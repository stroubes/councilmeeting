import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SYSTEM_ROLES } from '../core/constants/roles.constants';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { AgendasService } from '../agendas/agendas.service';
import type { CreateStaffReportDto } from './dto/create-staff-report.dto';
import type { CreateReportAttachmentDto } from './dto/create-report-attachment.dto';
import type { ImportDocxReportDto } from './dto/import-docx-report.dto';
import type { ReportQueryDto } from './dto/report-query.dto';
import type { UpdateStaffReportDto } from './dto/update-staff-report.dto';
import { DocxParserService } from './parsers/docx-parser.service';
import { SharePointDocxService } from './parsers/sharepoint-docx.service';
import { ReportsRepository } from './reports.repository';
import { AuditService } from '../audit/audit.service';
import { TemplatesService } from '../templates/templates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GovernanceService } from '../governance/governance.service';
import { WorkflowConfigRepository, type WorkflowRecord } from '../workflows/workflow-config.repository';

export type ReportWorkflowStatus =
  | 'DRAFT'
  | 'PENDING_DIRECTOR_APPROVAL'
  | 'PENDING_CAO_APPROVAL'
  | 'PENDING_WORKFLOW_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED';

export interface ReportApprovalEvent {
  id: string;
  staffReportId: string;
  stage: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED' | 'PUBLISHED';
  actedByUserId: string;
  actedAt: string;
  comments?: string;
}

