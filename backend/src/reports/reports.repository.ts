import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';
import type { ReportQueryDto } from './dto/report-query.dto';
import type {
  ReportAttachmentRecord,
  ReportApprovalEvent,
  ReportWorkflowStatus,
  StaffReportRecord,
} from './reports.service';

interface CreateReportInput {
  agendaItemId: string;
  templateId?: string;
  reportNumber?: string;
  title: string;
  department?: string;
  executiveSummary?: string;
  recommendations?: string;
  financialImpact?: string;
  legalImpact?: string;
  rawDocxFileName?: string;
  sourceSharePointSiteId?: string;
  sourceSharePointDriveId?: string;
  sourceSharePointItemId?: string;
  sourceSharePointWebUrl?: string;
  parsedContentJson: Record<string, unknown>;
  parsingVersion: string;
  parsingWarnings: string[];
  workflowStatus: ReportWorkflowStatus;
  workflowConfigId?: string;
  currentWorkflowStageIndex: number | null;
  currentWorkflowStageKey: string | null;
  currentWorkflowApproverRole: string | null;
  authorUserId: string;
  createdBy: string;
}

interface AppendApprovalInput {
  reportId: string;
  stage: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED' | 'PUBLISHED';
  actedByUserId: string;
  comments?: string;
}

interface CreateAttachmentInput {
  reportId: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  sourceType: 'SHAREPOINT';
  sourceSharePointSiteId?: string;
  sourceSharePointDriveId?: string;
  sourceSharePointItemId?: string;
  sourceSharePointWebUrl?: string;
  uploadedBy: string;
}

interface TransitionWorkflowInput {
  reportId: string;
  expectedUpdatedAt: string;
  patch: {
    workflowStatus: ReportWorkflowStatus;
    workflowConfigId?: string;
    currentWorkflowStageIndex?: number | null;
    currentWorkflowStageKey?: string | null;
    currentWorkflowApproverRole?: string | null;
  };
  approval: {
    stage: string;
    action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED' | 'PUBLISHED';
    actedByUserId: string;
    comments?: string;
  };
}

@Injectable()
export class ReportsRepository {
  private readonly memoryReports = new Map<string, StaffReportRecord>();
  private readonly memoryApprovals = new Map<string, ReportApprovalEvent[]>();
  private readonly memoryAttachments = new Map<string, ReportAttachmentRecord[]>();
  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async create(input: CreateReportInput): Promise<StaffReportRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();

      const result = await this.postgresService.query<DbReportRow>(
        `INSERT INTO app_staff_reports (
          id, agenda_item_id, template_id, report_number, title, author_user_id, department,
          executive_summary, recommendations, financial_impact, legal_impact,
          raw_docx_file_name, source_sharepoint_site_id, source_sharepoint_drive_id,
          source_sharepoint_item_id, source_sharepoint_web_url, parsed_content_json,
          parsing_version, parsing_warnings_json, workflow_status,
          workflow_config_id, current_workflow_stage_index, current_workflow_stage_key, current_workflow_approver_role,
          created_by,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14,
          $15, $16, $17,
          $18, $19, $20,
          $21, $22, $23, $24,
          $25,
          $26, $27
        ) RETURNING *`,
        [
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
          input.workflowConfigId,
          input.currentWorkflowStageIndex,
          input.currentWorkflowStageKey,
          input.currentWorkflowApproverRole,
          input.createdBy,
          now,
          now,
        ],
      );

