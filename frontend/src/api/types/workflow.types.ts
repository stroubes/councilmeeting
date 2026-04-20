export interface ReportApprovalEvent {
  id: string;
  staffReportId: string;
  stage: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED' | 'PUBLISHED';
  actedByUserId: string;
  actedAt: string;
  comments?: string;
}

export type WorkflowDomain = 'REPORT';

export interface WorkflowStageRecord {
  id: string;
  workflowId: string;
  key: string;
  name: string;
  approverRole: string;
  sortOrder: number;
  requireOnlyOneApproval: boolean;
  isOrdered: boolean;
  minimumApprovals: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRecord {
  id: string;
  code: string;
  name: string;
  description?: string;
  domain: WorkflowDomain;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stages: WorkflowStageRecord[];
}

export interface RoleDelegationRecord {
  id: string;
  delegateFromUserId: string;
  delegateToUserId: string;
  roleCode: string;
  startsAt: string;
  endsAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowPayload {
  code: string;
  name: string;
  description?: string;
  domain: WorkflowDomain;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateWorkflowPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface CreateWorkflowStagePayload {
  key: string;
  name: string;
  approverRole: string;
  requireOnlyOneApproval?: boolean;
  isOrdered?: boolean;
  minimumApprovals?: number;
}

export interface UpdateWorkflowStagePayload {
  key?: string;
  name?: string;
  approverRole?: string;
  requireOnlyOneApproval?: boolean;
  isOrdered?: boolean;
  minimumApprovals?: number;
}
