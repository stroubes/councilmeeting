import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ReportsService, type ReportWorkflowStatus, type StaffReportRecord } from '../reports/reports.service';
import type { ApproveReportDto } from './dto/approve-report.dto';
import type { CreateWorkflowConfigDto } from './dto/create-workflow-config.dto';
import type { CreateWorkflowStageDto } from './dto/create-workflow-stage.dto';
import type { ReorderWorkflowStagesDto } from './dto/reorder-workflow-stages.dto';
import type { RejectReportDto } from './dto/reject-report.dto';
import type { ResubmitReportDto } from './dto/resubmit-report.dto';
import type { UpdateWorkflowConfigDto } from './dto/update-workflow-config.dto';
import type { UpdateWorkflowStageDto } from './dto/update-workflow-stage.dto';
import type { WorkflowConfigQueryDto } from './dto/workflow-config-query.dto';
import {
  WorkflowConfigRepository,
  type WorkflowDomain,
  type WorkflowRecord,
} from './workflow-config.repository';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly workflowConfigRepository: WorkflowConfigRepository,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  directorQueue() {
    return this.listQueueByRole('DIRECTOR');
  }

  caoQueue() {
    return this.listQueueByRole('CAO');
  }

  myQueue(user: AuthenticatedUser) {
    return this.listQueueForUser(user);
  }

  reportHistory(reportId: string) {
    return this.reportsService.getApprovalHistory(reportId);
  }

  async approveReportByDirector(reportId: string, user: AuthenticatedUser, dto: ApproveReportDto) {
    const runtime = await this.resolveRuntimeStage(reportId);
    if (runtime.approverRole !== 'DIRECTOR') {
      throw new BadRequestException('Report is not currently assigned to Director stage');
    }

    return this.reportsService.approveAtCurrentStage(reportId, user, {
      expectedRole: runtime.approverRole,
      stage: runtime.stage,
      nextStatus: runtime.nextStatus,
      comments: dto.comments,
      notificationEventType: runtime.nextStatus === 'APPROVED' ? 'REPORT_APPROVED_CAO' : 'REPORT_APPROVED_DIRECTOR',
    });
  }

  async approveReportByCao(reportId: string, user: AuthenticatedUser, dto: ApproveReportDto) {
    const runtime = await this.resolveRuntimeStage(reportId);
    if (runtime.approverRole !== 'CAO') {
      throw new BadRequestException('Report is not currently assigned to CAO stage');
    }

    return this.reportsService.approveAtCurrentStage(reportId, user, {
      expectedRole: runtime.approverRole,
      stage: runtime.stage,
      nextStatus: runtime.nextStatus,
      comments: dto.comments,
      notificationEventType: runtime.nextStatus === 'APPROVED' ? 'REPORT_APPROVED_CAO' : 'REPORT_APPROVED_DIRECTOR',
    });
  }

  async rejectReportByDirector(reportId: string, user: AuthenticatedUser, dto: RejectReportDto) {
    const runtime = await this.resolveRuntimeStage(reportId);
    if (runtime.approverRole !== 'DIRECTOR') {
      throw new BadRequestException('Report is not currently assigned to Director stage');
    }

    return this.reportsService.rejectAtCurrentStage(reportId, user, {
      expectedRole: runtime.approverRole,
      stage: runtime.stage,
      comments: dto.comments,
      notificationEventType: 'REPORT_REJECTED_DIRECTOR',
    });
  }

  async rejectReportByCao(reportId: string, user: AuthenticatedUser, dto: RejectReportDto) {
    const runtime = await this.resolveRuntimeStage(reportId);
    if (runtime.approverRole !== 'CAO') {
      throw new BadRequestException('Report is not currently assigned to CAO stage');
    }

    return this.reportsService.rejectAtCurrentStage(reportId, user, {
      expectedRole: runtime.approverRole,
      stage: runtime.stage,
      comments: dto.comments,
      notificationEventType: 'REPORT_REJECTED_CAO',
    });
  }

  async approveReportByCurrentStage(reportId: string, user: AuthenticatedUser, dto: ApproveReportDto) {
    const runtime = await this.resolveRuntimeStage(reportId);
    return this.reportsService.approveAtCurrentStage(reportId, user, {
      expectedRole: runtime.approverRole,
      stage: runtime.stage,
      nextStatus: runtime.nextStatus,
      comments: dto.comments,
      notificationEventType: runtime.nextStatus === 'APPROVED' ? 'REPORT_APPROVED_CAO' : 'REPORT_APPROVED_DIRECTOR',
    });
  }

  async rejectReportByCurrentStage(reportId: string, user: AuthenticatedUser, dto: RejectReportDto) {
    const runtime = await this.resolveRuntimeStage(reportId);
    return this.reportsService.rejectAtCurrentStage(reportId, user, {
      expectedRole: runtime.approverRole,
      stage: runtime.stage,
      comments: dto.comments,
      notificationEventType: `REPORT_REJECTED_${runtime.stage}`,
    });
  }

  resubmitReport(reportId: string, user: AuthenticatedUser, dto: ResubmitReportDto) {
    return this.reportsService.resubmit(reportId, user, dto.comments);
  }

  listWorkflowConfigurations(query: WorkflowConfigQueryDto): Promise<WorkflowRecord[]> {
    return this.workflowConfigRepository.list({
      domain: query.domain,
      includeInactive: query.includeInactive === 'true' || query.includeInactive === '1',
    });
  }

  getWorkflowConfiguration(id: string): Promise<WorkflowRecord> {
    return this.workflowConfigRepository.getById(id);
  }

  async createWorkflowConfiguration(dto: CreateWorkflowConfigDto, user: AuthenticatedUser): Promise<WorkflowRecord> {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.workflowConfigRepository
      .getByCode(code)
      .then((workflow) => workflow)
      .catch((error: unknown) => {
        if (error instanceof NotFoundException) {
          return null;
        }
        throw error;
      });
    if (existing) {
      throw new ConflictException('Workflow code already exists');
    }

    const isDefault = dto.isDefault ?? false;
    if (isDefault) {
      await this.workflowConfigRepository.clearDefaultByDomain(dto.domain);
    }

    return this.workflowConfigRepository.create({
      code,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      domain: dto.domain,
      isActive: dto.isActive ?? true,
      isDefault,
      createdBy: user.id,
    });
  }

  async updateWorkflowConfiguration(
    id: string,
    dto: UpdateWorkflowConfigDto,
    _user: AuthenticatedUser,
  ): Promise<WorkflowRecord> {
    const existing = await this.workflowConfigRepository.getById(id);
    const isDefault = dto.isDefault ?? existing.isDefault;
    if (isDefault) {
      await this.workflowConfigRepository.clearDefaultByDomain(existing.domain);
    }

    return this.workflowConfigRepository.update(id, {
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      isActive: dto.isActive,
      isDefault: dto.isDefault,
    });
  }

  async removeWorkflowConfiguration(id: string): Promise<{ ok: true }> {
    await this.workflowConfigRepository.remove(id);
    return { ok: true };
  }

  async cloneWorkflowConfiguration(id: string, user: AuthenticatedUser): Promise<WorkflowRecord> {
    const source = await this.workflowConfigRepository.getById(id);
    const baseCode = `${source.code}_COPY`;
    let code = baseCode;
    let suffix = 2;
    while (
      await this.workflowConfigRepository
        .getByCode(code)
        .then(() => true)
        .catch((error) => !(error instanceof NotFoundException))
    ) {
      code = `${baseCode}_${suffix}`;
      suffix += 1;
    }

    const cloned = await this.workflowConfigRepository.create({
      code,
      name: `${source.name} (Copy)`,
      description: source.description,
      domain: source.domain,
      isActive: source.isActive,
      isDefault: false,
      createdBy: user.id,
    });

    const orderedStages = [...source.stages].sort((left, right) => left.sortOrder - right.sortOrder);
    for (const stage of orderedStages) {
      await this.workflowConfigRepository.addStage({
        workflowId: cloned.id,
        key: stage.key,
        name: stage.name,
        approverRole: stage.approverRole,
        sortOrder: stage.sortOrder,
        requireOnlyOneApproval: stage.requireOnlyOneApproval,
        isOrdered: stage.isOrdered,
        minimumApprovals: stage.minimumApprovals,
      });
    }

    return this.workflowConfigRepository.getById(cloned.id);
  }

  async addWorkflowStage(
    workflowId: string,
    dto: CreateWorkflowStageDto,
    _user: AuthenticatedUser,
  ): Promise<WorkflowRecord> {
    const workflow = await this.workflowConfigRepository.getById(workflowId);
    const normalizedKey = dto.key.trim().toUpperCase();
    if (workflow.stages.some((stage) => stage.key === normalizedKey)) {
      throw new ConflictException('Workflow stage key already exists');
    }

    const requireOnlyOneApproval = dto.requireOnlyOneApproval ?? true;
    const minimumApprovals = requireOnlyOneApproval ? 1 : Math.max(dto.minimumApprovals ?? 1, 1);
    return this.workflowConfigRepository.addStage({
      workflowId,
      key: normalizedKey,
      name: dto.name.trim(),
      approverRole: dto.approverRole.trim().toUpperCase(),
      sortOrder: workflow.stages.length + 1,
      requireOnlyOneApproval,
      isOrdered: dto.isOrdered ?? true,
      minimumApprovals,
    });
  }

  async updateWorkflowStage(
    workflowId: string,
    stageId: string,
    dto: UpdateWorkflowStageDto,
    _user: AuthenticatedUser,
  ): Promise<WorkflowRecord> {
    const workflow = await this.workflowConfigRepository.getById(workflowId);
    const stage = workflow.stages.find((entry) => entry.id === stageId);
    if (!stage) {
      throw new NotFoundException('Workflow stage not found');
    }

    const normalizedKey = dto.key?.trim().toUpperCase();
    if (normalizedKey && workflow.stages.some((entry) => entry.id !== stageId && entry.key === normalizedKey)) {
      throw new ConflictException('Workflow stage key already exists');
    }

    const requireOnlyOneApproval = dto.requireOnlyOneApproval ?? stage.requireOnlyOneApproval;
    const minimumApprovals = requireOnlyOneApproval ? 1 : Math.max(dto.minimumApprovals ?? stage.minimumApprovals, 1);
    return this.workflowConfigRepository.updateStage(workflowId, stageId, {
      key: normalizedKey,
      name: dto.name?.trim(),
      approverRole: dto.approverRole?.trim().toUpperCase(),
      requireOnlyOneApproval,
      isOrdered: dto.isOrdered,
      minimumApprovals,
    });
  }

  async removeWorkflowStage(workflowId: string, stageId: string): Promise<WorkflowRecord> {
    return this.workflowConfigRepository.removeStage(workflowId, stageId);
  }

  async reorderWorkflowStages(
    workflowId: string,
    dto: ReorderWorkflowStagesDto,
    _user: AuthenticatedUser,
  ): Promise<WorkflowRecord> {
    const workflow = await this.workflowConfigRepository.getById(workflowId);
    if (dto.stageIdsInOrder.length !== workflow.stages.length) {
      throw new BadRequestException('Reorder payload must include all workflow stages');
    }

    const stageIds = new Set(workflow.stages.map((stage) => stage.id));
    for (const stageId of dto.stageIdsInOrder) {
      if (!stageIds.has(stageId)) {
        throw new NotFoundException('Workflow stage not found');
      }
    }

    return this.workflowConfigRepository.reorderStages(workflowId, dto.stageIdsInOrder);
  }

  getDefaultWorkflow(domain: WorkflowDomain): Promise<WorkflowRecord | null> {
    return this.workflowConfigRepository
      .list({ domain, includeInactive: false })
      .then((workflows) => workflows.find((workflow) => workflow.isDefault) ?? null);
  }

  private async listQueueByRole(role: string): Promise<StaffReportRecord[]> {
    const [pendingDirector, pendingCao, pendingWorkflow] = await Promise.all([
      this.reportsService.listPendingDirector(),
      this.reportsService.listPendingCao(),
      this.reportsService.listPendingWorkflow(),
    ]);
    const candidates = [...pendingDirector, ...pendingCao, ...pendingWorkflow];
    const result: StaffReportRecord[] = [];

    for (const report of candidates) {
      const runtime = await this.resolveRuntimeStage(report.id, report);
      if (runtime.approverRole === role) {
        result.push(report);
      }
    }

    return result;
  }

  private async listQueueForUser(user: AuthenticatedUser): Promise<StaffReportRecord[]> {
    if (user.roles.some((role) => role.toUpperCase() === 'ADMIN')) {
      const [pendingDirector, pendingCao, pendingWorkflow] = await Promise.all([
        this.reportsService.listPendingDirector(),
        this.reportsService.listPendingCao(),
        this.reportsService.listPendingWorkflow(),
      ]);
      return [...pendingDirector, ...pendingCao, ...pendingWorkflow];
    }

    const normalizedRoles = new Set(user.roles.map((role) => role.toUpperCase()));
    const [pendingDirector, pendingCao, pendingWorkflow] = await Promise.all([
      this.reportsService.listPendingDirector(),
      this.reportsService.listPendingCao(),
      this.reportsService.listPendingWorkflow(),
    ]);
    const candidates = [...pendingDirector, ...pendingCao, ...pendingWorkflow];
    const result: StaffReportRecord[] = [];

    for (const report of candidates) {
      const runtime = await this.resolveRuntimeStage(report.id, report);
      if (normalizedRoles.has(runtime.approverRole.toUpperCase())) {
        result.push(report);
      }
    }

    return result;
  }

  private async resolveRuntimeStage(
    reportId: string,
    providedReport?: StaffReportRecord,
  ): Promise<{ stage: string; approverRole: string; nextStatus: ReportWorkflowStatus }> {
    const report = providedReport ?? (await this.reportsService.getById(reportId));
    const workflow = report.workflowConfigId
      ? await this.workflowConfigRepository
          .getById(report.workflowConfigId)
          .then((value) => value)
          .catch(() => null)
      : await this.getDefaultWorkflow('REPORT');
    const orderedStages = [...(workflow?.stages ?? [])].sort((left, right) => left.sortOrder - right.sortOrder);

    if (
      (report.workflowStatus === 'PENDING_DIRECTOR_APPROVAL' ||
        report.workflowStatus === 'PENDING_CAO_APPROVAL' ||
        report.workflowStatus === 'PENDING_WORKFLOW_APPROVAL') &&
      report.currentWorkflowStageIndex
    ) {
      const stage = orderedStages[report.currentWorkflowStageIndex - 1];
      const nextStage = orderedStages[report.currentWorkflowStageIndex];
      if (stage) {
        return {
          stage: stage.key,
          approverRole: stage.approverRole,
          nextStatus: nextStage ? 'PENDING_WORKFLOW_APPROVAL' : 'APPROVED',
        };
      }
    }

    if (report.workflowStatus === 'PENDING_DIRECTOR_APPROVAL') {
      const stage = orderedStages[0];
      return {
        stage: stage?.key ?? 'DIRECTOR',
        approverRole: stage?.approverRole ?? 'DIRECTOR',
        nextStatus: orderedStages.length >= 2 ? 'PENDING_WORKFLOW_APPROVAL' : 'APPROVED',
      };
    }

    if (report.workflowStatus === 'PENDING_CAO_APPROVAL') {
      const stage = orderedStages[1];
      return {
        stage: stage?.key ?? 'CAO',
        approverRole: stage?.approverRole ?? 'CAO',
        nextStatus: 'APPROVED',
      };
    }

    if (report.workflowStatus === 'PENDING_WORKFLOW_APPROVAL' && report.currentWorkflowApproverRole) {
      return {
        stage: report.currentWorkflowStageKey ?? report.currentWorkflowApproverRole,
        approverRole: report.currentWorkflowApproverRole,
        nextStatus: orderedStages.length > (report.currentWorkflowStageIndex ?? 0) ? 'PENDING_WORKFLOW_APPROVAL' : 'APPROVED',
      };
    }

    throw new BadRequestException('Report is not pending an approval stage');
  }
}
