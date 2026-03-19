import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export type PublicSubscriptionTopic = 'MEETINGS' | 'AGENDAS' | 'REPORTS' | 'MINUTES' | 'MOTIONS' | 'BUDGET';
export type PublicSubscriptionFrequency = 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';

export interface PublicSubscriptionRecord {
  id: string;
  email: string;
  topics: PublicSubscriptionTopic[];
  watchKeywords: string[];
  frequency: PublicSubscriptionFrequency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastNotifiedAt?: string;
}

interface DbPublicSubscriptionRow {
  id: string;
  email: string;
  topics: string[];
  watch_keywords: string[];
  frequency: PublicSubscriptionFrequency;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_notified_at: string | null;
}

@Injectable()
export class PublicSubscriptionsRepository {
  private readonly memory = new Map<string, PublicSubscriptionRecord>();
  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async create(input: {
    email: string;
    topics: PublicSubscriptionTopic[];
    watchKeywords: string[];
    frequency: PublicSubscriptionFrequency;
  }): Promise<PublicSubscriptionRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbPublicSubscriptionRow>(
        `INSERT INTO app_public_subscriptions (
          id, email, topics, watch_keywords, frequency, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *`,
        [id, input.email, input.topics, input.watchKeywords, input.frequency, true, now, now],
      );
      return toRecord(result.rows[0]);
    }, () => {
      const now = new Date().toISOString();
      const created: PublicSubscriptionRecord = {
        id: randomUUID(),
        email: input.email,
        topics: input.topics,
        watchKeywords: input.watchKeywords,
        frequency: input.frequency,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      this.memory.set(created.id, created);
      return created;
    });
  }

  async listByEmail(email: string): Promise<PublicSubscriptionRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbPublicSubscriptionRow>(
        `SELECT * FROM app_public_subscriptions WHERE email = $1 ORDER BY created_at DESC`,
        [email],
      );
      return result.rows.map((row) => toRecord(row));
    }, () => Array.from(this.memory.values()).filter((row) => row.email === email));
  }

  async listActiveByFrequency(
    frequency: PublicSubscriptionFrequency,
    options?: { limit?: number },
  ): Promise<PublicSubscriptionRecord[]> {
    const limit = Math.max(1, Math.min(500, options?.limit ?? 200));

    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbPublicSubscriptionRow>(
        `SELECT *
         FROM app_public_subscriptions
         WHERE is_active = TRUE AND frequency = $1
         ORDER BY updated_at ASC
         LIMIT $2`,
        [frequency, limit],
      );
      return result.rows.map((row) => toRecord(row));
    }, () =>
      Array.from(this.memory.values())
        .filter((row) => row.isActive && row.frequency === frequency)
        .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
        .slice(0, limit));
  }

  async getById(id: string): Promise<PublicSubscriptionRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbPublicSubscriptionRow>(
        `SELECT * FROM app_public_subscriptions WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Subscription not found');
      }
      return toRecord(result.rows[0]);
    }, () => {
      const existing = this.memory.get(id);
      if (!existing) {
        throw new NotFoundException('Subscription not found');
      }
      return existing;
    });
  }

  async update(
    id: string,
    patch: Partial<Pick<PublicSubscriptionRecord, 'topics' | 'watchKeywords' | 'frequency' | 'isActive' | 'lastNotifiedAt'>>,
  ): Promise<PublicSubscriptionRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbPublicSubscriptionRow>(
        `UPDATE app_public_subscriptions
         SET topics = $2,
             watch_keywords = $3,
             frequency = $4,
             is_active = $5,
             last_notified_at = $6,
             updated_at = $7
         WHERE id = $1
         RETURNING *`,
        [
          id,
          patch.topics ?? existing.topics,
          patch.watchKeywords ?? existing.watchKeywords,
          patch.frequency ?? existing.frequency,
          patch.isActive ?? existing.isActive,
          patch.lastNotifiedAt ?? existing.lastNotifiedAt ?? null,
          now,
        ],
      );
      return toRecord(result.rows[0]);
    }, async () => {
      const existing = await this.getById(id);
      const updated: PublicSubscriptionRecord = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      this.memory.set(id, updated);
      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      const deleted = await this.postgresService.query(`DELETE FROM app_public_subscriptions WHERE id = $1`, [id]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Subscription not found');
      }
    }, () => {
      if (!this.memory.delete(id)) {
        throw new NotFoundException('Subscription not found');
      }
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_public_subscriptions (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        topics TEXT[] NOT NULL,
        watch_keywords TEXT[] NOT NULL,
        frequency VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        last_notified_at TIMESTAMPTZ
      )
    `);
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_public_subscriptions_email ON app_public_subscriptions(email)`,
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

function toRecord(row: DbPublicSubscriptionRow): PublicSubscriptionRecord {
  return {
    id: row.id,
    email: row.email,
    topics: row.topics as PublicSubscriptionTopic[],
    watchKeywords: row.watch_keywords,
    frequency: row.frequency,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastNotifiedAt: row.last_notified_at ?? undefined,
  };
}
