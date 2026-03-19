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
exports.AuditRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
let AuditRepository = class AuditRepository {
    postgresService;
    memoryLogs = [];
    schemaEnsured = false;
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async create(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const id = (0, node_crypto_1.randomUUID)();
            const createdAt = new Date().toISOString();
            const result = await this.postgresService.query(`INSERT INTO app_audit_logs (
          id, actor_user_id, action, entity_type, entity_id, changes_json, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`, [
                id,
                input.actorUserId,
                input.action,
                input.entityType,
                input.entityId,
                input.changesJson ?? null,
                createdAt,
            ]);
            return toAuditLog(result.rows[0]);
        }, () => {
            const log = {
                id: (0, node_crypto_1.randomUUID)(),
                actorUserId: input.actorUserId,
                action: input.action,
                entityType: input.entityType,
                entityId: input.entityId,
                changesJson: input.changesJson,
                createdAt: new Date().toISOString(),
            };
            this.memoryLogs.push(log);
            return log;
        });
    }
    async listRecent(limit = 200) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_audit_logs ORDER BY created_at DESC LIMIT $1`, [limit]);
            return result.rows.map((row) => toAuditLog(row));
        }, () => [...this.memoryLogs].slice(-limit).reverse());
    }
    async ensureSchema() {
        if (this.schemaEnsured || !this.postgresService.isEnabled) {
            return;
        }
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_audit_logs (
        id UUID PRIMARY KEY,
        actor_user_id VARCHAR(255),
        action VARCHAR(120) NOT NULL,
        entity_type VARCHAR(120) NOT NULL,
        entity_id VARCHAR(255),
        changes_json JSONB,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_audit_logs_created_at ON app_audit_logs(created_at DESC)`);
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
exports.AuditRepository = AuditRepository;
exports.AuditRepository = AuditRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], AuditRepository);
function toAuditLog(row) {
    return {
        id: row.id,
        actorUserId: row.actor_user_id ?? undefined,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id ?? undefined,
        changesJson: row.changes_json ?? undefined,
        createdAt: row.created_at,
    };
}
//# sourceMappingURL=audit.repository.js.map