import { httpGet } from './httpClient';
import type { AuditLogRecord } from './types/audit.types';

export function listAuditLogs(limit = 200): Promise<AuditLogRecord[]> {
  return httpGet<AuditLogRecord[]>(`/audit/logs?limit=${limit}`);
}
