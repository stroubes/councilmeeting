import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createMinutes, finalizeMinutes, listMinutes, publishMinutes, startMinutes } from '../../api/minutes.api';
import { listMeetings } from '../../api/meetings.api';
import type { MinutesRecord } from '../../api/types/minutes.types';
import type { MeetingRecord } from '../../api/types/meeting.types';
import AppShell from '../../components/layout/AppShell';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../hooks/useToast';

function buildDefaultMinutesContent() {
  return {
    schemaVersion: 1 as const,
    summary: '',
    attendance: [],
    motions: [],
    votes: [],
    actionItems: [],
    notes: [],
  };
}

export default function MinutesRegister(): JSX.Element {
  const [minutes, setMinutes] = useState<MinutesRecord[]>([]);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [meetingId, setMeetingId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const { addToast } = useToast();

  const load = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [minutesData, meetingData] = await Promise.all([listMinutes(), listMeetings()]);
      setMinutes(minutesData);
      setMeetings(meetingData);
      if (!meetingId && meetingData.length > 0) {
        setMeetingId(meetingData[0].id);
      }
    } catch {
      setError('Could not load minutes register.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!meetingId) {
      addToast('Select a meeting before creating minutes.', 'error');
      return;
    }

    try {
      await createMinutes({ meetingId, contentJson: buildDefaultMinutesContent() });
      await load();
      addToast('Minutes record created.', 'success');
    } catch {
      setError('Could not create minutes.');
      addToast('Could not create minutes.', 'error');
    }
  };

  const runAction = async (
    minutesId: string,
    action: 'start' | 'finalize' | 'publish',
  ): Promise<void> => {
    setPendingAction(`${minutesId}:${action}`);
    setError(null);
    try {
      if (action === 'start') {
        await startMinutes(minutesId);
      } else if (action === 'finalize') {
        await finalizeMinutes(minutesId);
      } else {
        await publishMinutes(minutesId);
      }
      await load();
      addToast(`Minutes ${action} action completed.`, 'success');
    } catch {
      setError(`Could not ${action} minutes.`);
      addToast(`Could not ${action} minutes.`, 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const publishedCount = useMemo(
    () => minutes.filter((record) => record.status === 'PUBLISHED').length,
    [minutes],
  );

  return (
    <AppShell
      title="Minutes"
      subtitle="Minute taking lifecycle from draft through finalized and published."
      actions={
        <form onSubmit={(event) => void handleCreate(event)} className="page-actions">
          <select className="field" value={meetingId} onChange={(event) => setMeetingId(event.target.value)}>
            {meetings.map((meeting) => (
              <option key={meeting.id} value={meeting.id}>
                {meeting.title}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Create Minutes
          </button>
        </form>
      }
    >
      <section className="module-overview">
        <article className="metric-tile metric-tile-primary">
          <p className="metric-label">Minutes Records</p>
          <p className="metric-value">{minutes.length}</p>
          <p className="metric-foot">Tracked across council meetings</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Published</p>
          <p className="metric-value">{publishedCount}</p>
          <p className="metric-foot">Released to the public portal</p>
        </article>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>
              <span className="panel-icon">MIN</span>
              Minutes Register
            </h2>
            <p>Track minute taking status and publishing readiness.</p>
          </div>
        </header>
        <div className="card-body">
          {isLoading ? <p className="muted">Loading minutes operations...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && minutes.length === 0 ? (
            <div className="empty-state">No minutes records yet. Start by creating minutes for the next meeting.</div>
          ) : null}
          {minutes.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="Minutes register">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Status</th>
                    <th>Attendance</th>
                    <th>Motions</th>
                    <th>Action Items</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {minutes.map((record) => {
                    const actionKey = (action: string) => `${record.id}:${action}`;
                    const meeting = meetings.find((entry) => entry.id === record.meetingId);
                    return (
                      <tr key={record.id}>
                        <td>{meeting?.title ?? record.meetingId.slice(0, 8)}</td>
                        <td>
                          <StatusBadge status={record.status} />
                        </td>
                        <td>{record.contentJson.attendance.filter((entry) => entry.present).length}</td>
                        <td>{record.contentJson.motions.length}</td>
                        <td>{record.contentJson.actionItems.length}</td>
                        <td>{new Date(record.updatedAt).toLocaleString()}</td>
                        <td>
                          <div className="page-actions">
                            {record.status === 'DRAFT' ? (
                              <button
                                type="button"
                                className="btn"
                                disabled={pendingAction === actionKey('start')}
                                onClick={() => void runAction(record.id, 'start')}
                              >
                                Begin Session
                              </button>
                            ) : null}
                            {record.status === 'DRAFT' || record.status === 'IN_PROGRESS' ? (
                              <button
                                type="button"
                                className="btn"
                                disabled={pendingAction === actionKey('finalize')}
                                onClick={() => void runAction(record.id, 'finalize')}
                              >
                                Finalize Draft
                              </button>
                            ) : null}
                            {record.status === 'FINALIZED' ? (
                              <button
                                type="button"
                                className="btn btn-primary"
                                disabled={pendingAction === actionKey('publish')}
                                onClick={() => void runAction(record.id, 'publish')}
                              >
                                Publish
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
