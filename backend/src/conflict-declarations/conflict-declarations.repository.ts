import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export interface ConflictDeclarationRecord {
  id: string;
  meetingId: string;
  agendaItemId?: string;
  userId: string;
  reason?: string;
  declaredAt: string;
  recordedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateDeclarationInput {
  meetingId: string;
  agendaItemId?: string;
  userId: string;
  reason?: string;
  recordedByUserId?: string;
}

interface UpdateDeclarationInput {
  reason?: string;
}

@Injectable()
export class ConflictDeclarationsRepository {
  private schemaEnsured = false;
  private readonly memoryDeclarations = new Map<string, ConflictDeclarationRecord>();

  constructor(private readonly postgresService: PostgresService) {}

  async create(input: CreateDeclarationInput): Promise<ConflictDeclarationRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbDeclarationRow>(
        `INSERT INTO conflict_declarations (
          id, meeting_id, agenda_item_id, user_id, reason, declared_at, recorded_by_user_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          id,
          input.meetingId,
          input.agendaItemId ?? null,
          input.userId,
          input.reason ?? null,
          now,
          input.recordedByUserId ?? null,
          now,
          now,
        ],
      );
      return toDeclarationRecord(result.rows[0]);
    }, () => this.createInMemory(input));
  }

  async listByMeeting(meetingId: string): Promise<ConflictDeclarationRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbDeclarationRow>(
        `SELECT * FROM conflict_declarations WHERE meeting_id = $1 ORDER BY declared_at ASC`,
        [meetingId],
      );
      return result.rows.map(toDeclarationRecord);
    }, () => this.listByMeetingInMemory(meetingId));
  }

  async listByAgendaItem(agendaItemId: string): Promise<ConflictDeclarationRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbDeclarationRow>(
        `SELECT * FROM conflict_declarations WHERE agenda_item_id = $1 ORDER BY declared_at ASC`,
        [agendaItemId],
      );
      return result.rows.map(toDeclarationRecord);
    }, () =>
      Array.from(this.memoryDeclarations.values()).filter((d) => d.agendaItemId === agendaItemId),
    );
  }

  async getById(id: string): Promise<ConflictDeclarationRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbDeclarationRow>(
        `SELECT * FROM conflict_declarations WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Conflict declaration not found');
      }
      return toDeclarationRecord(result.rows[0]);
    }, () => {
      const found = Array.from(this.memoryDeclarations.values()).find((d) => d.id === id);
      if (!found) {
        throw new NotFoundException('Conflict declaration not found');
      }
      return found;
    });
  }

  async update(id: string, patch: UpdateDeclarationInput): Promise<ConflictDeclarationRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const updatedAt = new Date().toISOString();
      const result = await this.postgresService.query<DbDeclarationRow>(
        `UPDATE conflict_declarations
         SET reason = $2,
             updated_at = $3
         WHERE id = $1
         RETURNING *`,
        [id, patch.reason ?? existing.reason ?? null, updatedAt],
      );
      return toDeclarationRecord(result.rows[0]);
    }, async () => {
      const existing = await this.getById(id);
      const updated: ConflictDeclarationRecord = {
        ...existing,
        ...patch,
        id,
        updatedAt: new Date().toISOString(),
      };
      this.memoryDeclarations.set(id, updated);
      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const deleted = await this.postgresService.query(`DELETE FROM conflict_declarations WHERE id = $1`, [id]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Conflict declaration not found');
      }
    }, () => {
      const found = Array.from(this.memoryDeclarations.entries()).find(([, d]) => d.id === id);
      if (!found) {
        throw new NotFoundException('Conflict declaration not found');
      }
      this.memoryDeclarations.delete(found[0]);
    });
  }

  async getByMeetingAndUser(meetingId: string, userId: string): Promise<ConflictDeclarationRecord | null> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbDeclarationRow>(
        `SELECT * FROM conflict_declarations WHERE meeting_id = $1 AND user_id = $2 LIMIT 1`,
        [meetingId, userId],
      );
      return result.rows.length > 0 ? toDeclarationRecord(result.rows[0]) : null;
    }, () =>
      Array.from(this.memoryDeclarations.values()).find(
        (d) => d.meetingId === meetingId && d.userId === userId,
      ) ?? null,
    );
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS conflict_declarations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
        agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE SET NULL,
        user_id UUID NOT NULL REFERENCES users(id),
        reason TEXT,
        declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        recorded_by_user_id UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_conflict_declarations_meeting ON conflict_declarations(meeting_id)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_conflict_declarations_agenda ON conflict_declarations(agenda_item_id)`,
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

  private createInMemory(input: CreateDeclarationInput): ConflictDeclarationRecord {
    const now = new Date().toISOString();
    const record: ConflictDeclarationRecord = {
      id: randomUUID(),
      meetingId: input.meetingId,
      agendaItemId: input.agendaItemId,
      userId: input.userId,
      reason: input.reason,
      declaredAt: now,
      recordedByUserId: input.recordedByUserId,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryDeclarations.set(record.id, record);
    return record;
  }

  private listByMeetingInMemory(meetingId: string): ConflictDeclarationRecord[] {
    return Array.from(this.memoryDeclarations.values())
      .filter((d) => d.meetingId === meetingId)
      .sort((a, b) => a.declaredAt.localeCompare(b.declaredAt));
  }
}

interface DbDeclarationRow {
  id: string;
  meeting_id: string;
  agenda_item_id: string | null;
  user_id: string;
  reason: string | null;
  declared_at: string;
  recorded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

function toDeclarationRecord(row: DbDeclarationRow): ConflictDeclarationRecord {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    agendaItemId: row.agenda_item_id ?? undefined,
    userId: row.user_id,
    reason: row.reason ?? undefined,
    declaredAt: row.declared_at,
    recordedByUserId: row.recorded_by_user_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}