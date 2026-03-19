import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
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
export type ReportWorkflowStatus = 'DRAFT' | 'PENDING_DIRECTOR_APPROVAL' | 'PENDING_CAO_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
export interface ReportApprovalEvent {
    id: string;
    staffReportId: string;
    stage: 'DIRECTOR' | 'CAO' | 'SYSTEM';
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
export declare class ReportsService {
    private readonly docxParserService;
    private readonly sharePointDocxService;
    private readonly agendasService;
    private readonly reportsRepository;
    private readonly auditService;
    private readonly templatesService;
    private readonly notificationsService;
    private readonly governanceService;
    constructor(docxParserService: DocxParserService, sharePointDocxService: SharePointDocxService, agendasService: AgendasService, reportsRepository: ReportsRepository, auditService: AuditService, templatesService: TemplatesService, notificationsService: NotificationsService, governanceService: GovernanceService);
    health(): {
        status: string;
    };
    create(dto: CreateStaffReportDto, user: AuthenticatedUser): Promise<StaffReportRecord>;
    importDocx(dto: ImportDocxReportDto, user: AuthenticatedUser): Promise<StaffReportRecord>;
    list(query: ReportQueryDto): Promise<StaffReportRecord[]>;
    getById(id: string): Promise<StaffReportRecord>;
    update(id: string, dto: UpdateStaffReportDto, user: AuthenticatedUser): Promise<StaffReportRecord>;
    submitForDirector(id: string, user: AuthenticatedUser, comments?: string): Promise<StaffReportRecord>;
    approveDirector(id: string, user: AuthenticatedUser, comments?: string): Promise<StaffReportRecord>;
    approveCao(id: string, user: AuthenticatedUser, comments?: string): Promise<StaffReportRecord>;
    reject(id: string, user: AuthenticatedUser, stage: 'DIRECTOR' | 'CAO', comments: string): Promise<StaffReportRecord>;
    resubmit(id: string, user: AuthenticatedUser, comments?: string): Promise<StaffReportRecord>;
    publish(id: string, user: AuthenticatedUser): Promise<StaffReportRecord>;
    addAttachment(reportId: string, dto: CreateReportAttachmentDto, user: AuthenticatedUser): Promise<ReportAttachmentRecord>;
    listAttachments(reportId: string): Promise<ReportAttachmentRecord[]>;
    removeAttachment(reportId: string, attachmentId: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
    listPendingDirector(): Promise<StaffReportRecord[]>;
    listPendingCao(): Promise<StaffReportRecord[]>;
    getApprovalHistory(reportId: string): Promise<ReportApprovalEvent[]>;
    private ensureStatus;
    private ensureApproverRole;
    private ensureAgendaItemExists;
    private ensureTemplateType;
    private getSubmissionIssues;
    private emitNotification;
}
