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
exports.ApiSettingsRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
let ApiSettingsRepository = class ApiSettingsRepository {
    postgresService;
    memory = new Map();
    schemaEnsured = false;
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async list() {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_api_settings ORDER BY category NULLS LAST, label ASC`);
            return result.rows.map((row) => toRecord(row));
        }, () => Array.from(this.memory.values()).sort((left, right) => {
            const categoryCompare = (left.category ?? '').localeCompare(right.category ?? '');
            if (categoryCompare !== 0) {
                return categoryCompare;
            }
            return left.label.localeCompare(right.label);
        }));
    }
    async upsert(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const now = new Date().toISOString();
            const existing = await this.postgresService.query(`SELECT * FROM app_api_settings WHERE key = $1 LIMIT 1`, [input.key]);
            if (existing.rows.length > 0) {
                const updated = await this.postgresService.query(`UPDATE app_api_settings
           SET label = $2,
               category = $3,
               value = $4,
               is_secret = $5,
               updated_by = $6,
               updated_at = $7
           WHERE key = $1
           RETURNING *`, [input.key, input.label, input.category ?? null, input.value, input.isSecret, input.updatedBy, now]);
                return toRecord(updated.rows[0]);
            }
            const created = await this.postgresService.query(`INSERT INTO app_api_settings (
          id, key, label, category, value, is_secret, updated_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING *`, [(0, node_crypto_1.randomUUID)(), input.key, input.label, input.category ?? null, input.value, input.isSecret, input.updatedBy, now, now]);
            return toRecord(created.rows[0]);
        }, () => {
            const existing = Array.from(this.memory.values()).find((row) => row.key === input.key);
            if (existing) {
                const updated = {
                    ...existing,
                    label: input.label,
                    category: input.category,
                    value: input.value,
                    isSecret: input.isSecret,
                    updatedBy: input.updatedBy,
                    updatedAt: new Date().toISOString(),
                };
                this.memory.set(updated.id, updated);
                return updated;
            }
            const now = new Date().toISOString();
            const created = {
                id: (0, node_crypto_1.randomUUID)(),
                key: input.key,
                label: input.label,
                category: input.category,
                value: input.value,
                isSecret: input.isSecret,
                updatedBy: input.updatedBy,
                createdAt: now,
                updatedAt: now,
            };
            this.memory.set(created.id, created);
            return created;
        });
    }
    async remove(id) {
        await this.withFallback(async () => {
            await this.ensureSchema();
            const deleted = await this.postgresService.query(`DELETE FROM app_api_settings WHERE id = $1`, [id]);
            if (deleted.rowCount === 0) {
                throw new common_1.NotFoundException('API setting not found');
            }
        }, () => {
            if (!this.memory.delete(id)) {
                throw new common_1.NotFoundException('API setting not found');
            }
        });
    }
    async ensureSchema() {
        if (this.schemaEnsured || !this.postgresService.isEnabled) {
            return;
        }
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_api_settings (
        id UUID PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        label VARCHAR(120) NOT NULL,
        category VARCHAR(100),
        value TEXT NOT NULL,
        is_secret BOOLEAN NOT NULL,
        updated_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_api_settings_category ON app_api_settings(category)`);
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
exports.ApiSettingsRepository = ApiSettingsRepository;
exports.ApiSettingsRepository = ApiSettingsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], ApiSettingsRepository);
function toRecord(row) {
    return {
        id: row.id,
        key: row.key,
        label: row.label,
        category: row.category ?? undefined,
        value: row.value,
        isSecret: row.is_secret,
        updatedBy: row.updated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
//# sourceMappingURL=api-settings.repository.js.map