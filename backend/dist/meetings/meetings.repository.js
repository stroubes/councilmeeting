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
exports.MeetingsRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
let MeetingsRepository = class MeetingsRepository {
    postgresService;
    memoryMeetings = new Map();
    schemaEnsured = false;
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async create(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const id = (0, node_crypto_1.randomUUID)();
            const now = new Date().toISOString();
            const result = await this.postgresService.query(`INSERT INTO app_meetings (
          id, title, description, meeting_type_code, starts_at, ends_at, location,
          status, is_public, is_in_camera, video_url, recurrence_group_id, recurrence_index,
          created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        RETURNING *`, [
                id,
                input.title,
                input.description,
                input.meetingTypeCode,
                input.startsAt,
                input.endsAt,
                input.location,
                input.status,
                input.isPublic,
                input.isInCamera,
                input.videoUrl,
                input.recurrenceGroupId,
                input.recurrenceIndex,
                input.createdBy,
                now,
                now,
            ]);
            return toMeetingRecord(result.rows[0]);
        }, () => this.createInMemory(input));
    }
    async list(query) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const { whereClause, params } = this.buildWhereClause(query);
            const result = await this.postgresService.query(`SELECT * FROM app_meetings ${whereClause} ORDER BY starts_at ASC`, params);
            return result.rows.map((row) => toMeetingRecord(row));
        }, () => this.listInMemory(query));
    }
    async listPaged(query) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const { whereClause, params } = this.buildWhereClause(query);
            const { page, pageSize } = this.normalizePagination(query);
            const offset = (page - 1) * pageSize;
            const orderBy = this.resolveSortClause(query);
            const countResult = await this.postgresService.query(`SELECT COUNT(*)::text AS total FROM app_meetings ${whereClause}`, params);
            const total = Number.parseInt(countResult.rows[0]?.total ?? '0', 10) || 0;
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            const safePage = Math.min(page, totalPages);
            const safeOffset = (safePage - 1) * pageSize;
            const result = await this.postgresService.query(`SELECT * FROM app_meetings ${whereClause} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, pageSize, safeOffset]);
            return {
                items: result.rows.map((row) => toMeetingRecord(row)),
                total,
                page: safePage,
                pageSize,
                totalPages,
            };
        }, () => this.listPagedInMemory(query));
    }
    async listPublic() {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_meetings WHERE is_public = TRUE AND is_in_camera = FALSE ORDER BY starts_at ASC`);
            return result.rows.map((row) => toMeetingRecord(row));
        }, () => Array.from(this.memoryMeetings.values())
            .filter((meeting) => meeting.isPublic && !meeting.isInCamera)
            .sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
    }
    async getById(id) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_meetings WHERE id = $1 LIMIT 1`, [id]);
            if (result.rows.length === 0) {
                throw new common_1.NotFoundException('Meeting not found');
            }
            return toMeetingRecord(result.rows[0]);
        }, () => {
            const meeting = this.memoryMeetings.get(id);
            if (!meeting) {
                throw new common_1.NotFoundException('Meeting not found');
            }
            return meeting;
        });
    }
    async update(id, patch) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const existing = await this.getById(id);
            const updatedAt = new Date().toISOString();
            const result = await this.postgresService.query(`UPDATE app_meetings
         SET title = $2,
             description = $3,
             meeting_type_code = $4,
             starts_at = $5,
             ends_at = $6,
             location = $7,
             status = $8,
             is_public = $9,
             is_in_camera = $10,
             video_url = $11,
             recurrence_group_id = $12,
             recurrence_index = $13,
             updated_at = $14
          WHERE id = $1
          RETURNING *`, [
                id,
                patch.title ?? existing.title,
                patch.description ?? existing.description,
                patch.meetingTypeCode ?? existing.meetingTypeCode,
                patch.startsAt ?? existing.startsAt,
                patch.endsAt ?? existing.endsAt,
                patch.location ?? existing.location,
                patch.status ?? existing.status,
                patch.isPublic ?? existing.isPublic,
                patch.isInCamera ?? existing.isInCamera,
                patch.videoUrl ?? existing.videoUrl,
                patch.recurrenceGroupId ?? existing.recurrenceGroupId,
                patch.recurrenceIndex ?? existing.recurrenceIndex,
                updatedAt,
            ]);
            return toMeetingRecord(result.rows[0]);
        }, async () => {
            const existing = await this.getById(id);
            const updated = {
                ...existing,
                ...patch,
                updatedAt: new Date().toISOString(),
            };
            this.memoryMeetings.set(id, updated);
            return updated;
        });
    }
    async exists(id) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT EXISTS (SELECT 1 FROM app_meetings WHERE id = $1) AS exists`, [id]);
            return result.rows[0]?.exists === true;
        }, () => this.memoryMeetings.has(id));
    }
    async remove(id) {
        await this.withFallback(async () => {
            await this.ensureSchema();
            const deleted = await this.postgresService.query(`DELETE FROM app_meetings WHERE id = $1`, [id]);
            if (deleted.rowCount === 0) {
                throw new common_1.NotFoundException('Meeting not found');
            }
        }, () => {
            if (!this.memoryMeetings.delete(id)) {
                throw new common_1.NotFoundException('Meeting not found');
            }
        });
    }
    async ensureSchema() {
        if (this.schemaEnsured || !this.postgresService.isEnabled) {
            return;
        }
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_meetings (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        meeting_type_code VARCHAR(100) NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ,
        location VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        is_public BOOLEAN NOT NULL,
        is_in_camera BOOLEAN NOT NULL,
        video_url TEXT,
        recurrence_group_id UUID,
        recurrence_index INTEGER,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        CONSTRAINT chk_app_meeting_time CHECK (ends_at IS NULL OR ends_at >= starts_at)
      )
    `);
        await this.postgresService.query(`ALTER TABLE app_meetings ADD COLUMN IF NOT EXISTS recurrence_group_id UUID`);
        await this.postgresService.query(`ALTER TABLE app_meetings ADD COLUMN IF NOT EXISTS recurrence_index INTEGER`);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_meetings_starts_at ON app_meetings(starts_at)`);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_meetings_recurrence ON app_meetings(recurrence_group_id, recurrence_index)`);
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
    createInMemory(input) {
        const now = new Date().toISOString();
        const meeting = {
            id: (0, node_crypto_1.randomUUID)(),
            title: input.title,
            description: input.description,
            meetingTypeCode: input.meetingTypeCode,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            location: input.location,
            status: input.status,
            isPublic: input.isPublic,
            isInCamera: input.isInCamera,
            videoUrl: input.videoUrl,
            recurrenceGroupId: input.recurrenceGroupId,
            recurrenceIndex: input.recurrenceIndex,
            createdBy: input.createdBy,
            createdAt: now,
            updatedAt: now,
        };
        this.memoryMeetings.set(meeting.id, meeting);
        return meeting;
    }
    listInMemory(query) {
        return this.filterInMemory(query).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }
    listPagedInMemory(query) {
        const { page, pageSize } = this.normalizePagination(query);
        const sort = this.resolveSort(query);
        const filtered = this.filterInMemory(query).sort((left, right) => {
            const comparison = this.compareMeetings(left, right, sort.field);
            return sort.direction === 'asc' ? comparison : -comparison;
        });
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(page, totalPages);
        const start = (safePage - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);
        return {
            items,
            total,
            page: safePage,
            pageSize,
            totalPages,
        };
    }
    buildWhereClause(query) {
        const where = [];
        const params = [];
        if (query.status) {
            params.push(query.status);
            where.push(`status = $${params.length}`);
        }
        const includeInCamera = query.inCamera === 'true' || query.inCamera === '1';
        if (!includeInCamera) {
            where.push(`is_in_camera = FALSE`);
        }
        const publicOnly = query.publicOnly === 'true' || query.publicOnly === '1';
        if (publicOnly) {
            where.push(`is_public = TRUE`);
        }
        const search = query.q?.trim();
        if (search) {
            params.push(`%${search}%`);
            where.push(`(title ILIKE $${params.length} OR meeting_type_code ILIKE $${params.length})`);
        }
        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
        return { whereClause, params };
    }
    resolveSortClause(query) {
        const { field, direction } = this.resolveSort(query);
        if (field === 'title') {
            return `title ${direction}, starts_at ASC`;
        }
        if (field === 'status') {
            return `status ${direction}, starts_at ASC`;
        }
        return `starts_at ${direction}`;
    }
    resolveSort(query) {
        const field = query.sortField === 'title' || query.sortField === 'status' || query.sortField === 'startsAt'
            ? query.sortField
            : 'startsAt';
        const direction = query.sortDirection === 'asc' || query.sortDirection === 'desc' ? query.sortDirection : 'asc';
        return { field, direction };
    }
    normalizePagination(query) {
        const page = Number.isFinite(query.page) ? Math.max(1, Number(query.page)) : 1;
        const pageSize = Number.isFinite(query.pageSize)
            ? Math.max(1, Math.min(100, Number(query.pageSize)))
            : 8;
        return { page, pageSize };
    }
    filterInMemory(query) {
        const includeInCamera = query.inCamera === 'true' || query.inCamera === '1';
        const publicOnly = query.publicOnly === 'true' || query.publicOnly === '1';
        const search = query.q?.trim().toLowerCase();
        return Array.from(this.memoryMeetings.values()).filter((meeting) => {
            if (query.status && meeting.status !== query.status) {
                return false;
            }
            if (publicOnly && !meeting.isPublic) {
                return false;
            }
            if (!includeInCamera && meeting.isInCamera) {
                return false;
            }
            if (search) {
                const haystack = `${meeting.title} ${meeting.meetingTypeCode}`.toLowerCase();
                if (!haystack.includes(search)) {
                    return false;
                }
            }
            return true;
        });
    }
    compareMeetings(left, right, field) {
        if (field === 'title') {
            return left.title.localeCompare(right.title);
        }
        if (field === 'status') {
            return left.status.localeCompare(right.status);
        }
        return left.startsAt.localeCompare(right.startsAt);
    }
};
exports.MeetingsRepository = MeetingsRepository;
exports.MeetingsRepository = MeetingsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], MeetingsRepository);
function toMeetingRecord(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? undefined,
        meetingTypeCode: row.meeting_type_code,
        startsAt: row.starts_at,
        endsAt: row.ends_at ?? undefined,
        location: row.location ?? undefined,
        status: row.status,
        isPublic: row.is_public,
        isInCamera: row.is_in_camera,
        videoUrl: row.video_url ?? undefined,
        recurrenceGroupId: row.recurrence_group_id ?? undefined,
        recurrenceIndex: row.recurrence_index ?? undefined,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
//# sourceMappingURL=meetings.repository.js.map