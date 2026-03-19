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
exports.NotificationsRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
let NotificationsRepository = class NotificationsRepository {
    postgresService;
    memory = new Map();
    schemaEnsured = false;
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async create(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const now = new Date().toISOString();
            const id = (0, node_crypto_1.randomUUID)();
            const result = await this.postgresService.query(`INSERT INTO app_notification_events (
          id, event_type, entity_type, entity_id, actor_user_id, payload_json, channels,
          status, delivery_attempts, last_error, created_at, delivered_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13
        ) RETURNING *`, [
                id,
                input.eventType,
                input.entityType,
                input.entityId,
                input.actorUserId,
                input.payloadJson,
                input.channels,
                input.status,
                input.deliveryAttempts ?? 0,
                input.lastError,
                now,
                input.deliveredAt ?? null,
                now,
            ]);
            return toRecord(result.rows[0]);
        }, () => {
            const now = new Date().toISOString();
            const record = {
                id: (0, node_crypto_1.randomUUID)(),
                eventType: input.eventType,
                entityType: input.entityType,
                entityId: input.entityId,
                actorUserId: input.actorUserId,
                payloadJson: input.payloadJson,
                channels: input.channels,
                status: input.status,
                deliveryAttempts: input.deliveryAttempts ?? 0,
                lastError: input.lastError,
                createdAt: now,
                deliveredAt: input.deliveredAt,
                updatedAt: now,
            };
            this.memory.set(record.id, record);
            return record;
        });
    }
    async list(query) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const where = [];
            const params = [];
            if (query?.status) {
                params.push(query.status);
                where.push(`status = $${params.length}`);
            }
            if (query?.eventType) {
                params.push(query.eventType);
                where.push(`event_type = $${params.length}`);
            }
            const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
            const limit = Math.max(1, Math.min(250, query?.limit ?? 100));
            params.push(limit);
            const result = await this.postgresService.query(`SELECT * FROM app_notification_events ${whereClause} ORDER BY created_at DESC LIMIT $${params.length}`, params);
            return result.rows.map((row) => toRecord(row));
        }, () => {
            const status = query?.status;
            const eventType = query?.eventType;
            const limit = Math.max(1, Math.min(250, query?.limit ?? 100));
            return Array.from(this.memory.values())
                .filter((row) => {
                if (status && row.status !== status) {
                    return false;
                }
                if (eventType && row.eventType !== eventType) {
                    return false;
                }
                return true;
            })
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .slice(0, limit);
        });
    }
    async getById(id) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_notification_events WHERE id = $1 LIMIT 1`, [id]);
            if (result.rows.length === 0) {
                throw new common_1.NotFoundException('Notification event not found');
            }
            return toRecord(result.rows[0]);
        }, () => {
            const event = this.memory.get(id);
            if (!event) {
                throw new common_1.NotFoundException('Notification event not found');
            }
            return event;
        });
    }
    async updateDelivery(id, patch) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const now = new Date().toISOString();
            const result = await this.postgresService.query(`UPDATE app_notification_events
         SET status = $2,
             delivery_attempts = $3,
             last_error = $4,
             delivered_at = $5,
             updated_at = $6
         WHERE id = $1
         RETURNING *`, [id, patch.status, patch.deliveryAttempts, patch.lastError ?? null, patch.deliveredAt ?? null, now]);
            if (result.rows.length === 0) {
                throw new common_1.NotFoundException('Notification event not found');
            }
            return toRecord(result.rows[0]);
        }, async () => {
            const existing = await this.getById(id);
            const updated = {
                ...existing,
                status: patch.status,
                deliveryAttempts: patch.deliveryAttempts,
                lastError: patch.lastError,
                deliveredAt: patch.deliveredAt,
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
      CREATE TABLE IF NOT EXISTS app_notification_events (
        id UUID PRIMARY KEY,
        event_type VARCHAR(120) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(120) NOT NULL,
        actor_user_id VARCHAR(255),
        payload_json JSONB NOT NULL,
        channels TEXT[] NOT NULL,
        status VARCHAR(40) NOT NULL,
        delivery_attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL,
        delivered_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_notification_events_created ON app_notification_events(created_at DESC)`);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_notification_events_status ON app_notification_events(status)`);
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
exports.NotificationsRepository = NotificationsRepository;
exports.NotificationsRepository = NotificationsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], NotificationsRepository);
function toRecord(row) {
    return {
        id: row.id,
        eventType: row.event_type,
        entityType: row.entity_type,
        entityId: row.entity_id,
        actorUserId: row.actor_user_id ?? undefined,
        payloadJson: row.payload_json,
        channels: Array.isArray(row.channels) ? row.channels : [],
        status: row.status,
        deliveryAttempts: row.delivery_attempts,
        lastError: row.last_error ?? undefined,
        createdAt: row.created_at,
        deliveredAt: row.delivered_at ?? undefined,
        updatedAt: row.updated_at,
    };
}
//# sourceMappingURL=notifications.repository.js.map