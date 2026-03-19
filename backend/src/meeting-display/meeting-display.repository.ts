import { Injectable } from '@nestjs/common';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export type MeetingDisplayMode = 'AGENDA' | 'MOTION' | 'PRESENTATION';

export interface MeetingDisplayStateRecord {
  meetingId: string;
  displayMode: MeetingDisplayMode;
  currentAgendaItemId?: string;
  currentPresentationId?: string;
  currentPresentationSlideIndex?: number;
  updatedBy: string;
  updatedAt: string;
}

interface DbMeetingDisplayStateRow {
  meeting_id: string;
  display_mode: MeetingDisplayMode;
  current_agenda_item_id: string | null;
  current_presentation_id: string | null;
  current_presentation_slide_index: number | null;
  updated_by: string;
  updated_at: string;
}

@Injectable()
export class MeetingDisplayRepository {
  private readonly memory = new Map<string, MeetingDisplayStateRecord>();

  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async getByMeetingId(meetingId: string): Promise<MeetingDisplayStateRecord | null> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbMeetingDisplayStateRow>(
        `SELECT * FROM app_meeting_display_state WHERE meeting_id = $1 LIMIT 1`,
        [meetingId],
      );
      if (result.rows.length === 0) {
        return null;
      }
      return toMeetingDisplayStateRecord(result.rows[0]);
    }, () => this.memory.get(meetingId) ?? null);
  }

  async upsert(
    meetingId: string,
    patch: Partial<Pick<MeetingDisplayStateRecord, 'displayMode'>> & {
      currentAgendaItemId?: string | null;
      currentPresentationId?: string | null;
      currentPresentationSlideIndex?: number | null;
    },
    updatedBy: string,
  ): Promise<MeetingDisplayStateRecord> {
    const existing = await this.getByMeetingId(meetingId);
    const hasAgendaItemPatch = Object.prototype.hasOwnProperty.call(patch, 'currentAgendaItemId');
    const hasPresentationPatch = Object.prototype.hasOwnProperty.call(patch, 'currentPresentationId');
    const hasSlideIndexPatch = Object.prototype.hasOwnProperty.call(patch, 'currentPresentationSlideIndex');
    const next: MeetingDisplayStateRecord = {
      meetingId,
      displayMode: patch.displayMode ?? existing?.displayMode ?? 'AGENDA',
      currentAgendaItemId: hasAgendaItemPatch
        ? patch.currentAgendaItemId ?? undefined
        : existing?.currentAgendaItemId,
      currentPresentationId: hasPresentationPatch
        ? patch.currentPresentationId ?? undefined
        : existing?.currentPresentationId,
      currentPresentationSlideIndex: hasSlideIndexPatch
        ? patch.currentPresentationSlideIndex ?? undefined
        : existing?.currentPresentationSlideIndex,
      updatedBy,
      updatedAt: new Date().toISOString(),
    };

    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbMeetingDisplayStateRow>(
        `INSERT INTO app_meeting_display_state (
          meeting_id,
          display_mode,
          current_agenda_item_id,
          current_presentation_id,
          current_presentation_slide_index,
          updated_by,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        )
        ON CONFLICT (meeting_id)
        DO UPDATE SET
          display_mode = EXCLUDED.display_mode,
          current_agenda_item_id = EXCLUDED.current_agenda_item_id,
          current_presentation_id = EXCLUDED.current_presentation_id,
          current_presentation_slide_index = EXCLUDED.current_presentation_slide_index,
          updated_by = EXCLUDED.updated_by,
          updated_at = EXCLUDED.updated_at
        RETURNING *`,
        [
          next.meetingId,
          next.displayMode,
          next.currentAgendaItemId ?? null,
          next.currentPresentationId ?? null,
          next.currentPresentationSlideIndex ?? null,
          next.updatedBy,
          next.updatedAt,
        ],
      );
      return toMeetingDisplayStateRecord(result.rows[0]);
    }, () => {
      this.memory.set(meetingId, next);
      return next;
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_meeting_display_state (
        meeting_id UUID PRIMARY KEY,
        display_mode VARCHAR(50) NOT NULL,
        current_agenda_item_id UUID,
        current_presentation_id UUID,
        current_presentation_slide_index INTEGER,
        updated_by VARCHAR(255) NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
    await this.postgresService.query(
      `ALTER TABLE app_meeting_display_state ADD COLUMN IF NOT EXISTS current_presentation_id UUID`,
    );
    await this.postgresService.query(
      `ALTER TABLE app_meeting_display_state ADD COLUMN IF NOT EXISTS current_presentation_slide_index INTEGER`,
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

function toMeetingDisplayStateRecord(row: DbMeetingDisplayStateRow): MeetingDisplayStateRecord {
  return {
    meetingId: row.meeting_id,
    displayMode: row.display_mode,
    currentAgendaItemId: row.current_agenda_item_id ?? undefined,
    currentPresentationId: row.current_presentation_id ?? undefined,
    currentPresentationSlideIndex: row.current_presentation_slide_index ?? undefined,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}
