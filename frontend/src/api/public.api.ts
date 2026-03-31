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

export function getPublicSummary(): Promise<PublicSummaryResponse> {
  return httpGet<PublicSummaryResponse>('/public/summary');
}

export function listPublicAgendas(): Promise<AgendaRecord[]> {
  return httpGet<AgendaRecord[]>('/public/agendas');
}

export function listPublicMeetings(): Promise<MeetingRecord[]> {
  return httpGet<MeetingRecord[]>('/public/meetings');
}

export function listPublicReports(): Promise<StaffReportRecord[]> {
  return httpGet<StaffReportRecord[]>('/public/reports');
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
