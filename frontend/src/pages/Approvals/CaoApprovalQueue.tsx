import { useEffect, useMemo, useState } from 'react';
import { approveReportByCao, getCaoQueue, rejectReportByCao } from '../../api/workflows.api';
import type { StaffReportRecord } from '../../api/types/report.types';
import AppShell from '../../components/layout/AppShell';
import StatusBadge from '../../components/ui/StatusBadge';
import WorkflowHistoryPanel from '../../components/ui/WorkflowHistoryPanel';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useToast } from '../../hooks/useToast';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CaoApprovalQueue(): JSX.Element {
  const [queue, setQueue] = useState<StaffReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = usePersistentState('caoQueue.query', '');
  const [selectedReport, setSelectedReport] = useState<StaffReportRecord | null>(null);
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const { addToast } = useToast();

  const load = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCaoQueue();
      setQueue(data);
    } catch {
      setError('Could not load CAO approval queue.');
      addToast('Could not load CAO queue.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleApprove = async (reportId: string): Promise<void> => {
    setError(null);
    setPendingReportId(reportId);
    setPendingAction('approve');
    try {
      await approveReportByCao(reportId, { comments: 'CAO approved.' });
      setQueue((current) => current.filter((report) => report.id !== reportId));
      addToast('Report approved by CAO.', 'success');
    } catch {
      setError('Failed to approve report.');
      addToast('Failed to approve report.', 'error');
    } finally {
      setPendingReportId(null);
      setPendingAction(null);
    }
  };

  const handleReject = async (reportId: string): Promise<void> => {
    setError(null);
    setPendingReportId(reportId);
    setPendingAction('reject');
    try {
      await rejectReportByCao(reportId, { comments: 'CAO rejected. Please revise.' });
      setQueue((current) => current.filter((report) => report.id !== reportId));
      addToast('Report rejected by CAO.', 'success');
    } catch {
      setError('Failed to reject report.');
      addToast('Failed to reject report.', 'error');
    } finally {
      setPendingReportId(null);
      setPendingAction(null);
    }
  };

  const filteredQueue = useMemo(
    () =>
      queue.filter((report) => {
        const search = query.toLowerCase();
        return (
          report.title.toLowerCase().includes(search) ||
          (report.department ?? '').toLowerCase().includes(search) ||
          (report.reportNumber ?? '').toLowerCase().includes(search)
        );
      }),
    [queue, query],
  );

  const awaitingExecutiveCount = queue.filter((report) => report.workflowStatus === 'PENDING_CAO_APPROVAL').length;

  return (
    <AppShell
      title="CAO Approval Queue"
      subtitle="Executive decision lane for final report approval and publication readiness."
    >
      <section className="module-overview">
        <article className="metric-tile metric-tile-primary">
          <p className="metric-label">Executive Review Lane</p>
          <p className="metric-value">{queue.length}</p>
          <p className="metric-foot">Reports waiting for CAO decision</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Awaiting Executive</p>
          <p className="metric-value">{awaitingExecutiveCount}</p>
          <p className="metric-foot">Pending final governance approval</p>
        </article>
      </section>
      <section className="card">
        <header className="card-header">
          <div>
            <h2>
              <span className="panel-icon">CAO</span>
              Pending Executive Actions
            </h2>
            <p>Approve to complete workflow or reject to return report for revisions.</p>
          </div>
          <span className="pill">{filteredQueue.length} visible</span>
        </header>
        <div className="card-body">
          <div className="workspace-toolbar">
            <div className="workspace-toolbar-row">
            <input
              className="field"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search report title, number, or department"
              aria-label="Search CAO queue"
            />
            <span className="pill">Executive lane</span>
            </div>
          </div>
          {isLoading ? <p className="muted">Loading executive review queue...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && filteredQueue.length === 0 ? (
            <div className="empty-state">Executive queue is clear. No reports are waiting for final decision.</div>
          ) : null}
          {filteredQueue.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="CAO approval queue">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Status</th>
                    <th>Department</th>
                    <th>Updated</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <strong>{report.title}</strong>
                        <div className="muted">{report.reportNumber ?? report.id.slice(0, 8)}</div>
                      </td>
                      <td>
                        <StatusBadge status={report.workflowStatus} />
                      </td>
                      <td>{report.department ?? 'General Administration'}</td>
                      <td>{formatDate(report.updatedAt)}</td>
                      <td>
                        <div className="page-actions">
                          <button
                            type="button"
                            className="btn"
                            onClick={() => void handleApprove(report.id)}
                            disabled={pendingReportId === report.id}
                          >
                            {pendingReportId === report.id && pendingAction === 'approve'
                              ? 'Finalizing...'
                              : 'Approve for Publication'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => void handleReject(report.id)}
                            disabled={pendingReportId === report.id}
                          >
                            {pendingReportId === report.id && pendingAction === 'reject'
                              ? 'Returning...'
                              : 'Return for Revision'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-quiet"
                            onClick={() => setSelectedReport(report)}
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>

      {selectedReport ? (
        <WorkflowHistoryPanel
          reportId={selectedReport.id}
          reportTitle={selectedReport.title}
          onClose={() => setSelectedReport(null)}
        />
      ) : null}
    </AppShell>
  );
}
