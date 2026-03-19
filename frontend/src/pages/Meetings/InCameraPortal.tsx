import { useEffect, useState } from 'react';
import { listMeetings } from '../../api/meetings.api';
import type { MeetingRecord } from '../../api/types/meeting.types';
import AppShell from '../../components/layout/AppShell';
import StatusBadge from '../../components/ui/StatusBadge';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function InCameraPortal(): JSX.Element {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listMeetings({ inCamera: true });
        setMeetings(data);
      } catch {
        setError('Could not load in-camera meetings.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <AppShell
      title="In-Camera Portal"
      subtitle="Restricted access area for confidential materials and closed-session records."
    >
      <section className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">Restricted Sessions</p>
          <p className="stat-value">{meetings.length}</p>
          <p className="stat-delta">Live feed from in-camera meeting endpoint</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Access Tier</p>
          <p className="stat-value">Permissioned</p>
          <p className="stat-delta">meeting.read.in_camera required</p>
        </article>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Confidential Workspace</h2>
            <p>Visible only to users with in-camera permissions.</p>
          </div>
        </header>
        <div className="card-body">
          {isLoading ? <p className="muted">Loading in-camera meetings...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && meetings.length === 0 ? (
            <div className="empty-state">No in-camera meetings are currently available.</div>
          ) : null}
          {meetings.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="In-camera meetings">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Status</th>
                    <th>Start Time</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting) => (
                    <tr key={meeting.id}>
                      <td>
                        <strong>{meeting.title}</strong>
                        <div className="muted">{meeting.meetingTypeCode}</div>
                      </td>
                      <td>
                        <StatusBadge status={meeting.status} />
                      </td>
                      <td>{formatDateTime(meeting.startsAt)}</td>
                      <td>{meeting.location ?? 'Not specified'}</td>
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
