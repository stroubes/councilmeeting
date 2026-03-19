import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export interface AuditLogRecord {
  id: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changesJson?: Record<string, unknown>;
  createdAt: string;
}

interface CreateAuditLogInput {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changesJson?: Record<string, unknown>;
}

@Injectable()
export class AuditRepository {
  private readonly memoryLogs: AuditLogRecord[] = [];
  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async create(input: CreateAuditLogInput): Promise<AuditLogRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const createdAt = new Date().toISOString();
      const result = await this.postgresService.query<DbAuditRow>(
        `INSERT INTO app_audit_logs (
          id, actor_user_id, action, entity_type, entity_id, changes_json, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          id,
          input.actorUserId,
          input.action,
          input.entityType,
          input.entityId,
          input.changesJson ?? null,
          createdAt,
        ],
      );

      return toAuditLog(result.rows[0]);
    }, () => {
      const log: AuditLogRecord = {
        id: randomUUID(),
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        changesJson: input.changesJson,
        createdAt: new Date().toISOString(),
      };
      this.memoryLogs.push(log);
      return log;
    });
  }

  async listRecent(limit = 200): Promise<AuditLogRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbAuditRow>(
        `SELECT * FROM app_audit_logs ORDER BY created_at DESC LIMIT $1`,
        [limit],
      );
      return result.rows.map((row) => toAuditLog(row));
    }, () => [...this.memoryLogs].slice(-limit).reverse());
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_audit_logs (
        id UUID PRIMARY KEY,
        actor_user_id VARCHAR(255),
        action VARCHAR(120) NOT NULL,
        entity_type VARCHAR(120) NOT NULL,
        entity_id VARCHAR(255),
        changes_json JSONB,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);

    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_audit_logs_created_at ON app_audit_logs(created_at DESC)`,
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

interface DbAuditRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes_json: Record<string, unknown> | null;
  created_at: string;
}

function toAuditLog(row: DbAuditRow): AuditLogRecord {
  return {
    id: row.id,
    actorUserId: row.actor_user_id ?? undefined,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? undefined,
    changesJson: row.changes_json ?? undefined,
    createdAt: row.created_at,
  };
}
