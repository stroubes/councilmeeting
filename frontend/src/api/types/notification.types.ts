export type NotificationDeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED';

export interface NotificationEventRecord {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorUserId?: string;
  payloadJson: Record<string, unknown>;
  channels: string[];
  status: NotificationDeliveryStatus;
  deliveryAttempts: number;
  lastError?: string;
  createdAt: string;
  deliveredAt?: string;
  updatedAt: string;
}

export interface NotificationSummary {
  total: number;
  pending: number;
  delivered: number;
  failed: number;
}

export interface NotificationObservability {
  generatedAt: string;
  windowSize: number;
  totals: NotificationSummary;
  byChannel: Array<{
    channel: string;
    total: number;
    pending: number;
    delivered: number;
    failed: number;
  }>;
  digest: {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    latestDigestEventAt?: string;
  };
  backlog: {
    pendingOldestAgeMinutes: number;
    highRetryCount: number;
  };
}
