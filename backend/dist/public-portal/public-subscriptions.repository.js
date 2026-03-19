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
exports.PublicSubscriptionsRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
let PublicSubscriptionsRepository = class PublicSubscriptionsRepository {
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
            const result = await this.postgresService.query(`INSERT INTO app_public_subscriptions (
          id, email, topics, watch_keywords, frequency, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *`, [id, input.email, input.topics, input.watchKeywords, input.frequency, true, now, now]);
            return toRecord(result.rows[0]);
        }, () => {
            const now = new Date().toISOString();
            const created = {
                id: (0, node_crypto_1.randomUUID)(),
                email: input.email,
                topics: input.topics,
                watchKeywords: input.watchKeywords,
                frequency: input.frequency,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            };
            this.memory.set(created.id, created);
            return created;
        });
    }
    async listByEmail(email) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_public_subscriptions WHERE email = $1 ORDER BY created_at DESC`, [email]);
            return result.rows.map((row) => toRecord(row));
        }, () => Array.from(this.memory.values()).filter((row) => row.email === email));
    }
    async listActiveByFrequency(frequency, options) {
        const limit = Math.max(1, Math.min(500, options?.limit ?? 200));
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT *
         FROM app_public_subscriptions
         WHERE is_active = TRUE AND frequency = $1
         ORDER BY updated_at ASC
         LIMIT $2`, [frequency, limit]);
            return result.rows.map((row) => toRecord(row));
        }, () => Array.from(this.memory.values())
            .filter((row) => row.isActive && row.frequency === frequency)
            .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
            .slice(0, limit));
    }
    async getById(id) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_public_subscriptions WHERE id = $1 LIMIT 1`, [id]);
            if (result.rows.length === 0) {
                throw new common_1.NotFoundException('Subscription not found');
            }
            return toRecord(result.rows[0]);
        }, () => {
            const existing = this.memory.get(id);
            if (!existing) {
                throw new common_1.NotFoundException('Subscription not found');
            }
            return existing;
        });
    }
    async update(id, patch) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const existing = await this.getById(id);
            const now = new Date().toISOString();
            const result = await this.postgresService.query(`UPDATE app_public_subscriptions
         SET topics = $2,
             watch_keywords = $3,
             frequency = $4,
             is_active = $5,
             last_notified_at = $6,
             updated_at = $7
         WHERE id = $1
         RETURNING *`, [
                id,
                patch.topics ?? existing.topics,
                patch.watchKeywords ?? existing.watchKeywords,
                patch.frequency ?? existing.frequency,
                patch.isActive ?? existing.isActive,
                patch.lastNotifiedAt ?? existing.lastNotifiedAt ?? null,
                now,
            ]);
            return toRecord(result.rows[0]);
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
    async remove(id) {
        await this.withFallback(async () => {
            await this.ensureSchema();
            const deleted = await this.postgresService.query(`DELETE FROM app_public_subscriptions WHERE id = $1`, [id]);
            if (deleted.rowCount === 0) {
                throw new common_1.NotFoundException('Subscription not found');
            }
        }, () => {
            if (!this.memory.delete(id)) {
                throw new common_1.NotFoundException('Subscription not found');
            }
        });
    }
    async ensureSchema() {
        if (this.schemaEnsured || !this.postgresService.isEnabled) {
            return;
        }
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_public_subscriptions (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        topics TEXT[] NOT NULL,
        watch_keywords TEXT[] NOT NULL,
        frequency VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        last_notified_at TIMESTAMPTZ
      )
    `);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_public_subscriptions_email ON app_public_subscriptions(email)`);
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
exports.PublicSubscriptionsRepository = PublicSubscriptionsRepository;
exports.PublicSubscriptionsRepository = PublicSubscriptionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], PublicSubscriptionsRepository);
function toRecord(row) {
    return {
        id: row.id,
        email: row.email,
        topics: row.topics,
        watchKeywords: row.watch_keywords,
        frequency: row.frequency,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastNotifiedAt: row.last_notified_at ?? undefined,
    };
}
//# sourceMappingURL=public-subscriptions.repository.js.map