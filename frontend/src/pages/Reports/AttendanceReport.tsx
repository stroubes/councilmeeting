import { useEffect, useState } from 'react';
import { fetchAttendanceReport } from '../../api/reportGenerators.api';
import type { AttendanceMeetingEntry } from '../../api/types/report-generator.types';
import AppShell from '../../components/layout/AppShell';
import DataTable from '../../components/ui/DataTable';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AttendanceReport(): JSX.Element {
  const [report, setReport] = useState<AttendanceMeetingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchAttendanceReport()
      .then((data) => setReport(data.map((r) => ({ ...r, id: r.meetingId }))))
      .catch(() => setError('Could not load attendance report.'))
      .finally(() => setIsLoading(false));
  }, []);

  const columns = [
    {
      key: 'meetingTitle',
      header: 'Meeting',
      render: (row: AttendanceMeetingEntry) => (
        <div>
          <div className="fw-medium">{row.meetingTitle}</div>
          <div className="text-sm muted">{formatDate(row.meetingDate)}</div>
        </div>
      ),
    },
    { key: 'meetingType', header: 'Type' },
    { key: 'status', header: 'Status' },
    {
      key: 'attendees',
      header: 'Present',
      render: (row: AttendanceMeetingEntry) => row.attendees.length,
    },
    {
      key: 'absent',
      header: 'Absent',
      render: (row: AttendanceMeetingEntry) => row.absentMembers.length,
    },
    {
      key: 'attendeeNames',
      header: 'Attendees',
      render: (row: AttendanceMeetingEntry) =>
        row.attendees.map((a) => a.displayName).join(', ') || '—',
    },
  ];

  return (
    <AppShell title="Attendance Report" subtitle="Council member attendance across meetings">
      <Card>
        <CardHeader title="Attendance by Meeting" />
        <CardBody>
          {error ? <p className="inline-alert">{error}</p> : null}
          <DataTable
            columns={columns}
            data={report as (AttendanceMeetingEntry & { id: string })[]}
            isLoading={isLoading}
            emptyMessage="No attendance records found."
            rowKey={(row) => row.meetingId}
          />
        </CardBody>
      </Card>
    </AppShell>
  );
}