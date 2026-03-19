import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export interface ApiSettingRecord {
  id: string;
  key: string;
  label: string;
  category?: string;
  value: string;
  isSecret: boolean;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface DbApiSettingRow {
  id: string;
  key: string;
  label: string;
  category: string | null;
  value: string;
  is_secret: boolean;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class ApiSettingsRepository {
  private readonly memory = new Map<string, ApiSettingRecord>();
  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async list(): Promise<ApiSettingRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbApiSettingRow>(
        `SELECT * FROM app_api_settings ORDER BY category NULLS LAST, label ASC`,
      );
      return result.rows.map((row) => toRecord(row));
    }, () =>
      Array.from(this.memory.values()).sort((left, right) => {
        const categoryCompare = (left.category ?? '').localeCompare(right.category ?? '');
        if (categoryCompare !== 0) {
          return categoryCompare;
        }
        return left.label.localeCompare(right.label);
      }));
  }

  async upsert(input: {
    key: string;
    label: string;
    category?: string;
    value: string;
    isSecret: boolean;
    updatedBy: string;
  }): Promise<ApiSettingRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const now = new Date().toISOString();
      const existing = await this.postgresService.query<DbApiSettingRow>(
        `SELECT * FROM app_api_settings WHERE key = $1 LIMIT 1`,
        [input.key],
      );

      if (existing.rows.length > 0) {
        const updated = await this.postgresService.query<DbApiSettingRow>(
          `UPDATE app_api_settings
           SET label = $2,
               category = $3,
               value = $4,
               is_secret = $5,
               updated_by = $6,
               updated_at = $7
           WHERE key = $1
           RETURNING *`,
          [input.key, input.label, input.category ?? null, input.value, input.isSecret, input.updatedBy, now],
        );
        return toRecord(updated.rows[0]);
      }

      const created = await this.postgresService.query<DbApiSettingRow>(
        `INSERT INTO app_api_settings (
          id, key, label, category, value, is_secret, updated_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING *`,
        [randomUUID(), input.key, input.label, input.category ?? null, input.value, input.isSecret, input.updatedBy, now, now],
      );
      return toRecord(created.rows[0]);
    }, () => {
      const existing = Array.from(this.memory.values()).find((row) => row.key === input.key);
      if (existing) {
        const updated: ApiSettingRecord = {
          ...existing,
          label: input.label,
          category: input.category,
          value: input.value,
          isSecret: input.isSecret,
          updatedBy: input.updatedBy,
          updatedAt: new Date().toISOString(),
        };
        this.memory.set(updated.id, updated);
        return updated;
      }

      const now = new Date().toISOString();
      const created: ApiSettingRecord = {
        id: randomUUID(),
        key: input.key,
        label: input.label,
        category: input.category,
        value: input.value,
        isSecret: input.isSecret,
        updatedBy: input.updatedBy,
        createdAt: now,
        updatedAt: now,
      };
      this.memory.set(created.id, created);
      return created;
    });
  }

  async remove(id: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      const deleted = await this.postgresService.query(`DELETE FROM app_api_settings WHERE id = $1`, [id]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('API setting not found');
      }
    }, () => {
      if (!this.memory.delete(id)) {
        throw new NotFoundException('API setting not found');
      }
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_api_settings (
        id UUID PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        label VARCHAR(120) NOT NULL,
        category VARCHAR(100),
        value TEXT NOT NULL,
        is_secret BOOLEAN NOT NULL,
        updated_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_api_settings_category ON app_api_settings(category)`,
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

function toRecord(row: DbApiSettingRow): ApiSettingRecord {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    category: row.category ?? undefined,
    value: row.value,
    isSecret: row.is_secret,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
