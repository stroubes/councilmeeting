import { useEffect, useMemo, useState } from 'react';
import {
  approveReportByCurrentStage,
  getMyQueue,
  rejectReportByCurrentStage,
} from '../../api/workflows.api';
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

export default function MyApprovalQueue(): JSX.Element {
  const [queue, setQueue] = useState<StaffReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = usePersistentState('myApprovalQueue.query', '');
  const [selectedReport, setSelectedReport] = useState<StaffReportRecord | null>(null);
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const { addToast } = useToast();

  const load = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyQueue();
      setQueue(data);
    } catch {
      setError('Could not load your approval queue.');
      addToast('Could not load your approval queue.', 'error');
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
      await approveReportByCurrentStage(reportId, { comments: 'Approved in role queue.' });
      setQueue((current) => current.filter((report) => report.id !== reportId));
      addToast('Report approved.', 'success');
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
      await rejectReportByCurrentStage(reportId, { comments: 'Rejected in role queue. Please revise.' });
      setQueue((current) => current.filter((report) => report.id !== reportId));
      addToast('Report rejected for revision.', 'success');
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
          (report.reportNumber ?? '').toLowerCase().includes(search) ||
          (report.currentWorkflowStageKey ?? '').toLowerCase().includes(search)
        );
      }),
    [queue, query],
  );

  return (
    <AppShell
      title="My Approval Queue"
      subtitle="Role-based approvals from configurable workflow stages."
    >
      <section className="module-overview">
        <MetricTile
          variant="primary"
          label="Assigned Reports"
          value={queue.length}
          foot="Items currently routed to your role"
        />
      </section>

      <Card>
        <CardHeader
          title="Pending Role Approvals"
          description="Approve to advance to the next configured stage or reject for revision."
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
                placeholder="Search title, number, department, or stage"
                aria-label="Search my approval queue"
              />
              <span className="pill">Role queue</span>
            </div>
          </div>

          {isLoading ? <p className="muted">Loading your queue...</p> : null}
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
                key: 'currentWorkflowStageKey',
                header: 'Stage',
                render: (report: StaffReportRecord) =>
                  report.currentWorkflowStageKey ?? report.currentWorkflowApproverRole ?? 'Current stage',
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
                      {pendingReportId === report.id && pendingAction === 'approve' ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => void handleReject(report.id)}
                      disabled={pendingReportId === report.id}
                    >
                      {pendingReportId === report.id && pendingAction === 'reject' ? 'Rejecting...' : 'Reject'}
                    </button>
                    <button type="button" className="btn btn-quiet" onClick={() => setSelectedReport(report)}>
                      History
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredQueue}
            isLoading={isLoading}
            emptyMessage="No reports are currently routed to your role."
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
