import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import type { ReportQueryDto } from './dto/report-query.dto';
import { normalizePagination, toPaginatedResult, type PaginatedResult } from '../types/pagination';
import type { ReportApprovalEvent, StaffReportRecord } from './reports.service';

@Injectable()
export class ReportsQueryService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  list(query: ReportQueryDto): Promise<StaffReportRecord[]> {
    return this.reportsRepository.list(query);
  }

  async listPaged(
    query: ReportQueryDto & { page?: number; limit?: number },
  ): Promise<PaginatedResult<StaffReportRecord>> {
    const allReports = await this.reportsRepository.list(query);
    const pagination = normalizePagination(query.page, query.limit);
    return toPaginatedResult(
      allReports.slice(pagination.offset, pagination.offset + pagination.limit),
      allReports.length,
      pagination.page,
      pagination.limit,
    );
  }

  getById(id: string): Promise<StaffReportRecord> {
    return this.reportsRepository.getById(id);
  }

  listPendingDirector(): Promise<StaffReportRecord[]> {
    return this.reportsRepository.listPendingDirector();
  }

  listPendingCao(): Promise<StaffReportRecord[]> {
    return this.reportsRepository.listPendingCao();
  }

  getApprovalHistory(reportId: string): Promise<ReportApprovalEvent[]> {
    return this.reportsRepository.getApprovalHistory(reportId);
  }
}
