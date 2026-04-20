import { useEffect, useState } from 'react';
import { fetchConflictReport } from '../../api/reportGenerators.api';
import type { ConflictReportEntry } from '../../api/types/report-generator.types';
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

export default function ConflictReport(): JSX.Element {
  const [report, setReport] = useState<ConflictReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchConflictReport()
      .then((data) => setReport(data.map((r) => ({ ...r, id: r.declarationId }))))
      .catch(() => setError('Could not load conflict of interest report.'))
      .finally(() => setIsLoading(false));
  }, []);

  const columns = [
    {
      key: 'meeting',
      header: 'Meeting',
      render: (row: ConflictReportEntry) => (
        <div>
          <div className="fw-medium">{row.meetingTitle}</div>
          <div className="text-sm muted">{formatDate(row.meetingDate)}</div>
        </div>
      ),
    },
    { key: 'userName', header: 'Member' },
    {
      key: 'agendaItem',
      header: 'Agenda Item',
      render: (row: ConflictReportEntry) => row.agendaItemTitle ?? '—',
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (row: ConflictReportEntry) => row.reason ?? '—',
    },
    { key: 'declaredAt', header: 'Declared', render: (row: ConflictReportEntry) => formatDate(row.declaredAt) },
  ];

  return (
    <AppShell
      title="Conflict of Interest Report"
      subtitle="Declared conflicts of interest across meetings"
    >
      <Card>
        <CardHeader title="COI Declarations" />
        <CardBody>
          {error ? <p className="inline-alert">{error}</p> : null}
          <DataTable
            columns={columns}
            data={report as (ConflictReportEntry & { id: string })[]}
            isLoading={isLoading}
            emptyMessage="No conflict of interest declarations found."
            rowKey={(row) => row.declarationId}
          />
        </CardBody>
      </Card>
    </AppShell>
  );
}