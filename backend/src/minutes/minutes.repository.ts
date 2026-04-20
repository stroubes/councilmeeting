import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PostgresService } from '../database/postgres.service';
import { BaseRepository } from '../database/base.repository';
import { createDefaultMinutesContent, normalizeMinutesContent, type MinutesContent } from './minutes-content';

export type MinutesStatus = 'DRAFT' | 'IN_PROGRESS' | 'FINALIZED' | 'ADOPTED' | 'PUBLISHED';

export interface MinutesRecord {
  id: string;
  meetingId: string;
  minuteTakerUserId?: string;
  contentJson: MinutesContent;
  richTextSummary?: Record<string, unknown>;
  isInCamera: boolean;
  status: MinutesStatus;
  startedAt?: string;
  finalizedAt?: string;
  adoptedAt?: string;
  adoptedBy?: string;
  publishedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateMinutesInput {
  meetingId: string;
  minuteTakerUserId?: string;
  contentJson?: MinutesContent;
  isInCamera?: boolean;
  createdBy: string;
}

@Injectable()
export class MinutesRepository extends BaseRepository {
  private readonly memory = new Map<string, MinutesRecord>();
  protected schemaEnsured = false;

  constructor(postgresService: PostgresService) {
    super(postgresService);
  }

  async create(input: CreateMinutesInput): Promise<MinutesRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbMinutesRow>(
        `INSERT INTO app_minutes (
          id, meeting_id, minute_taker_user_id, content_json, is_in_camera, status,
          started_at, finalized_at, adopted_at, adopted_by, published_at,
          created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'DRAFT', NULL, NULL, NULL, NULL, NULL, $6, $7, $8)
        RETURNING *`,
        [
          id,
          input.meetingId,
          input.minuteTakerUserId,
          normalizeMinutesContent(input.contentJson ?? createDefaultMinutesContent()),
          input.isInCamera ?? false,
          input.createdBy,
          now,
          now,
        ],
      );

