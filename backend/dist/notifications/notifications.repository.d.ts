import { PostgresService } from '../database/postgres.service';
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
export declare class NotificationsRepository {
    private readonly postgresService;
    private readonly memory;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    create(input: {
        eventType: string;
        entityType: string;
        entityId: string;
        actorUserId?: string;
        payloadJson: Record<string, unknown>;
        channels: string[];
        status: NotificationDeliveryStatus;
        deliveryAttempts?: number;
        lastError?: string;
        deliveredAt?: string;
    }): Promise<NotificationEventRecord>;
    list(query?: {
        status?: NotificationDeliveryStatus;
        eventType?: string;
        limit?: number;
    }): Promise<NotificationEventRecord[]>;
    getById(id: string): Promise<NotificationEventRecord>;
    updateDelivery(id: string, patch: {
        status: NotificationDeliveryStatus;
        deliveryAttempts: number;
        lastError?: string;
        deliveredAt?: string;
    }): Promise<NotificationEventRecord>;
    private ensureSchema;
    private withFallback;
}
