import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listAgendas } from '../../api/agendas.api';
import { getMeetingById, listMeetings } from '../../api/meetings.api';
import type { AgendaRecord } from '../../api/types/agenda.types';
import type { MeetingRecord } from '../../api/types/meeting.types';
import AppShell from '../../components/layout/AppShell';
import StatusBadge from '../../components/ui/StatusBadge';

function formatDateTime(value?: string): string {
  if (!value) {
    return 'Not scheduled';
  }
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MeetingDetails(): JSX.Element {
  const { meetingId } = useParams();
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [agendas, setAgendas] = useState<AgendaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!meetingId) {
        setError('Meeting id is missing from route.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const relatedAgendasPromise = listAgendas(meetingId);

        let matchedMeeting: MeetingRecord | null = null;
        try {
          matchedMeeting = await getMeetingById(meetingId);
        } catch {
          const allMeetings = await listMeetings();
          matchedMeeting = allMeetings.find((entry) => entry.id === meetingId) ?? null;
        }

        const relatedAgendas = await relatedAgendasPromise;

        if (!matchedMeeting) {
          setError('Meeting could not be found.');
        }

        setMeeting(matchedMeeting);
        setAgendas(relatedAgendas);
      } catch {
        setError('Could not load meeting details.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [meetingId]);

  const agendaItemCount = useMemo(
    () => agendas.reduce((total, agenda) => total + agenda.items.length, 0),
    [agendas],
  );

  return (
    <AppShell title="Meeting Details" subtitle="Detailed meeting timeline, agenda package, and supporting records.">
      <section className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">Agendas Linked</p>
          <p className="stat-value">{agendas.length}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Agenda Items</p>
          <p className="stat-value">{agendaItemCount}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Visibility</p>
          <p className="stat-value">{meeting?.isInCamera ? 'In-Camera' : 'Public'}</p>
        </article>
      </section>

      {isLoading ? <p className="muted">Loading meeting details...</p> : null}
      {error ? <p className="inline-alert">{error}</p> : null}

      {!isLoading && !error && meeting ? (
        <section className="split-grid">
          <article className="card">
            <header className="card-header">
              <div>
                <h2>{meeting.title}</h2>
                <p>{meeting.description ?? 'No meeting description provided.'}</p>
              </div>
              <StatusBadge status={meeting.status} />
            </header>
            <div className="card-body">
              <ul className="timeline-list">
                <li className="timeline-item">
                  <h4>Schedule</h4>
                  <p>
                    Starts {formatDateTime(meeting.startsAt)} and ends {formatDateTime(meeting.endsAt)}.
                  </p>
                </li>
                <li className="timeline-item">
                  <h4>Location</h4>
                  <p>{meeting.location ?? 'Location not yet confirmed.'}</p>
                </li>
                <li className="timeline-item">
                  <h4>Meeting Type</h4>
                  <p>{meeting.meetingTypeCode}</p>
                </li>
              </ul>
            </div>
          </article>

          <article className="card">
            <header className="card-header">
              <div>
                <h3>Agenda Packages</h3>
                <p>All agenda versions currently associated with this meeting.</p>
              </div>
            </header>
            <div className="card-body">
              {agendas.length === 0 ? (
                <div className="empty-state">No agendas have been linked to this meeting yet.</div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table" aria-label="Meeting agendas">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Version</th>
                        <th>Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agendas.map((agenda) => (
                        <tr key={agenda.id}>
                          <td>{agenda.title}</td>
                          <td>
                            <StatusBadge status={agenda.status} />
                          </td>
                          <td>v{agenda.version}</td>
                          <td>{agenda.items.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="page-actions content-actions">
                <Link className="btn" to="/agendas">
                  Open Agenda Register
                </Link>
                <Link className="btn" to="/reports">
                  Open Staff Reports
                </Link>
                <Link className="btn" to="/motions">
                  Open Motion Console
                </Link>
                <Link className="btn" to={`/public/live-meeting/${meeting.id}`} target="_blank" rel="noreferrer">
                  Open Public Meeting Screen
                </Link>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {!isLoading && !meeting && !error ? (
        <section className="card">
          <div className="card-body">
            <div className="empty-state">No meeting data is available for this route.</div>
          </div>
        </section>
      ) : null}

      {!isLoading && error ? (
        <section className="card">
          <div className="card-body">
            <div className="empty-state">Try returning to the Meetings register and selecting a valid entry.</div>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
