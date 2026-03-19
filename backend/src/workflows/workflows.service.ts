import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ReportsService } from '../reports/reports.service';
import type { ApproveReportDto } from './dto/approve-report.dto';
import type { RejectReportDto } from './dto/reject-report.dto';
import type { ResubmitReportDto } from './dto/resubmit-report.dto';

@Injectable()
export class WorkflowsService {
  constructor(private readonly reportsService: ReportsService) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  directorQueue() {
    return this.reportsService.listPendingDirector();
  }

  caoQueue() {
    return this.reportsService.listPendingCao();
  }

  reportHistory(reportId: string) {
    return this.reportsService.getApprovalHistory(reportId);
  }

  approveReportByDirector(reportId: string, user: AuthenticatedUser, dto: ApproveReportDto) {
    return this.reportsService.approveDirector(reportId, user, dto.comments);
  }

  approveReportByCao(reportId: string, user: AuthenticatedUser, dto: ApproveReportDto) {
    return this.reportsService.approveCao(reportId, user, dto.comments);
  }

  rejectReportByDirector(reportId: string, user: AuthenticatedUser, dto: RejectReportDto) {
    return this.reportsService.reject(reportId, user, 'DIRECTOR', dto.comments);
  }

  rejectReportByCao(reportId: string, user: AuthenticatedUser, dto: RejectReportDto) {
    return this.reportsService.reject(reportId, user, 'CAO', dto.comments);
  }

  resubmitReport(reportId: string, user: AuthenticatedUser, dto: ResubmitReportDto) {
    return this.reportsService.resubmit(reportId, user, dto.comments);
  }
}
