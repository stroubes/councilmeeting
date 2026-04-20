import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type { StaffReportRecord } from './types/report.types';
import type {
  CreateWorkflowPayload,
  CreateWorkflowStagePayload,
  ReportApprovalEvent,
  UpdateWorkflowPayload,
  UpdateWorkflowStagePayload,
  WorkflowDomain,
  WorkflowRecord,
  RoleDelegationRecord,
} from './types/workflow.types';

interface ApprovalPayload {
  comments?: string;
}

interface RejectPayload {
  comments: string;
}

export function getDirectorQueue(): Promise<StaffReportRecord[]> {
  return httpGet<StaffReportRecord[]>('/workflows/reports/director-queue');
}

export function getCaoQueue(): Promise<StaffReportRecord[]> {
  return httpGet<StaffReportRecord[]>('/workflows/reports/cao-queue');
}

export function getMyQueue(): Promise<StaffReportRecord[]> {
  return httpGet<StaffReportRecord[]>('/workflows/reports/my-queue');
}

export function getReportWorkflowHistory(reportId: string): Promise<ReportApprovalEvent[]> {
  return httpGet<ReportApprovalEvent[]>(`/workflows/reports/${reportId}/history`);
}

export function approveReportByDirector(
  reportId: string,
  payload?: ApprovalPayload,
): Promise<StaffReportRecord> {
  return httpPost<StaffReportRecord, ApprovalPayload>(
    `/workflows/reports/${reportId}/approve-director`,
    payload,
  );
}

export function approveReportByCao(reportId: string, payload?: ApprovalPayload): Promise<StaffReportRecord> {
  return httpPost<StaffReportRecord, ApprovalPayload>(`/workflows/reports/${reportId}/approve-cao`, payload);
}

export function rejectReportByDirector(
  reportId: string,
  payload: RejectPayload,
): Promise<StaffReportRecord> {
  return httpPost<StaffReportRecord, RejectPayload>(`/workflows/reports/${reportId}/reject-director`, payload);
}

export function rejectReportByCao(reportId: string, payload: RejectPayload): Promise<StaffReportRecord> {
  return httpPost<StaffReportRecord, RejectPayload>(`/workflows/reports/${reportId}/reject-cao`, payload);
}

export function approveReportByCurrentStage(
  reportId: string,
  payload?: ApprovalPayload,
): Promise<StaffReportRecord> {
  return httpPost<StaffReportRecord, ApprovalPayload>(`/workflows/reports/${reportId}/approve-current`, payload);
}

export function rejectReportByCurrentStage(
  reportId: string,
  payload: RejectPayload,
): Promise<StaffReportRecord> {
  return httpPost<StaffReportRecord, RejectPayload>(`/workflows/reports/${reportId}/reject-current`, payload);
}

export function resubmitReport(reportId: string, payload?: ApprovalPayload): Promise<StaffReportRecord> {
  return httpPost<StaffReportRecord, ApprovalPayload>(`/workflows/reports/${reportId}/resubmit`, payload);
}

export function listWorkflowConfigurations(params?: {
  domain?: WorkflowDomain;
  includeInactive?: boolean;
}): Promise<WorkflowRecord[]> {
  const query = new URLSearchParams();
  if (params?.domain) {
    query.set('domain', params.domain);
  }
  if (params?.includeInactive) {
    query.set('includeInactive', 'true');
  }
  const queryString = query.toString();
  return httpGet<WorkflowRecord[]>(`/workflows/configurations${queryString ? `?${queryString}` : ''}`);
}

export function getWorkflowConfiguration(workflowId: string): Promise<WorkflowRecord> {
  return httpGet<WorkflowRecord>(`/workflows/configurations/${workflowId}`);
}

export function createWorkflowConfiguration(payload: CreateWorkflowPayload): Promise<WorkflowRecord> {
  return httpPost<WorkflowRecord, CreateWorkflowPayload>('/workflows/configurations', payload);
}

export function updateWorkflowConfiguration(
  workflowId: string,
  payload: UpdateWorkflowPayload,
): Promise<WorkflowRecord> {
  return httpPatch<WorkflowRecord, UpdateWorkflowPayload>(`/workflows/configurations/${workflowId}`, payload);
}

export function deleteWorkflowConfiguration(workflowId: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/workflows/configurations/${workflowId}`);
}

export function cloneWorkflowConfiguration(workflowId: string): Promise<WorkflowRecord> {
  return httpPost<WorkflowRecord>(`/workflows/configurations/${workflowId}/clone`);
}

export function addWorkflowStage(
  workflowId: string,
  payload: CreateWorkflowStagePayload,
): Promise<WorkflowRecord> {
  return httpPost<WorkflowRecord, CreateWorkflowStagePayload>(`/workflows/configurations/${workflowId}/stages`, payload);
}

export function updateWorkflowStage(
  workflowId: string,
  stageId: string,
  payload: UpdateWorkflowStagePayload,
): Promise<WorkflowRecord> {
  return httpPatch<WorkflowRecord, UpdateWorkflowStagePayload>(
    `/workflows/configurations/${workflowId}/stages/${stageId}`,
    payload,
  );
}

export function removeWorkflowStage(workflowId: string, stageId: string): Promise<WorkflowRecord> {
  return httpDelete<WorkflowRecord>(`/workflows/configurations/${workflowId}/stages/${stageId}`);
}

export function reorderWorkflowStages(workflowId: string, stageIdsInOrder: string[]): Promise<WorkflowRecord> {
  return httpPost<WorkflowRecord, { stageIdsInOrder: string[] }>(
    `/workflows/configurations/${workflowId}/stages/reorder`,
    { stageIdsInOrder },
  );
}

export function listRoleDelegations(): Promise<RoleDelegationRecord[]> {
  return httpGet<RoleDelegationRecord[]>('/workflows/delegations');
}

export function createRoleDelegation(payload: {
  delegateFromUserId: string;
  delegateToUserId: string;
  roleCode: string;
  startsAt: string;
  endsAt?: string;
}): Promise<RoleDelegationRecord> {
  return httpPost<RoleDelegationRecord, typeof payload>('/workflows/delegations', payload);
}

export function removeRoleDelegation(id: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/workflows/delegations/${id}`);
}
