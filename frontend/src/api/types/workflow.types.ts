export interface ReportApprovalEvent {
  id: string;
  staffReportId: string;
  stage: 'DIRECTOR' | 'CAO' | 'SYSTEM';
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED' | 'PUBLISHED';
  actedByUserId: string;
  actedAt: string;
  comments?: string;
}
