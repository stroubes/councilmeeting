import { useEffect, useState } from 'react';
import { getExecutiveKpis } from '../../api/analytics.api';
import type { ExecutiveKpiSnapshot } from '../../api/types/analytics.types';
import AppShell from '../../components/layout/AppShell';
import { useToast } from '../../hooks/useToast';

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
        <article className="metric-tile metric-tile-primary">
          <p className="metric-label">Total Approval Pressure</p>
          <p className="metric-value">{kpis?.approvals.totalPending ?? 0}</p>
          <p className="metric-foot">
            Director {kpis?.approvals.directorPending ?? 0} / CAO {kpis?.approvals.caoPending ?? 0}
          </p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Median Report Cycle</p>
          <p className="metric-value">{kpis?.cycleTimeHours.reportMedian ?? 0}h</p>
          <p className="metric-foot">Created to publication median for published reports</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Digest Delivery Rate</p>
          <p className="metric-value">{kpis?.digest.deliveryRate ?? 0}%</p>
          <p className="metric-foot">Public watchlist digest delivery success</p>
        </article>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>
              <span className="panel-icon">KPI</span>
              Publication and Cycle Performance
            </h2>
            <p>Coverage and throughput indicators across agendas, reports, and minutes publication pipeline.</p>
          </div>
        </header>
        <div className="card-body">
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
        </div>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>
              <span className="panel-icon">TRN</span>
              Publication Trend (Last 6 Months)
            </h2>
            <p>Monthly release momentum to benchmark consistency across councils and quarters.</p>
          </div>
        </header>
        <div className="card-body">
          {kpis ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="Monthly publication trend">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Agendas</th>
                    <th>Reports</th>
                    <th>Minutes</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.monthlyPublications.map((row) => (
                    <tr key={row.month}>
                      <td>{row.month}</td>
                      <td>{row.agendas}</td>
                      <td>{row.reports}</td>
                      <td>{row.minutes}</td>
                      <td>{row.agendas + row.reports + row.minutes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
