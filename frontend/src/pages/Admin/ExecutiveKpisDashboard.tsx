import { useEffect, useState } from 'react';
import { getExecutiveKpis } from '../../api/analytics.api';
import type { ExecutiveKpiSnapshot } from '../../api/types/analytics.types';
import AppShell from '../../components/layout/AppShell';
import { useToast } from '../../hooks/useToast';
import MetricTile from '../../components/ui/MetricTile';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';

export default function ExecutiveKpisDashboard(): JSX.Element {
  const [kpis, setKpis] = useState<ExecutiveKpiSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const load = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getExecutiveKpis();
      setKpis(data);
    } catch {
      setError('Could not load executive KPI dashboard data.');
      addToast('Could not load executive KPI dashboard data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <AppShell
      title="Executive KPI Dashboard"
      subtitle="Leadership scorecard for cycle-time, approvals pressure, publication performance, and digest outcomes."
      workspaceVariant="admin"
      actions={
        <button type="button" className="btn" disabled={isLoading} onClick={() => void load()}>
          {isLoading ? 'Refreshing...' : 'Refresh KPIs'}
        </button>
      }
    >
      {isLoading ? <p className="muted">Loading executive KPI data...</p> : null}
      {error ? <p className="inline-alert">{error}</p> : null}

      <section className="module-overview">
        <MetricTile
          label="Total Approval Pressure"
          value={kpis?.approvals.totalPending ?? 0}
          foot={`Director ${kpis?.approvals.directorPending ?? 0} / CAO ${kpis?.approvals.caoPending ?? 0}`}
          icon="alert-triangle"
          variant="primary"
        />
        <MetricTile
          label="Median Report Cycle"
          value={`${kpis?.cycleTimeHours.reportMedian ?? 0}h`}
          foot="Created to publication median for published reports"
          icon="clock"
        />
        <MetricTile
          label="Digest Delivery Rate"
          value={`${kpis?.digest.deliveryRate ?? 0}%`}
          foot="Public watchlist digest delivery success"
          icon="check-circle"
        />
      </section>

      <Card>
        <CardHeader
          title="Publication and Cycle Performance"
          description="Coverage and throughput indicators across agendas, reports, and minutes publication pipeline."
        />
        <CardBody>
          {kpis ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="Publication KPI table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Context</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Agenda Publication Coverage</td>
                    <td>{kpis.publicationCoverage.agendasPublishedPct}%</td>
                    <td>Published agendas out of total agendas</td>
                  </tr>
                  <tr>
                    <td>Report Publication Coverage</td>
                    <td>{kpis.publicationCoverage.reportsPublishedPct}%</td>
                    <td>Published reports out of total reports</td>
                  </tr>
                  <tr>
                    <td>Minutes Publication Coverage</td>
                    <td>{kpis.publicationCoverage.minutesPublishedPct}%</td>
                    <td>Published minutes out of total minutes records</td>
                  </tr>
                  <tr>
                    <td>Median Agenda Cycle</td>
                    <td>{kpis.cycleTimeHours.agendaMedian}h</td>
                    <td>Create-to-publish median for published agendas</td>
                  </tr>
                  <tr>
                    <td>Median Report Cycle</td>
                    <td>{kpis.cycleTimeHours.reportMedian}h</td>
                    <td>Create-to-publish median for published reports</td>
                  </tr>
                  <tr>
                    <td>Median Minutes Cycle</td>
                    <td>{kpis.cycleTimeHours.minutesMedian}h</td>
                    <td>Create-to-publish median for published minutes</td>
                  </tr>
                  <tr>
                    <td>Reports Approved or Published</td>
                    <td>{kpis.reportWorkflow.approvedOrPublishedRate}%</td>
                    <td>Quality of report workflow progression</td>
                  </tr>
                  <tr>
                    <td>Report Rejection Rate</td>
                    <td>{kpis.reportWorkflow.rejectedRate}%</td>
                    <td>Rejection proportion in workflow</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Publication Trend (Last 6 Months)"
          description="Monthly release momentum to benchmark consistency across councils and quarters."
        />
        <CardBody>
          {kpis ? (
            <DataTable
              rowKey={(row) => (row as unknown as { month: string }).month}
              data={kpis.monthlyPublications as unknown as { id: string | number }[]}
              columns={[
                { key: 'month', header: 'Month' },
                { key: 'agendas', header: 'Agendas' },
                { key: 'reports', header: 'Reports' },
                { key: 'minutes', header: 'Minutes' },
                {
                  key: 'total',
                  header: 'Total',
                  render: (row) => (row as unknown as { agendas: number; reports: number; minutes: number }).agendas +
                    (row as unknown as { agendas: number; reports: number; minutes: number }).reports +
                    (row as unknown as { agendas: number; reports: number; minutes: number }).minutes,
                },
              ]}
              emptyMessage="No publication trend data available."
            />
          ) : null}
        </CardBody>
      </Card>
    </AppShell>
  );
}
