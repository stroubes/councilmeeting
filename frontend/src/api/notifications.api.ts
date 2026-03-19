import { httpGet, httpPost } from './httpClient';
import type {
  NotificationDeliveryStatus,
  NotificationEventRecord,
  NotificationObservability,
  NotificationSummary,
} from './types/notification.types';

export function listNotificationEvents(params?: {
  status?: NotificationDeliveryStatus | 'ALL';
  eventType?: string;
  limit?: number;
}): Promise<NotificationEventRecord[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') {
    query.set('status', params.status);
  }
  if (params?.eventType?.trim()) {
    query.set('eventType', params.eventType.trim());
  }
  if (params?.limit) {
    query.set('limit', String(params.limit));
  }
  const queryString = query.toString();
  return httpGet<NotificationEventRecord[]>(`/notifications/events${queryString ? `?${queryString}` : ''}`);
}

export function getNotificationSummary(): Promise<NotificationSummary> {
  return httpGet<NotificationSummary>('/notifications/summary');
}

export function getNotificationObservability(): Promise<NotificationObservability> {
  return httpGet<NotificationObservability>('/notifications/observability');
}

export function retryNotificationEvent(id: string): Promise<NotificationEventRecord> {
  return httpPost<NotificationEventRecord>(`/notifications/events/${id}/retry`);
}
