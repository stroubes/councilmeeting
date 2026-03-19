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
exports.PresentationsRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
let PresentationsRepository = class PresentationsRepository {
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
            const result = await this.postgresService.query(`SELECT id, meeting_id, file_name, title, mime_type, page_count, content_base64, created_by, updated_by, created_at, updated_at
         FROM app_presentations
         ${whereClause}
         ORDER BY created_at DESC`, params);
            return result.rows.map((row) => toPresentationSummary(toPresentationRecord(row)));
        }, () => {
            const rows = Array.from(this.memory.values())
                .filter((row) => (meetingId ? row.meetingId === meetingId : true))
                .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
            return rows.map((row) => toPresentationSummary(row));
        });
    }
    async getById(id) {
        return toPresentationSummary(await this.getWithContentById(id));
    }
    async getWithContentById(id) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT id, meeting_id, file_name, title, mime_type, page_count, content_base64, created_by, updated_by, created_at, updated_at
         FROM app_presentations
         WHERE id = $1
         LIMIT 1`, [id]);
            if (result.rows.length === 0) {
                throw new common_1.NotFoundException('Presentation not found');
            }
            return toPresentationRecord(result.rows[0]);
        }, () => {
            const record = this.memory.get(id);
            if (!record) {
                throw new common_1.NotFoundException('Presentation not found');
            }
            return record;
        });
    }
    async create(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const id = (0, node_crypto_1.randomUUID)();
            const now = new Date().toISOString();
            const result = await this.postgresService.query(`INSERT INTO app_presentations (
          id, meeting_id, file_name, title, mime_type, page_count, content_base64, created_by, updated_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING id, meeting_id, file_name, title, mime_type, page_count, content_base64, created_by, updated_by, created_at, updated_at`, [
                id,
                input.meetingId,
                input.fileName,
                input.title,
                input.mimeType,
                input.pageCount,
                input.contentBase64,
                input.createdBy,
                input.createdBy,
                now,
                now,
            ]);
            return toPresentationSummary(toPresentationRecord(result.rows[0]));
        }, () => {
            const now = new Date().toISOString();
            const record = {
                id: (0, node_crypto_1.randomUUID)(),
                meetingId: input.meetingId,
                fileName: input.fileName,
                title: input.title,
                mimeType: input.mimeType,
                pageCount: input.pageCount,
                contentBase64: input.contentBase64,
                createdBy: input.createdBy,
                updatedBy: input.createdBy,
                createdAt: now,
                updatedAt: now,
            };
            this.memory.set(record.id, record);
            return toPresentationSummary(record);
        });
    }
    async remove(id) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`DELETE FROM app_presentations WHERE id = $1`, [id]);
            if (result.rowCount === 0) {
                throw new common_1.NotFoundException('Presentation not found');
            }
        }, () => {
            const existed = this.memory.delete(id);
            if (!existed) {
                throw new common_1.NotFoundException('Presentation not found');
            }
        });
    }
    async ensureSchema() {
        if (this.schemaEnsured || !this.postgresService.isEnabled) {
            return;
        }
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_presentations (
        id UUID PRIMARY KEY,
        meeting_id UUID NOT NULL,
        file_name VARCHAR(500) NOT NULL,
        title VARCHAR(250) NOT NULL,
        mime_type VARCHAR(150) NOT NULL,
        page_count INTEGER NOT NULL,
        content_base64 TEXT NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_presentations_meeting_id ON app_presentations(meeting_id, created_at DESC)`);
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
exports.PresentationsRepository = PresentationsRepository;
exports.PresentationsRepository = PresentationsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], PresentationsRepository);
function toPresentationRecord(row) {
    return {
        id: row.id,
        meetingId: row.meeting_id,
        fileName: row.file_name,
        title: row.title,
        mimeType: row.mime_type,
        pageCount: row.page_count,
        contentBase64: row.content_base64,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function toPresentationSummary(record) {
    return {
        id: record.id,
        meetingId: record.meetingId,
        fileName: record.fileName,
        title: record.title,
        mimeType: record.mimeType,
        pageCount: record.pageCount,
        createdBy: record.createdBy,
        updatedBy: record.updatedBy,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}
//# sourceMappingURL=presentations.repository.js.map