      return toReportRecord(result.rows[0]);
    }, () => this.createInMemory(input));
  }

  async list(query: ReportQueryDto): Promise<StaffReportRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const where: string[] = [];
      const params: unknown[] = [];

      if (query.agendaItemId) {
        params.push(query.agendaItemId);
        where.push(`agenda_item_id = $${params.length}`);
      }

      if (query.status) {
        params.push(query.status);
        where.push(`workflow_status = $${params.length}`);
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
      const result = await this.postgresService.query<DbReportRow>(
        `SELECT * FROM app_staff_reports ${whereClause} ORDER BY updated_at DESC`,
        params,
      );
      return result.rows.map((row) => toReportRecord(row));
    }, () => this.listInMemory(query));
  }

  async getById(id: string): Promise<StaffReportRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbReportRow>(
        `SELECT * FROM app_staff_reports WHERE id = $1 LIMIT 1`,
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Staff report not found');
      }

      return toReportRecord(result.rows[0]);
    }, () => {
      const report = this.memoryReports.get(id);
      if (!report) {
        throw new NotFoundException('Staff report not found');
      }
      return report;
    });
  }

  async update(
    id: string,
    patch: Partial<
      Pick<
        StaffReportRecord,
        | 'title'
        | 'templateId'
        | 'department'
        | 'executiveSummary'
        | 'recommendations'
        | 'financialImpact'
        | 'legalImpact'
        | 'workflowConfigId'
      >
    >,
  ): Promise<StaffReportRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const updatedAt = new Date().toISOString();

      const result = await this.postgresService.query<DbReportRow>(
        `UPDATE app_staff_reports
         SET title = $2,
             template_id = $3,
             department = $4,
             executive_summary = $5,
             recommendations = $6,
             financial_impact = $7,
             legal_impact = $8,
             workflow_config_id = $9,
             updated_at = $10
          WHERE id = $1
          RETURNING *`,
        [
          id,
          patch.title ?? existing.title,
          patch.templateId ?? existing.templateId,
          patch.department ?? existing.department,
          patch.executiveSummary ?? existing.executiveSummary,
          patch.recommendations ?? existing.recommendations,
          patch.financialImpact ?? existing.financialImpact,
          patch.legalImpact ?? existing.legalImpact,
          patch.workflowConfigId ?? existing.workflowConfigId,
          updatedAt,
        ],
      );

      return toReportRecord(result.rows[0]);
    }, async () => {
      const report = await this.getById(id);
      const updated: StaffReportRecord = {
        ...report,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      this.memoryReports.set(id, updated);
      return updated;
    });
  }

  async updateWorkflowStatus(id: string, workflowStatus: ReportWorkflowStatus): Promise<StaffReportRecord> {
    return this.updateWorkflowState(id, { workflowStatus });
  }

  async updateWorkflowState(
    id: string,
    patch: {
      workflowStatus: ReportWorkflowStatus;
      workflowConfigId?: string;
      currentWorkflowStageIndex?: number | null;
      currentWorkflowStageKey?: string | null;
      currentWorkflowApproverRole?: string | null;
    },
  ): Promise<StaffReportRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const result = await this.postgresService.query<DbReportRow>(
        `UPDATE app_staff_reports
         SET workflow_status = $2,
             workflow_config_id = $3,
             current_workflow_stage_index = $4,
             current_workflow_stage_key = $5,
             current_workflow_approver_role = $6,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          id,
          patch.workflowStatus,
          patch.workflowConfigId ?? existing.workflowConfigId,
          patch.currentWorkflowStageIndex === undefined ? existing.currentWorkflowStageIndex : patch.currentWorkflowStageIndex,
          patch.currentWorkflowStageKey === undefined ? existing.currentWorkflowStageKey : patch.currentWorkflowStageKey,
          patch.currentWorkflowApproverRole === undefined
            ? existing.currentWorkflowApproverRole
            : patch.currentWorkflowApproverRole,
        ],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Staff report not found');
      }
      return toReportRecord(result.rows[0]);
    }, async () => {
      const existing = await this.getById(id);
      const updated = {
        ...existing,
        workflowStatus: patch.workflowStatus,
        workflowConfigId: patch.workflowConfigId ?? existing.workflowConfigId,
        currentWorkflowStageIndex:
          patch.currentWorkflowStageIndex === undefined
            ? existing.currentWorkflowStageIndex
            : patch.currentWorkflowStageIndex ?? undefined,
        currentWorkflowStageKey:
          patch.currentWorkflowStageKey === undefined
            ? existing.currentWorkflowStageKey
            : patch.currentWorkflowStageKey ?? undefined,
        currentWorkflowApproverRole:
          patch.currentWorkflowApproverRole === undefined
            ? existing.currentWorkflowApproverRole
            : patch.currentWorkflowApproverRole ?? undefined,
        updatedAt: new Date().toISOString(),
      };
      this.memoryReports.set(id, updated);
      return updated;
    });
  }

  async listPendingDirector(): Promise<StaffReportRecord[]> {
    return this.list({ status: 'PENDING_DIRECTOR_APPROVAL' });
  }

  async listPendingCao(): Promise<StaffReportRecord[]> {
    return this.list({ status: 'PENDING_CAO_APPROVAL' });
  }

  async listPendingWorkflow(): Promise<StaffReportRecord[]> {
    return this.list({ status: 'PENDING_WORKFLOW_APPROVAL' });
  }

  async appendApproval(input: AppendApprovalInput): Promise<ReportApprovalEvent> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const actedAt = new Date().toISOString();

      const result = await this.postgresService.query<DbApprovalRow>(
        `INSERT INTO app_report_approvals (
          id, staff_report_id, stage, action, acted_by_user_id, acted_at, comments, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [id, input.reportId, input.stage, input.action, input.actedByUserId, actedAt, input.comments, actedAt],
      );

      return toApprovalEvent(result.rows[0]);
    }, () => this.appendApprovalInMemory(input));
  }

  async transitionWorkflow(input: TransitionWorkflowInput): Promise<StaffReportRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();

      return this.postgresService.withTransaction(async (client) => {
        const existingResult = await client.query<DbReportRow>(
          `SELECT * FROM app_staff_reports WHERE id = $1 LIMIT 1 FOR UPDATE`,
          [input.reportId],
        );

        if (existingResult.rows.length === 0) {
          throw new NotFoundException('Staff report not found');
        }

        const existing = existingResult.rows[0];
        if (existing.updated_at !== input.expectedUpdatedAt) {
          throw new ConflictException('Staff report changed by another user. Refresh and try again.');
        }

        const updateResult = await client.query<DbReportRow>(
          `UPDATE app_staff_reports
           SET workflow_status = $2,
               workflow_config_id = $3,
               current_workflow_stage_index = $4,
               current_workflow_stage_key = $5,
               current_workflow_approver_role = $6,
               updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [
            input.reportId,
            input.patch.workflowStatus,
            input.patch.workflowConfigId ?? existing.workflow_config_id,
            input.patch.currentWorkflowStageIndex === undefined
              ? existing.current_workflow_stage_index
              : input.patch.currentWorkflowStageIndex,
            input.patch.currentWorkflowStageKey === undefined
              ? existing.current_workflow_stage_key
              : input.patch.currentWorkflowStageKey,
            input.patch.currentWorkflowApproverRole === undefined
              ? existing.current_workflow_approver_role
              : input.patch.currentWorkflowApproverRole,
          ],
        );

        const approvalId = randomUUID();
        const actedAt = new Date().toISOString();
        await client.query(
          `INSERT INTO app_report_approvals (
             id, staff_report_id, stage, action, acted_by_user_id, acted_at, comments, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            approvalId,
            input.reportId,
            input.approval.stage,
            input.approval.action,
            input.approval.actedByUserId,
            actedAt,
            input.approval.comments,
            actedAt,
          ],
        );

        return toReportRecord(updateResult.rows[0]);
      });
    }, async () => {
      const existing = await this.getById(input.reportId);
      if (existing.updatedAt !== input.expectedUpdatedAt) {
        throw new ConflictException('Staff report changed by another user. Refresh and try again.');
      }

      const updated: StaffReportRecord = {
        ...existing,
        workflowStatus: input.patch.workflowStatus,
        workflowConfigId: input.patch.workflowConfigId ?? existing.workflowConfigId,
        currentWorkflowStageIndex:
          input.patch.currentWorkflowStageIndex === undefined
            ? existing.currentWorkflowStageIndex
            : input.patch.currentWorkflowStageIndex ?? undefined,
        currentWorkflowStageKey:
          input.patch.currentWorkflowStageKey === undefined
            ? existing.currentWorkflowStageKey
            : input.patch.currentWorkflowStageKey ?? undefined,
        currentWorkflowApproverRole:
          input.patch.currentWorkflowApproverRole === undefined
            ? existing.currentWorkflowApproverRole
            : input.patch.currentWorkflowApproverRole ?? undefined,
        updatedAt: new Date().toISOString(),
      };

      this.memoryReports.set(input.reportId, updated);
      const history = this.memoryApprovals.get(input.reportId) ?? [];
      history.push({
        id: randomUUID(),
        staffReportId: input.reportId,
        stage: input.approval.stage,
        action: input.approval.action,
        actedByUserId: input.approval.actedByUserId,
        actedAt: new Date().toISOString(),
        comments: input.approval.comments,
      });
      this.memoryApprovals.set(input.reportId, history);
      return updated;
    });
  }

  async getApprovalHistory(reportId: string): Promise<ReportApprovalEvent[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbApprovalRow>(
        `SELECT * FROM app_report_approvals WHERE staff_report_id = $1 ORDER BY acted_at ASC`,
        [reportId],
      );
      return result.rows.map((row) => toApprovalEvent(row));
    }, () =>
      [...(this.memoryApprovals.get(reportId) ?? [])].sort((a, b) => a.actedAt.localeCompare(b.actedAt)));
  }

  async createAttachment(input: CreateAttachmentInput): Promise<ReportAttachmentRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbReportAttachmentRow>(
        `INSERT INTO app_report_attachments (
          id, report_id, file_name, mime_type, size_bytes, source_type,
          source_sharepoint_site_id, source_sharepoint_drive_id, source_sharepoint_item_id,
          source_sharepoint_web_url, uploaded_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9,
          $10, $11, $12
        ) RETURNING *`,
        [
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
        ],
      );
      return toAttachmentRecord(result.rows[0]);
    }, () => this.createAttachmentInMemory(input));
  }

  async listAttachments(reportId: string): Promise<ReportAttachmentRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbReportAttachmentRow>(
        `SELECT * FROM app_report_attachments WHERE report_id = $1 ORDER BY created_at DESC`,
        [reportId],
      );
      return result.rows.map((row) => toAttachmentRecord(row));
    }, () => [...(this.memoryAttachments.get(reportId) ?? [])]);
  }

  async removeAttachment(reportId: string, attachmentId: string): Promise<void> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query(
        `DELETE FROM app_report_attachments WHERE report_id = $1 AND id = $2`,
        [reportId, attachmentId],
      );
      if (result.rowCount === 0) {
        throw new NotFoundException('Report attachment not found');
      }
    }, () => {
      const existing = this.memoryAttachments.get(reportId) ?? [];
      const next = existing.filter((attachment) => attachment.id !== attachmentId);
      if (next.length === existing.length) {
        throw new NotFoundException('Report attachment not found');
      }
      this.memoryAttachments.set(reportId, next);
    });
  }

  async remove(reportId: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      await this.postgresService.query(`DELETE FROM app_report_attachments WHERE report_id = $1`, [reportId]);
      await this.postgresService.query(`DELETE FROM app_report_approvals WHERE staff_report_id = $1`, [reportId]);
      const deleted = await this.postgresService.query(`DELETE FROM app_staff_reports WHERE id = $1`, [reportId]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Staff report not found');
      }
    }, () => {
      const existed = this.memoryReports.delete(reportId);
      this.memoryApprovals.delete(reportId);
      this.memoryAttachments.delete(reportId);
      if (!existed) {
        throw new NotFoundException('Staff report not found');
      }
    });
  }

  private async ensureSchema(): Promise<void> {
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
         workflow_config_id UUID,
         current_workflow_stage_index INTEGER,
         current_workflow_stage_key VARCHAR(120),
         current_workflow_approver_role VARCHAR(120),
         created_by VARCHAR(255) NOT NULL,
         created_at TIMESTAMPTZ NOT NULL,
         updated_at TIMESTAMPTZ NOT NULL
       )
     `);

    await this.postgresService.query(
      `ALTER TABLE app_staff_reports ADD COLUMN IF NOT EXISTS workflow_config_id UUID`,
    );
    await this.postgresService.query(
      `ALTER TABLE app_staff_reports ADD COLUMN IF NOT EXISTS current_workflow_stage_index INTEGER`,
    );
    await this.postgresService.query(
      `ALTER TABLE app_staff_reports ADD COLUMN IF NOT EXISTS current_workflow_stage_key VARCHAR(120)`,
    );
    await this.postgresService.query(
      `ALTER TABLE app_staff_reports ADD COLUMN IF NOT EXISTS current_workflow_approver_role VARCHAR(120)`,
    );

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

    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_staff_reports_status ON app_staff_reports(workflow_status)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_report_approvals_report_id ON app_report_approvals(staff_report_id)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_report_attachments_report_id ON app_report_attachments(report_id, created_at DESC)`,
    );

    await this.postgresService.query(
      `DELETE FROM app_staff_reports r WHERE NOT EXISTS (
         SELECT 1 FROM app_agenda_items a WHERE a.id = r.agenda_item_id
       )`,
    );
    await this.postgresService.query(
      `DELETE FROM app_report_approvals h WHERE NOT EXISTS (
         SELECT 1 FROM app_staff_reports r WHERE r.id = h.staff_report_id
       )`,
    );
    await this.postgresService.query(
      `DELETE FROM app_report_attachments a WHERE NOT EXISTS (
         SELECT 1 FROM app_staff_reports r WHERE r.id = a.report_id
       )`,
    );

    await this.postgresService.query(`
      DO $$
      BEGIN
        IF to_regclass('public.app_agenda_items') IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_staff_reports_agenda_item'
          ) THEN
          ALTER TABLE app_staff_reports
            ADD CONSTRAINT fk_app_staff_reports_agenda_item
            FOREIGN KEY (agenda_item_id) REFERENCES app_agenda_items(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_report_approvals_report'
        ) THEN
          ALTER TABLE app_report_approvals
            ADD CONSTRAINT fk_app_report_approvals_report
            FOREIGN KEY (staff_report_id) REFERENCES app_staff_reports(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_report_attachments_report'
        ) THEN
          ALTER TABLE app_report_attachments
            ADD CONSTRAINT fk_app_report_attachments_report
            FOREIGN KEY (report_id) REFERENCES app_staff_reports(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    this.schemaEnsured = true;
  }

  private async withFallback<T>(dbFn: () => Promise<T>, fallbackFn: () => Promise<T> | T): Promise<T> {
    if (!this.postgresService.isEnabled) {
      return fallbackFn();
    }

    try {
      return await dbFn();
    } catch (error) {
      if (error instanceof DatabaseUnavailableError) {
        return fallbackFn();
      }
      throw error;
    }
  }

  private createInMemory(input: CreateReportInput): StaffReportRecord {
    const now = new Date().toISOString();
    const report: StaffReportRecord = {
      id: randomUUID(),
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
      workflowConfigId: input.workflowConfigId,
      currentWorkflowStageIndex: input.currentWorkflowStageIndex ?? undefined,
      currentWorkflowStageKey: input.currentWorkflowStageKey ?? undefined,
      currentWorkflowApproverRole: input.currentWorkflowApproverRole ?? undefined,
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

  private listInMemory(query: ReportQueryDto): StaffReportRecord[] {
    return Array.from(this.memoryReports.values())
      .filter((report) => (query.agendaItemId ? report.agendaItemId === query.agendaItemId : true))
      .filter((report) => (query.status ? report.workflowStatus === query.status : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private appendApprovalInMemory(input: AppendApprovalInput): ReportApprovalEvent {
    const history = this.memoryApprovals.get(input.reportId) ?? [];
    const event: ReportApprovalEvent = {
      id: randomUUID(),
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

  private createAttachmentInMemory(input: CreateAttachmentInput): ReportAttachmentRecord {
    const attachment: ReportAttachmentRecord = {
      id: randomUUID(),
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
}

interface DbReportRow {
  id: string;
  agenda_item_id: string;
  template_id: string | null;
  report_number: string | null;
  title: string;
  department: string | null;
  executive_summary: string | null;
  recommendations: string | null;
  financial_impact: string | null;
  legal_impact: string | null;
  raw_docx_file_name: string | null;
  source_sharepoint_site_id: string | null;
  source_sharepoint_drive_id: string | null;
  source_sharepoint_item_id: string | null;
  source_sharepoint_web_url: string | null;
  parsed_content_json: Record<string, unknown>;
  parsing_version: string;
  parsing_warnings_json: string[] | null;
  workflow_status: ReportWorkflowStatus;
  workflow_config_id: string | null;
  current_workflow_stage_index: number | null;
  current_workflow_stage_key: string | null;
  current_workflow_approver_role: string | null;
  author_user_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DbApprovalRow {
  id: string;
  staff_report_id: string;
  stage: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED' | 'PUBLISHED';
  acted_by_user_id: string;
  acted_at: string;
  comments: string | null;
}

interface DbReportAttachmentRow {
  id: string;
  report_id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  source_type: 'SHAREPOINT';
  source_sharepoint_site_id: string | null;
  source_sharepoint_drive_id: string | null;
  source_sharepoint_item_id: string | null;
  source_sharepoint_web_url: string | null;
  uploaded_by: string;
  created_at: string;
}

function toReportRecord(row: DbReportRow): StaffReportRecord {
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
    workflowConfigId: row.workflow_config_id ?? undefined,
    currentWorkflowStageIndex: row.current_workflow_stage_index ?? undefined,
    currentWorkflowStageKey: row.current_workflow_stage_key ?? undefined,
    currentWorkflowApproverRole: row.current_workflow_approver_role ?? undefined,
    authorUserId: row.author_user_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toApprovalEvent(row: DbApprovalRow): ReportApprovalEvent {
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

function toAttachmentRecord(row: DbReportAttachmentRow): ReportAttachmentRecord {
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
