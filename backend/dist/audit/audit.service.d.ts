import { AuditRepository, type AuditLogRecord } from './audit.repository';
export declare class AuditService {
    private readonly auditRepository;
    constructor(auditRepository: AuditRepository);
    log(input: {
        actorUserId?: string;
        action: string;
        entityType: string;
        entityId?: string;
        changesJson?: Record<string, unknown>;
    }): Promise<void>;
    listRecent(limit?: number): Promise<AuditLogRecord[]>;
}
