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
exports.TemplatesRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
let TemplatesRepository = class TemplatesRepository {
    postgresService;
    schemaEnsured = false;
    memoryTemplates = new Map();
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async create(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const id = (0, node_crypto_1.randomUUID)();
            const now = new Date().toISOString();
            const result = await this.postgresService.query(`INSERT INTO app_templates (
          id, template_type, code, name, description, is_active, version, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $9)
        RETURNING *`, [id, input.type, input.code, input.name, input.description, input.isActive, input.createdBy, now, now]);
            return this.hydrateSingle(result.rows[0]);
        }, () => this.createInMemory(input));
    }
    async list(query) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const where = [];
            const params = [];
            if (query?.type) {
                params.push(query.type);
                where.push(`template_type = $${params.length}`);
            }
            if (!query?.includeInactive) {
                where.push(`is_active = TRUE`);
            }
            const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
            const templates = await this.postgresService.query(`SELECT * FROM app_templates ${whereClause} ORDER BY updated_at DESC`, params);
            return this.hydrateList(templates.rows);
        }, () => this.listInMemory(query));
    }
    async getById(id) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_templates WHERE id = $1 LIMIT 1`, [id]);
            if (result.rows.length === 0) {
                throw new common_1.NotFoundException('Template not found');
            }
            return this.hydrateSingle(result.rows[0]);
        }, () => {
            const template = this.memoryTemplates.get(id);
            if (!template) {
                throw new common_1.NotFoundException('Template not found');
            }
            return template;
        });
    }
    async update(id, patch) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const existing = await this.getById(id);
            const updatedAt = new Date().toISOString();
            const result = await this.postgresService.query(`UPDATE app_templates
         SET name = $2,
             description = $3,
             is_active = $4,
             version = $5,
             updated_at = $6
         WHERE id = $1
         RETURNING *`, [
                id,
                patch.name ?? existing.name,
                patch.description ?? existing.description,
                patch.isActive ?? existing.isActive,
                patch.version ?? existing.version,
                updatedAt,
            ]);
            return this.hydrateSingle(result.rows[0]);
        }, async () => {
            const existing = await this.getById(id);
            const updated = {
                ...existing,
                name: patch.name ?? existing.name,
                description: patch.description ?? existing.description,
                isActive: patch.isActive ?? existing.isActive,
                version: patch.version ?? existing.version,
                updatedAt: new Date().toISOString(),
            };
            this.memoryTemplates.set(id, updated);
            return updated;
        });
    }
    async addSection(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const id = (0, node_crypto_1.randomUUID)();
            const now = new Date().toISOString();
            await this.postgresService.query(`INSERT INTO app_template_sections (
          id, template_id, title, description, section_type, item_type, is_required, sort_order, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
                id,
                input.templateId,
                input.title,
                input.description,
                input.sectionType,
                input.itemType,
                input.isRequired,
                input.sortOrder,
                now,
                now,
            ]);
            return this.getById(input.templateId);
        }, async () => {
            const template = await this.getById(input.templateId);
            const now = new Date().toISOString();
            const section = {
                id: (0, node_crypto_1.randomUUID)(),
                templateId: input.templateId,
                title: input.title,
                description: input.description,
                sectionType: input.sectionType,
                itemType: input.itemType,
                isRequired: input.isRequired,
                sortOrder: input.sortOrder,
                createdAt: now,
                updatedAt: now,
            };
            const updated = {
                ...template,
                sections: [...template.sections, section].sort((a, b) => a.sortOrder - b.sortOrder),
                updatedAt: now,
            };
            this.memoryTemplates.set(template.id, updated);
            return updated;
        });
    }
    async updateSection(templateId, sectionId, patch) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const sectionResult = await this.postgresService.query(`SELECT * FROM app_template_sections WHERE id = $1 AND template_id = $2 LIMIT 1`, [sectionId, templateId]);
            if (sectionResult.rows.length === 0) {
                throw new common_1.NotFoundException('Template section not found');
            }
            const existing = sectionResult.rows[0];
            await this.postgresService.query(`UPDATE app_template_sections
         SET title = $3,
             description = $4,
             section_type = $5,
             item_type = $6,
             is_required = $7,
             updated_at = $8
         WHERE id = $1 AND template_id = $2`, [
                sectionId,
                templateId,
                patch.title ?? existing.title,
                patch.description ?? existing.description,
                patch.sectionType ?? existing.section_type,
                patch.itemType ?? existing.item_type,
                patch.isRequired ?? existing.is_required,
                new Date().toISOString(),
            ]);
            return this.getById(templateId);
        }, async () => {
            const template = await this.getById(templateId);
            const now = new Date().toISOString();
            const hasSection = template.sections.some((section) => section.id === sectionId);
            if (!hasSection) {
                throw new common_1.NotFoundException('Template section not found');
            }
            const updated = {
                ...template,
                sections: template.sections.map((section) => section.id === sectionId
                    ? {
                        ...section,
                        title: patch.title ?? section.title,
                        description: patch.description ?? section.description,
                        sectionType: patch.sectionType ?? section.sectionType,
                        itemType: patch.itemType ?? section.itemType,
                        isRequired: patch.isRequired ?? section.isRequired,
                        updatedAt: now,
                    }
                    : section),
                updatedAt: now,
            };
            this.memoryTemplates.set(template.id, updated);
            return updated;
        });
    }
    async removeSection(templateId, sectionId) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const deleted = await this.postgresService.query(`DELETE FROM app_template_sections WHERE id = $1 AND template_id = $2`, [sectionId, templateId]);
            if (deleted.rowCount === 0) {
                throw new common_1.NotFoundException('Template section not found');
            }
            const template = await this.getById(templateId);
            return this.reorderSections(templateId, template.sections.map((section) => section.id));
        }, async () => {
            const template = await this.getById(templateId);
            const before = template.sections.length;
            const updatedSections = template.sections
                .filter((section) => section.id !== sectionId)
                .map((section, index) => ({ ...section, sortOrder: index + 1 }));
            if (updatedSections.length === before) {
                throw new common_1.NotFoundException('Template section not found');
            }
            const updated = {
                ...template,
                sections: updatedSections,
                updatedAt: new Date().toISOString(),
            };
            this.memoryTemplates.set(template.id, updated);
            return updated;
        });
    }
    async reorderSections(templateId, sectionIdsInOrder) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const now = new Date().toISOString();
            await this.postgresService.query(`UPDATE app_template_sections
         SET sort_order = sort_order + 1000,
             updated_at = $2
         WHERE template_id = $1`, [templateId, now]);
            for (let index = 0; index < sectionIdsInOrder.length; index += 1) {
                const sectionId = sectionIdsInOrder[index];
                await this.postgresService.query(`UPDATE app_template_sections
           SET sort_order = $3,
               updated_at = $4
           WHERE template_id = $1 AND id = $2`, [templateId, sectionId, index + 1, now]);
            }
            return this.getById(templateId);
        }, async () => {
            const template = await this.getById(templateId);
            const sectionById = new Map(template.sections.map((section) => [section.id, section]));
            const reordered = sectionIdsInOrder.map((sectionId, index) => {
                const section = sectionById.get(sectionId);
                if (!section) {
                    throw new common_1.NotFoundException(`Template section ${sectionId} not found`);
                }
                return {
                    ...section,
                    sortOrder: index + 1,
                    updatedAt: new Date().toISOString(),
                };
            });
            const updated = {
                ...template,
                sections: reordered,
                updatedAt: new Date().toISOString(),
            };
            this.memoryTemplates.set(template.id, updated);
            return updated;
        });
    }
    async remove(templateId) {
        await this.withFallback(async () => {
            await this.ensureSchema();
            await this.postgresService.query(`DELETE FROM app_template_sections WHERE template_id = $1`, [templateId]);
            const deleted = await this.postgresService.query(`DELETE FROM app_templates WHERE id = $1`, [templateId]);
            if (deleted.rowCount === 0) {
                throw new common_1.NotFoundException('Template not found');
            }
        }, () => {
            if (!this.memoryTemplates.delete(templateId)) {
                throw new common_1.NotFoundException('Template not found');
            }
        });
    }
    async hydrateSingle(row) {
        const sections = await this.postgresService.query(`SELECT * FROM app_template_sections WHERE template_id = $1 ORDER BY sort_order ASC`, [row.id]);
        return toTemplateRecord(row, sections.rows);
    }
    async hydrateList(rows) {
        if (rows.length === 0) {
            return [];
        }
        const templateIds = rows.map((row) => row.id);
        const sections = await this.postgresService.query(`SELECT * FROM app_template_sections WHERE template_id = ANY($1::uuid[]) ORDER BY sort_order ASC`, [templateIds]);
        const sectionsByTemplateId = new Map();
        for (const section of sections.rows) {
            const list = sectionsByTemplateId.get(section.template_id) ?? [];
            list.push(section);
            sectionsByTemplateId.set(section.template_id, list);
        }
        return rows.map((row) => toTemplateRecord(row, sectionsByTemplateId.get(row.id) ?? []));
    }
    async ensureSchema() {
        if (this.schemaEnsured || !this.postgresService.isEnabled) {
            return;
        }
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_templates (
        id UUID PRIMARY KEY,
        template_type VARCHAR(50) NOT NULL,
        code VARCHAR(120) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        version INTEGER NOT NULL DEFAULT 1,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_template_sections (
        id UUID PRIMARY KEY,
        template_id UUID NOT NULL REFERENCES app_templates(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        section_type VARCHAR(60),
        item_type VARCHAR(60),
        is_required BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        CONSTRAINT uq_app_template_section_order UNIQUE (template_id, sort_order)
      )
    `);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_templates_type ON app_templates(template_type)`);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_template_sections_template_id ON app_template_sections(template_id, sort_order)`);
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
        const template = {
            id: (0, node_crypto_1.randomUUID)(),
            type: input.type,
            code: input.code,
            name: input.name,
            description: input.description,
            isActive: input.isActive,
            version: 1,
            createdBy: input.createdBy,
            createdAt: now,
            updatedAt: now,
            sections: [],
        };
        this.memoryTemplates.set(template.id, template);
        return template;
    }
    listInMemory(query) {
        return Array.from(this.memoryTemplates.values())
            .filter((template) => (query?.type ? template.type === query.type : true))
            .filter((template) => (query?.includeInactive ? true : template.isActive))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
};
exports.TemplatesRepository = TemplatesRepository;
exports.TemplatesRepository = TemplatesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], TemplatesRepository);
function toTemplateRecord(row, sections) {
    return {
        id: row.id,
        type: row.template_type,
        code: row.code,
        name: row.name,
        description: row.description ?? undefined,
        isActive: row.is_active,
        version: row.version,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        sections: sections.map((section) => ({
            id: section.id,
            templateId: section.template_id,
            title: section.title,
            description: section.description ?? undefined,
            sectionType: section.section_type ?? undefined,
            itemType: section.item_type ?? undefined,
            isRequired: section.is_required,
            sortOrder: section.sort_order,
            createdAt: section.created_at,
            updatedAt: section.updated_at,
        })),
    };
}
//# sourceMappingURL=templates.repository.js.map