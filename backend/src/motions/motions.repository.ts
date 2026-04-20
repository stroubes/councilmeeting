import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export type MotionStatus = 'DRAFT' | 'LIVE' | 'CARRIED' | 'DEFEATED' | 'WITHDRAWN';
export type MotionPhase = 'PROPOSED' | 'SECONDED' | 'DEBATING' | 'CALLED';

export interface MotionRecord {
  id: string;
  meetingId: string;
  agendaItemId?: string;
  sortOrder: number;
  title: string;
  body: string;
  status: MotionStatus;
  motionPhase: MotionPhase;
  moverUserId?: string;
  seconderUserId?: string;
  isCurrentLive: boolean;
  resultNote?: string;
  liveAt?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateMotionInput {
  meetingId: string;
  agendaItemId?: string;
  title: string;
  body: string;
  moverUserId?: string;
  createdBy: string;
}

@Injectable()
export class MotionsRepository {
  private readonly memory = new Map<string, MotionRecord>();
  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async list(meetingId?: string): Promise<MotionRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const params: unknown[] = [];
      const whereClause = meetingId ? 'WHERE meeting_id = $1' : '';
      if (meetingId) {
        params.push(meetingId);
      }
      const result = await this.postgresService.query<DbMotionRow>(
        `SELECT * FROM app_motions ${whereClause} ORDER BY sort_order ASC, created_at ASC`,
        params,
      );
      return result.rows.map((row) => toMotionRecord(row));
    }, () => {
      const rows = Array.from(this.memory.values());
      return rows
        .filter((row) => (meetingId ? row.meetingId === meetingId : true))
        .sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt));
    });
  }

  async getById(id: string): Promise<MotionRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbMotionRow>(`SELECT * FROM app_motions WHERE id = $1 LIMIT 1`, [id]);
      if (result.rows.length === 0) {
        throw new NotFoundException('Motion not found');
      }
      return toMotionRecord(result.rows[0]);
    }, () => {
      const record = this.memory.get(id);
      if (!record) {
        throw new NotFoundException('Motion not found');
      }
      return record;
    });
  }

  async create(input: CreateMotionInput): Promise<MotionRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const sortOrder = await this.getNextSortOrder(input.meetingId);
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbMotionRow>(
        `INSERT INTO app_motions (
          id, meeting_id, agenda_item_id, sort_order, title, body, status, motion_phase,
          mover_user_id, is_current_live, result_note, live_at, created_by, updated_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'DRAFT', 'PROPOSED', $7, false, NULL, NULL, $8, $9, $10, $11
        ) RETURNING *`,
        [id, input.meetingId, input.agendaItemId, sortOrder, input.title, input.body, input.moverUserId ?? null, input.createdBy, input.createdBy, now, now],
      );
      return toMotionRecord(result.rows[0]);
    }, async () => {
      const meetingRows = (await this.list(input.meetingId)).length;
      const now = new Date().toISOString();
      const record: MotionRecord = {
        id: randomUUID(),
        meetingId: input.meetingId,
        agendaItemId: input.agendaItemId,
        sortOrder: meetingRows + 1,
        title: input.title,
        body: input.body,
        status: 'DRAFT',
        motionPhase: 'PROPOSED',
        moverUserId: input.moverUserId,
        seconderUserId: undefined,
        isCurrentLive: false,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
      };
      this.memory.set(record.id, record);
      return record;
    });
  }

  async update(
    id: string,
    patch: Partial<Pick<MotionRecord, 'agendaItemId' | 'title' | 'body' | 'status' | 'motionPhase' | 'moverUserId' | 'seconderUserId' | 'isCurrentLive' | 'resultNote' | 'liveAt' | 'updatedBy'>>,
  ): Promise<MotionRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const updatedAt = new Date().toISOString();
      const result = await this.postgresService.query<DbMotionRow>(
        `UPDATE app_motions
         SET agenda_item_id = $2,
             title = $3,
             body = $4,
             status = $5,
             motion_phase = $6,
             mover_user_id = $7,
             seconder_user_id = $8,
             is_current_live = $9,
             result_note = $10,
             live_at = $11,
             updated_by = $12,
             updated_at = $13
          WHERE id = $1
          RETURNING *`,
        [
          id,
          patch.agendaItemId ?? null,
          patch.title ?? existing.title,
          patch.body ?? existing.body,
          patch.status ?? existing.status,
          patch.motionPhase ?? existing.motionPhase,
          patch.moverUserId ?? existing.moverUserId ?? null,
          patch.seconderUserId ?? existing.seconderUserId ?? null,
          patch.isCurrentLive ?? existing.isCurrentLive,
          patch.resultNote ?? null,
          patch.liveAt ?? existing.liveAt ?? null,
          patch.updatedBy ?? existing.updatedBy,
          updatedAt,
        ],
      );
      return toMotionRecord(result.rows[0]);
    }, async () => {
      const existing = await this.getById(id);
      const updated: MotionRecord = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      this.memory.set(id, updated);
      return updated;
    });
  }

  async clearLiveByMeeting(meetingId: string, updatedBy: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      await this.postgresService.query(
        `UPDATE app_motions
         SET is_current_live = false,
             updated_by = $2,
             updated_at = $3
         WHERE meeting_id = $1 AND is_current_live = true`,
        [meetingId, updatedBy, new Date().toISOString()],
      );
    }, async () => {
      const rows = await this.list(meetingId);
      const updatedAt = new Date().toISOString();
      for (const row of rows) {
        if (!row.isCurrentLive) {
          continue;
        }
        this.memory.set(row.id, {
          ...row,
          isCurrentLive: false,
          updatedBy,
          updatedAt,
        });
      }
    });
  }

  async getCurrentLiveByMeeting(meetingId: string): Promise<MotionRecord | null> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbMotionRow>(
        `SELECT * FROM app_motions WHERE meeting_id = $1 AND is_current_live = true LIMIT 1`,
        [meetingId],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return toMotionRecord(result.rows[0]);
    }, async () => {
      const rows = await this.list(meetingId);
      return rows.find((row) => row.isCurrentLive) ?? null;
    });
  }

  async remove(id: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      const deleted = await this.postgresService.query(`DELETE FROM app_motions WHERE id = $1`, [id]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Motion not found');
      }
    }, () => {
      if (!this.memory.delete(id)) {
        throw new NotFoundException('Motion not found');
      }
    });
  }

  private async getNextSortOrder(meetingId: string): Promise<number> {
    const result = await this.postgresService.query<{ max_sort_order: number | null }>(
      `SELECT MAX(sort_order) AS max_sort_order FROM app_motions WHERE meeting_id = $1`,
      [meetingId],
    );
    const maxSortOrder = result.rows[0]?.max_sort_order ?? 0;
    return maxSortOrder + 1;
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_motions (
        id UUID PRIMARY KEY,
        meeting_id UUID NOT NULL,
        agenda_item_id UUID,
        sort_order INTEGER NOT NULL,
        title VARCHAR(500) NOT NULL,
        body TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        motion_phase VARCHAR(50) NOT NULL DEFAULT 'PROPOSED',
        mover_user_id VARCHAR(255),
        seconder_user_id VARCHAR(255),
        is_current_live BOOLEAN NOT NULL DEFAULT FALSE,
        result_note TEXT,
        live_at TIMESTAMPTZ,
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
    await this.postgresService.query(`ALTER TABLE app_motions ADD COLUMN IF NOT EXISTS motion_phase VARCHAR(50) NOT NULL DEFAULT 'PROPOSED'`);
    await this.postgresService.query(`ALTER TABLE app_motions ADD COLUMN IF NOT EXISTS mover_user_id VARCHAR(255)`);
    await this.postgresService.query(`ALTER TABLE app_motions ADD COLUMN IF NOT EXISTS seconder_user_id VARCHAR(255)`);
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_motions_meeting_id ON app_motions(meeting_id)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_motions_phase ON app_motions(motion_phase)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_motions_mover ON app_motions(mover_user_id)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_motions_seconder ON app_motions(seconder_user_id)`,
    );
    await this.postgresService.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_app_motions_one_live_per_meeting ON app_motions(meeting_id) WHERE is_current_live = true`,
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

interface DbMotionRow {
  id: string;
  meeting_id: string;
  agenda_item_id: string | null;
  sort_order: number;
  title: string;
  body: string;
  status: MotionStatus;
  motion_phase: MotionPhase;
  mover_user_id: string | null;
  seconder_user_id: string | null;
  is_current_live: boolean;
  result_note: string | null;
  live_at: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

function toMotionRecord(row: DbMotionRow): MotionRecord {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    agendaItemId: row.agenda_item_id ?? undefined,
    sortOrder: row.sort_order,
    title: row.title,
    body: row.body,
    status: row.status,
    motionPhase: row.motion_phase,
    moverUserId: row.mover_user_id ?? undefined,
    seconderUserId: row.seconder_user_id ?? undefined,
    isCurrentLive: row.is_current_live,
    resultNote: row.result_note ?? undefined,
    liveAt: row.live_at ?? undefined,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
