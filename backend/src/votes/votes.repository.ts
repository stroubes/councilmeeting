import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export type VoteValue = 'YEA' | 'NAY' | 'ABSTAIN' | 'ABSENT';

export interface VoteRecord {
  id: string;
  motionId: string;
  councilMemberId: string;
  voteValue: VoteValue;
  votedAt: string;
  isConflictDeclared: boolean;
  note?: string;
  createdAt: string;
}

export interface VoteTally {
  motionId: string;
  yesCount: number;
  noCount: number;
  abstainCount: number;
  absentCount: number;
  totalVotes: number;
  recordedVotes: VoteRecord[];
}

interface CastVoteInput {
  motionId: string;
  councilMemberId: string;
  voteValue: VoteValue;
  isConflictDeclared?: boolean;
  note?: string;
}

@Injectable()
export class VotesRepository {
  private schemaEnsured = false;
  private readonly memoryVotes = new Map<string, VoteRecord>();

  constructor(private readonly postgresService: PostgresService) {}

  async upsert(input: CastVoteInput): Promise<VoteRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.postgresService.query<DbVoteRow>(
        `SELECT * FROM app_votes WHERE motion_id = $1 AND council_member_id = $2 LIMIT 1`,
        [input.motionId, input.councilMemberId],
      );
      if (existing.rows.length > 0) {
        return this.doUpdate(existing.rows[0].id, input);
      }
      return this.doInsert(input);
    }, () => this.upsertInMemory(input));
  }

  async listByMotion(motionId: string): Promise<VoteRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbVoteRow>(
        `SELECT * FROM app_votes WHERE motion_id = $1 ORDER BY voted_at ASC`,
        [motionId],
      );
      return result.rows.map(toVoteRecord);
    }, () => this.listByMotionInMemory(motionId));
  }

  async getTally(motionId: string): Promise<VoteTally> {
    const recordedVotes = await this.listByMotion(motionId);
    return {
      motionId,
      yesCount: recordedVotes.filter((v) => v.voteValue === 'YEA').length,
      noCount: recordedVotes.filter((v) => v.voteValue === 'NAY').length,
      abstainCount: recordedVotes.filter((v) => v.voteValue === 'ABSTAIN').length,
      absentCount: recordedVotes.filter((v) => v.voteValue === 'ABSENT').length,
      totalVotes: recordedVotes.length,
      recordedVotes,
    };
  }

  async getById(id: string): Promise<VoteRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbVoteRow>(
        `SELECT * FROM app_votes WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Vote not found');
      }
      return toVoteRecord(result.rows[0]);
    }, () => {
      const found = Array.from(this.memoryVotes.values()).find((v) => v.id === id);
      if (!found) {
        throw new NotFoundException('Vote not found');
      }
      return found;
    });
  }

  async getByMotionAndMember(motionId: string, councilMemberId: string): Promise<VoteRecord | null> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbVoteRow>(
        `SELECT * FROM app_votes WHERE motion_id = $1 AND council_member_id = $2 LIMIT 1`,
        [motionId, councilMemberId],
      );
      return result.rows.length > 0 ? toVoteRecord(result.rows[0]) : null;
    }, () => {
      return (
        Array.from(this.memoryVotes.values()).find(
          (v) => v.motionId === motionId && v.councilMemberId === councilMemberId,
        ) ?? null
      );
    });
  }

  async remove(id: string): Promise<void> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const deleted = await this.postgresService.query(`DELETE FROM app_votes WHERE id = $1`, [id]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Vote not found');
      }
    }, () => {
      const entry = Array.from(this.memoryVotes.entries()).find(([, v]) => v.id === id);
      if (!entry) {
        throw new NotFoundException('Vote not found');
      }
      this.memoryVotes.delete(entry[0]);
    });
  }

  private async doInsert(input: CastVoteInput): Promise<VoteRecord> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const result = await this.postgresService.query<DbVoteRow>(
      `INSERT INTO app_votes (id, motion_id, council_member_id, vote_value, voted_at, is_conflict_declared, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        input.motionId,
        input.councilMemberId,
        input.voteValue,
        now,
        input.isConflictDeclared ?? false,
        input.note ?? null,
        now,
      ],
    );
    return toVoteRecord(result.rows[0]);
  }

  private async doUpdate(id: string, input: Partial<CastVoteInput>): Promise<VoteRecord> {
    const existing = await this.getById(id);
    const now = new Date().toISOString();
    const result = await this.postgresService.query<DbVoteRow>(
      `UPDATE app_votes
       SET vote_value = $2,
            is_conflict_declared = $3,
            note = $4,
           voted_at = $5
       WHERE id = $1
       RETURNING *`,
      [
        id,
        input.voteValue ?? existing.voteValue,
        input.isConflictDeclared ?? existing.isConflictDeclared,
        input.note ?? existing.note ?? null,
        now,
      ],
    );
    return toVoteRecord(result.rows[0]);
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vote_value_enum') THEN
          CREATE TYPE vote_value_enum AS ENUM ('YEA', 'NAY', 'ABSTAIN', 'ABSENT');
        END IF;
      END $$;
    `);

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        motion_id UUID NOT NULL,
        council_member_id UUID NOT NULL,
        vote_value vote_value_enum NOT NULL,
        voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_conflict_declared BOOLEAN NOT NULL DEFAULT FALSE,
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (motion_id, council_member_id)
      )
    `);

    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_votes_motion ON app_votes(motion_id)`,
    );

    await this.postgresService.query(`
      DO $$
      BEGIN
        IF to_regclass('public.app_motions') IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_votes_motion'
          ) THEN
          ALTER TABLE app_votes
            ADD CONSTRAINT fk_app_votes_motion
            FOREIGN KEY (motion_id) REFERENCES app_motions(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

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

  private upsertInMemory(input: CastVoteInput): VoteRecord {
    const existing = Array.from(this.memoryVotes.values()).find(
      (v) => v.motionId === input.motionId && v.councilMemberId === input.councilMemberId,
    );
    const now = new Date().toISOString();
    if (existing) {
      const updated: VoteRecord = {
        ...existing,
        voteValue: input.voteValue,
        isConflictDeclared: input.isConflictDeclared ?? existing.isConflictDeclared,
        note: input.note ?? existing.note,
        votedAt: now,
      };
      this.memoryVotes.set(existing.id, updated);
      return updated;
    }
    const record: VoteRecord = {
      id: randomUUID(),
      motionId: input.motionId,
      councilMemberId: input.councilMemberId,
      voteValue: input.voteValue,
      votedAt: now,
      isConflictDeclared: input.isConflictDeclared ?? false,
      note: input.note,
      createdAt: now,
    };
    this.memoryVotes.set(record.id, record);
    return record;
  }

  private listByMotionInMemory(motionId: string): VoteRecord[] {
    return Array.from(this.memoryVotes.values())
      .filter((v) => v.motionId === motionId)
      .sort((a, b) => a.votedAt.localeCompare(b.votedAt));
  }
}

interface DbVoteRow {
  id: string;
  motion_id: string;
  council_member_id: string;
  vote_value: VoteValue;
  voted_at: string;
  is_conflict_declared: boolean;
  note: string | null;
  created_at: string;
}

function toVoteRecord(row: DbVoteRow): VoteRecord {
  return {
    id: row.id,
    motionId: row.motion_id,
    councilMemberId: row.council_member_id,
    voteValue: row.vote_value,
    votedAt: row.voted_at,
    isConflictDeclared: row.is_conflict_declared,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}
