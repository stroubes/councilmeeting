import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export type AttendanceRole = 'CHAIR' | 'COUNCIL_MEMBER' | 'STAFF' | 'GUEST';
export type AttendeeStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE' | 'EARLY_DEPARTURE';

export interface MeetingAttendeeRecord {
  id: string;
  meetingId: string;
  userId: string;
  role: AttendanceRole;
  status: AttendeeStatus;
  arrivedAt?: string;
  departedAt?: string;
  isConflictOfInterest: boolean;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuorumStatus {
  meetingId: string;
  councilSize: number;
  requiredCount: number;
  presentCount: number;
  isQuorumMet: boolean;
}

interface CreateAttendeeInput {
  meetingId: string;
  userId: string;
  role?: AttendanceRole;
  status?: AttendeeStatus;
  arrivedAt?: string;
  departedAt?: string;
  isConflictOfInterest?: boolean;
  notes?: string;
  recordedBy?: string;
}

@Injectable()
export class AttendeesRepository {
  private schemaEnsured = false;
  private readonly memoryAttendees = new Map<string, MeetingAttendeeRecord>();

  constructor(private readonly postgresService: PostgresService) {}

  async create(input: CreateAttendeeInput): Promise<MeetingAttendeeRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbAttendeeRow>(
        `INSERT INTO meeting_attendees (
          id, meeting_id, user_id, role, status, arrived_at, departed_at,
          is_conflict_of_interest, notes, recorded_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          id,
          input.meetingId,
          input.userId,
          input.role ?? 'COUNCIL_MEMBER',
          input.status ?? 'PRESENT',
          input.arrivedAt ?? null,
          input.departedAt ?? null,
          input.isConflictOfInterest ?? false,
          input.notes ?? null,
          input.recordedBy ?? null,
          now,
          now,
        ],
      );
      return toAttendeeRecord(result.rows[0]);
    }, () => this.createInMemory(input));
  }

  async listByMeeting(meetingId: string): Promise<MeetingAttendeeRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbAttendeeRow>(
        `SELECT * FROM meeting_attendees WHERE meeting_id = $1 ORDER BY arrived_at ASC NULLS LAST`,
        [meetingId],
      );
      return result.rows.map(toAttendeeRecord);
    }, () => this.listByMeetingInMemory(meetingId));
  }

  async getById(id: string): Promise<MeetingAttendeeRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbAttendeeRow>(
        `SELECT * FROM meeting_attendees WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Attendee record not found');
      }
      return toAttendeeRecord(result.rows[0]);
    }, () => {
      const found = Array.from(this.memoryAttendees.values()).find((a) => a.id === id);
      if (!found) {
        throw new NotFoundException('Attendee record not found');
      }
      return found;
    });
  }

  async update(id: string, patch: Partial<MeetingAttendeeRecord>): Promise<MeetingAttendeeRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const updatedAt = new Date().toISOString();
      const result = await this.postgresService.query<DbAttendeeRow>(
        `UPDATE meeting_attendees
         SET role = $2,
             status = $3,
             arrived_at = $4,
             departed_at = $5,
             is_conflict_of_interest = $6,
             notes = $7,
             updated_at = $8
         WHERE id = $1
         RETURNING *`,
        [
          id,
          patch.role ?? existing.role,
          patch.status ?? existing.status,
          patch.arrivedAt ?? existing.arrivedAt ?? null,
          patch.departedAt ?? existing.departedAt ?? null,
          patch.isConflictOfInterest ?? existing.isConflictOfInterest,
          patch.notes ?? existing.notes ?? null,
          updatedAt,
        ],
      );
      return toAttendeeRecord(result.rows[0]);
    }, async () => {
      const existing = await this.getById(id);
      const updated: MeetingAttendeeRecord = {
        ...existing,
        ...patch,
        id,
        updatedAt: new Date().toISOString(),
      };
      this.memoryAttendees.set(id, updated);
      return updated;
    });
  }

  async upsert(meetingId: string, userId: string, input: Partial<CreateAttendeeInput>): Promise<MeetingAttendeeRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.postgresService.query<DbAttendeeRow>(
        `SELECT * FROM meeting_attendees WHERE meeting_id = $1 AND user_id = $2 LIMIT 1`,
        [meetingId, userId],
      );
      if (existing.rows.length > 0) {
        return this.update(existing.rows[0].id, input);
      }
      return this.create({ meetingId, userId, ...input });
    }, async () => {
      const found = Array.from(this.memoryAttendees.values()).find(
        (a) => a.meetingId === meetingId && a.userId === userId,
      );
      if (found) {
        return this.update(found.id, input);
      }
      return this.createInMemory({ meetingId, userId, ...input });
    });
  }

  async remove(id: string): Promise<void> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const deleted = await this.postgresService.query(`DELETE FROM meeting_attendees WHERE id = $1`, [id]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Attendee record not found');
      }
    }, () => {
      const found = Array.from(this.memoryAttendees.entries()).find(([, a]) => a.id === id);
      if (!found) {
        throw new NotFoundException('Attendee record not found');
      }
      this.memoryAttendees.delete(found[0]);
    });
  }

  async countPresentCouncilMembers(meetingId: string): Promise<number> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM meeting_attendees
         WHERE meeting_id = $1
           AND role = 'COUNCIL_MEMBER'
           AND status IN ('PRESENT', 'LATE')`,
        [meetingId],
      );
      return Number.parseInt(result.rows[0]?.count ?? '0', 10);
    }, () => {
      return Array.from(this.memoryAttendees.values()).filter(
        (a) => a.meetingId === meetingId && a.role === 'COUNCIL_MEMBER' && (a.status === 'PRESENT' || a.status === 'LATE'),
      ).length;
    });
  }

  async getCouncilSizeForMeetingType(meetingTypeCode: string): Promise<number> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<{ council_size: number }>(
        `SELECT council_size FROM app_meeting_types WHERE code = $1 LIMIT 1`,
        [meetingTypeCode],
      );
      return result.rows[0]?.council_size ?? 0;
    }, () => 0);
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TYPE IF NOT EXISTS attendance_role AS ENUM ('CHAIR', 'COUNCIL_MEMBER', 'STAFF', 'GUEST')
    `);
    await this.postgresService.query(`
      CREATE TYPE IF NOT EXISTS attendee_status AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE', 'EARLY_DEPARTURE')
    `);

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS meeting_attendees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL,
        user_id UUID NOT NULL,
        role attendance_role NOT NULL DEFAULT 'COUNCIL_MEMBER',
        status attendee_status NOT NULL DEFAULT 'PRESENT',
        arrived_at TIMESTAMPTZ,
        departed_at TIMESTAMPTZ,
        is_conflict_of_interest BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT,
        recorded_by UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (meeting_id, user_id)
      )
    `);

    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting ON meeting_attendees(meeting_id)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user ON meeting_attendees(user_id)`,
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

  private createInMemory(input: CreateAttendeeInput): MeetingAttendeeRecord {
    const now = new Date().toISOString();
    const record: MeetingAttendeeRecord = {
      id: randomUUID(),
      meetingId: input.meetingId,
      userId: input.userId,
      role: input.role ?? 'COUNCIL_MEMBER',
      status: input.status ?? 'PRESENT',
      arrivedAt: input.arrivedAt,
      departedAt: input.departedAt,
      isConflictOfInterest: input.isConflictOfInterest ?? false,
      notes: input.notes,
      recordedBy: input.recordedBy,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryAttendees.set(record.id, record);
    return record;
  }

  private listByMeetingInMemory(meetingId: string): MeetingAttendeeRecord[] {
    return Array.from(this.memoryAttendees.values())
      .filter((a) => a.meetingId === meetingId)
      .sort((a, b) => (a.arrivedAt ?? '').localeCompare(b.arrivedAt ?? ''));
  }
}

interface DbAttendeeRow {
  id: string;
  meeting_id: string;
  user_id: string;
  role: AttendanceRole;
  status: AttendeeStatus;
  arrived_at: string | null;
  departed_at: string | null;
  is_conflict_of_interest: boolean;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

function toAttendeeRecord(row: DbAttendeeRow): MeetingAttendeeRecord {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    arrivedAt: row.arrived_at ?? undefined,
    departedAt: row.departed_at ?? undefined,
    isConflictOfInterest: row.is_conflict_of_interest,
    notes: row.notes ?? undefined,
    recordedBy: row.recorded_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}