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
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
let UsersRepository = class UsersRepository {
    postgresService;
    memory = new Map();
    schemaEnsured = false;
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async list() {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_managed_users ORDER BY updated_at DESC`);
            return result.rows.map((row) => toManagedUser(row));
        }, () => Array.from(this.memory.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    }
    async getById(id) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_managed_users WHERE id = $1 LIMIT 1`, [id]);
            if (result.rows.length === 0) {
                throw new common_1.NotFoundException('Managed user not found');
            }
            return toManagedUser(result.rows[0]);
        }, () => {
            const record = this.memory.get(id);
            if (!record) {
                throw new common_1.NotFoundException('Managed user not found');
            }
            return record;
        });
    }
    async findByOidOrEmail(microsoftOid, email) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_managed_users WHERE microsoft_oid = $1 OR email = $2 LIMIT 1`, [microsoftOid, email]);
            if (result.rows.length === 0) {
                return null;
            }
            return toManagedUser(result.rows[0]);
        }, () => Array.from(this.memory.values()).find((record) => record.microsoftOid === microsoftOid || record.email === email) ?? null);
    }
    async upsert(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const now = new Date().toISOString();
            const existing = await this.postgresService.query(`SELECT * FROM app_managed_users WHERE microsoft_oid = $1 OR email = $2 LIMIT 1`, [input.microsoftOid, input.email]);
            if (existing.rows.length > 0) {
                const id = existing.rows[0].id;
                const result = await this.postgresService.query(`UPDATE app_managed_users
           SET microsoft_oid = $2,
               email = $3,
               display_name = $4,
               roles_json = $5,
               updated_at = $6
           WHERE id = $1
           RETURNING *`, [id, input.microsoftOid, input.email, input.displayName, input.roles, now]);
                return toManagedUser(result.rows[0]);
            }
            const id = (0, node_crypto_1.randomUUID)();
            const result = await this.postgresService.query(`INSERT INTO app_managed_users (
          id, microsoft_oid, email, display_name, roles_json, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`, [id, input.microsoftOid, input.email, input.displayName, input.roles, now, now]);
            return toManagedUser(result.rows[0]);
        }, () => {
            const existing = Array.from(this.memory.values()).find((row) => row.microsoftOid === input.microsoftOid || row.email === input.email);
            if (existing) {
                const updated = {
                    ...existing,
                    microsoftOid: input.microsoftOid,
                    email: input.email,
                    displayName: input.displayName,
                    roles: input.roles,
                    updatedAt: new Date().toISOString(),
                };
                this.memory.set(updated.id, updated);
                return updated;
            }
            const now = new Date().toISOString();
            const created = {
                id: (0, node_crypto_1.randomUUID)(),
                microsoftOid: input.microsoftOid,
                email: input.email,
                displayName: input.displayName,
                roles: input.roles,
                createdAt: now,
                updatedAt: now,
            };
            this.memory.set(created.id, created);
            return created;
        });
    }
    async ensureSchema() {
        if (this.schemaEnsured || !this.postgresService.isEnabled) {
            return;
        }
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_managed_users (
        id UUID PRIMARY KEY,
        microsoft_oid VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        roles_json JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_managed_users_updated_at ON app_managed_users(updated_at DESC)`);
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
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], UsersRepository);
function toManagedUser(row) {
    return {
        id: row.id,
        microsoftOid: row.microsoft_oid,
        email: row.email,
        displayName: row.display_name,
        roles: row.roles_json,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
//# sourceMappingURL=users.repository.js.map