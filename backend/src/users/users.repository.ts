import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export interface ManagedUserRecord {
  id: string;
  microsoftOid: string;
  email: string;
  displayName: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

interface UpsertUserInput {
  microsoftOid: string;
  email: string;
  displayName: string;
  roles: string[];
}

@Injectable()
export class UsersRepository {
  private readonly memory = new Map<string, ManagedUserRecord>();
  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async list(): Promise<ManagedUserRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbManagedUserRow>(
        `SELECT * FROM app_managed_users ORDER BY updated_at DESC`,
      );
      return result.rows.map((row) => toManagedUser(row));
    }, () => Array.from(this.memory.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }

  async getById(id: string): Promise<ManagedUserRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbManagedUserRow>(
        `SELECT * FROM app_managed_users WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Managed user not found');
      }
      return toManagedUser(result.rows[0]);
    }, () => {
      const record = this.memory.get(id);
      if (!record) {
        throw new NotFoundException('Managed user not found');
      }
      return record;
    });
  }

  async findByOidOrEmail(microsoftOid: string, email: string): Promise<ManagedUserRecord | null> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbManagedUserRow>(
        `SELECT * FROM app_managed_users WHERE microsoft_oid = $1 OR email = $2 LIMIT 1`,
        [microsoftOid, email],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return toManagedUser(result.rows[0]);
    }, () =>
      Array.from(this.memory.values()).find(
        (record) => record.microsoftOid === microsoftOid || record.email === email,
      ) ?? null);
  }

  async upsert(input: UpsertUserInput): Promise<ManagedUserRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const now = new Date().toISOString();
      const existing = await this.postgresService.query<DbManagedUserRow>(
        `SELECT * FROM app_managed_users WHERE microsoft_oid = $1 OR email = $2 LIMIT 1`,
        [input.microsoftOid, input.email],
      );

      if (existing.rows.length > 0) {
        const id = existing.rows[0].id;
        const result = await this.postgresService.query<DbManagedUserRow>(
          `UPDATE app_managed_users
           SET microsoft_oid = $2,
               email = $3,
               display_name = $4,
               roles_json = $5,
               updated_at = $6
           WHERE id = $1
           RETURNING *`,
          [id, input.microsoftOid, input.email, input.displayName, input.roles, now],
        );
        return toManagedUser(result.rows[0]);
      }

      const id = randomUUID();
      const result = await this.postgresService.query<DbManagedUserRow>(
        `INSERT INTO app_managed_users (
          id, microsoft_oid, email, display_name, roles_json, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [id, input.microsoftOid, input.email, input.displayName, input.roles, now, now],
      );

      return toManagedUser(result.rows[0]);
    }, () => {
      const existing = Array.from(this.memory.values()).find(
        (row) => row.microsoftOid === input.microsoftOid || row.email === input.email,
      );

      if (existing) {
        const updated: ManagedUserRecord = {
          ...existing,
          microsoftOid: input.microsoftOid,
          email: input.email,
          displayName: input.displayName,
          roles: input.roles,
          updatedAt: new Date().toISOString(),
        };
        this.memory.set(updated.id, updated);
        return updated;
      }

      const now = new Date().toISOString();
      const created: ManagedUserRecord = {
        id: randomUUID(),
        microsoftOid: input.microsoftOid,
        email: input.email,
        displayName: input.displayName,
        roles: input.roles,
        createdAt: now,
        updatedAt: now,
      };
      this.memory.set(created.id, created);
      return created;
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_managed_users (
        id UUID PRIMARY KEY,
        microsoft_oid VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        roles_json JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);

    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_managed_users_updated_at ON app_managed_users(updated_at DESC)`,
    );

    this.schemaEnsured = true;
  }

  private async withFallback<T>(dbFn: () => Promise<T>, fallbackFn: () => Promise<T> | T): Promise<T> {
    if (!this.postgresService.isEnabled) {
      return fallbackFn();
    }

    try {
      return await dbFn();
    } catch (error) {
      if (error instanceof DatabaseUnavailableError) {
        return fallbackFn();
      }
      throw error;
    }
  }
}

interface DbManagedUserRow {
  id: string;
  microsoft_oid: string;
  email: string;
  display_name: string;
  roles_json: string[];
  created_at: string;
  updated_at: string;
}

function toManagedUser(row: DbManagedUserRow): ManagedUserRecord {
  return {
    id: row.id,
    microsoftOid: row.microsoft_oid,
    email: row.email,
    displayName: row.display_name,
    roles: row.roles_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
