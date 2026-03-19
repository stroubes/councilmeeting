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
exports.MotionsRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
let MotionsRepository = class MotionsRepository {
    postgresService;
    memory = new Map();
    schemaEnsured = false;
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async list(meetingId) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const params = [];
            const whereClause = meetingId ? 'WHERE meeting_id = $1' : '';
            if (meetingId) {
                params.push(meetingId);
            }
            const result = await this.postgresService.query(`SELECT * FROM app_motions ${whereClause} ORDER BY sort_order ASC, created_at ASC`, params);
            return result.rows.map((row) => toMotionRecord(row));
        }, () => {
            const rows = Array.from(this.memory.values());
            return rows
                .filter((row) => (meetingId ? row.meetingId === meetingId : true))
                .sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt));
        });
    }
    async getById(id) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_motions WHERE id = $1 LIMIT 1`, [id]);
            if (result.rows.length === 0) {
                throw new common_1.NotFoundException('Motion not found');
            }
            return toMotionRecord(result.rows[0]);
        }, () => {
            const record = this.memory.get(id);
            if (!record) {
                throw new common_1.NotFoundException('Motion not found');
            }
            return record;
        });
    }
    async create(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const sortOrder = await this.getNextSortOrder(input.meetingId);
            const id = (0, node_crypto_1.randomUUID)();
            const now = new Date().toISOString();
            const result = await this.postgresService.query(`INSERT INTO app_motions (
          id, meeting_id, agenda_item_id, sort_order, title, body, status,
          is_current_live, result_note, live_at, created_by, updated_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'DRAFT', false, NULL, NULL, $7, $8, $9, $10
        ) RETURNING *`, [id, input.meetingId, input.agendaItemId, sortOrder, input.title, input.body, input.createdBy, input.createdBy, now, now]);
            return toMotionRecord(result.rows[0]);
        }, async () => {
            const meetingRows = (await this.list(input.meetingId)).length;
            const now = new Date().toISOString();
            const record = {
                id: (0, node_crypto_1.randomUUID)(),
                meetingId: input.meetingId,
                agendaItemId: input.agendaItemId,
                sortOrder: meetingRows + 1,
                title: input.title,
                body: input.body,
                status: 'DRAFT',
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
    async update(id, patch) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const existing = await this.getById(id);
            const updatedAt = new Date().toISOString();
            const result = await this.postgresService.query(`UPDATE app_motions
         SET agenda_item_id = $2,
             title = $3,
             body = $4,
             status = $5,
             is_current_live = $6,
             result_note = $7,
             live_at = $8,
             updated_by = $9,
             updated_at = $10
         WHERE id = $1
         RETURNING *`, [
                id,
                patch.agendaItemId ?? null,
                patch.title ?? existing.title,
                patch.body ?? existing.body,
                patch.status ?? existing.status,
                patch.isCurrentLive ?? existing.isCurrentLive,
                patch.resultNote ?? null,
                patch.liveAt ?? existing.liveAt ?? null,
                patch.updatedBy ?? existing.updatedBy,
                updatedAt,
            ]);
            return toMotionRecord(result.rows[0]);
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
    async clearLiveByMeeting(meetingId, updatedBy) {
        await this.withFallback(async () => {
            await this.ensureSchema();
            await this.postgresService.query(`UPDATE app_motions
         SET is_current_live = false,
             updated_by = $2,
             updated_at = $3
         WHERE meeting_id = $1 AND is_current_live = true`, [meetingId, updatedBy, new Date().toISOString()]);
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
    async getCurrentLiveByMeeting(meetingId) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_motions WHERE meeting_id = $1 AND is_current_live = true LIMIT 1`, [meetingId]);
            if (result.rows.length === 0) {
                return null;
            }
            return toMotionRecord(result.rows[0]);
        }, async () => {
            const rows = await this.list(meetingId);
            return rows.find((row) => row.isCurrentLive) ?? null;
        });
    }
    async remove(id) {
        await this.withFallback(async () => {
            await this.ensureSchema();
            const deleted = await this.postgresService.query(`DELETE FROM app_motions WHERE id = $1`, [id]);
            if (deleted.rowCount === 0) {
                throw new common_1.NotFoundException('Motion not found');
            }
        }, () => {
            if (!this.memory.delete(id)) {
                throw new common_1.NotFoundException('Motion not found');
            }
        });
    }
    async getNextSortOrder(meetingId) {
        const result = await this.postgresService.query(`SELECT MAX(sort_order) AS max_sort_order FROM app_motions WHERE meeting_id = $1`, [meetingId]);
        const maxSortOrder = result.rows[0]?.max_sort_order ?? 0;
        return maxSortOrder + 1;
    }
    async ensureSchema() {
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
        is_current_live BOOLEAN NOT NULL DEFAULT FALSE,
        result_note TEXT,
        live_at TIMESTAMPTZ,
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_motions_meeting_id ON app_motions(meeting_id)`);
        await this.postgresService.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_app_motions_one_live_per_meeting ON app_motions(meeting_id) WHERE is_current_live = true`);
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
exports.MotionsRepository = MotionsRepository;
exports.MotionsRepository = MotionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], MotionsRepository);
function toMotionRecord(row) {
    return {
        id: row.id,
        meetingId: row.meeting_id,
        agendaItemId: row.agenda_item_id ?? undefined,
        sortOrder: row.sort_order,
        title: row.title,
        body: row.body,
        status: row.status,
        isCurrentLive: row.is_current_live,
        resultNote: row.result_note ?? undefined,
        liveAt: row.live_at ?? undefined,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
//# sourceMappingURL=motions.repository.js.map