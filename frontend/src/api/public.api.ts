import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type { AgendaRecord } from './types/agenda.types';
import type { MeetingRecord } from './types/meeting.types';
import type {
  PublicMeetingPackage,
  PublicSubscriptionPreview,
  PublicSubscriptionRecord,
  PublicSummaryResponse,
} from './types/public.types';
import type { StaffReportRecord } from './types/report.types';
import type { PaginatedResponse } from './types/pagination.types';
import type { MinutesRecord } from './types/minutes.types';

export function getPublicSummary(): Promise<PublicSummaryResponse> {
  return httpGet<PublicSummaryResponse>('/public/summary');
}

export function listPublicAgendas(): Promise<AgendaRecord[]> {
  return httpGet<AgendaRecord[]>('/public/agendas');
}

export function listPublicAgendasPaged(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AgendaRecord>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const queryString = query.toString();
  return httpGet<PaginatedResponse<AgendaRecord>>(`/public/agendas/paged${queryString ? `?${queryString}` : ''}`);
}

export function listPublicMeetings(): Promise<MeetingRecord[]> {
  return httpGet<MeetingRecord[]>('/public/meetings');
}

export function listPublicMeetingsPaged(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<MeetingRecord>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const queryString = query.toString();
  return httpGet<PaginatedResponse<MeetingRecord>>(`/public/meetings/paged${queryString ? `?${queryString}` : ''}`);
}

export function listPublicReports(): Promise<StaffReportRecord[]> {
  return httpGet<StaffReportRecord[]>('/public/reports');
}

export function listPublicReportsPaged(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<StaffReportRecord>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const queryString = query.toString();
  return httpGet<PaginatedResponse<StaffReportRecord>>(`/public/reports/paged${queryString ? `?${queryString}` : ''}`);
}

export function listPublicMinutesPaged(params?: {
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const queryString = query.toString();
  return httpGet<PaginatedResponse<MinutesRecord>>(`/public/minutes/paged${queryString ? `?${queryString}` : ''}`);
}

export function listPublicPackages(query?: string): Promise<PublicMeetingPackage[]> {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : '';
  return httpGet<PublicMeetingPackage[]>(`/public/packages${suffix}`);
}

export function createPublicSubscription(payload: {
  email: string;
  topics: string[];
  watchKeywords?: string[];
  frequency: 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';
}): Promise<PublicSubscriptionRecord> {
  return httpPost<PublicSubscriptionRecord, typeof payload>('/public/subscriptions', payload);
}

export function listPublicSubscriptions(email: string): Promise<PublicSubscriptionRecord[]> {
  return httpGet<PublicSubscriptionRecord[]>(`/public/subscriptions?email=${encodeURIComponent(email)}`);
}

export function updatePublicSubscription(
  id: string,
  payload: Partial<{
    topics: string[];
    watchKeywords: string[];
    frequency: 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';
    isActive: boolean;
  }>,
): Promise<PublicSubscriptionRecord> {
  return httpPatch<PublicSubscriptionRecord, typeof payload>(`/public/subscriptions/${id}`, payload);
}

export function deletePublicSubscription(id: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/public/subscriptions/${id}`);
}

export function previewPublicSubscription(id: string): Promise<PublicSubscriptionPreview> {
  return httpGet<PublicSubscriptionPreview>(`/public/subscriptions/${id}/preview`);
}

export function runPublicDigestSweep(): Promise<{ runAt: string; processed: number; delivered: number; skipped: number }> {
  return httpPost<{ runAt: string; processed: number; delivered: number; skipped: number }>('/public/subscriptions/digest/run');
}
