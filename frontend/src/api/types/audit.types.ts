export interface AuditLogRecord {
  id: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changesJson?: Record<string, unknown>;
  createdAt: string;
}
