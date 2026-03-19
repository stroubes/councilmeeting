import { WorkflowsService } from './workflows.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ApproveReportDto } from './dto/approve-report.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { ResubmitReportDto } from './dto/resubmit-report.dto';
export declare class WorkflowsController {
    private readonly workflowsService;
    constructor(workflowsService: WorkflowsService);
    health(): {
        status: string;
    };
    directorQueue(): Promise<import("../reports/reports.service").StaffReportRecord[]>;
    caoQueue(): Promise<import("../reports/reports.service").StaffReportRecord[]>;
    reportHistory(reportId: string): Promise<import("../reports/reports.service").ReportApprovalEvent[]>;
    approveDirector(reportId: string, user: AuthenticatedUser, dto: ApproveReportDto): Promise<import("../reports/reports.service").StaffReportRecord>;
    approveCao(reportId: string, user: AuthenticatedUser, dto: ApproveReportDto): Promise<import("../reports/reports.service").StaffReportRecord>;
    rejectDirector(reportId: string, user: AuthenticatedUser, dto: RejectReportDto): Promise<import("../reports/reports.service").StaffReportRecord>;
    rejectCao(reportId: string, user: AuthenticatedUser, dto: RejectReportDto): Promise<import("../reports/reports.service").StaffReportRecord>;
    resubmit(reportId: string, user: AuthenticatedUser, dto: ResubmitReportDto): Promise<import("../reports/reports.service").StaffReportRecord>;
}
