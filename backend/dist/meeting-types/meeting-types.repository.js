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
exports.MeetingTypesRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
const DEFAULT_MEETING_TYPES = [
    {
        code: 'COUNCIL',
        name: 'Council Meeting',
        description: 'Regular public council meeting.',
        isInCamera: false,
    },
    {
        code: 'SPECIAL_COUNCIL',
        name: 'Special Council Meeting',
        description: 'Specially called council session.',
        isInCamera: false,
    },
    {
        code: 'COMMITTEE_OF_WHOLE',
        name: 'Committee of the Whole',
        description: 'Committee of the Whole meeting.',
        isInCamera: false,
    },
    {
        code: 'IN_CAMERA',
        name: 'In-Camera Meeting',
        description: 'Closed in-camera meeting.',
        isInCamera: true,
    },
];
let MeetingTypesRepository = class MeetingTypesRepository {
    postgresService;
    schemaEnsured = false;
    memoryMeetingTypes = new Map();
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async create(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const id = (0, node_crypto_1.randomUUID)();
            const now = new Date().toISOString();
            const created = await this.postgresService.query(`INSERT INTO app_meeting_types (
          id, code, name, description, is_in_camera, is_active, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`, [
                id,
                input.code,
                input.name,
                input.description,
                input.isInCamera,
                input.isActive,
                input.createdBy,
                now,
                now,
            ]);
            return toMeetingTypeRecord(created.rows[0]);
        }, () => this.createInMemory(input));
    }
    async list(query) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const whereClause = query?.includeInactive ? '' : 'WHERE is_active = TRUE';
            const result = await this.postgresService.query(`SELECT * FROM app_meeting_types ${whereClause} ORDER BY name ASC`);
            return result.rows.map((row) => toMeetingTypeRecord(row));
        }, () => this.listInMemory(query));
    }
    async getByCode(code) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_meeting_types WHERE code = $1 LIMIT 1`, [code]);
            if (result.rows.length === 0) {
                throw new common_1.NotFoundException('Meeting type not found');
            }
            return toMeetingTypeRecord(result.rows[0]);
        }, () => {
            const found = Array.from(this.memoryMeetingTypes.values()).find((meetingType) => meetingType.code === code);
            if (!found) {
                throw new common_1.NotFoundException('Meeting type not found');
            }
            return found;
        });
    }
    async remove(id) {
        await this.withFallback(async () => {
            await this.ensureSchema();
            const deleted = await this.postgresService.query(`DELETE FROM app_meeting_types WHERE id = $1`, [id]);
            if (deleted.rowCount === 0) {
                throw new common_1.NotFoundException('Meeting type not found');
            }
        }, () => {
            if (!this.memoryMeetingTypes.delete(id)) {
                throw new common_1.NotFoundException('Meeting type not found');
            }
        });
    }
    async ensureSchema() {
        if (this.schemaEnsured || !this.postgresService.isEnabled) {
            return;
        }
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_meeting_types (
        id UUID PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        is_in_camera BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_meeting_types_active ON app_meeting_types(is_active, name)`);
        const result = await this.postgresService.query(`SELECT COUNT(*)::text AS count FROM app_meeting_types`);
        const count = Number.parseInt(result.rows[0]?.count ?? '0', 10);
        if (count === 0) {
            const now = new Date().toISOString();
            for (const meetingType of DEFAULT_MEETING_TYPES) {
                await this.postgresService.query(`INSERT INTO app_meeting_types (
            id, code, name, description, is_in_camera, is_active, created_by, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, TRUE, 'system', $6, $7)`, [(0, node_crypto_1.randomUUID)(), meetingType.code, meetingType.name, meetingType.description, meetingType.isInCamera, now, now]);
            }
        }
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
        this.seedMemoryDefaults();
        const now = new Date().toISOString();
        const meetingType = {
            id: (0, node_crypto_1.randomUUID)(),
            code: input.code,
            name: input.name,
            description: input.description,
            isInCamera: input.isInCamera,
            isActive: input.isActive,
            createdBy: input.createdBy,
            createdAt: now,
            updatedAt: now,
        };
        this.memoryMeetingTypes.set(meetingType.id, meetingType);
        return meetingType;
    }
    listInMemory(query) {
        this.seedMemoryDefaults();
        return Array.from(this.memoryMeetingTypes.values())
            .filter((meetingType) => (query?.includeInactive ? true : meetingType.isActive))
            .sort((a, b) => a.name.localeCompare(b.name));
    }
    seedMemoryDefaults() {
        if (this.memoryMeetingTypes.size > 0) {
            return;
        }
        const now = new Date().toISOString();
        for (const meetingType of DEFAULT_MEETING_TYPES) {
            const id = (0, node_crypto_1.randomUUID)();
            this.memoryMeetingTypes.set(id, {
                id,
                code: meetingType.code,
                name: meetingType.name,
                description: meetingType.description,
                isInCamera: meetingType.isInCamera,
                isActive: true,
                createdBy: 'system',
                createdAt: now,
                updatedAt: now,
            });
        }
    }
};
exports.MeetingTypesRepository = MeetingTypesRepository;
exports.MeetingTypesRepository = MeetingTypesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], MeetingTypesRepository);
function toMeetingTypeRecord(row) {
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description ?? undefined,
        isInCamera: row.is_in_camera,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
//# sourceMappingURL=meeting-types.repository.js.map