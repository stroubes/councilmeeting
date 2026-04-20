import { useEffect, useState } from 'react';
import { fetchMotionReport } from '../../api/reportGenerators.api';
import type { MotionReportEntry } from '../../api/types/report-generator.types';
import AppShell from '../../components/layout/AppShell';
import StatusBadge from '../../components/ui/StatusBadge';
import DataTable from '../../components/ui/DataTable';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MotionReport(): JSX.Element {
  const [report, setReport] = useState<MotionReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchMotionReport()
      .then((data) => setReport(data.map((r) => ({ ...r, id: r.motionId }))))
      .catch(() => setError('Could not load motion report.'))
      .finally(() => setIsLoading(false));
  }, []);

  const columns = [
    {
      key: 'meeting',
      header: 'Meeting',
      render: (row: MotionReportEntry) => (
        <div>
          <div className="fw-medium">{row.meetingTitle}</div>
          <div className="text-sm muted">{formatDate(row.meetingDate)}</div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Motion',
      render: (row: MotionReportEntry) => (
        <div>
          <div className="fw-medium">{row.title}</div>
          {row.body && <div className="text-sm muted" style={{ maxWidth: 300 }}>{row.body.slice(0, 80)}…</div>}
        </div>
      ),
    },
    { key: 'moverName', header: 'Mover' },
    {
      key: 'status',
      header: 'Status',
      render: (row: MotionReportEntry) => <StatusBadge status={row.status} />,
    },
    { key: 'outcome', header: 'Outcome' },
    { key: 'createdAt', header: 'Filed', render: (row: MotionReportEntry) => formatDate(row.createdAt) },
  ];

  return (
    <AppShell title="Motion Report" subtitle="All motions raised during council meetings">
      <Card>
        <CardHeader title="Motions" />
        <CardBody>
          {error ? <p className="inline-alert">{error}</p> : null}
          <DataTable
            columns={columns}
            data={report as (MotionReportEntry & { id: string })[]}
            isLoading={isLoading}
            emptyMessage="No motions found."
            rowKey={(row) => row.motionId}
          />
        </CardBody>
      </Card>
    </AppShell>
  );
}