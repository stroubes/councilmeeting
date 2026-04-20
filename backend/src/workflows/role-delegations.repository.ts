import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BaseRepository } from '../database/base.repository';
import { PostgresService } from '../database/postgres.service';

export interface RoleDelegationRecord {
  id: string;
  delegateFromUserId: string;
  delegateToUserId: string;
  roleCode: string;
  startsAt: string;
  endsAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class RoleDelegationsRepository extends BaseRepository {
  private readonly memory = new Map<string, RoleDelegationRecord>();

  constructor(postgresService: PostgresService) {
    super(postgresService);
  }

  async create(input: Omit<RoleDelegationRecord, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<RoleDelegationRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbRoleDelegationRow>(
        `INSERT INTO app_role_delegations (
          id, delegate_from_user_id, delegate_to_user_id, role_code, starts_at, ends_at, is_active, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,TRUE,$7,$8) RETURNING *`,
        [randomUUID(), input.delegateFromUserId, input.delegateToUserId, input.roleCode, input.startsAt, input.endsAt ?? null, now, now],
      );
      return toRecord(result.rows[0]);
    }, () => {
      const now = new Date().toISOString();
      const record: RoleDelegationRecord = {
        id: randomUUID(),
        delegateFromUserId: input.delegateFromUserId,
        delegateToUserId: input.delegateToUserId,
        roleCode: input.roleCode,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      this.memory.set(record.id, record);
      return record;
    });
  }

  async listActiveByDelegate(delegateToUserId: string, nowIso = new Date().toISOString()): Promise<RoleDelegationRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbRoleDelegationRow>(
        `SELECT *
         FROM app_role_delegations
         WHERE delegate_to_user_id = $1
           AND is_active = TRUE
           AND starts_at <= $2
           AND (ends_at IS NULL OR ends_at >= $2)
         ORDER BY created_at DESC`,
        [delegateToUserId, nowIso],
      );
      return result.rows.map(toRecord);
    }, () =>
      Array.from(this.memory.values()).filter(
        (record) =>
          record.delegateToUserId === delegateToUserId &&
          record.isActive &&
          record.startsAt <= nowIso &&
          (!record.endsAt || record.endsAt >= nowIso),
      ));
  }

  async listAll(): Promise<RoleDelegationRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbRoleDelegationRow>(
        `SELECT * FROM app_role_delegations ORDER BY created_at DESC`,
      );
      return result.rows.map(toRecord);
    }, () => Array.from(this.memory.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  async deactivate(id: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query(
        `UPDATE app_role_delegations SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
        [id],
      );
      if (!result.rowCount) {
        throw new NotFoundException('Role delegation not found');
      }
    }, () => {
      const existing = this.memory.get(id);
      if (!existing) {
        throw new NotFoundException('Role delegation not found');
      }
      this.memory.set(id, { ...existing, isActive: false, updatedAt: new Date().toISOString() });
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_role_delegations (
        id UUID PRIMARY KEY,
        delegate_from_user_id VARCHAR(255) NOT NULL,
        delegate_to_user_id VARCHAR(255) NOT NULL,
        role_code VARCHAR(120) NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_role_delegations_delegate_to ON app_role_delegations(delegate_to_user_id, is_active)`,
    );
    this.schemaEnsured = true;
  }
}

interface DbRoleDelegationRow {
  id: string;
  delegate_from_user_id: string;
  delegate_to_user_id: string;
  role_code: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function toRecord(row: DbRoleDelegationRow): RoleDelegationRecord {
  return {
    id: row.id,
    delegateFromUserId: row.delegate_from_user_id,
    delegateToUserId: row.delegate_to_user_id,
    roleCode: row.role_code,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
