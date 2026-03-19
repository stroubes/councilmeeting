import { httpGet, httpPost } from './httpClient';
import type { StaffReportRecord } from './types/report.types';
import type { ReportApprovalEvent } from './types/workflow.types';

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

export function resubmitReport(reportId: string, payload?: ApprovalPayload): Promise<StaffReportRecord> {
  return httpPost<StaffReportRecord, ApprovalPayload>(`/workflows/reports/${reportId}/resubmit`, payload);
}
