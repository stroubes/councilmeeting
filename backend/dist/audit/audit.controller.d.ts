import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    list(limit?: string): Promise<import("./audit.repository").AuditLogRecord[]>;
}
