import { PostgresService } from '../database/postgres.service';
import type { ReportQueryDto } from './dto/report-query.dto';
import type { ReportAttachmentRecord, ReportApprovalEvent, ReportWorkflowStatus, StaffReportRecord } from './reports.service';
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
    authorUserId: string;
    createdBy: string;
}
interface AppendApprovalInput {
    reportId: string;
    stage: 'DIRECTOR' | 'CAO' | 'SYSTEM';
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
export declare class ReportsRepository {
    private readonly postgresService;
    private readonly memoryReports;
    private readonly memoryApprovals;
    private readonly memoryAttachments;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    create(input: CreateReportInput): Promise<StaffReportRecord>;
    list(query: ReportQueryDto): Promise<StaffReportRecord[]>;
    getById(id: string): Promise<StaffReportRecord>;
    update(id: string, patch: Partial<Pick<StaffReportRecord, 'title' | 'templateId' | 'department' | 'executiveSummary' | 'recommendations' | 'financialImpact' | 'legalImpact'>>): Promise<StaffReportRecord>;
    updateWorkflowStatus(id: string, workflowStatus: ReportWorkflowStatus): Promise<StaffReportRecord>;
    listPendingDirector(): Promise<StaffReportRecord[]>;
    listPendingCao(): Promise<StaffReportRecord[]>;
    appendApproval(input: AppendApprovalInput): Promise<ReportApprovalEvent>;
    getApprovalHistory(reportId: string): Promise<ReportApprovalEvent[]>;
    createAttachment(input: CreateAttachmentInput): Promise<ReportAttachmentRecord>;
    listAttachments(reportId: string): Promise<ReportAttachmentRecord[]>;
    removeAttachment(reportId: string, attachmentId: string): Promise<void>;
    remove(reportId: string): Promise<void>;
    private ensureSchema;
    private withFallback;
    private createInMemory;
    private listInMemory;
    private appendApprovalInMemory;
    private createAttachmentInMemory;
}
export {};
