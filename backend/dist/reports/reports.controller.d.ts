import { ReportsService } from './reports.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateStaffReportDto } from './dto/create-staff-report.dto';
import { CreateReportAttachmentDto } from './dto/create-report-attachment.dto';
import { ImportDocxReportDto } from './dto/import-docx-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { UpdateStaffReportDto } from './dto/update-staff-report.dto';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    health(): {
        status: string;
    };
    create(dto: CreateStaffReportDto, user: AuthenticatedUser): Promise<import("./reports.service").StaffReportRecord>;
    importDocx(dto: ImportDocxReportDto, user: AuthenticatedUser): Promise<import("./reports.service").StaffReportRecord>;
    list(query: ReportQueryDto): Promise<import("./reports.service").StaffReportRecord[]>;
    getById(id: string): Promise<import("./reports.service").StaffReportRecord>;
    update(id: string, dto: UpdateStaffReportDto, user: AuthenticatedUser): Promise<import("./reports.service").StaffReportRecord>;
    submitForDirector(id: string, user: AuthenticatedUser): Promise<import("./reports.service").StaffReportRecord>;
    publish(id: string, user: AuthenticatedUser): Promise<import("./reports.service").StaffReportRecord>;
    listAttachments(id: string): Promise<import("./reports.service").ReportAttachmentRecord[]>;
    addAttachment(id: string, dto: CreateReportAttachmentDto, user: AuthenticatedUser): Promise<import("./reports.service").ReportAttachmentRecord>;
    removeAttachment(id: string, attachmentId: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
}
