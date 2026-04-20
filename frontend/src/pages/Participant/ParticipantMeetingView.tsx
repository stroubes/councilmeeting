import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMeetingById } from '../../api/meetings.api';
import { listAgendas } from '../../api/agendas.api';
import type { MeetingRecord } from '../../api/types/meeting.types';
import type { AgendaRecord } from '../../api/types/agenda.types';
import AppShell from '../../components/layout/AppShell';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import MeetingTypeBadge from '../../components/ui/MeetingTypeBadge';
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

export default function ParticipantMeetingView(): JSX.Element {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [agendas, setAgendas] = useState<AgendaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!meetingId) return;
      setIsLoading(true);
      setError(null);
      try {
        const [meetingData, agendaData] = await Promise.all([
          getMeetingById(meetingId),
          listAgendas(meetingId),
        ]);
        setMeeting(meetingData);
        setAgendas(agendaData);
      } catch {
        setError('Could not load meeting details.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [meetingId]);

  if (isLoading) {
    return (
      <AppShell title="Meeting Details" subtitle="Loading...">
        <p className="muted">Loading meeting...</p>
      </AppShell>
    );
  }

  if (error || !meeting) {
    return (
      <AppShell title="Meeting Details" subtitle="Error">
        <p className="inline-alert">{error ?? 'Meeting not found.'}</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={meeting.title}
      subtitle="Council Member View"
    >
      {error ? <p className="inline-alert">{error}</p> : null}

      <Card>
        <CardHeader title="Meeting Information" />
        <CardBody>
          <dl className="details-list">
            <div>
              <dt>Status</dt>
              <dd><StatusBadge status={meeting.status} /></dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd><MeetingTypeBadge code={meeting.meetingTypeCode} /></dd>
            </div>
            <div>
              <dt>Start Time</dt>
              <dd>{formatDateTime(meeting.startsAt)}</dd>
            </div>
            {meeting.endsAt && (
              <div>
                <dt>End Time</dt>
                <dd>{formatDateTime(meeting.endsAt)}</dd>
              </div>
            )}
            <div>
              <dt>Location</dt>
              <dd>{meeting.location ?? 'Not specified'}</dd>
            </div>
            <div>
              <dt>Visibility</dt>
              <dd>{meeting.isInCamera ? 'In Camera' : meeting.isPublic ? 'Public' : 'Internal'}</dd>
            </div>
            {meeting.videoUrl && (
              <div>
                <dt>Video</dt>
                <dd><a href={meeting.videoUrl} target="_blank" rel="noopener noreferrer">Join Video</a></dd>
              </div>
            )}
          </dl>
        </CardBody>
      </Card>

      {agendas.length === 0 ? (
        <Card>
          <CardHeader title="Agenda Items" />
          <CardBody>
            <div className="empty-state">No agenda items have been published for this meeting yet.</div>
          </CardBody>
        </Card>
      ) : (
        agendas.map((agenda) => (
          <Card key={agenda.id}>
            <CardHeader
              title={agenda.title}
              description={`${agenda.items.length} item${agenda.items.length !== 1 ? 's' : ''}`}
            />
            <CardBody>
              {agenda.items.length === 0 ? (
                <div className="empty-state">No items in this agenda.</div>
              ) : (
                <DataTable
                  columns={[
                    {
                      key: 'itemNumber',
                      header: '#',
                      render: (item) => item.itemNumber ?? '—',
                    },
                    {
                      key: 'title',
                      header: 'Item',
                      render: (item) => (
                        <Link to={`/participant/agendas/${item.id}`}>
                          <strong>{item.title}</strong>
                        </Link>
                      ),
                    },
                    {
                      key: 'itemType',
                      header: 'Type',
                      render: (item) => item.itemType,
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (item) => <StatusBadge status={item.status} />,
                    },
                    {
                      key: 'actions',
                      header: 'Actions',
                      render: (item) => (
                        <Link className="btn btn-quiet" to={`/participant/agendas/${item.id}`}>
                          View & Declare COI
                        </Link>
                      ),
                    },
                  ]}
                  data={agenda.items}
                  rowKey={(item) => item.id}
                  emptyMessage="No items."
                />
              )}
            </CardBody>
          </Card>
        ))
      )}
    </AppShell>
  );
}

function DataTable({ columns, data, rowKey, emptyMessage }: {
  columns: Array<{ key: string; header: string; render: (row: any) => JSX.Element | string }>;
  data: any[];
  rowKey: (row: any) => string;
  emptyMessage: string;
}): JSX.Element {
  if (data.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table" aria-label="Data table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.key}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
