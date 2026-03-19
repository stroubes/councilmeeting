import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ReportsService } from '../reports/reports.service';
import type { ApproveReportDto } from './dto/approve-report.dto';
import type { RejectReportDto } from './dto/reject-report.dto';
import type { ResubmitReportDto } from './dto/resubmit-report.dto';
export declare class WorkflowsService {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    health(): {
        status: string;
    };
    directorQueue(): Promise<import("../reports/reports.service").StaffReportRecord[]>;
    caoQueue(): Promise<import("../reports/reports.service").StaffReportRecord[]>;
    reportHistory(reportId: string): Promise<import("../reports/reports.service").ReportApprovalEvent[]>;
    approveReportByDirector(reportId: string, user: AuthenticatedUser, dto: ApproveReportDto): Promise<import("../reports/reports.service").StaffReportRecord>;
    approveReportByCao(reportId: string, user: AuthenticatedUser, dto: ApproveReportDto): Promise<import("../reports/reports.service").StaffReportRecord>;
    rejectReportByDirector(reportId: string, user: AuthenticatedUser, dto: RejectReportDto): Promise<import("../reports/reports.service").StaffReportRecord>;
    rejectReportByCao(reportId: string, user: AuthenticatedUser, dto: RejectReportDto): Promise<import("../reports/reports.service").StaffReportRecord>;
    resubmitReport(reportId: string, user: AuthenticatedUser, dto: ResubmitReportDto): Promise<import("../reports/reports.service").StaffReportRecord>;
}
