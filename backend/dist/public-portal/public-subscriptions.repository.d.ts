import { PostgresService } from '../database/postgres.service';
export type PublicSubscriptionTopic = 'MEETINGS' | 'AGENDAS' | 'REPORTS' | 'MINUTES' | 'MOTIONS' | 'BUDGET';
export type PublicSubscriptionFrequency = 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';
export interface PublicSubscriptionRecord {
    id: string;
    email: string;
    topics: PublicSubscriptionTopic[];
    watchKeywords: string[];
    frequency: PublicSubscriptionFrequency;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastNotifiedAt?: string;
}
export declare class PublicSubscriptionsRepository {
    private readonly postgresService;
    private readonly memory;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    create(input: {
        email: string;
        topics: PublicSubscriptionTopic[];
        watchKeywords: string[];
        frequency: PublicSubscriptionFrequency;
    }): Promise<PublicSubscriptionRecord>;
    listByEmail(email: string): Promise<PublicSubscriptionRecord[]>;
    listActiveByFrequency(frequency: PublicSubscriptionFrequency, options?: {
        limit?: number;
    }): Promise<PublicSubscriptionRecord[]>;
    getById(id: string): Promise<PublicSubscriptionRecord>;
    update(id: string, patch: Partial<Pick<PublicSubscriptionRecord, 'topics' | 'watchKeywords' | 'frequency' | 'isActive' | 'lastNotifiedAt'>>): Promise<PublicSubscriptionRecord>;
    remove(id: string): Promise<void>;
    private ensureSchema;
    private withFallback;
}
