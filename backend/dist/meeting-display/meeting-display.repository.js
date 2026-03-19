"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingDisplayRepository = void 0;
const common_1 = require("@nestjs/common");
const postgres_service_1 = require("../database/postgres.service");
let MeetingDisplayRepository = class MeetingDisplayRepository {
    postgresService;
    memory = new Map();
    schemaEnsured = false;
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async getByMeetingId(meetingId) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_meeting_display_state WHERE meeting_id = $1 LIMIT 1`, [meetingId]);
            if (result.rows.length === 0) {
                return null;
            }
            return toMeetingDisplayStateRecord(result.rows[0]);
        }, () => this.memory.get(meetingId) ?? null);
    }
    async upsert(meetingId, patch, updatedBy) {
        const existing = await this.getByMeetingId(meetingId);
        const hasAgendaItemPatch = Object.prototype.hasOwnProperty.call(patch, 'currentAgendaItemId');
        const hasPresentationPatch = Object.prototype.hasOwnProperty.call(patch, 'currentPresentationId');
        const hasSlideIndexPatch = Object.prototype.hasOwnProperty.call(patch, 'currentPresentationSlideIndex');
        const next = {
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
            const result = await this.postgresService.query(`INSERT INTO app_meeting_display_state (
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
        RETURNING *`, [
                next.meetingId,
                next.displayMode,
                next.currentAgendaItemId ?? null,
                next.currentPresentationId ?? null,
                next.currentPresentationSlideIndex ?? null,
                next.updatedBy,
                next.updatedAt,
            ]);
            return toMeetingDisplayStateRecord(result.rows[0]);
        }, () => {
            this.memory.set(meetingId, next);
            return next;
        });
    }
    async ensureSchema() {
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
        await this.postgresService.query(`ALTER TABLE app_meeting_display_state ADD COLUMN IF NOT EXISTS current_presentation_id UUID`);
        await this.postgresService.query(`ALTER TABLE app_meeting_display_state ADD COLUMN IF NOT EXISTS current_presentation_slide_index INTEGER`);
        this.schemaEnsured = true;
    }
    async withFallback(dbFn, fallbackFn) {
        if (!this.postgresService.isEnabled) {
            return fallbackFn();
        }
        try {
            return await dbFn();
        }
        catch (error) {
            if (error instanceof postgres_service_1.DatabaseUnavailableError) {
                return fallbackFn();
            }
            throw error;
        }
    }
};
exports.MeetingDisplayRepository = MeetingDisplayRepository;
exports.MeetingDisplayRepository = MeetingDisplayRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], MeetingDisplayRepository);
function toMeetingDisplayStateRecord(row) {
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
//# sourceMappingURL=meeting-display.repository.js.map