      return toMinutesRecord(result.rows[0]);
    }, () => {
      const now = new Date().toISOString();
      const record: MinutesRecord = {
        id: randomUUID(),
        meetingId: input.meetingId,
        minuteTakerUserId: input.minuteTakerUserId,
        contentJson: normalizeMinutesContent(input.contentJson ?? createDefaultMinutesContent()),
        isInCamera: input.isInCamera ?? false,
        status: 'DRAFT',
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
      };
      this.memory.set(record.id, record);
      return record;
    });
  }

  async list(meetingId?: string, isInCamera?: boolean): Promise<MinutesRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const params: unknown[] = [];
      const conditions: string[] = [];
      if (meetingId) {
        params.push(meetingId);
        conditions.push(`meeting_id = $${params.length}`);
      }
      if (isInCamera !== undefined) {
        params.push(isInCamera);
        conditions.push(`is_in_camera = $${params.length}`);
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const result = await this.postgresService.query<DbMinutesRow>(
        `SELECT * FROM app_minutes ${whereClause} ORDER BY updated_at DESC`,
        params,
      );
      return result.rows.map((row) => toMinutesRecord(row));
    }, () =>
      Array.from(this.memory.values())
        .filter((row) => {
          if (meetingId && row.meetingId !== meetingId) return false;
          if (isInCamera !== undefined && row.isInCamera !== isInCamera) return false;
          return true;
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }

  async getById(id: string): Promise<MinutesRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbMinutesRow>(
        `SELECT * FROM app_minutes WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Minutes not found');
      }
      return toMinutesRecord(result.rows[0]);
    }, () => {
      const record = this.memory.get(id);
      if (!record) {
        throw new NotFoundException('Minutes not found');
      }
      return record;
    });
  }

  async update(id: string, patch: Partial<MinutesRecord>): Promise<MinutesRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const updatedAt = new Date().toISOString();
      const result = await this.postgresService.query<DbMinutesRow>(
        `UPDATE app_minutes
         SET minute_taker_user_id = $2,
             content_json = $3,
             rich_text_summary = $4,
             status = $5,
             started_at = $6,
             finalized_at = $7,
             adopted_at = $8,
             adopted_by = $9,
             published_at = $10,
             updated_at = $11
         WHERE id = $1
         RETURNING *`,
        [
          id,
          patch.minuteTakerUserId ?? existing.minuteTakerUserId,
            normalizeMinutesContent(patch.contentJson ?? existing.contentJson),
          patch.richTextSummary != null ? JSON.stringify(patch.richTextSummary) : existing.richTextSummary ?? null,
          patch.status ?? existing.status,
          patch.startedAt ?? existing.startedAt ?? null,
          patch.finalizedAt ?? existing.finalizedAt ?? null,
          patch.adoptedAt ?? existing.adoptedAt ?? null,
          patch.adoptedBy ?? existing.adoptedBy ?? null,
          patch.publishedAt ?? existing.publishedAt ?? null,
          updatedAt,
        ],
      );

      return toMinutesRecord(result.rows[0]);
    }, async () => {
      const existing = await this.getById(id);
      const updated: MinutesRecord = {
        ...existing,
        ...patch,
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
      CREATE TABLE IF NOT EXISTS app_minutes (
        id UUID PRIMARY KEY,
        meeting_id UUID NOT NULL,
        minute_taker_user_id VARCHAR(255),
        content_json JSONB NOT NULL,
        status VARCHAR(50) NOT NULL,
        started_at TIMESTAMPTZ,
        finalized_at TIMESTAMPTZ,
        adopted_at TIMESTAMPTZ,
        adopted_by VARCHAR(255),
        published_at TIMESTAMPTZ,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
    await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_minutes_meeting ON app_minutes(meeting_id)`);

    await this.postgresService.query(`ALTER TABLE app_minutes ADD COLUMN IF NOT EXISTS adopted_at TIMESTAMPTZ`);
    await this.postgresService.query(`ALTER TABLE app_minutes ADD COLUMN IF NOT EXISTS adopted_by VARCHAR(255)`);
    await this.postgresService.query(`ALTER TABLE app_minutes ADD COLUMN IF NOT EXISTS rich_text_summary JSONB`);
    await this.postgresService.query(`ALTER TABLE app_minutes ADD COLUMN IF NOT EXISTS is_in_camera BOOLEAN NOT NULL DEFAULT FALSE`);

    await this.postgresService.query(
      `DELETE FROM app_minutes m WHERE NOT EXISTS (
         SELECT 1 FROM app_meetings mt WHERE mt.id = m.meeting_id
       )`,
    );

    await this.postgresService.query(`
      DO $$
      BEGIN
        IF to_regclass('public.app_meetings') IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_minutes_meeting'
          ) THEN
          ALTER TABLE app_minutes
            ADD CONSTRAINT fk_app_minutes_meeting
            FOREIGN KEY (meeting_id) REFERENCES app_meetings(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    this.schemaEnsured = true;
  }

}

interface DbMinutesRow {
  id: string;
  meeting_id: string;
  minute_taker_user_id: string | null;
  content_json: unknown;
  rich_text_summary: Record<string, unknown> | null;
  is_in_camera: boolean;
  status: MinutesStatus;
  started_at: string | null;
  finalized_at: string | null;
  adopted_at: string | null;
  adopted_by: string | null;
  published_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function toMinutesRecord(row: DbMinutesRow): MinutesRecord {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    minuteTakerUserId: row.minute_taker_user_id ?? undefined,
    contentJson: normalizeMinutesContent(row.content_json),
    richTextSummary: row.rich_text_summary ?? undefined,
    isInCamera: row.is_in_camera,
    status: row.status,
    startedAt: row.started_at ?? undefined,
    finalizedAt: row.finalized_at ?? undefined,
    adoptedAt: row.adopted_at ?? undefined,
    adoptedBy: row.adopted_by ?? undefined,
    publishedAt: row.published_at ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
