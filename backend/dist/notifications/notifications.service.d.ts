import { ConfigService } from '@nestjs/config';
import { NotificationsRepository, type NotificationDeliveryStatus, type NotificationEventRecord } from './notifications.repository';
export declare class NotificationsService {
    private readonly notificationsRepository;
    private readonly configService;
    constructor(notificationsRepository: NotificationsRepository, configService: ConfigService);
    health(): {
        status: string;
    };
    emit(input: {
        eventType: string;
        entityType: string;
        entityId: string;
        actorUserId?: string;
        payloadJson?: Record<string, unknown>;
    }): Promise<NotificationEventRecord>;
    list(query?: {
        status?: NotificationDeliveryStatus;
        eventType?: string;
        limit?: number;
    }): Promise<NotificationEventRecord[]>;
    summary(): Promise<{
        total: number;
        pending: number;
        delivered: number;
        failed: number;
    }>;
    observability(): Promise<{
        generatedAt: string;
        windowSize: number;
        totals: {
            total: number;
            pending: number;
            delivered: number;
            failed: number;
        };
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
    }>;
    retry(id: string): Promise<NotificationEventRecord>;
    private dispatch;
    private resolveChannels;
    private resolveMaxAttempts;
    private resolveRetryDelayMs;
    private deliverThroughChannels;
    private deliverToChannel;
    private buildWebhookPayload;
    private buildWebhookDigestPayload;
    private buildEmailDigestPayload;
    private buildTeamsDigestPayload;
    private buildDigestSummaryText;
    private buildDigestLines;
    private toDigestView;
    private postJson;
}
