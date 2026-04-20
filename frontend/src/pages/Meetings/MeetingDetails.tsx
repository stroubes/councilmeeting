import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listAgendas } from '../../api/agendas.api';
import { getMeetingById, listMeetings } from '../../api/meetings.api';
import { recordInCameraMinutes } from '../../api/minutes.api';
import type { AgendaRecord } from '../../api/types/agenda.types';
import type { MeetingRecord } from '../../api/types/meeting.types';
import AppShell from '../../components/layout/AppShell';
import MeetingTypeBadge from '../../components/ui/MeetingTypeBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import MetricTile from '../../components/ui/MetricTile';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import AttendeesPanel from '../../components/AttendeesPanel';
import RollCallVotingPanel from '../../components/RollCallVotingPanel';
import BylawsManagementPanel from '../../components/BylawsManagementPanel';
import ConflictDeclarationsPanel from '../../components/ConflictDeclarationsPanel';
import { useToast } from '../../hooks/useToast';

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
  const [isRecordingInCamera, setIsRecordingInCamera] = useState(false);
  const { addToast } = useToast();

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

  const handleRecordInCameraMinutes = async (): Promise<void> => {
    if (!meeting) return;
    setIsRecordingInCamera(true);
    try {
      await recordInCameraMinutes(meeting.id);
      addToast('In-camera minutes record created.', 'success');
    } catch {
      addToast('Could not create in-camera minutes record.', 'error');
    } finally {
      setIsRecordingInCamera(false);
    }
  };

  return (
    <AppShell title="Meeting Details" subtitle="Detailed meeting timeline, agenda package, and supporting records.">
      <section className="stats-grid">
        <MetricTile
          label="Agendas Linked"
          value={agendas.length}
          icon="file-text"
        />
        <MetricTile
          label="Agenda Items"
          value={agendaItemCount}
          icon="file-text"
        />
        <MetricTile
          label="Visibility"
          value={meeting?.isInCamera ? 'In-Camera' : 'Public'}
          icon={meeting?.isInCamera ? 'lock' : 'globe'}
        />
      </section>

      {!isLoading && !error && meeting?.isInCamera ? (
        <div className="page-actions" style={{ marginTop: 'var(--space-4)' }}>
          <button
            type="button"
            className="btn"
            disabled={isRecordingInCamera}
            onClick={() => void handleRecordInCameraMinutes()}
          >
            {isRecordingInCamera ? 'Creating Minutes...' : 'Record In-Camera Minutes'}
          </button>
        </div>
      ) : null}

      {isLoading ? <p className="muted">Loading meeting details...</p> : null}
      {error ? <p className="inline-alert">{error}</p> : null}

      {!isLoading && !error && meeting ? (
        <>
        <section className="split-grid">
          <Card>
            <CardHeader
              title={meeting.title}
              description={meeting.description ?? 'No meeting description provided.'}
              actions={<StatusBadge status={meeting.status} />}
            />
            <CardBody>
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
                  <MeetingTypeBadge code={meeting.meetingTypeCode} />
                </li>
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Agenda Packages"
              description="All agenda versions currently associated with this meeting."
            />
            <CardBody>
              {agendas.length === 0 ? (
                <div className="empty-state">No agendas have been linked to this meeting yet.</div>
              ) : (
                <DataTable
                  columns={[
                    { key: 'title', header: 'Title', render: (agenda: AgendaRecord) => agenda.title },
                    { key: 'status', header: 'Status', render: (agenda: AgendaRecord) => <StatusBadge status={agenda.status} /> },
                    { key: 'version', header: 'Version', render: (agenda: AgendaRecord) => `v${agenda.version}` },
                    { key: 'items', header: 'Items', render: (agenda: AgendaRecord) => agenda.items.length },
                  ]}
                  data={agendas}
                  rowKey={(agenda: AgendaRecord) => agenda.id}
                  emptyMessage="No agendas have been linked to this meeting yet."
                />
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
            </CardBody>
          </Card>
        </section>

        <AttendeesPanel meetingId={meeting.id} />
        <ConflictDeclarationsPanel meetingId={meeting.id} />
        <RollCallVotingPanel meetingId={meeting.id} />
        <BylawsManagementPanel meetingId={meeting.id} />
        </>
      ) : null}

      {!isLoading && !meeting && !error ? (
        <Card>
          <CardBody>
            <div className="empty-state">No meeting data is available for this route.</div>
          </CardBody>
        </Card>
      ) : null}

      {!isLoading && error ? (
        <Card>
          <CardBody>
            <div className="empty-state">Try returning to the Meetings register and selecting a valid entry.</div>
          </CardBody>
        </Card>
      ) : null}
    </AppShell>
  );
}
