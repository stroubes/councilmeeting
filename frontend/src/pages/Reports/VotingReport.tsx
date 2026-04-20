import { useEffect, useState } from 'react';
import { fetchVotingReport } from '../../api/reportGenerators.api';
import type { VotingReportEntry } from '../../api/types/report-generator.types';
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

function VoteBadge({ value }: { value: string }): JSX.Element {
  const classMap: Record<string, string> = {
    YEA: 'badge badge-success',
    NAY: 'badge badge-danger',
    ABSTAIN: 'badge badge-neutral',
    ABSENT: 'badge badge-muted',
  };
  return <span className={classMap[value] ?? 'badge'}>{value}</span>;
}

export default function VotingReport(): JSX.Element {
  const [report, setReport] = useState<VotingReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchVotingReport()
      .then((data) => setReport(data.map((r) => ({ ...r, id: r.voteId }))))
      .catch(() => setError('Could not load voting report.'))
      .finally(() => setIsLoading(false));
  }, []);

  const columns = [
    {
      key: 'meeting',
      header: 'Meeting',
      render: (row: VotingReportEntry) => (
        <div>
          <div className="fw-medium">{row.meetingTitle}</div>
          <div className="text-sm muted">{formatDate(row.meetingDate)}</div>
        </div>
      ),
    },
    {
      key: 'motion',
      header: 'Motion',
      render: (row: VotingReportEntry) => <span className="fw-medium">{row.motionTitle}</span>,
    },
    { key: 'memberName', header: 'Member' },
    {
      key: 'voteValue',
      header: 'Vote',
      render: (row: VotingReportEntry) => <VoteBadge value={row.voteValue} />,
    },
    {
      key: 'coi',
      header: 'COI',
      render: (row: VotingReportEntry) => (row.isConflictDeclared ? 'Yes' : '—'),
    },
    { key: 'votedAt', header: 'Recorded', render: (row: VotingReportEntry) => formatDate(row.votedAt) },
  ];

  return (
    <AppShell title="Voting Report" subtitle="Individual voting records for all motions">
      <Card>
        <CardHeader title="Votes" />
        <CardBody>
          {error ? <p className="inline-alert">{error}</p> : null}
          <DataTable
            columns={columns}
            data={report as (VotingReportEntry & { id: string })[]}
            isLoading={isLoading}
            emptyMessage="No voting records found."
            rowKey={(row) => row.voteId}
          />
        </CardBody>
      </Card>
    </AppShell>
  );
}