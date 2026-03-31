import { useEffect, useMemo, useState } from 'react';
import { listAuditLogs } from '../../api/audit.api';
import type { AuditLogRecord } from '../../api/types/audit.types';
import AppShell from '../../components/layout/AppShell';
import MetricTile from '../../components/ui/MetricTile';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';

type EntityFilter = 'ALL' | string;

export default function AuditLogsAdmin(): JSX.Element {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [query, setQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const recent = await listAuditLogs(250);
      setLogs(recent);
    } catch {
      setError('Could not load audit log entries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const entityTypes = useMemo(
    () => Array.from(new Set(logs.map((entry) => entry.entityType))).sort((left, right) => left.localeCompare(right)),
    [logs],
  );

  const filteredLogs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return logs.filter((entry) => {
      const matchesEntity = entityFilter === 'ALL' || entry.entityType === entityFilter;
      const matchesQuery =
        needle.length === 0 ||
        entry.action.toLowerCase().includes(needle) ||
        entry.entityType.toLowerCase().includes(needle) ||
        entry.entityId?.toLowerCase().includes(needle) ||
        entry.actorUserId?.toLowerCase().includes(needle);
      return matchesEntity && matchesQuery;
    });
  }, [logs, query, entityFilter]);

  const uniqueActors = useMemo(() => new Set(logs.map((entry) => entry.actorUserId).filter(Boolean)).size, [logs]);

  return (
    <AppShell
      title="Audit Logs"
      subtitle="Review governance and workflow events for compliance traceability."
      workspaceVariant="admin"
      actions={
        <button type="button" className="btn" onClick={() => void load()} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      <section className="module-overview">
        <MetricTile label="Events" value={logs.length} foot="Latest 250 events" variant="primary" />
        <MetricTile label="Filtered" value={filteredLogs.length} foot="Current filter result" />
        <MetricTile label="Entity Types" value={entityTypes.length} foot="Distinct audited domains" />
        <MetricTile label="Actors" value={uniqueActors} foot="Distinct users in current sample" />
      </section>

      <Card>
        <CardHeader
          title="Compliance Event Register"
          description="Inspect action-level records, actors, and change payloads for governance audits."
          actions={
            <>
              <input
                className="field"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search action, actor, or entity"
                aria-label="Search audit logs"
              />
              <select
                className="field"
                value={entityFilter}
                onChange={(event) => setEntityFilter(event.target.value)}
                aria-label="Filter by entity type"
              >
                <option value="ALL">All entity types</option>
                {entityTypes.map((entityType) => (
                  <option key={entityType} value={entityType}>
                    {entityType}
                  </option>
                ))}
              </select>
            </>
          }
        />
        <CardBody>
          {isLoading ? <p className="muted">Loading audit log entries...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}

          {!isLoading && !error && filteredLogs.length === 0 ? (
            <div className="empty-state">No audit events match the current filters.</div>
          ) : null}

          {filteredLogs.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="Audit logs">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Actor</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((entry) => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.createdAt).toLocaleString()}</td>
                      <td>{entry.action}</td>
                      <td>
                        {entry.entityType}
                        {entry.entityId ? ` / ${entry.entityId.slice(0, 8)}` : ''}
                      </td>
                      <td>{entry.actorUserId ?? 'System'}</td>
                      <td>
                        {entry.changesJson ? (
                          <code>{JSON.stringify(entry.changesJson)}</code>
                        ) : (
                          <span className="muted">No change payload</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </AppShell>
  );
}
