import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { Public } from '../core/decorators/public.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ApproveReportDto } from './dto/approve-report.dto';
import { CreateWorkflowConfigDto } from './dto/create-workflow-config.dto';
import { CreateWorkflowStageDto } from './dto/create-workflow-stage.dto';
import { ReorderWorkflowStagesDto } from './dto/reorder-workflow-stages.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { ResubmitReportDto } from './dto/resubmit-report.dto';
import { UpdateWorkflowConfigDto } from './dto/update-workflow-config.dto';
import { UpdateWorkflowStageDto } from './dto/update-workflow-stage.dto';
import { WorkflowConfigQueryDto } from './dto/workflow-config-query.dto';
import { CreateRoleDelegationDto } from './dto/create-role-delegation.dto';

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
  @Get('reports/my-queue')
  myQueue(@CurrentUser() user: AuthenticatedUser) {
    return this.workflowsService.myQueue(user);
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

  @Permissions(PERMISSIONS.MEETING_READ)
  @Post('reports/:reportId/approve-current')
  approveCurrentStage(
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApproveReportDto,
  ) {
    return this.workflowsService.approveReportByCurrentStage(reportId, user, dto);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Post('reports/:reportId/reject-current')
  rejectCurrentStage(
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectReportDto,
  ) {
    return this.workflowsService.rejectReportByCurrentStage(reportId, user, dto);
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

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Get('delegations')
  listDelegations() {
    return this.workflowsService.listRoleDelegations();
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Post('delegations')
  createDelegation(@Body() dto: CreateRoleDelegationDto) {
    return this.workflowsService.createRoleDelegation(dto);
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Delete('delegations/:id')
  removeDelegation(@Param('id') id: string) {
    return this.workflowsService.removeRoleDelegation(id);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('configurations')
  listConfigurations(@Query() query: WorkflowConfigQueryDto) {
    return this.workflowsService.listWorkflowConfigurations(query);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('configurations/:id')
  getConfiguration(@Param('id') id: string) {
    return this.workflowsService.getWorkflowConfiguration(id);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Post('configurations')
  createConfiguration(@Body() dto: CreateWorkflowConfigDto, @CurrentUser() user: AuthenticatedUser) {
    return this.workflowsService.createWorkflowConfiguration(dto, user);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Patch('configurations/:id')
  updateConfiguration(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowConfigDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflowsService.updateWorkflowConfiguration(id, dto, user);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Delete('configurations/:id')
  removeConfiguration(@Param('id') id: string) {
    return this.workflowsService.removeWorkflowConfiguration(id);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Post('configurations/:id/clone')
  cloneConfiguration(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.workflowsService.cloneWorkflowConfiguration(id, user);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Post('configurations/:workflowId/stages')
  addConfigurationStage(
    @Param('workflowId') workflowId: string,
    @Body() dto: CreateWorkflowStageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflowsService.addWorkflowStage(workflowId, dto, user);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Patch('configurations/:workflowId/stages/:stageId')
  updateConfigurationStage(
    @Param('workflowId') workflowId: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateWorkflowStageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflowsService.updateWorkflowStage(workflowId, stageId, dto, user);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Delete('configurations/:workflowId/stages/:stageId')
  removeConfigurationStage(@Param('workflowId') workflowId: string, @Param('stageId') stageId: string) {
    return this.workflowsService.removeWorkflowStage(workflowId, stageId);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Post('configurations/:workflowId/stages/reorder')
  reorderConfigurationStages(
    @Param('workflowId') workflowId: string,
    @Body() dto: ReorderWorkflowStagesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflowsService.reorderWorkflowStages(workflowId, dto, user);
  }
}
