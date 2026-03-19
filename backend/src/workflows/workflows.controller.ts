import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { Public } from '../core/decorators/public.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ApproveReportDto } from './dto/approve-report.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { ResubmitReportDto } from './dto/resubmit-report.dto';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.workflowsService.health();
  }

  @Permissions(PERMISSIONS.REPORT_APPROVE_DIRECTOR)
  @Get('reports/director-queue')
  directorQueue() {
    return this.workflowsService.directorQueue();
  }

  @Permissions(PERMISSIONS.REPORT_APPROVE_CAO)
  @Get('reports/cao-queue')
  caoQueue() {
    return this.workflowsService.caoQueue();
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('reports/:reportId/history')
  reportHistory(@Param('reportId') reportId: string) {
    return this.workflowsService.reportHistory(reportId);
  }

  @Permissions(PERMISSIONS.REPORT_APPROVE_DIRECTOR)
  @Post('reports/:reportId/approve-director')
  approveDirector(
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApproveReportDto,
  ) {
    return this.workflowsService.approveReportByDirector(reportId, user, dto);
  }

  @Permissions(PERMISSIONS.REPORT_APPROVE_CAO)
  @Post('reports/:reportId/approve-cao')
  approveCao(
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApproveReportDto,
  ) {
    return this.workflowsService.approveReportByCao(reportId, user, dto);
  }

  @Permissions(PERMISSIONS.REPORT_APPROVE_DIRECTOR)
  @Post('reports/:reportId/reject-director')
  rejectDirector(
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectReportDto,
  ) {
    return this.workflowsService.rejectReportByDirector(reportId, user, dto);
  }

  @Permissions(PERMISSIONS.REPORT_APPROVE_CAO)
  @Post('reports/:reportId/reject-cao')
  rejectCao(
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectReportDto,
  ) {
    return this.workflowsService.rejectReportByCao(reportId, user, dto);
  }

  @Permissions(PERMISSIONS.REPORT_SUBMIT)
  @Post('reports/:reportId/resubmit')
  resubmit(
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ResubmitReportDto,
  ) {
    return this.workflowsService.resubmitReport(reportId, user, dto);
  }
}
