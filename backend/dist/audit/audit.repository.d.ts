import { PostgresService } from '../database/postgres.service';
export interface AuditLogRecord {
    id: string;
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    changesJson?: Record<string, unknown>;
    createdAt: string;
}
interface CreateAuditLogInput {
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    changesJson?: Record<string, unknown>;
}
export declare class AuditRepository {
    private readonly postgresService;
    private readonly memoryLogs;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    create(input: CreateAuditLogInput): Promise<AuditLogRecord>;
    listRecent(limit?: number): Promise<AuditLogRecord[]>;
    private ensureSchema;
    private withFallback;
}
export {};
