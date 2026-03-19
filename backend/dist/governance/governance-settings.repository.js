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
exports.GovernanceSettingsRepository = void 0;
const common_1 = require("@nestjs/common");
const postgres_service_1 = require("../database/postgres.service");
let GovernanceSettingsRepository = class GovernanceSettingsRepository {
    postgresService;
    memory = new Map();
    schemaEnsured = false;
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async getValue(key) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT value FROM app_governance_settings WHERE key = $1 LIMIT 1`, [key]);
            return result.rows[0]?.value ?? null;
        }, () => this.memory.get(key) ?? null);
    }
    async setValue(key, value) {
        await this.withFallback(async () => {
            await this.ensureSchema();
            await this.postgresService.query(`INSERT INTO app_governance_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value,
             updated_at = NOW()`, [key, value]);
        }, () => {
            this.memory.set(key, value);
        });
    }
    async ensureSchema() {
        if (this.schemaEnsured || !this.postgresService.isEnabled) {
            return;
        }
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_governance_settings (
        key VARCHAR(120) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
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
exports.GovernanceSettingsRepository = GovernanceSettingsRepository;
exports.GovernanceSettingsRepository = GovernanceSettingsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], GovernanceSettingsRepository);
//# sourceMappingURL=governance-settings.repository.js.map