export interface StaffReportRecord {
  id: string;
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
  currentWorkflowStageIndex?: number;
  currentWorkflowStageKey?: string;
  currentWorkflowApproverRole?: string;
  authorUserId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportAttachmentRecord {
  id: string;
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
  createdAt: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly docxParserService: DocxParserService,
    private readonly sharePointDocxService: SharePointDocxService,
    private readonly agendasService: AgendasService,
    private readonly reportsRepository: ReportsRepository,
    private readonly auditService: AuditService,
    private readonly templatesService: TemplatesService,
    private readonly notificationsService: NotificationsService,
    private readonly governanceService: GovernanceService,
    private readonly workflowConfigRepository: WorkflowConfigRepository,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  async create(dto: CreateStaffReportDto, user: AuthenticatedUser): Promise<StaffReportRecord> {
    await this.ensureAgendaItemExists(dto.agendaItemId);
    const template = dto.templateId ? await this.ensureTemplateType(dto.templateId, 'STAFF_REPORT') : null;

    const defaultSections = template
      ? template.sections
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((section) => ({
            key: section.sectionType ?? section.title,
            title: section.title,
            content: '',
            required: section.isRequired,
          }))
      : [];

    const executiveSummary =
      dto.executiveSummary ??
      (defaultSections.length > 0 ? `Prepared using template: ${template?.name ?? ''}`.trim() : undefined);

    const selectedWorkflow = await this.resolveWorkflowConfiguration(dto.workflowConfigId);

    const created = await this.reportsRepository.create({
      agendaItemId: dto.agendaItemId,
      templateId: dto.templateId,
      reportNumber: dto.reportNumber,
      title: dto.title,
      department: dto.department,
      executiveSummary,
      recommendations: dto.recommendations,
      financialImpact: dto.financialImpact,
      legalImpact: dto.legalImpact,
      parsedContentJson: {
        title: dto.title,
        templateId: dto.templateId,
        executiveSummary,
        recommendations: dto.recommendations,
        sections: defaultSections,
      },
      parsingVersion: '1.0-manual',
      parsingWarnings: [],
      workflowStatus: 'DRAFT',
      workflowConfigId: selectedWorkflow?.id,
      currentWorkflowStageIndex: null,
      currentWorkflowStageKey: null,
      currentWorkflowApproverRole: null,
      authorUserId: user.id,
      createdBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.create',
      entityType: 'report',
      entityId: created.id,
    });

    return created;
  }

  async importDocx(dto: ImportDocxReportDto, user: AuthenticatedUser): Promise<StaffReportRecord> {
    await this.ensureAgendaItemExists(dto.agendaItemId);
    const contentBase64 = await this.sharePointDocxService.resolveBase64({
      contentBase64: dto.contentBase64,
      sharePointDriveId: dto.sharePointDriveId,
      sharePointItemId: dto.sharePointItemId,
    });

    if (!contentBase64) {
      throw new BadRequestException(
        'Provide contentBase64 or SharePoint drive/item identifiers for DOCX import.',
      );
    }

    const parsed = await this.docxParserService.parseFromBase64(dto.fileName, contentBase64);
    const selectedWorkflow = await this.resolveWorkflowConfiguration(dto.workflowConfigId);

    const created = await this.reportsRepository.create({
      agendaItemId: dto.agendaItemId,
      title: parsed.title,
      rawDocxFileName: dto.fileName,
      sourceSharePointSiteId: dto.sharePointSiteId,
      sourceSharePointDriveId: dto.sharePointDriveId,
      sourceSharePointItemId: dto.sharePointItemId,
      sourceSharePointWebUrl: dto.sharePointWebUrl,
      executiveSummary: parsed.executiveSummary,
      recommendations: parsed.recommendations,
      parsedContentJson: {
        title: parsed.title,
        sections: parsed.sections,
        rawText: parsed.rawText,
      },
      parsingVersion: '2.0-docx-openxml',
      parsingWarnings: parsed.warnings,
      workflowStatus: 'DRAFT',
      workflowConfigId: selectedWorkflow?.id,
      currentWorkflowStageIndex: null,
      currentWorkflowStageKey: null,
      currentWorkflowApproverRole: null,
      authorUserId: user.id,
      createdBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.import_docx',
      entityType: 'report',
      entityId: created.id,
    });

    return created;
  }

  list(query: ReportQueryDto): Promise<StaffReportRecord[]> {
    return this.reportsRepository.list(query);
  }

  getById(id: string): Promise<StaffReportRecord> {
    return this.reportsRepository.getById(id);
  }

  async update(id: string, dto: UpdateStaffReportDto, user: AuthenticatedUser): Promise<StaffReportRecord> {
    const report = await this.reportsRepository.getById(id);
    if (report.workflowStatus === 'PUBLISHED') {
      throw new BadRequestException('Published report cannot be edited');
    }

    if (dto.templateId) {
      await this.ensureTemplateType(dto.templateId, 'STAFF_REPORT');
    }

    let workflowConfigId: string | undefined;
    if (dto.workflowConfigId !== undefined) {
      const selectedWorkflow = await this.resolveWorkflowConfiguration(dto.workflowConfigId);
      workflowConfigId = selectedWorkflow?.id;
    }

    const updated = await this.reportsRepository.update(id, {
      templateId: dto.templateId,
      workflowConfigId,
      title: dto.title,
      department: dto.department,
      executiveSummary: dto.executiveSummary,
      recommendations: dto.recommendations,
      financialImpact: dto.financialImpact,
      legalImpact: dto.legalImpact,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.update',
      entityType: 'report',
      entityId: updated.id,
    });

    return updated;
  }

  async submitForDirector(
    id: string,
    user: AuthenticatedUser,
    comments?: string,
  ): Promise<StaffReportRecord> {
    const report = await this.reportsRepository.getById(id);
    const previousStatus = report.workflowStatus;
    this.ensureStatus(report.workflowStatus, ['DRAFT', 'REJECTED']);

    const readinessIssues = await this.getSubmissionIssues(report);
    if (readinessIssues.length > 0) {
      const profile = await this.governanceService.getActiveProfile();
      throw new BadRequestException({
        message: 'Staff report is not ready for submission.',
        profile: profile.id,
        issues: readinessIssues,
      });
    }

    const workflow = await this.resolveWorkflowForReport(report);
    const firstStage = this.getStageByOrder(workflow, 1);
    if (!firstStage) {
      throw new BadRequestException('No active report workflow stages are configured.');
    }

    const updated = await this.reportsRepository.transitionWorkflow({
      reportId: id,
      expectedUpdatedAt: report.updatedAt,
      patch: {
        workflowStatus: this.toPendingStatus(firstStage.approverRole),
        currentWorkflowStageIndex: 1,
        currentWorkflowStageKey: firstStage.key,
        currentWorkflowApproverRole: firstStage.approverRole,
        workflowConfigId: workflow.id,
      },
      approval: {
        stage: firstStage.key,
        action: previousStatus === 'REJECTED' ? 'RESUBMITTED' : 'SUBMITTED',
        actedByUserId: user.id,
        comments,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.submit',
      entityType: 'report',
      entityId: id,
    });
    await this.emitNotification({
      eventType: previousStatus === 'REJECTED' ? 'REPORT_RESUBMITTED' : 'REPORT_SUBMITTED',
      entityType: 'report',
      entityId: id,
      actorUserId: user.id,
      payloadJson: { status: updated.workflowStatus, stage: firstStage.key },
    });

    return updated;
  }

  async approveDirector(id: string, user: AuthenticatedUser, comments?: string): Promise<StaffReportRecord> {
    this.ensureApproverRole(user, [SYSTEM_ROLES.DIRECTOR, SYSTEM_ROLES.ADMIN]);
    const report = await this.reportsRepository.getById(id);
    this.ensureStatus(report.workflowStatus, ['PENDING_DIRECTOR_APPROVAL']);

    const updated = await this.reportsRepository.transitionWorkflow({
      reportId: id,
      expectedUpdatedAt: report.updatedAt,
      patch: {
        workflowStatus: 'PENDING_CAO_APPROVAL',
      },
      approval: {
        stage: 'DIRECTOR',
        action: 'APPROVED',
        actedByUserId: user.id,
        comments,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.approve_director',
      entityType: 'report',
      entityId: id,
    });
    await this.emitNotification({
      eventType: 'REPORT_APPROVED_DIRECTOR',
      entityType: 'report',
      entityId: id,
      actorUserId: user.id,
      payloadJson: { status: 'PENDING_CAO_APPROVAL' },
    });

    return updated;
  }

  async approveAtCurrentStage(
    id: string,
    user: AuthenticatedUser,
    input: {
      expectedRole: string;
      stage: string;
      nextStatus: ReportWorkflowStatus;
      comments?: string;
      notificationEventType?: string;
    },
  ): Promise<StaffReportRecord> {
    this.ensureApproverRole(user, [input.expectedRole.toUpperCase(), SYSTEM_ROLES.ADMIN]);
    const report = await this.reportsRepository.getById(id);
    this.ensureStatus(report.workflowStatus, [
      'PENDING_DIRECTOR_APPROVAL',
      'PENDING_CAO_APPROVAL',
      'PENDING_WORKFLOW_APPROVAL',
    ]);

    const nextStageIndex = input.nextStatus === 'APPROVED' ? null : (report.currentWorkflowStageIndex ?? 0) + 1;
    const nextStage = nextStageIndex ? this.getStageByOrder(await this.resolveWorkflowForReport(report), nextStageIndex) : null;

    const updated = await this.reportsRepository.transitionWorkflow({
      reportId: id,
      expectedUpdatedAt: report.updatedAt,
      patch: {
        workflowStatus: input.nextStatus,
        currentWorkflowStageIndex: nextStageIndex,
        currentWorkflowStageKey: nextStage?.key,
        currentWorkflowApproverRole: nextStage?.approverRole,
      },
      approval: {
        stage: input.stage,
        action: 'APPROVED',
        actedByUserId: user.id,
        comments: input.comments,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.approve_stage',
      entityType: 'report',
      entityId: id,
      changesJson: {
        stage: input.stage,
        role: input.expectedRole,
        nextStatus: input.nextStatus,
      },
    });

    if (input.notificationEventType) {
      await this.emitNotification({
        eventType: input.notificationEventType,
        entityType: 'report',
        entityId: id,
        actorUserId: user.id,
        payloadJson: { status: input.nextStatus, stage: input.stage },
      });
    }

    return updated;
  }

  async approveCao(id: string, user: AuthenticatedUser, comments?: string): Promise<StaffReportRecord> {
    this.ensureApproverRole(user, [SYSTEM_ROLES.CAO, SYSTEM_ROLES.ADMIN]);
    const report = await this.reportsRepository.getById(id);
    this.ensureStatus(report.workflowStatus, ['PENDING_CAO_APPROVAL']);

    const updated = await this.reportsRepository.transitionWorkflow({
      reportId: id,
      expectedUpdatedAt: report.updatedAt,
      patch: {
        workflowStatus: 'APPROVED',
      },
      approval: {
        stage: 'CAO',
        action: 'APPROVED',
        actedByUserId: user.id,
        comments,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.approve_cao',
      entityType: 'report',
      entityId: id,
    });
    await this.emitNotification({
      eventType: 'REPORT_APPROVED_CAO',
      entityType: 'report',
      entityId: id,
      actorUserId: user.id,
      payloadJson: { status: 'APPROVED' },
    });

    return updated;
  }

  async reject(
    id: string,
    user: AuthenticatedUser,
    stage: 'DIRECTOR' | 'CAO',
    comments: string,
  ): Promise<StaffReportRecord> {
    this.ensureApproverRole(user, [SYSTEM_ROLES.DIRECTOR, SYSTEM_ROLES.CAO, SYSTEM_ROLES.ADMIN]);
    const report = await this.reportsRepository.getById(id);
    this.ensureStatus(report.workflowStatus, ['PENDING_DIRECTOR_APPROVAL', 'PENDING_CAO_APPROVAL']);

    const updated = await this.reportsRepository.transitionWorkflow({
      reportId: id,
      expectedUpdatedAt: report.updatedAt,
      patch: {
        workflowStatus: 'REJECTED',
        currentWorkflowStageIndex: null,
        currentWorkflowStageKey: null,
        currentWorkflowApproverRole: null,
      },
      approval: {
        stage,
        action: 'REJECTED',
        actedByUserId: user.id,
        comments,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: `report.reject_${stage.toLowerCase()}`,
      entityType: 'report',
      entityId: id,
      changesJson: { comments },
    });
    await this.emitNotification({
      eventType: `REPORT_REJECTED_${stage}`,
      entityType: 'report',
      entityId: id,
      actorUserId: user.id,
      payloadJson: { status: 'REJECTED', stage, comments },
    });

    return updated;
  }

  async rejectAtCurrentStage(
    id: string,
    user: AuthenticatedUser,
    input: {
      expectedRole: string;
      stage: string;
      comments: string;
      notificationEventType?: string;
    },
  ): Promise<StaffReportRecord> {
    this.ensureApproverRole(user, [input.expectedRole.toUpperCase(), SYSTEM_ROLES.ADMIN]);
    const report = await this.reportsRepository.getById(id);
    this.ensureStatus(report.workflowStatus, [
      'PENDING_DIRECTOR_APPROVAL',
      'PENDING_CAO_APPROVAL',
      'PENDING_WORKFLOW_APPROVAL',
    ]);

    const updated = await this.reportsRepository.transitionWorkflow({
      reportId: id,
      expectedUpdatedAt: report.updatedAt,
      patch: {
        workflowStatus: 'REJECTED',
      },
      approval: {
        stage: input.stage,
        action: 'REJECTED',
        actedByUserId: user.id,
        comments: input.comments,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.reject_stage',
      entityType: 'report',
      entityId: id,
      changesJson: {
        stage: input.stage,
        role: input.expectedRole,
        comments: input.comments,
      },
    });

    if (input.notificationEventType) {
      await this.emitNotification({
        eventType: input.notificationEventType,
        entityType: 'report',
        entityId: id,
        actorUserId: user.id,
        payloadJson: { status: 'REJECTED', stage: input.stage, comments: input.comments },
      });
    }

    return updated;
  }

  async resubmit(id: string, user: AuthenticatedUser, comments?: string): Promise<StaffReportRecord> {
    const report = await this.reportsRepository.getById(id);
    this.ensureStatus(report.workflowStatus, ['REJECTED']);

    const readinessIssues = await this.getSubmissionIssues(report);
    if (readinessIssues.length > 0) {
      const profile = await this.governanceService.getActiveProfile();
      throw new BadRequestException({
        message: 'Staff report is not ready for resubmission.',
        profile: profile.id,
        issues: readinessIssues,
      });
    }

    const workflow = await this.resolveWorkflowForReport(report);
    const firstStage = this.getStageByOrder(workflow, 1);
    if (!firstStage) {
      throw new BadRequestException('No active report workflow stages are configured.');
    }

    const updated = await this.reportsRepository.transitionWorkflow({
      reportId: id,
      expectedUpdatedAt: report.updatedAt,
      patch: {
        workflowStatus: this.toPendingStatus(firstStage.approverRole),
        currentWorkflowStageIndex: 1,
        currentWorkflowStageKey: firstStage.key,
        currentWorkflowApproverRole: firstStage.approverRole,
        workflowConfigId: workflow.id,
      },
      approval: {
        stage: firstStage.key,
        action: 'RESUBMITTED',
        actedByUserId: user.id,
        comments,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.resubmit',
      entityType: 'report',
      entityId: id,
    });
    await this.emitNotification({
      eventType: 'REPORT_RESUBMITTED',
      entityType: 'report',
      entityId: id,
      actorUserId: user.id,
      payloadJson: { status: updated.workflowStatus, stage: firstStage.key },
    });

    return updated;
  }

  async publish(id: string, user: AuthenticatedUser): Promise<StaffReportRecord> {
    if (!user.permissions.includes(PERMISSIONS.PUBLIC_PUBLISH) && !user.roles.includes(SYSTEM_ROLES.ADMIN)) {
      throw new ForbiddenException('Publish permission is required');
    }

    const report = await this.reportsRepository.getById(id);
    this.ensureStatus(report.workflowStatus, ['APPROVED']);

    const updated = await this.reportsRepository.transitionWorkflow({
      reportId: id,
      expectedUpdatedAt: report.updatedAt,
      patch: {
        workflowStatus: 'PUBLISHED',
        currentWorkflowStageIndex: null,
        currentWorkflowStageKey: null,
        currentWorkflowApproverRole: null,
      },
      approval: {
        stage: 'SYSTEM',
        action: 'PUBLISHED',
        actedByUserId: user.id,
        comments: 'Published to public portal.',
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.publish',
      entityType: 'report',
      entityId: id,
    });
    await this.emitNotification({
      eventType: 'REPORT_PUBLISHED',
      entityType: 'report',
      entityId: id,
      actorUserId: user.id,
      payloadJson: { status: 'PUBLISHED' },
    });

    return updated;
  }

  async addAttachment(
    reportId: string,
    dto: CreateReportAttachmentDto,
    user: AuthenticatedUser,
  ): Promise<ReportAttachmentRecord> {
    await this.reportsRepository.getById(reportId);

    let sharePointItemId = dto.sharePointItemId;
    let sharePointWebUrl = dto.sharePointWebUrl;
    let sizeBytes = dto.sizeBytes;

    if (dto.contentBase64?.trim()) {
      if (!dto.sharePointDriveId) {
        throw new BadRequestException('sharePointDriveId is required when uploading a file attachment.');
      }
      const uploaded = await this.sharePointDocxService.uploadBase64File({
        sharePointDriveId: dto.sharePointDriveId,
        fileName: dto.fileName,
        contentBase64: dto.contentBase64,
        mimeType: dto.mimeType,
      });
      sharePointItemId = uploaded.itemId;
      sharePointWebUrl = uploaded.webUrl ?? sharePointWebUrl;
      sizeBytes = uploaded.sizeBytes ?? sizeBytes;
    } else if (!dto.sharePointDriveId || !dto.sharePointItemId) {
      throw new BadRequestException(
        'Provide contentBase64 with sharePointDriveId, or provide existing sharePointDriveId and sharePointItemId.',
      );
    }

    const created = await this.reportsRepository.createAttachment({
      reportId,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes,
      sourceType: 'SHAREPOINT',
      sourceSharePointSiteId: dto.sharePointSiteId,
      sourceSharePointDriveId: dto.sharePointDriveId,
      sourceSharePointItemId: sharePointItemId,
      sourceSharePointWebUrl: sharePointWebUrl,
      uploadedBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.attachment.add',
      entityType: 'report',
      entityId: reportId,
      changesJson: { attachmentId: created.id },
    });

    return created;
  }

  async listAttachments(reportId: string): Promise<ReportAttachmentRecord[]> {
    await this.reportsRepository.getById(reportId);
    return this.reportsRepository.listAttachments(reportId);
  }

  async removeAttachment(reportId: string, attachmentId: string, user: AuthenticatedUser): Promise<{ ok: true }> {
    await this.reportsRepository.getById(reportId);
    await this.reportsRepository.removeAttachment(reportId, attachmentId);
    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.attachment.remove',
      entityType: 'report',
      entityId: reportId,
      changesJson: { attachmentId },
    });
    return { ok: true };
  }

  async remove(id: string, user: AuthenticatedUser): Promise<{ ok: true }> {
    await this.reportsRepository.remove(id);
    await this.auditService.log({
      actorUserId: user.id,
      action: 'report.delete',
      entityType: 'report',
      entityId: id,
    });
    return { ok: true };
  }

  listPendingDirector(): Promise<StaffReportRecord[]> {
    return this.reportsRepository.listPendingDirector();
  }

  listPendingCao(): Promise<StaffReportRecord[]> {
    return this.reportsRepository.listPendingCao();
  }

  listPendingWorkflow(): Promise<StaffReportRecord[]> {
    return this.reportsRepository.listPendingWorkflow();
  }

  async getApprovalHistory(reportId: string): Promise<ReportApprovalEvent[]> {
    await this.reportsRepository.getById(reportId);
    return this.reportsRepository.getApprovalHistory(reportId);
  }

  private ensureStatus(current: ReportWorkflowStatus, allowed: ReportWorkflowStatus[]): void {
    if (!allowed.includes(current)) {
      throw new BadRequestException(
        `Invalid report workflow transition from ${current}. Allowed: ${allowed.join(', ')}`,
      );
    }
  }

  private ensureApproverRole(user: AuthenticatedUser, allowedRoles: string[]): void {
    if (!allowedRoles.some((role) => user.roles.includes(role))) {
      throw new ForbiddenException('Approver role is required');
    }
  }

  private async ensureAgendaItemExists(agendaItemId: string): Promise<void> {
    const exists = await this.agendasService.hasAgendaItem(agendaItemId);
    if (!exists) {
      throw new BadRequestException('Agenda item does not exist for this report');
    }
  }

  private async ensureTemplateType(templateId: string, expectedType: 'AGENDA' | 'STAFF_REPORT') {
    const template = await this.templatesService.getById(templateId);
    if (template.type !== expectedType) {
      throw new BadRequestException(`Template ${templateId} must be of type ${expectedType}`);
    }
    return template;
  }

  private async getSubmissionIssues(report: StaffReportRecord): Promise<string[]> {
    const issues: string[] = [];

    if (report.title.trim().length < 5) {
      issues.push('Title must be at least 5 characters.');
    }

    if (!report.executiveSummary?.trim()) {
      issues.push('Executive summary is required before submission.');
    }

    if (!report.recommendations?.trim()) {
      issues.push('Recommendation is required before submission.');
    }

    if (!report.templateId) {
      return issues;
    }

    const template = await this.templatesService.getById(report.templateId);
    if (template.type !== 'STAFF_REPORT') {
      issues.push('Selected template must be a staff report template.');
      return issues;
    }

    const requiresFinancialSection = template.sections.some((section) => {
      const key = `${section.sectionType ?? ''} ${section.title}`.toLowerCase();
      return section.isRequired && key.includes('financial');
    });

    if (requiresFinancialSection && !report.financialImpact?.trim()) {
      issues.push('Financial implications are required by the selected template.');
    }

    return issues;
  }

  private async emitNotification(input: {
    eventType: string;
    entityType: string;
    entityId: string;
    actorUserId?: string;
    payloadJson?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.notificationsService.emit(input);
    } catch {
      // notification failures should never block workflow transitions
    }
  }

  private async resolveWorkflowConfiguration(workflowConfigId?: string): Promise<WorkflowRecord | null> {
    if (workflowConfigId) {
      return this.workflowConfigRepository.getById(workflowConfigId);
    }
    const workflows = await this.workflowConfigRepository.list({ domain: 'REPORT', includeInactive: false });
    return workflows.find((workflow) => workflow.isDefault) ?? null;
  }

  private async resolveWorkflowForReport(report: StaffReportRecord): Promise<WorkflowRecord> {
    const workflow = await this.resolveWorkflowConfiguration(report.workflowConfigId);
    if (!workflow) {
      throw new BadRequestException('No active default report workflow is configured.');
    }
    return workflow;
  }

  private getStageByOrder(workflow: WorkflowRecord, index: number) {
    const ordered = [...workflow.stages].sort((left, right) => left.sortOrder - right.sortOrder);
    return ordered[index - 1] ?? null;
  }

  private toPendingStatus(approverRole: string): ReportWorkflowStatus {
    const normalizedRole = approverRole.trim().toUpperCase();
    if (!normalizedRole) {
      throw new BadRequestException('Workflow stage approver role is required');
    }
    return 'PENDING_WORKFLOW_APPROVAL';
  }
}
