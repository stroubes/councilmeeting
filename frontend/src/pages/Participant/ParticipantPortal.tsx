import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMeetings } from '../../api/meetings.api';
import type { MeetingRecord } from '../../api/types/meeting.types';
import AppShell from '../../components/layout/AppShell';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
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

export default function ParticipantPortal(): JSX.Element {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listMeetings();
        setMeetings(data);
      } catch {
        setError('Could not load your meetings.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const upcomingMeetings = meetings.filter(
    (m) => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS',
  );
  const pastMeetings = meetings.filter(
    (m) => m.status === 'ADJOURNED' || m.status === 'COMPLETED' || m.status === 'CANCELLED',
  );

  return (
    <AppShell
      title="Council Member Portal"
      subtitle="Your upcoming meetings, agenda items, and conflict of interest declarations."
    >
      {error ? <p className="inline-alert">{error}</p> : null}

      <Card>
        <CardHeader title="Upcoming Meetings" description="Scheduled and in-progress meetings you are attending." />
        <CardBody>
          {isLoading ? (
            <p className="muted">Loading your meetings...</p>
          ) : upcomingMeetings.length === 0 ? (
            <div className="empty-state">You have no upcoming meetings.</div>
          ) : (
            <DataTable
              columns={[
                {
                  key: 'title',
                  header: 'Meeting',
                  render: (meeting: MeetingRecord) => (
                    <Link to={`/participant/meetings/${meeting.id}`}>
                      <strong>{meeting.title}</strong>
                    </Link>
                  ),
                },
                {
                  key: 'meetingTypeCode',
                  header: 'Type',
                  render: (meeting: MeetingRecord) => (
                    <MeetingTypeBadge code={meeting.meetingTypeCode} />
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (meeting: MeetingRecord) => <StatusBadge status={meeting.status} />,
                },
                {
                  key: 'startsAt',
                  header: 'Start Time',
                  render: (meeting: MeetingRecord) => formatDateTime(meeting.startsAt),
                },
                {
                  key: 'location',
                  header: 'Location',
                  render: (meeting: MeetingRecord) => meeting.location ?? 'Not specified',
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (meeting: MeetingRecord) => (
                    <Link className="btn btn-quiet" to={`/participant/meetings/${meeting.id}`}>
                      View Agenda
                    </Link>
                  ),
                },
              ]}
              data={upcomingMeetings}
              rowKey={(meeting: MeetingRecord) => meeting.id}
              emptyMessage="No upcoming meetings."
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Past Meetings" description="Completed, adjourned, or cancelled meetings." />
        <CardBody>
          {isLoading ? (
            <p className="muted">Loading...</p>
          ) : pastMeetings.length === 0 ? (
            <div className="empty-state">No past meetings on record.</div>
          ) : (
            <DataTable
              columns={[
                {
                  key: 'title',
                  header: 'Meeting',
                  render: (meeting: MeetingRecord) => (
                    <Link to={`/participant/meetings/${meeting.id}`}>
                      <strong>{meeting.title}</strong>
                    </Link>
                  ),
                },
                {
                  key: 'meetingTypeCode',
                  header: 'Type',
                  render: (meeting: MeetingRecord) => (
                    <MeetingTypeBadge code={meeting.meetingTypeCode} />
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (meeting: MeetingRecord) => <StatusBadge status={meeting.status} />,
                },
                {
                  key: 'startsAt',
                  header: 'Start Time',
                  render: (meeting: MeetingRecord) => formatDateTime(meeting.startsAt),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (meeting: MeetingRecord) => (
                    <Link className="btn btn-quiet" to={`/participant/meetings/${meeting.id}`}>
                      View
                    </Link>
                  ),
                },
              ]}
              data={pastMeetings}
              rowKey={(meeting: MeetingRecord) => meeting.id}
              emptyMessage="No past meetings."
            />
          )}
        </CardBody>
      </Card>
    </AppShell>
  );
}
