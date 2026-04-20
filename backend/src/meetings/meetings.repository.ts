import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PostgresService } from '../database/postgres.service';
import { BaseRepository } from '../database/base.repository';
import type { MeetingListQueryDto } from './dto/meeting-list-query.dto';
import type { MeetingQueryDto } from './dto/meeting-query.dto';
import type { MeetingPageResult, MeetingRecord, MeetingStatus } from './meetings.service';

interface CreateMeetingInput {
  title: string;
  description?: string;
  meetingTypeCode: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  status: MeetingStatus;
  publishStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPublic: boolean;
  isInCamera: boolean;
  videoUrl?: string;
  recurrenceGroupId?: string;
  recurrenceIndex?: number;
  createdBy: string;
}

@Injectable()
export class MeetingsRepository extends BaseRepository {
  private readonly memoryMeetings = new Map<string, MeetingRecord>();
  protected schemaEnsured = false;

  constructor(postgresService: PostgresService) {
    super(postgresService);
  }

  async create(input: CreateMeetingInput): Promise<MeetingRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbMeetingRow>(
        `INSERT INTO app_meetings (
          id, title, description, meeting_type_code, starts_at, ends_at, location,
          status, publish_status, is_public, is_in_camera, video_url, recurrence_group_id, recurrence_index,
          created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
        RETURNING *`,
        [
          id,
          input.title,
          input.description,
          input.meetingTypeCode,
          input.startsAt,
          input.endsAt,
          input.location,
          input.status,
          input.publishStatus,
          input.isPublic,
          input.isInCamera,
          input.videoUrl,
          input.recurrenceGroupId,
          input.recurrenceIndex,
          input.createdBy,
          now,
          now,
        ],
      );

