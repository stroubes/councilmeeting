import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export interface PresentationRecord {
  id: string;
  meetingId: string;
  fileName: string;
  title: string;
  mimeType: string;
  pageCount: number;
  contentBase64: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type PresentationSummary = Omit<PresentationRecord, 'contentBase64'>;

interface CreatePresentationInput {
  meetingId: string;
  fileName: string;
  title: string;
  mimeType: string;
  pageCount: number;
  contentBase64: string;
  createdBy: string;
}

interface DbPresentationRow {
  id: string;
  meeting_id: string;
  file_name: string;
  title: string;
  mime_type: string;
  page_count: number;
  content_base64: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class PresentationsRepository {
  private readonly memory = new Map<string, PresentationRecord>();
  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async list(meetingId?: string): Promise<PresentationSummary[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const params: unknown[] = [];
      const whereClause = meetingId ? 'WHERE meeting_id = $1' : '';
      if (meetingId) {
        params.push(meetingId);
      }
      const result = await this.postgresService.query<DbPresentationRow>(
        `SELECT id, meeting_id, file_name, title, mime_type, page_count, content_base64, created_by, updated_by, created_at, updated_at
         FROM app_presentations
         ${whereClause}
         ORDER BY created_at DESC`,
        params,
      );
      return result.rows.map((row) => toPresentationSummary(toPresentationRecord(row)));
    }, () => {
      const rows = Array.from(this.memory.values())
        .filter((row) => (meetingId ? row.meetingId === meetingId : true))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      return rows.map((row) => toPresentationSummary(row));
    });
  }

  async getById(id: string): Promise<PresentationSummary> {
    return toPresentationSummary(await this.getWithContentById(id));
  }

  async getWithContentById(id: string): Promise<PresentationRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbPresentationRow>(
        `SELECT id, meeting_id, file_name, title, mime_type, page_count, content_base64, created_by, updated_by, created_at, updated_at
         FROM app_presentations
         WHERE id = $1
         LIMIT 1`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Presentation not found');
      }
      return toPresentationRecord(result.rows[0]);
    }, () => {
      const record = this.memory.get(id);
      if (!record) {
        throw new NotFoundException('Presentation not found');
      }
      return record;
    });
  }

  async create(input: CreatePresentationInput): Promise<PresentationSummary> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbPresentationRow>(
        `INSERT INTO app_presentations (
          id, meeting_id, file_name, title, mime_type, page_count, content_base64, created_by, updated_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING id, meeting_id, file_name, title, mime_type, page_count, content_base64, created_by, updated_by, created_at, updated_at`,
        [
          id,
          input.meetingId,
          input.fileName,
          input.title,
          input.mimeType,
          input.pageCount,
          input.contentBase64,
          input.createdBy,
          input.createdBy,
          now,
          now,
        ],
      );
      return toPresentationSummary(toPresentationRecord(result.rows[0]));
    }, () => {
      const now = new Date().toISOString();
      const record: PresentationRecord = {
        id: randomUUID(),
        meetingId: input.meetingId,
        fileName: input.fileName,
        title: input.title,
        mimeType: input.mimeType,
        pageCount: input.pageCount,
        contentBase64: input.contentBase64,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
      };
      this.memory.set(record.id, record);
      return toPresentationSummary(record);
    });
  }

  async remove(id: string): Promise<void> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query(`DELETE FROM app_presentations WHERE id = $1`, [id]);
      if (result.rowCount === 0) {
        throw new NotFoundException('Presentation not found');
      }
    }, () => {
      const existed = this.memory.delete(id);
      if (!existed) {
        throw new NotFoundException('Presentation not found');
      }
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_presentations (
        id UUID PRIMARY KEY,
        meeting_id UUID NOT NULL,
        file_name VARCHAR(500) NOT NULL,
        title VARCHAR(250) NOT NULL,
        mime_type VARCHAR(150) NOT NULL,
        page_count INTEGER NOT NULL,
        content_base64 TEXT NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_presentations_meeting_id ON app_presentations(meeting_id, created_at DESC)`,
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

function toPresentationRecord(row: DbPresentationRow): PresentationRecord {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    fileName: row.file_name,
    title: row.title,
    mimeType: row.mime_type,
    pageCount: row.page_count,
    contentBase64: row.content_base64,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPresentationSummary(record: PresentationRecord): PresentationSummary {
  return {
    id: record.id,
    meetingId: record.meetingId,
    fileName: record.fileName,
    title: record.title,
    mimeType: record.mimeType,
    pageCount: record.pageCount,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
