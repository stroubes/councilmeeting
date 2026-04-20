import { useEffect, useState } from 'react';
import { fetchForecastReport } from '../../api/reportGenerators.api';
import type { ForecastReportEntry } from '../../api/types/report-generator.types';
import AppShell from '../../components/layout/AppShell';
import StatusBadge from '../../components/ui/StatusBadge';
import DataTable from '../../components/ui/DataTable';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ForecastReport(): JSX.Element {
  const [report, setReport] = useState<ForecastReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchForecastReport()
      .then((data) => setReport(data.map((r) => ({ ...r, id: r.meetingId }))))
      .catch(() => setError('Could not load forecast report.'))
      .finally(() => setIsLoading(false));
  }, []);

  const columns = [
    {
      key: 'title',
      header: 'Meeting',
      render: (row: ForecastReportEntry) => <span className="fw-medium">{row.title}</span>,
    },
    { key: 'meetingType', header: 'Type' },
    { key: 'startsAt', header: 'Scheduled', render: (row: ForecastReportEntry) => formatDate(row.startsAt) },
    { key: 'location', header: 'Location' },
    {
      key: 'status',
      header: 'Status',
      render: (row: ForecastReportEntry) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <AppShell title="Meeting Forecast" subtitle="Upcoming scheduled meetings">
      <Card>
        <CardHeader title="Scheduled Meetings" />
        <CardBody>
          {error ? <p className="inline-alert">{error}</p> : null}
          <DataTable
            columns={columns}
            data={report as (ForecastReportEntry & { id: string })[]}
            isLoading={isLoading}
            emptyMessage="No upcoming meetings scheduled."
            rowKey={(row) => row.meetingId}
          />
        </CardBody>
      </Card>
    </AppShell>
  );
}