      return toMeetingRecord(result.rows[0]);
    }, () => this.createInMemory(input));
  }

  async list(query: MeetingQueryDto): Promise<MeetingRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const { whereClause, params } = this.buildWhereClause(query);
      const result = await this.postgresService.query<DbMeetingRow>(
        `SELECT * FROM app_meetings ${whereClause} ORDER BY starts_at ASC`,
        params,
      );

      return result.rows.map((row) => toMeetingRecord(row));
    }, () => this.listInMemory(query));
  }

  async listPaged(query: MeetingListQueryDto): Promise<MeetingPageResult> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const { whereClause, params } = this.buildWhereClause(query);
      const { page, pageSize } = this.normalizePagination(query);
      const offset = (page - 1) * pageSize;
      const orderBy = this.resolveSortClause(query);

      const countResult = await this.postgresService.query<{ total: string }>(
        `SELECT COUNT(*)::text AS total FROM app_meetings ${whereClause}`,
        params,
      );
      const total = Number.parseInt(countResult.rows[0]?.total ?? '0', 10) || 0;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, totalPages);
      const safeOffset = (safePage - 1) * pageSize;

      const result = await this.postgresService.query<DbMeetingRow>(
        `SELECT * FROM app_meetings ${whereClause} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, safeOffset],
      );

      return {
        items: result.rows.map((row) => toMeetingRecord(row)),
        total,
        page: safePage,
        pageSize,
        totalPages,
      };
    }, () => this.listPagedInMemory(query));
  }

  async listPublic(): Promise<MeetingRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbMeetingRow>(
        `SELECT * FROM app_meetings WHERE is_public = TRUE AND is_in_camera = FALSE ORDER BY starts_at ASC`,
      );
      return result.rows.map((row) => toMeetingRecord(row));
    }, () =>
      Array.from(this.memoryMeetings.values())
        .filter((meeting) => meeting.isPublic && !meeting.isInCamera)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
  }

  async getById(id: string): Promise<MeetingRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbMeetingRow>(
        `SELECT * FROM app_meetings WHERE id = $1 LIMIT 1`,
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Meeting not found');
      }

      return toMeetingRecord(result.rows[0]);
    }, () => {
      const meeting = this.memoryMeetings.get(id);
      if (!meeting) {
        throw new NotFoundException('Meeting not found');
      }
      return meeting;
    });
  }

  async update(id: string, patch: Partial<MeetingRecord>): Promise<MeetingRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const updatedAt = new Date().toISOString();
      const result = await this.postgresService.query<DbMeetingRow>(
        `UPDATE app_meetings
         SET title = $2,
             description = $3,
             meeting_type_code = $4,
             starts_at = $5,
             ends_at = $6,
             location = $7,
             status = $8,
             publish_status = $9,
             published_at = $10,
             is_public = $11,
             is_in_camera = $12,
             video_url = $13,
             recurrence_group_id = $14,
             recurrence_index = $15,
             updated_at = $16
          WHERE id = $1
          RETURNING *`,
        [
          id,
          patch.title ?? existing.title,
          patch.description ?? existing.description,
          patch.meetingTypeCode ?? existing.meetingTypeCode,
          patch.startsAt ?? existing.startsAt,
          patch.endsAt ?? existing.endsAt,
          patch.location ?? existing.location,
          patch.status ?? existing.status,
          (patch as any).publishStatus ?? existing.publishStatus,
          (patch as any).publishedAt ?? existing.publishedAt,
          patch.isPublic ?? existing.isPublic,
          patch.isInCamera ?? existing.isInCamera,
          patch.videoUrl ?? existing.videoUrl,
          patch.recurrenceGroupId ?? existing.recurrenceGroupId,
          patch.recurrenceIndex ?? existing.recurrenceIndex,
          updatedAt,
        ],
      );

      return toMeetingRecord(result.rows[0]);
    }, async () => {
      const existing = await this.getById(id);
      const updated: MeetingRecord = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      this.memoryMeetings.set(id, updated);
      return updated;
    });
  }

  async exists(id: string): Promise<boolean> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<{ exists: boolean }>(
        `SELECT EXISTS (SELECT 1 FROM app_meetings WHERE id = $1) AS exists`,
        [id],
      );
      return result.rows[0]?.exists === true;
    }, () => this.memoryMeetings.has(id));
  }

  async remove(id: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      const deleted = await this.postgresService.query(`DELETE FROM app_meetings WHERE id = $1`, [id]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Meeting not found');
      }
    }, () => {
      if (!this.memoryMeetings.delete(id)) {
        throw new NotFoundException('Meeting not found');
      }
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_meetings (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        meeting_type_code VARCHAR(100) NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ,
        location VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        publish_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
        published_at TIMESTAMPTZ,
        is_public BOOLEAN NOT NULL,
        is_in_camera BOOLEAN NOT NULL,
        video_url TEXT,
        recurrence_group_id UUID,
        recurrence_index INTEGER,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        CONSTRAINT chk_app_meeting_time CHECK (ends_at IS NULL OR ends_at >= starts_at)
      )
    `);

    await this.postgresService.query(`ALTER TABLE app_meetings ADD COLUMN IF NOT EXISTS recurrence_group_id UUID`);
    await this.postgresService.query(`ALTER TABLE app_meetings ADD COLUMN IF NOT EXISTS recurrence_index INTEGER`);
    await this.postgresService.query(`ALTER TABLE app_meetings ADD COLUMN IF NOT EXISTS publish_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT'`);
    await this.postgresService.query(`ALTER TABLE app_meetings ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`);

    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_meetings_starts_at ON app_meetings(starts_at)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_meetings_recurrence ON app_meetings(recurrence_group_id, recurrence_index)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_meetings_publish_status ON app_meetings(publish_status)`,
    );

    this.schemaEnsured = true;
  }

  private createInMemory(input: CreateMeetingInput): MeetingRecord {
    const now = new Date().toISOString();
    const meeting: MeetingRecord = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      meetingTypeCode: input.meetingTypeCode,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location,
      status: input.status,
      publishStatus: input.publishStatus,
      publishedAt: undefined,
      isPublic: input.isPublic,
      isInCamera: input.isInCamera,
      videoUrl: input.videoUrl,
      recurrenceGroupId: input.recurrenceGroupId,
      recurrenceIndex: input.recurrenceIndex,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryMeetings.set(meeting.id, meeting);
    return meeting;
  }

  private listInMemory(query: MeetingQueryDto): MeetingRecord[] {
    return this.filterInMemory(query).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  private listPagedInMemory(query: MeetingListQueryDto): MeetingPageResult {
    const { page, pageSize } = this.normalizePagination(query);
    const sort = this.resolveSort(query);
    const filtered = this.filterInMemory(query).sort((left, right) => {
      const comparison = this.compareMeetings(left, right, sort.field);
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      page: safePage,
      pageSize,
      totalPages,
    };
  }

  private buildWhereClause(query: MeetingQueryDto & { q?: string }): { whereClause: string; params: unknown[] } {
    const where: string[] = [];
    const params: unknown[] = [];

    if (query.status) {
      params.push(query.status);
      where.push(`status = $${params.length}`);
    }

    const includeInCamera = query.inCamera === 'true' || query.inCamera === '1';
    if (!includeInCamera) {
      where.push(`is_in_camera = FALSE`);
    }

    const publicOnly = query.publicOnly === 'true' || query.publicOnly === '1';
    if (publicOnly) {
      where.push(`is_public = TRUE`);
    }

    const search = query.q?.trim();
    if (search) {
      params.push(`%${search}%`);
      where.push(`(title ILIKE $${params.length} OR meeting_type_code ILIKE $${params.length})`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    return { whereClause, params };
  }

  private resolveSortClause(query: MeetingListQueryDto): string {
    const { field, direction } = this.resolveSort(query);
    if (field === 'title') {
      return `title ${direction}, starts_at ASC`;
    }
    if (field === 'status') {
      return `status ${direction}, starts_at ASC`;
    }
    return `starts_at ${direction}`;
  }

  private resolveSort(query: MeetingListQueryDto): { field: 'title' | 'startsAt' | 'status'; direction: 'asc' | 'desc' } {
    const field = query.sortField === 'title' || query.sortField === 'status' || query.sortField === 'startsAt'
      ? query.sortField
      : 'startsAt';
    const direction = query.sortDirection === 'asc' || query.sortDirection === 'desc' ? query.sortDirection : 'asc';
    return { field, direction };
  }

  private normalizePagination(query: MeetingListQueryDto): { page: number; pageSize: number } {
    const page = Number.isFinite(query.page) ? Math.max(1, Number(query.page)) : 1;
    const pageSize = Number.isFinite(query.pageSize)
      ? Math.max(1, Math.min(100, Number(query.pageSize)))
      : 8;
    return { page, pageSize };
  }

  private filterInMemory(query: MeetingQueryDto & { q?: string }): MeetingRecord[] {
    const includeInCamera = query.inCamera === 'true' || query.inCamera === '1';
    const publicOnly = query.publicOnly === 'true' || query.publicOnly === '1';
    const search = query.q?.trim().toLowerCase();

    return Array.from(this.memoryMeetings.values()).filter((meeting) => {
      if (query.status && meeting.status !== query.status) {
        return false;
      }

      if (publicOnly && !meeting.isPublic) {
        return false;
      }

      if (!includeInCamera && meeting.isInCamera) {
        return false;
      }

      if (search) {
        const haystack = `${meeting.title} ${meeting.meetingTypeCode}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }

      return true;
    });
  }

  private compareMeetings(left: MeetingRecord, right: MeetingRecord, field: 'title' | 'startsAt' | 'status'): number {
    if (field === 'title') {
      return left.title.localeCompare(right.title);
    }
    if (field === 'status') {
      return left.status.localeCompare(right.status);
    }
    return left.startsAt.localeCompare(right.startsAt);
  }
}

interface DbMeetingRow {
  id: string;
  title: string;
  description: string | null;
  meeting_type_code: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  status: MeetingStatus;
  publish_status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  published_at: string | null;
  is_public: boolean;
  is_in_camera: boolean;
  video_url: string | null;
  recurrence_group_id: string | null;
  recurrence_index: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function toMeetingRecord(row: DbMeetingRow): MeetingRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    meetingTypeCode: row.meeting_type_code,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? undefined,
    location: row.location ?? undefined,
    status: row.status,
    publishStatus: row.publish_status,
    publishedAt: row.published_at ?? undefined,
    isPublic: row.is_public,
    isInCamera: row.is_in_camera,
    videoUrl: row.video_url ?? undefined,
    recurrenceGroupId: row.recurrence_group_id ?? undefined,
    recurrenceIndex: row.recurrence_index ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
