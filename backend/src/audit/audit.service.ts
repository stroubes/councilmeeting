import { Injectable } from '@nestjs/common';
import { AuditRepository, type AuditLogRecord } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async log(input: {
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    changesJson?: Record<string, unknown>;
  }): Promise<void> {
    await this.auditRepository.create(input);
  }

  listRecent(limit?: number): Promise<AuditLogRecord[]> {
    return this.auditRepository.listRecent(limit);
  }
}
