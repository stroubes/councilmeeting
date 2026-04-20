import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type {
  CreateReportAttachmentPayload,
  CreateStaffReportPayload,
  ImportDocxReportPayload,
  ReportAttachmentRecord,
  StaffReportRecord,
} from './types/report.types';
import type { PaginatedResponse } from './types/pagination.types';

export function listReports(params?: {
  status?: string;
  agendaItemId?: string;
}): Promise<StaffReportRecord[]> {
  const query = new URLSearchParams();
  if (params?.status) {
    query.set('status', params.status);
  }
  if (params?.agendaItemId) {
    query.set('agendaItemId', params.agendaItemId);
  }
  const queryString = query.toString();
  return httpGet<StaffReportRecord[]>(`/reports${queryString ? `?${queryString}` : ''}`);
}

export function listReportsPaged(params?: {
  status?: string;
  agendaItemId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<StaffReportRecord>> {
  const query = new URLSearchParams();
  if (params?.status) {
    query.set('status', params.status);
  }
  if (params?.agendaItemId) {
    query.set('agendaItemId', params.agendaItemId);
  }
  if (params?.page) {
    query.set('page', String(params.page));
  }
  if (params?.limit) {
    query.set('limit', String(params.limit));
  }
  const queryString = query.toString();
  return httpGet<PaginatedResponse<StaffReportRecord>>(`/reports/paged${queryString ? `?${queryString}` : ''}`);
}

export function createReport(payload: CreateStaffReportPayload): Promise<StaffReportRecord> {
  return httpPost<StaffReportRecord, CreateStaffReportPayload>('/reports', payload);
}

export function importDocxReport(payload: ImportDocxReportPayload): Promise<StaffReportRecord> {
  return httpPost<StaffReportRecord, ImportDocxReportPayload>('/reports/import-docx', payload);
}

export function updateReport(
  reportId: string,
  payload: Partial<CreateStaffReportPayload>,
): Promise<StaffReportRecord> {
  return httpPatch<StaffReportRecord, Partial<CreateStaffReportPayload>>(`/reports/${reportId}`, payload);
}

export function submitReport(reportId: string): Promise<StaffReportRecord> {
  return httpPost<StaffReportRecord>(`/reports/${reportId}/submit`);
}

export function publishReport(reportId: string): Promise<StaffReportRecord> {
  return httpPost<StaffReportRecord>(`/reports/${reportId}/publish`);
}

export function deleteReport(reportId: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/reports/${reportId}`);
}

export function listReportAttachments(reportId: string): Promise<ReportAttachmentRecord[]> {
  return httpGet<ReportAttachmentRecord[]>(`/reports/${reportId}/attachments`);
}

export function addReportAttachment(
  reportId: string,
  payload: CreateReportAttachmentPayload,
): Promise<ReportAttachmentRecord> {
  return httpPost<ReportAttachmentRecord, CreateReportAttachmentPayload>(`/reports/${reportId}/attachments`, payload);
}

export function removeReportAttachment(reportId: string, attachmentId: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/reports/${reportId}/attachments/${attachmentId}`);
}

export function runReportBulkAction(payload: {
  reportIds: string[];
  action: 'SUBMIT' | 'RESUBMIT' | 'PUBLISH';
  comments?: string;
}) {
  return httpPost<{ requested: number; succeeded: number; failed: Array<{ reportId: string; reason: string }> }, typeof payload>(
    '/reports/bulk-action',
    payload,
  );
}
