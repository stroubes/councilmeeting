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
exports.ReportsRepository = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const postgres_service_1 = require("../database/postgres.service");
let ReportsRepository = class ReportsRepository {
    postgresService;
    memoryReports = new Map();
    memoryApprovals = new Map();
    memoryAttachments = new Map();
    schemaEnsured = false;
    constructor(postgresService) {
        this.postgresService = postgresService;
    }
    async create(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const id = (0, node_crypto_1.randomUUID)();
            const now = new Date().toISOString();
            const result = await this.postgresService.query(`INSERT INTO app_staff_reports (
          id, agenda_item_id, template_id, report_number, title, author_user_id, department,
          executive_summary, recommendations, financial_impact, legal_impact,
          raw_docx_file_name, source_sharepoint_site_id, source_sharepoint_drive_id,
          source_sharepoint_item_id, source_sharepoint_web_url, parsed_content_json,
          parsing_version, parsing_warnings_json, workflow_status, created_by,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14,
          $15, $16, $17,
          $18, $19, $20, $21,
          $22, $23
        ) RETURNING *`, [
                id,
                input.agendaItemId,
                input.templateId,
                input.reportNumber,
                input.title,
                input.authorUserId,
                input.department,
                input.executiveSummary,
                input.recommendations,
                input.financialImpact,
                input.legalImpact,
                input.rawDocxFileName,
                input.sourceSharePointSiteId,
                input.sourceSharePointDriveId,
                input.sourceSharePointItemId,
                input.sourceSharePointWebUrl,
                input.parsedContentJson,
                input.parsingVersion,
                input.parsingWarnings,
                input.workflowStatus,
                input.createdBy,
                now,
                now,
            ]);
            return toReportRecord(result.rows[0]);
        }, () => this.createInMemory(input));
    }
    async list(query) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const where = [];
            const params = [];
            if (query.agendaItemId) {
                params.push(query.agendaItemId);
                where.push(`agenda_item_id = $${params.length}`);
            }
            if (query.status) {
                params.push(query.status);
                where.push(`workflow_status = $${params.length}`);
            }
            const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
            const result = await this.postgresService.query(`SELECT * FROM app_staff_reports ${whereClause} ORDER BY updated_at DESC`, params);
            return result.rows.map((row) => toReportRecord(row));
        }, () => this.listInMemory(query));
    }
    async getById(id) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_staff_reports WHERE id = $1 LIMIT 1`, [id]);
            if (result.rows.length === 0) {
                throw new common_1.NotFoundException('Staff report not found');
            }
            return toReportRecord(result.rows[0]);
        }, () => {
            const report = this.memoryReports.get(id);
            if (!report) {
                throw new common_1.NotFoundException('Staff report not found');
            }
            return report;
        });
    }
    async update(id, patch) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const existing = await this.getById(id);
            const updatedAt = new Date().toISOString();
            const result = await this.postgresService.query(`UPDATE app_staff_reports
         SET title = $2,
             template_id = $3,
             department = $4,
             executive_summary = $5,
             recommendations = $6,
             financial_impact = $7,
             legal_impact = $8,
             updated_at = $9
         WHERE id = $1
         RETURNING *`, [
                id,
                patch.title ?? existing.title,
                patch.templateId ?? existing.templateId,
                patch.department ?? existing.department,
                patch.executiveSummary ?? existing.executiveSummary,
                patch.recommendations ?? existing.recommendations,
                patch.financialImpact ?? existing.financialImpact,
                patch.legalImpact ?? existing.legalImpact,
                updatedAt,
            ]);
            return toReportRecord(result.rows[0]);
        }, async () => {
            const report = await this.getById(id);
            const updated = {
                ...report,
                ...patch,
                updatedAt: new Date().toISOString(),
            };
            this.memoryReports.set(id, updated);
            return updated;
        });
    }
    async updateWorkflowStatus(id, workflowStatus) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`UPDATE app_staff_reports SET workflow_status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`, [id, workflowStatus]);
            if (result.rows.length === 0) {
                throw new common_1.NotFoundException('Staff report not found');
            }
            return toReportRecord(result.rows[0]);
        }, async () => {
            const existing = await this.getById(id);
            const updated = { ...existing, workflowStatus, updatedAt: new Date().toISOString() };
            this.memoryReports.set(id, updated);
            return updated;
        });
    }
    async listPendingDirector() {
        return this.list({ status: 'PENDING_DIRECTOR_APPROVAL' });
    }
    async listPendingCao() {
        return this.list({ status: 'PENDING_CAO_APPROVAL' });
    }
    async appendApproval(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const id = (0, node_crypto_1.randomUUID)();
            const actedAt = new Date().toISOString();
            const result = await this.postgresService.query(`INSERT INTO app_report_approvals (
          id, staff_report_id, stage, action, acted_by_user_id, acted_at, comments, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`, [id, input.reportId, input.stage, input.action, input.actedByUserId, actedAt, input.comments, actedAt]);
            return toApprovalEvent(result.rows[0]);
        }, () => this.appendApprovalInMemory(input));
    }
    async getApprovalHistory(reportId) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_report_approvals WHERE staff_report_id = $1 ORDER BY acted_at ASC`, [reportId]);
            return result.rows.map((row) => toApprovalEvent(row));
        }, () => [...(this.memoryApprovals.get(reportId) ?? [])].sort((a, b) => a.actedAt.localeCompare(b.actedAt)));
    }
    async createAttachment(input) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const id = (0, node_crypto_1.randomUUID)();
            const now = new Date().toISOString();
            const result = await this.postgresService.query(`INSERT INTO app_report_attachments (
          id, report_id, file_name, mime_type, size_bytes, source_type,
          source_sharepoint_site_id, source_sharepoint_drive_id, source_sharepoint_item_id,
          source_sharepoint_web_url, uploaded_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9,
          $10, $11, $12
        ) RETURNING *`, [
                id,
                input.reportId,
                input.fileName,
                input.mimeType,
                input.sizeBytes,
                input.sourceType,
                input.sourceSharePointSiteId,
                input.sourceSharePointDriveId,
                input.sourceSharePointItemId,
                input.sourceSharePointWebUrl,
                input.uploadedBy,
                now,
            ]);
            return toAttachmentRecord(result.rows[0]);
        }, () => this.createAttachmentInMemory(input));
    }
    async listAttachments(reportId) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`SELECT * FROM app_report_attachments WHERE report_id = $1 ORDER BY created_at DESC`, [reportId]);
            return result.rows.map((row) => toAttachmentRecord(row));
        }, () => [...(this.memoryAttachments.get(reportId) ?? [])]);
    }
    async removeAttachment(reportId, attachmentId) {
        return this.withFallback(async () => {
            await this.ensureSchema();
            const result = await this.postgresService.query(`DELETE FROM app_report_attachments WHERE report_id = $1 AND id = $2`, [reportId, attachmentId]);
            if (result.rowCount === 0) {
                throw new common_1.NotFoundException('Report attachment not found');
            }
        }, () => {
            const existing = this.memoryAttachments.get(reportId) ?? [];
            const next = existing.filter((attachment) => attachment.id !== attachmentId);
            if (next.length === existing.length) {
                throw new common_1.NotFoundException('Report attachment not found');
            }
            this.memoryAttachments.set(reportId, next);
        });
    }
    async remove(reportId) {
        await this.withFallback(async () => {
            await this.ensureSchema();
            await this.postgresService.query(`DELETE FROM app_report_attachments WHERE report_id = $1`, [reportId]);
            await this.postgresService.query(`DELETE FROM app_report_approvals WHERE staff_report_id = $1`, [reportId]);
            const deleted = await this.postgresService.query(`DELETE FROM app_staff_reports WHERE id = $1`, [reportId]);
            if (deleted.rowCount === 0) {
                throw new common_1.NotFoundException('Staff report not found');
            }
        }, () => {
            const existed = this.memoryReports.delete(reportId);
            this.memoryApprovals.delete(reportId);
            this.memoryAttachments.delete(reportId);
            if (!existed) {
                throw new common_1.NotFoundException('Staff report not found');
            }
        });
    }
    async ensureSchema() {
        if (this.schemaEnsured || !this.postgresService.isEnabled) {
            return;
        }
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_staff_reports (
        id UUID PRIMARY KEY,
        agenda_item_id UUID NOT NULL,
        report_number VARCHAR(100),
        title VARCHAR(500) NOT NULL,
        template_id UUID,
        author_user_id VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        executive_summary TEXT,
        recommendations TEXT,
        financial_impact TEXT,
        legal_impact TEXT,
        raw_docx_file_name VARCHAR(500),
        source_sharepoint_site_id VARCHAR(255),
        source_sharepoint_drive_id VARCHAR(255),
        source_sharepoint_item_id VARCHAR(255),
        source_sharepoint_web_url TEXT,
        parsed_content_json JSONB NOT NULL,
        parsing_version VARCHAR(50) NOT NULL,
        parsing_warnings_json JSONB,
        workflow_status VARCHAR(50) NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_report_approvals (
        id UUID PRIMARY KEY,
        staff_report_id UUID NOT NULL,
        stage VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        acted_by_user_id VARCHAR(255) NOT NULL,
        acted_at TIMESTAMPTZ NOT NULL,
        comments TEXT,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_report_attachments (
        id UUID PRIMARY KEY,
        report_id UUID NOT NULL,
        file_name VARCHAR(500) NOT NULL,
        mime_type VARCHAR(150),
        size_bytes BIGINT,
        source_type VARCHAR(40) NOT NULL,
        source_sharepoint_site_id VARCHAR(255),
        source_sharepoint_drive_id VARCHAR(255),
        source_sharepoint_item_id VARCHAR(255),
        source_sharepoint_web_url TEXT,
        uploaded_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_staff_reports_status ON app_staff_reports(workflow_status)`);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_report_approvals_report_id ON app_report_approvals(staff_report_id)`);
        await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_report_attachments_report_id ON app_report_attachments(report_id, created_at DESC)`);
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
        const report = {
            id: (0, node_crypto_1.randomUUID)(),
            agendaItemId: input.agendaItemId,
            templateId: input.templateId,
            reportNumber: input.reportNumber,
            title: input.title,
            department: input.department,
            executiveSummary: input.executiveSummary,
            recommendations: input.recommendations,
            financialImpact: input.financialImpact,
            legalImpact: input.legalImpact,
            rawDocxFileName: input.rawDocxFileName,
            sourceSharePointSiteId: input.sourceSharePointSiteId,
            sourceSharePointDriveId: input.sourceSharePointDriveId,
            sourceSharePointItemId: input.sourceSharePointItemId,
            sourceSharePointWebUrl: input.sourceSharePointWebUrl,
            parsedContentJson: input.parsedContentJson,
            parsingVersion: input.parsingVersion,
            parsingWarnings: input.parsingWarnings,
            workflowStatus: input.workflowStatus,
            authorUserId: input.authorUserId,
            createdBy: input.createdBy,
            createdAt: now,
            updatedAt: now,
        };
        this.memoryReports.set(report.id, report);
        this.memoryApprovals.set(report.id, []);
        this.memoryAttachments.set(report.id, []);
        return report;
    }
    listInMemory(query) {
        return Array.from(this.memoryReports.values())
            .filter((report) => (query.agendaItemId ? report.agendaItemId === query.agendaItemId : true))
            .filter((report) => (query.status ? report.workflowStatus === query.status : true))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    appendApprovalInMemory(input) {
        const history = this.memoryApprovals.get(input.reportId) ?? [];
        const event = {
            id: (0, node_crypto_1.randomUUID)(),
            staffReportId: input.reportId,
            stage: input.stage,
            action: input.action,
            actedByUserId: input.actedByUserId,
            actedAt: new Date().toISOString(),
            comments: input.comments,
        };
        history.push(event);
        this.memoryApprovals.set(input.reportId, history);
        return event;
    }
    createAttachmentInMemory(input) {
        const attachment = {
            id: (0, node_crypto_1.randomUUID)(),
            reportId: input.reportId,
            fileName: input.fileName,
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            sourceType: input.sourceType,
            sourceSharePointSiteId: input.sourceSharePointSiteId,
            sourceSharePointDriveId: input.sourceSharePointDriveId,
            sourceSharePointItemId: input.sourceSharePointItemId,
            sourceSharePointWebUrl: input.sourceSharePointWebUrl,
            uploadedBy: input.uploadedBy,
            createdAt: new Date().toISOString(),
        };
        const existing = this.memoryAttachments.get(input.reportId) ?? [];
        this.memoryAttachments.set(input.reportId, [attachment, ...existing]);
        return attachment;
    }
};
exports.ReportsRepository = ReportsRepository;
exports.ReportsRepository = ReportsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_service_1.PostgresService])
], ReportsRepository);
function toReportRecord(row) {
    return {
        id: row.id,
        agendaItemId: row.agenda_item_id,
        templateId: row.template_id ?? undefined,
        reportNumber: row.report_number ?? undefined,
        title: row.title,
        department: row.department ?? undefined,
        executiveSummary: row.executive_summary ?? undefined,
        recommendations: row.recommendations ?? undefined,
        financialImpact: row.financial_impact ?? undefined,
        legalImpact: row.legal_impact ?? undefined,
        rawDocxFileName: row.raw_docx_file_name ?? undefined,
        sourceSharePointSiteId: row.source_sharepoint_site_id ?? undefined,
        sourceSharePointDriveId: row.source_sharepoint_drive_id ?? undefined,
        sourceSharePointItemId: row.source_sharepoint_item_id ?? undefined,
        sourceSharePointWebUrl: row.source_sharepoint_web_url ?? undefined,
        parsedContentJson: row.parsed_content_json,
        parsingVersion: row.parsing_version,
        parsingWarnings: row.parsing_warnings_json ?? [],
        workflowStatus: row.workflow_status,
        authorUserId: row.author_user_id,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function toApprovalEvent(row) {
    return {
        id: row.id,
        staffReportId: row.staff_report_id,
        stage: row.stage,
        action: row.action,
        actedByUserId: row.acted_by_user_id,
        actedAt: row.acted_at,
        comments: row.comments ?? undefined,
    };
}
function toAttachmentRecord(row) {
    return {
        id: row.id,
        reportId: row.report_id,
        fileName: row.file_name,
        mimeType: row.mime_type ?? undefined,
        sizeBytes: row.size_bytes ?? undefined,
        sourceType: row.source_type,
        sourceSharePointSiteId: row.source_sharepoint_site_id ?? undefined,
        sourceSharePointDriveId: row.source_sharepoint_drive_id ?? undefined,
        sourceSharePointItemId: row.source_sharepoint_item_id ?? undefined,
        sourceSharePointWebUrl: row.source_sharepoint_web_url ?? undefined,
        uploadedBy: row.uploaded_by,
        createdAt: row.created_at,
    };
}
//# sourceMappingURL=reports.repository.js.map