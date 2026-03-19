import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export type NotificationDeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED';

export interface NotificationEventRecord {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorUserId?: string;
  payloadJson: Record<string, unknown>;
  channels: string[];
  status: NotificationDeliveryStatus;
  deliveryAttempts: number;
  lastError?: string;
  createdAt: string;
  deliveredAt?: string;
  updatedAt: string;
}

interface DbNotificationEventRow {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_user_id: string | null;
  payload_json: Record<string, unknown>;
  channels: string[];
  status: NotificationDeliveryStatus;
  delivery_attempts: number;
  last_error: string | null;
  created_at: string;
  delivered_at: string | null;
  updated_at: string;
}

@Injectable()
export class NotificationsRepository {
  private readonly memory = new Map<string, NotificationEventRecord>();
  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async create(input: {
    eventType: string;
    entityType: string;
    entityId: string;
    actorUserId?: string;
    payloadJson: Record<string, unknown>;
    channels: string[];
    status: NotificationDeliveryStatus;
    deliveryAttempts?: number;
    lastError?: string;
    deliveredAt?: string;
  }): Promise<NotificationEventRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const now = new Date().toISOString();
      const id = randomUUID();
      const result = await this.postgresService.query<DbNotificationEventRow>(
        `INSERT INTO app_notification_events (
          id, event_type, entity_type, entity_id, actor_user_id, payload_json, channels,
          status, delivery_attempts, last_error, created_at, delivered_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13
        ) RETURNING *`,
        [
          id,
          input.eventType,
          input.entityType,
          input.entityId,
          input.actorUserId,
          input.payloadJson,
          input.channels,
          input.status,
          input.deliveryAttempts ?? 0,
          input.lastError,
          now,
          input.deliveredAt ?? null,
          now,
        ],
      );
      return toRecord(result.rows[0]);
    }, () => {
      const now = new Date().toISOString();
      const record: NotificationEventRecord = {
        id: randomUUID(),
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        actorUserId: input.actorUserId,
        payloadJson: input.payloadJson,
        channels: input.channels,
        status: input.status,
        deliveryAttempts: input.deliveryAttempts ?? 0,
        lastError: input.lastError,
        createdAt: now,
        deliveredAt: input.deliveredAt,
        updatedAt: now,
      };
      this.memory.set(record.id, record);
      return record;
    });
  }

  async list(query?: { status?: NotificationDeliveryStatus; eventType?: string; limit?: number }): Promise<NotificationEventRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const where: string[] = [];
      const params: unknown[] = [];

      if (query?.status) {
        params.push(query.status);
        where.push(`status = $${params.length}`);
      }
      if (query?.eventType) {
        params.push(query.eventType);
        where.push(`event_type = $${params.length}`);
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
      const limit = Math.max(1, Math.min(250, query?.limit ?? 100));
      params.push(limit);
      const result = await this.postgresService.query<DbNotificationEventRow>(
        `SELECT * FROM app_notification_events ${whereClause} ORDER BY created_at DESC LIMIT $${params.length}`,
        params,
      );
      return result.rows.map((row) => toRecord(row));
    }, () => {
      const status = query?.status;
      const eventType = query?.eventType;
      const limit = Math.max(1, Math.min(250, query?.limit ?? 100));
      return Array.from(this.memory.values())
        .filter((row) => {
          if (status && row.status !== status) {
            return false;
          }
          if (eventType && row.eventType !== eventType) {
            return false;
          }
          return true;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    });
  }

  async getById(id: string): Promise<NotificationEventRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbNotificationEventRow>(
        `SELECT * FROM app_notification_events WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Notification event not found');
      }
      return toRecord(result.rows[0]);
    }, () => {
      const event = this.memory.get(id);
      if (!event) {
        throw new NotFoundException('Notification event not found');
      }
      return event;
    });
  }

  async updateDelivery(
    id: string,
    patch: { status: NotificationDeliveryStatus; deliveryAttempts: number; lastError?: string; deliveredAt?: string },
  ): Promise<NotificationEventRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbNotificationEventRow>(
        `UPDATE app_notification_events
         SET status = $2,
             delivery_attempts = $3,
             last_error = $4,
             delivered_at = $5,
             updated_at = $6
         WHERE id = $1
         RETURNING *`,
        [id, patch.status, patch.deliveryAttempts, patch.lastError ?? null, patch.deliveredAt ?? null, now],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Notification event not found');
      }
      return toRecord(result.rows[0]);
    }, async () => {
      const existing = await this.getById(id);
      const updated: NotificationEventRecord = {
        ...existing,
        status: patch.status,
        deliveryAttempts: patch.deliveryAttempts,
        lastError: patch.lastError,
        deliveredAt: patch.deliveredAt,
        updatedAt: new Date().toISOString(),
      };
      this.memory.set(id, updated);
      return updated;
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_notification_events (
        id UUID PRIMARY KEY,
        event_type VARCHAR(120) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(120) NOT NULL,
        actor_user_id VARCHAR(255),
        payload_json JSONB NOT NULL,
        channels TEXT[] NOT NULL,
        status VARCHAR(40) NOT NULL,
        delivery_attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL,
        delivered_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_notification_events_created ON app_notification_events(created_at DESC)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_notification_events_status ON app_notification_events(status)`,
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

function toRecord(row: DbNotificationEventRow): NotificationEventRecord {
  return {
    id: row.id,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actorUserId: row.actor_user_id ?? undefined,
    payloadJson: row.payload_json,
    channels: Array.isArray(row.channels) ? row.channels : [],
    status: row.status,
    deliveryAttempts: row.delivery_attempts,
    lastError: row.last_error ?? undefined,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at ?? undefined,
    updatedAt: row.updated_at,
  };
}
