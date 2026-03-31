import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export type ResolutionStatus = 'DRAFT' | 'ADOPTED' | 'DEFEATED' | 'WITHDRAWN';

export interface ResolutionRecord {
  id: string;
  meetingId: string;
  agendaItemId?: string;
  motionId?: string;
  resolutionNumber: string;
  title: string;
  body: string;
  bylawNumber?: string;
  movedBy?: string;
  secondedBy?: string;
  voteFor: number;
  voteAgainst: number;
  voteAbstain: number;
  status: ResolutionStatus;
  isActionRequired: boolean;
  dueDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateResolutionInput {
  meetingId: string;
  agendaItemId?: string;
  motionId?: string;
  resolutionNumber: string;
  title: string;
  body: string;
  bylawNumber?: string;
  movedBy?: string;
  secondedBy?: string;
  voteFor: number;
  voteAgainst: number;
  voteAbstain: number;
  status: ResolutionStatus;
  isActionRequired: boolean;
  dueDate?: string;
  createdBy: string;
}

@Injectable()
export class ResolutionsRepository {
  private readonly memory = new Map<string, ResolutionRecord>();
  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async list(meetingId?: string): Promise<ResolutionRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const params: unknown[] = [];
      const whereClause = meetingId ? 'WHERE meeting_id = $1' : '';
      if (meetingId) {
        params.push(meetingId);
      }
      const result = await this.postgresService.query<DbResolutionRow>(
        `SELECT * FROM app_resolutions ${whereClause} ORDER BY created_at DESC`,
        params,
      );
      return result.rows.map((row) => toResolutionRecord(row));
    }, () =>
      Array.from(this.memory.values())
        .filter((record) => (meetingId ? record.meetingId === meetingId : true))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
  }

  async getById(id: string): Promise<ResolutionRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbResolutionRow>(`SELECT * FROM app_resolutions WHERE id = $1 LIMIT 1`, [id]);
      if (result.rows.length === 0) {
        throw new NotFoundException('Resolution not found');
      }
      return toResolutionRecord(result.rows[0]);
    }, () => {
      const record = this.memory.get(id);
      if (!record) {
        throw new NotFoundException('Resolution not found');
      }
      return record;
    });
  }

  async create(input: CreateResolutionInput): Promise<ResolutionRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbResolutionRow>(
        `INSERT INTO app_resolutions (
          id, meeting_id, agenda_item_id, motion_id, resolution_number,
          title, body, bylaw_number, moved_by, seconded_by,
          vote_for, vote_against, vote_abstain, status, is_action_required,
          due_date, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19
        ) RETURNING *`,
        [
          id,
          input.meetingId,
          input.agendaItemId,
          input.motionId,
          input.resolutionNumber,
          input.title,
          input.body,
          input.bylawNumber,
          input.movedBy,
          input.secondedBy,
          input.voteFor,
          input.voteAgainst,
          input.voteAbstain,
          input.status,
          input.isActionRequired,
          input.dueDate,
          input.createdBy,
          now,
          now,
        ],
      );
      return toResolutionRecord(result.rows[0]);
    }, () => {
      const now = new Date().toISOString();
      const record: ResolutionRecord = {
        id: randomUUID(),
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      this.memory.set(record.id, record);
      return record;
    });
  }

  async update(id: string, patch: Partial<ResolutionRecord>): Promise<ResolutionRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const result = await this.postgresService.query<DbResolutionRow>(
        `UPDATE app_resolutions
         SET title = $2,
             body = $3,
             bylaw_number = $4,
             moved_by = $5,
             seconded_by = $6,
             vote_for = $7,
             vote_against = $8,
             vote_abstain = $9,
             status = $10,
             is_action_required = $11,
             due_date = $12,
             updated_at = $13
         WHERE id = $1
         RETURNING *`,
        [
          id,
          patch.title ?? existing.title,
          patch.body ?? existing.body,
          patch.bylawNumber ?? existing.bylawNumber ?? null,
          patch.movedBy ?? existing.movedBy ?? null,
          patch.secondedBy ?? existing.secondedBy ?? null,
          patch.voteFor ?? existing.voteFor,
          patch.voteAgainst ?? existing.voteAgainst,
          patch.voteAbstain ?? existing.voteAbstain,
          patch.status ?? existing.status,
          patch.isActionRequired ?? existing.isActionRequired,
          patch.dueDate ?? existing.dueDate ?? null,
          new Date().toISOString(),
        ],
      );
      return toResolutionRecord(result.rows[0]);
    }, async () => {
      const existing = await this.getById(id);
      const updated = {
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
      const deleted = await this.postgresService.query(`DELETE FROM app_resolutions WHERE id = $1`, [id]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Resolution not found');
      }
    }, () => {
      if (!this.memory.delete(id)) {
        throw new NotFoundException('Resolution not found');
      }
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }
    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_resolutions (
        id UUID PRIMARY KEY,
        meeting_id UUID NOT NULL,
        agenda_item_id UUID,
        motion_id UUID,
        resolution_number VARCHAR(100) NOT NULL,
        title VARCHAR(500) NOT NULL,
        body TEXT NOT NULL,
        bylaw_number VARCHAR(100),
        moved_by VARCHAR(255),
        seconded_by VARCHAR(255),
        vote_for INTEGER NOT NULL DEFAULT 0,
        vote_against INTEGER NOT NULL DEFAULT 0,
        vote_abstain INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL,
        is_action_required BOOLEAN NOT NULL DEFAULT FALSE,
        due_date DATE,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
    await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_resolutions_meeting_id ON app_resolutions(meeting_id)`);
    await this.postgresService.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_app_resolutions_number ON app_resolutions(resolution_number)`);
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

interface DbResolutionRow {
  id: string;
  meeting_id: string;
  agenda_item_id: string | null;
  motion_id: string | null;
  resolution_number: string;
  title: string;
  body: string;
  bylaw_number: string | null;
  moved_by: string | null;
  seconded_by: string | null;
  vote_for: number;
  vote_against: number;
  vote_abstain: number;
  status: ResolutionStatus;
  is_action_required: boolean;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function toResolutionRecord(row: DbResolutionRow): ResolutionRecord {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    agendaItemId: row.agenda_item_id ?? undefined,
    motionId: row.motion_id ?? undefined,
    resolutionNumber: row.resolution_number,
    title: row.title,
    body: row.body,
    bylawNumber: row.bylaw_number ?? undefined,
    movedBy: row.moved_by ?? undefined,
    secondedBy: row.seconded_by ?? undefined,
    voteFor: row.vote_for,
    voteAgainst: row.vote_against,
    voteAbstain: row.vote_abstain,
    status: row.status,
    isActionRequired: row.is_action_required,
    dueDate: row.due_date ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
