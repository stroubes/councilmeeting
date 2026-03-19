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
exports.AgendasRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
let AgendasRepository = class AgendasRepository {
    postgresService;
    memoryAgendas = new Map();
    schemaEnsured = false;
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async create(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const id = (0, node_crypto_1.randomUUID)();
            const now = new Date().toISOString();
            await this.postgresService.query(`INSERT INTO app_agendas (
          id, meeting_id, template_id, title, status, version, rejection_reason,
          published_at, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, 'DRAFT', 1, NULL,
          NULL, $5, $6, $7
        )`, [id, input.meetingId, input.templateId, input.title, input.createdBy, now, now]);
            return this.getById(id);
        }, () => this.createInMemory(input));
    }
    async list(meetingId) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const params = [];
            const whereClause = meetingId ? `WHERE meeting_id = $1` : '';
            if (meetingId) {
                params.push(meetingId);
            }
            const agendasResult = await this.postgresService.query(`SELECT * FROM app_agendas ${whereClause} ORDER BY updated_at DESC`, params);
            if (agendasResult.rows.length === 0) {
                return [];
            }
            const agendaIds = agendasResult.rows.map((row) => row.id);
            const itemsResult = await this.postgresService.query(`SELECT * FROM app_agenda_items WHERE agenda_id = ANY($1::uuid[]) ORDER BY sort_order ASC`, [agendaIds]);
            const itemsByAgendaId = groupItemsByAgenda(itemsResult.rows);
            return agendasResult.rows.map((row) => toAgendaRecord(row, itemsByAgendaId.get(row.id) ?? []));
        }, () => {
            const agendas = Array.from(this.memoryAgendas.values());
            return agendas
                .filter((agenda) => (meetingId ? agenda.meetingId === meetingId : true))
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });
    }
    async getById(id) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const agendaResult = await this.postgresService.query(`SELECT * FROM app_agendas WHERE id = $1 LIMIT 1`, [id]);
            if (agendaResult.rows.length === 0) {
                throw new common_1.NotFoundException('Agenda not found');
            }
            const itemsResult = await this.postgresService.query(`SELECT * FROM app_agenda_items WHERE agenda_id = $1 ORDER BY sort_order ASC`, [id]);
            return toAgendaRecord(agendaResult.rows[0], itemsResult.rows.map((row) => toAgendaItemRecord(row)));
        }, () => {
            const agenda = this.memoryAgendas.get(id);
            if (!agenda) {
                throw new common_1.NotFoundException('Agenda not found');
            }
            return agenda;
        });
    }
    async update(id, patch) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const existing = await this.getById(id);
            const updatedAt = new Date().toISOString();
            await this.postgresService.query(`UPDATE app_agendas
         SET title = $2,
             status = $3,
             version = $4,
             rejection_reason = $5,
             published_at = $6,
             updated_at = $7
         WHERE id = $1`, [
                id,
                patch.title ?? existing.title,
                patch.status ?? existing.status,
                patch.version ?? existing.version,
                patch.rejectionReason ?? existing.rejectionReason ?? null,
                patch.publishedAt ?? existing.publishedAt ?? null,
                updatedAt,
            ]);
            return this.getById(id);
        }, async () => {
            const existing = await this.getById(id);
            const updated = {
                ...existing,
                ...patch,
                updatedAt: new Date().toISOString(),
            };
            this.memoryAgendas.set(id, updated);
            return updated;
        });
    }
    async replaceItems(agendaId, items) {
        await this.withFallback(async () => {
            await this.ensureSchema();
            await this.postgresService.query(`DELETE FROM app_agenda_items WHERE agenda_id = $1`, [agendaId]);
            if (items.length === 0) {
                return;
            }
            for (const item of items) {
                await this.postgresService.query(`INSERT INTO app_agenda_items (
            id, agenda_id, item_type, title, description, parent_item_id,
            is_in_camera, sort_order, status, created_by, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12
          )`, [
                    item.id,
                    agendaId,
                    item.itemType,
                    item.title,
                    item.description,
                    item.parentItemId,
                    item.isInCamera,
                    item.sortOrder,
                    item.status,
                    item.createdBy,
                    item.createdAt,
                    item.updatedAt,
                ]);
            }
        }, async () => {
            const existing = await this.getById(agendaId);
            this.memoryAgendas.set(agendaId, {
                ...existing,
                items,
                updatedAt: new Date().toISOString(),
            });
        });
    }
    async addItem(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const id = (0, node_crypto_1.randomUUID)();
            const now = new Date().toISOString();
            const result = await this.postgresService.query(`INSERT INTO app_agenda_items (
          id, agenda_id, item_type, title, description, parent_item_id,
          is_in_camera, sort_order, status, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12
        ) RETURNING *`, [
                id,
                input.agendaId,
                input.itemType,
                input.title,
                input.description,
                input.parentItemId,
                input.isInCamera,
                input.sortOrder,
                input.status,
                input.createdBy,
                now,
                now,
            ]);
            return toAgendaItemRecord(result.rows[0]);
        }, async () => {
            const agenda = await this.getById(input.agendaId);
            const now = new Date().toISOString();
            const item = {
                id: (0, node_crypto_1.randomUUID)(),
                agendaId: input.agendaId,
                itemType: input.itemType,
                title: input.title,
                description: input.description,
                parentItemId: input.parentItemId,
                isInCamera: input.isInCamera,
                sortOrder: input.sortOrder,
                status: input.status,
                createdBy: input.createdBy,
                createdAt: now,
                updatedAt: now,
            };
            this.memoryAgendas.set(agenda.id, {
                ...agenda,
                items: [...agenda.items, item],
                updatedAt: now,
            });
            return item;
        });
    }
    async updateItem(agendaId, itemId, patch) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const currentResult = await this.postgresService.query(`SELECT * FROM app_agenda_items WHERE agenda_id = $1 AND id = $2 LIMIT 1`, [agendaId, itemId]);
            if (currentResult.rows.length === 0) {
                throw new common_1.NotFoundException('Agenda item not found');
            }
            const current = toAgendaItemRecord(currentResult.rows[0]);
            const updatedAt = new Date().toISOString();
            const result = await this.postgresService.query(`UPDATE app_agenda_items
         SET item_type = $3,
             title = $4,
             description = $5,
             parent_item_id = $6,
             is_in_camera = $7,
             status = $8,
             updated_at = $9
         WHERE agenda_id = $1 AND id = $2
         RETURNING *`, [
                agendaId,
                itemId,
                patch.itemType ?? current.itemType,
                patch.title ?? current.title,
                patch.description ?? null,
                patch.parentItemId ?? null,
                patch.isInCamera ?? current.isInCamera,
                patch.status ?? current.status,
                updatedAt,
            ]);
            return toAgendaItemRecord(result.rows[0]);
        }, async () => {
            const agenda = await this.getById(agendaId);
            const item = agenda.items.find((candidate) => candidate.id === itemId);
            if (!item) {
                throw new common_1.NotFoundException('Agenda item not found');
            }
            const updatedItem = {
                ...item,
                ...patch,
                updatedAt: new Date().toISOString(),
            };
            this.memoryAgendas.set(agenda.id, {
                ...agenda,
                items: agenda.items.map((candidate) => (candidate.id === itemId ? updatedItem : candidate)),
                updatedAt: new Date().toISOString(),
            });
            return updatedItem;
        });
    }
    async hasAgendaItem(itemId) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT EXISTS (SELECT 1 FROM app_agenda_items WHERE id = $1) AS exists`, [itemId]);
            return result.rows[0]?.exists === true;
        }, () => Array.from(this.memoryAgendas.values()).some((agenda) => agenda.items.some((item) => item.id === itemId)));
    }
    async remove(id) {
        await this.withFallback(async () => {
            await this.ensureSchema();
            await this.postgresService.query(`DELETE FROM app_agenda_items WHERE agenda_id = $1`, [id]);
            const deleted = await this.postgresService.query(`DELETE FROM app_agendas WHERE id = $1`, [id]);
            if (deleted.rowCount === 0) {
                throw new common_1.NotFoundException('Agenda not found');
            }
        }, () => {
            if (!this.memoryAgendas.delete(id)) {
                throw new common_1.NotFoundException('Agenda not found');
            }
        });
    }
    async ensureSchema() {
        if (this.schemaEnsured || !this.postgresService.isEnabled) {
            return;
        }
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_agendas (
        id UUID PRIMARY KEY,
        meeting_id UUID NOT NULL,
        template_id VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        version INTEGER NOT NULL,
        rejection_reason TEXT,
        published_at TIMESTAMPTZ,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_agenda_items (
        id UUID PRIMARY KEY,
        agenda_id UUID NOT NULL,
        item_type VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        parent_item_id UUID,
        is_in_camera BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_agendas_meeting_id ON app_agendas(meeting_id)`);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_agenda_items_agenda_id ON app_agenda_items(agenda_id)`);
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
        const agenda = {
            id: (0, node_crypto_1.randomUUID)(),
            meetingId: input.meetingId,
            templateId: input.templateId,
            title: input.title,
            status: 'DRAFT',
            version: 1,
            items: [],
            createdBy: input.createdBy,
            createdAt: now,
            updatedAt: now,
        };
        this.memoryAgendas.set(agenda.id, agenda);
        return agenda;
    }
};
exports.AgendasRepository = AgendasRepository;
exports.AgendasRepository = AgendasRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], AgendasRepository);
function toAgendaRecord(row, items) {
    return {
        id: row.id,
        meetingId: row.meeting_id,
        templateId: row.template_id ?? undefined,
        title: row.title,
        status: row.status,
        version: row.version,
        rejectionReason: row.rejection_reason ?? undefined,
        items,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        publishedAt: row.published_at ?? undefined,
    };
}
function toAgendaItemRecord(row) {
    return {
        id: row.id,
        agendaId: row.agenda_id,
        itemType: row.item_type,
        title: row.title,
        description: row.description ?? undefined,
        parentItemId: row.parent_item_id ?? undefined,
        isInCamera: row.is_in_camera,
        sortOrder: row.sort_order,
        status: row.status,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function groupItemsByAgenda(rows) {
    const grouped = new Map();
    for (const row of rows) {
        const current = grouped.get(row.agenda_id) ?? [];
        current.push(toAgendaItemRecord(row));
        grouped.set(row.agenda_id, current);
    }
    return grouped;
}
//# sourceMappingURL=agendas.repository.js.map