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
exports.MinutesRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
const minutes_content_1 = require("./minutes-content");
let MinutesRepository = class MinutesRepository {
    postgresService;
    memory = new Map();
    schemaEnsured = false;
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async create(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const id = (0, node_crypto_1.randomUUID)();
            const now = new Date().toISOString();
            const result = await this.postgresService.query(`INSERT INTO app_minutes (
          id, meeting_id, minute_taker_user_id, content_json, status,
          started_at, finalized_at, published_at, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'DRAFT', NULL, NULL, NULL, $5, $6, $7)
        RETURNING *`, [
                id,
                input.meetingId,
                input.minuteTakerUserId,
                (0, minutes_content_1.normalizeMinutesContent)(input.contentJson ?? (0, minutes_content_1.createDefaultMinutesContent)()),
                input.createdBy,
                now,
                now,
            ]);
            return toMinutesRecord(result.rows[0]);
        }, () => {
            const now = new Date().toISOString();
            const record = {
                id: (0, node_crypto_1.randomUUID)(),
                meetingId: input.meetingId,
                minuteTakerUserId: input.minuteTakerUserId,
                contentJson: (0, minutes_content_1.normalizeMinutesContent)(input.contentJson ?? (0, minutes_content_1.createDefaultMinutesContent)()),
                status: 'DRAFT',
                createdBy: input.createdBy,
                createdAt: now,
                updatedAt: now,
            };
            this.memory.set(record.id, record);
            return record;
        });
    }
    async list(meetingId) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const params = [];
            const whereClause = meetingId ? 'WHERE meeting_id = $1' : '';
            if (meetingId)
                params.push(meetingId);
            const result = await this.postgresService.query(`SELECT * FROM app_minutes ${whereClause} ORDER BY updated_at DESC`, params);
            return result.rows.map((row) => toMinutesRecord(row));
        }, () => Array.from(this.memory.values())
            .filter((row) => (meetingId ? row.meetingId === meetingId : true))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    }
    async getById(id) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_minutes WHERE id = $1 LIMIT 1`, [id]);
            if (result.rows.length === 0) {
                throw new common_1.NotFoundException('Minutes not found');
            }
            return toMinutesRecord(result.rows[0]);
        }, () => {
            const record = this.memory.get(id);
            if (!record) {
                throw new common_1.NotFoundException('Minutes not found');
            }
            return record;
        });
    }
    async update(id, patch) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const existing = await this.getById(id);
            const updatedAt = new Date().toISOString();
            const result = await this.postgresService.query(`UPDATE app_minutes
         SET minute_taker_user_id = $2,
             content_json = $3,
             status = $4,
             started_at = $5,
             finalized_at = $6,
             published_at = $7,
             updated_at = $8
         WHERE id = $1
         RETURNING *`, [
                id,
                patch.minuteTakerUserId ?? existing.minuteTakerUserId,
                (0, minutes_content_1.normalizeMinutesContent)(patch.contentJson ?? existing.contentJson),
                patch.status ?? existing.status,
                patch.startedAt ?? existing.startedAt ?? null,
                patch.finalizedAt ?? existing.finalizedAt ?? null,
                patch.publishedAt ?? existing.publishedAt ?? null,
                updatedAt,
            ]);
            return toMinutesRecord(result.rows[0]);
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
    async ensureSchema() {
        if (this.schemaEnsured || !this.postgresService.isEnabled) {
            return;
        }
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_minutes (
        id UUID PRIMARY KEY,
        meeting_id UUID NOT NULL,
        minute_taker_user_id VARCHAR(255),
        content_json JSONB NOT NULL,
        status VARCHAR(50) NOT NULL,
        started_at TIMESTAMPTZ,
        finalized_at TIMESTAMPTZ,
        published_at TIMESTAMPTZ,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_minutes_meeting ON app_minutes(meeting_id)`);
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
exports.MinutesRepository = MinutesRepository;
exports.MinutesRepository = MinutesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], MinutesRepository);
function toMinutesRecord(row) {
    return {
        id: row.id,
        meetingId: row.meeting_id,
        minuteTakerUserId: row.minute_taker_user_id ?? undefined,
        contentJson: (0, minutes_content_1.normalizeMinutesContent)(row.content_json),
        status: row.status,
        startedAt: row.started_at ?? undefined,
        finalizedAt: row.finalized_at ?? undefined,
        publishedAt: row.published_at ?? undefined,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
//# sourceMappingURL=minutes.repository.js.map