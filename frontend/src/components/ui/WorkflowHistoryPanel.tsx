import { useEffect, useState } from 'react';
import { getReportWorkflowHistory } from '../../api/workflows.api';
import type { ReportApprovalEvent } from '../../api/types/workflow.types';

interface WorkflowHistoryPanelProps {
  reportId: string;
  reportTitle: string;
  onClose: () => void;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function WorkflowHistoryPanel({
  reportId,
  reportTitle,
  onClose,
}: WorkflowHistoryPanelProps): JSX.Element {
  const [events, setEvents] = useState<ReportApprovalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getReportWorkflowHistory(reportId);
        setEvents(data);
      } catch {
        setError('Could not load workflow history for this report.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [reportId]);

  return (
    <section className="card panel-card" aria-live="polite">
      <header className="card-header">
        <div>
          <h3>Workflow History</h3>
          <p>{reportTitle}</p>
        </div>
        <button type="button" className="btn btn-quiet" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="card-body">
        {isLoading ? <p className="muted">Loading event history...</p> : null}
        {error ? <p className="inline-alert">{error}</p> : null}
        {!isLoading && !error && events.length === 0 ? (
          <div className="empty-state">No workflow events found for this report.</div>
        ) : null}
        {events.length > 0 ? (
          <ul className="timeline-list">
            {events.map((event) => (
              <li key={event.id} className="timeline-item">
                <h4>
                  {event.stage} - {event.action}
                </h4>
                <p>{formatTimestamp(event.actedAt)}</p>
                {event.comments ? <p>{event.comments}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
