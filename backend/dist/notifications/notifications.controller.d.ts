import type { NotificationDeliveryStatus } from './notifications.repository';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    health(): {
        status: string;
    };
    list(status?: NotificationDeliveryStatus, eventType?: string, limit?: string): Promise<import("./notifications.repository").NotificationEventRecord[]>;
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
    retry(id: string): Promise<import("./notifications.repository").NotificationEventRecord>;
}
