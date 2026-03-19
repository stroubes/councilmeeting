import { useEffect, useMemo, useState } from 'react';
import {
  getNotificationObservability,
  getNotificationSummary,
  listNotificationEvents,
  retryNotificationEvent,
} from '../../api/notifications.api';
import { runPublicDigestSweep } from '../../api/public.api';
import type {
  NotificationDeliveryStatus,
  NotificationEventRecord,
  NotificationObservability,
  NotificationSummary,
} from '../../api/types/notification.types';
import AppShell from '../../components/layout/AppShell';
import { useToast } from '../../hooks/useToast';

type StatusFilter = 'ALL' | NotificationDeliveryStatus;

export default function NotificationsAdmin(): JSX.Element {
  const [events, setEvents] = useState<NotificationEventRecord[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>({ total: 0, pending: 0, delivered: 0, failed: 0 });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [observability, setObservability] = useState<NotificationObservability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const [isRunningDigest, setIsRunningDigest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const load = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryData, eventData, observabilityData] = await Promise.all([
        getNotificationSummary(),
        listNotificationEvents({ status: statusFilter, limit: 100 }),
        getNotificationObservability(),
      ]);
      setSummary(summaryData);
      setEvents(eventData);
      setObservability(observabilityData);
    } catch {
      setError('Could not load notification events.');
      addToast('Could not load notification events.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [statusFilter]);

  const lastDeliveredLabel = useMemo(() => {
    const delivered = events.find((entry) => entry.deliveredAt);
    return delivered?.deliveredAt ? new Date(delivered.deliveredAt).toLocaleString() : 'No deliveries yet';
  }, [events]);

  const handleRetry = async (eventId: string): Promise<void> => {
    setIsRetrying(eventId);
    try {
      await retryNotificationEvent(eventId);
      await load();
      addToast('Notification event retried.', 'success');
    } catch {
      addToast('Could not retry notification event.', 'error');
    } finally {
      setIsRetrying(null);
    }
  };

  const handleRunDigest = async (): Promise<void> => {
    setIsRunningDigest(true);
    try {
      const result = await runPublicDigestSweep();
      await load();
      addToast(
        `Digest run completed: processed ${result.processed}, delivered ${result.delivered}, skipped ${result.skipped}.`,
        'success',
      );
    } catch {
      addToast('Could not run public digest sweep.', 'error');
    } finally {
      setIsRunningDigest(false);
    }
  };

  return (
    <AppShell
      title="Notifications"
      subtitle="Control workflow communication rules for governance actions and escalations."
      workspaceVariant="admin"
    >
      <section className="module-overview">
        <article className="metric-tile metric-tile-primary">
          <p className="metric-label">Events Tracked</p>
          <p className="metric-value">{summary.total}</p>
          <p className="metric-foot">Recent workflow notification events</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Delivered</p>
          <p className="metric-value">{summary.delivered}</p>
          <p className="metric-foot">Last delivered: {lastDeliveredLabel}</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Pending / Failed</p>
          <p className="metric-value">
            {summary.pending} / {summary.failed}
          </p>
          <p className="metric-foot">Use retry for failed dispatches</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Oldest Pending Age</p>
          <p className="metric-value">{observability?.backlog.pendingOldestAgeMinutes ?? 0}m</p>
          <p className="metric-foot">Queue aging indicator for delivery backlog</p>
        </article>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>
              <span className="panel-icon">OBS</span>
              Pipeline Observability
            </h2>
            <p>Realtime health signals for notification throughput, digest output, and retry pressure.</p>
          </div>
        </header>
        <div className="card-body">
          {observability ? (
            <>
              <p className="muted">
                Generated: {new Date(observability.generatedAt).toLocaleString()} | Window: {observability.windowSize} events | High
                Retry Count: {observability.backlog.highRetryCount}
              </p>
              <div className="table-wrap">
                <table className="data-table" aria-label="Notification channel observability">
                  <thead>
                    <tr>
                      <th>Channel</th>
                      <th>Total</th>
                      <th>Delivered</th>
                      <th>Pending</th>
                      <th>Failed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observability.byChannel.map((entry) => (
                      <tr key={entry.channel}>
                        <td>{entry.channel}</td>
                        <td>{entry.total}</td>
                        <td>{entry.delivered}</td>
                        <td>{entry.pending}</td>
                        <td>{entry.failed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted" style={{ marginTop: '0.75rem' }}>
                Digest events: {observability.digest.total} (Delivered: {observability.digest.delivered}, Pending:{' '}
                {observability.digest.pending}, Failed: {observability.digest.failed}) | Last Digest Event:{' '}
                {observability.digest.latestDigestEventAt
                  ? new Date(observability.digest.latestDigestEventAt).toLocaleString()
                  : 'None'}
              </p>
            </>
          ) : (
            <p className="muted">Observability metrics not available.</p>
          )}
        </div>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>
              <span className="panel-icon">NTF</span>
              Notification Event Pipeline
            </h2>
            <p>Operational event stream for submit, approve, reject, finalize, and publish workflow actions.</p>
          </div>
          <div className="card-header-meta">
            <button type="button" className="btn" disabled={isRunningDigest} onClick={() => void handleRunDigest()}>
              {isRunningDigest ? 'Running Digest...' : 'Run Digest Sweep'}
            </button>
            <select
              className="field"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              aria-label="Filter by notification status"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </header>
        <div className="card-body">
          {isLoading ? <p className="muted">Loading notification events...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && events.length === 0 ? (
            <div className="empty-state">No notification events match the selected filter.</div>
          ) : null}
          {events.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="Notification event list">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Entity</th>
                    <th>Status</th>
                    <th>Channels</th>
                    <th>Attempts</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.eventType}</td>
                      <td>
                        {entry.entityType} / {entry.entityId.slice(0, 8)}
                      </td>
                      <td>{entry.status}</td>
                      <td>{entry.channels.join(', ') || 'IN_APP'}</td>
                      <td>{entry.deliveryAttempts}</td>
                      <td>{new Date(entry.createdAt).toLocaleString()}</td>
                      <td>
                        {entry.status === 'FAILED' ? (
                          <button
                            type="button"
                            className="btn btn-quiet"
                            disabled={isRetrying === entry.id}
                            onClick={() => void handleRetry(entry.id)}
                          >
                            Retry
                          </button>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
