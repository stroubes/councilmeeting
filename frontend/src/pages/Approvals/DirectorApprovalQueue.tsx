import { useEffect, useMemo, useState } from 'react';
import { approveReportByDirector, getDirectorQueue, rejectReportByDirector } from '../../api/workflows.api';
import type { StaffReportRecord } from '../../api/types/report.types';
import AppShell from '../../components/layout/AppShell';
import StatusBadge from '../../components/ui/StatusBadge';
import WorkflowHistoryPanel from '../../components/ui/WorkflowHistoryPanel';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useToast } from '../../hooks/useToast';
import MetricTile from '../../components/ui/MetricTile';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DirectorApprovalQueue(): JSX.Element {
  const [queue, setQueue] = useState<StaffReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = usePersistentState('directorQueue.query', '');
  const [selectedReport, setSelectedReport] = useState<StaffReportRecord | null>(null);
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const { addToast } = useToast();

  const load = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDirectorQueue();
      setQueue(data);
    } catch {
      setError('Could not load Director approval queue.');
      addToast('Could not load Director queue.', 'error');
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
      await approveReportByDirector(reportId, { comments: 'Director approved.' });
      setQueue((current) => current.filter((report) => report.id !== reportId));
      addToast('Report approved and moved forward.', 'success');
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
      await rejectReportByDirector(reportId, { comments: 'Director rejected. Please revise.' });
      setQueue((current) => current.filter((report) => report.id !== reportId));
      addToast('Report rejected and returned for revision.', 'success');
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

  const urgentCount = queue.filter((report) => report.workflowStatus === 'PENDING_DIRECTOR_APPROVAL').length;

  return (
    <AppShell
      title="Director Approval Queue"
      subtitle="Department-level review and recommendation stage before executive review."
    >
      <section className="module-overview">
        <MetricTile
          variant="primary"
          label="Director Review Lane"
          value={queue.length}
          foot="Reports currently in director queue"
        />
        <MetricTile
          label="Awaiting Decision"
          value={urgentCount}
          foot="Pending direct action this cycle"
        />
      </section>

      <Card>
        <CardHeader
          title="Pending Director Actions"
          description="Approve to forward to CAO queue or reject for report revisions."
          actions={<span className="pill">{filteredQueue.length} visible</span>}
        />
        <CardBody>
          <div className="workspace-toolbar">
            <div className="workspace-toolbar-row">
              <input
                className="field"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search report title, number, or department"
                aria-label="Search director queue"
              />
              <span className="pill">Director lane</span>
            </div>
          </div>
          {isLoading ? <p className="muted">Loading director review queue...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}

          <DataTable
            columns={[
              {
                key: 'title',
                header: 'Report',
                render: (report: StaffReportRecord) => (
                  <>
                    <strong>{report.title}</strong>
                    <div className="muted">{report.reportNumber ?? report.id.slice(0, 8)}</div>
                  </>
                ),
              },
              {
                key: 'workflowStatus',
                header: 'Status',
                render: (report: StaffReportRecord) => <StatusBadge status={report.workflowStatus} />,
              },
              {
                key: 'department',
                header: 'Department',
                render: (report: StaffReportRecord) => report.department ?? 'General Administration',
              },
              {
                key: 'updatedAt',
                header: 'Updated',
                render: (report: StaffReportRecord) => formatDate(report.updatedAt),
              },
              {
                key: 'actions',
                header: 'Decision',
                render: (report: StaffReportRecord) => (
                  <div className="page-actions">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => void handleApprove(report.id)}
                      disabled={pendingReportId === report.id}
                    >
                      {pendingReportId === report.id && pendingAction === 'approve' ? 'Advancing...' : 'Advance to CAO'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => void handleReject(report.id)}
                      disabled={pendingReportId === report.id}
                    >
                      {pendingReportId === report.id && pendingAction === 'reject' ? 'Returning...' : 'Return for Revision'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-quiet"
                      onClick={() => setSelectedReport(report)}
                    >
                      History
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredQueue}
            isLoading={isLoading}
            emptyMessage="Director queue is clear. No reports are awaiting departmental decision."
            rowKey={(report) => report.id}
          />
        </CardBody>
      </Card>

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
