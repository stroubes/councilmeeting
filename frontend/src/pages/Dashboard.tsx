import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { listAgendas } from '../api/agendas.api';
import { listMeetings } from '../api/meetings.api';
import { listReports } from '../api/reports.api';
import { getCaoQueue, getDirectorQueue } from '../api/workflows.api';
import { listMinutes } from '../api/minutes.api';
import { getPublicSummary } from '../api/public.api';
import type { AgendaRecord } from '../api/types/agenda.types';
import type { MeetingRecord } from '../api/types/meeting.types';
import type { StaffReportRecord } from '../api/types/report.types';
import StatusBadge from '../components/ui/StatusBadge';

export default function Dashboard(): JSX.Element {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [agendas, setAgendas] = useState<AgendaRecord[]>([]);
  const [reports, setReports] = useState<StaffReportRecord[]>([]);
  const [directorQueueCount, setDirectorQueueCount] = useState(0);
  const [caoQueueCount, setCaoQueueCount] = useState(0);
  const [minutesCount, setMinutesCount] = useState(0);
  const [publishedMinutesCount, setPublishedMinutesCount] = useState(0);
  const [publicReleaseCount, setPublicReleaseCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const [meetingData, agendaData, reportData, directorQueue, caoQueue, minutesData, publicSummary] = await Promise.all([
          listMeetings(),
          listAgendas(),
          listReports(),
          getDirectorQueue(),
          getCaoQueue(),
          listMinutes(),
          getPublicSummary(),
        ]);

        setMeetings(meetingData);
        setAgendas(agendaData);
        setReports(reportData);
        setDirectorQueueCount(directorQueue.length);
        setCaoQueueCount(caoQueue.length);
        setMinutesCount(minutesData.length);
        setPublishedMinutesCount(minutesData.filter((record) => record.status === 'PUBLISHED').length);
        setPublicReleaseCount(
          publicSummary.counts.meetings +
            publicSummary.counts.agendas +
            publicSummary.counts.reports +
            publicSummary.counts.minutes,
        );
      } catch {
        setError('Could not load dashboard metrics.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const publishedAgendas = agendas.filter((agenda) => agenda.status === 'PUBLISHED').length;
  const publishedReports = reports.filter((report) => report.workflowStatus === 'PUBLISHED').length;
  const publicationTotal = publishedAgendas + publishedReports + publishedMinutesCount;
  const publicationCoverage =
    meetings.length > 0 ? Math.min(100, Math.round((publicationTotal / Math.max(1, meetings.length)) * 100)) : 0;
  const approvalPressure = directorQueueCount + caoQueueCount;
  const upcomingMeetings = useMemo(
    () =>
      [...meetings]
        .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
        .slice(0, 5),
    [meetings],
  );

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <AppShell
      title="Municipal Operations Dashboard"
      subtitle="Workflow visibility across meetings, agendas, and report approvals."
    >
      {isLoading ? <p className="muted">Loading dashboard metrics...</p> : null}
      {error ? <p className="inline-alert">{error}</p> : null}

      <section className="executive-grid">
        <article className="briefing-card briefing-card-primary">
          <p className="briefing-label">Executive Session</p>
          <p className="briefing-value">{user?.displayName ?? user?.email ?? 'Unknown'}</p>
          <p className="briefing-note">Operational brief for {today}</p>
        </article>
        <article className="briefing-card">
          <p className="briefing-label">Approval Pressure</p>
          <p className="briefing-value">{approvalPressure}</p>
          <p className="briefing-note">Director {directorQueueCount} / CAO {caoQueueCount}</p>
        </article>
        <article className="briefing-card">
          <p className="briefing-label">Publication Coverage</p>
          <p className="briefing-value">{publicationCoverage}%</p>
          <p className="briefing-note">{publicationTotal} records released across agendas, reports, and minutes</p>
        </article>
        <article className="briefing-card">
          <p className="briefing-label">Public Releases</p>
          <p className="briefing-value">{publicReleaseCount}</p>
          <p className="briefing-note">Meeting, agenda, report, and minutes visibility</p>
        </article>
      </section>

      <section className="split-grid">
        <article className="card signal-panel">
          <header className="card-header">
            <div>
              <h2>Cycle Health Signals</h2>
              <p>Priority operating indicators for the current council cycle.</p>
            </div>
          </header>
          <div className="card-body signal-list">
            <div className="signal-row">
              <div>
                <p className="signal-title">Meeting Cadence</p>
                <p className="signal-meta">{meetings.length} sessions tracked in register</p>
              </div>
              <span className="pill">{meetings.length > 0 ? 'Active' : 'Setup needed'}</span>
            </div>
            <div className="signal-row">
              <div>
                <p className="signal-title">Agenda Readiness</p>
                <p className="signal-meta">{publishedAgendas} published / {agendas.length} total packages</p>
              </div>
              <div className="health-meter" aria-hidden="true">
                <span className="health-meter-fill" style={{ width: `${agendas.length > 0 ? (publishedAgendas / agendas.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="signal-row">
              <div>
                <p className="signal-title">Report Throughput</p>
                <p className="signal-meta">{publishedReports} published / {reports.length} total reports</p>
              </div>
              <div className="health-meter" aria-hidden="true">
                <span className="health-meter-fill" style={{ width: `${reports.length > 0 ? (publishedReports / reports.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="signal-row">
              <div>
                <p className="signal-title">Minutes Completion</p>
                <p className="signal-meta">{publishedMinutesCount} published / {minutesCount} total minutes records</p>
              </div>
              <div className="health-meter" aria-hidden="true">
                <span
                  className="health-meter-fill"
                  style={{ width: `${minutesCount > 0 ? (publishedMinutesCount / minutesCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </article>

        <article className="card">
          <header className="card-header">
            <div>
              <h3>Priority Actions</h3>
              <p>Fast paths for high-impact operational decisions.</p>
            </div>
          </header>
          <div className="card-body priority-grid">
            <Link className="priority-card" to="/approvals/director">
              <p className="priority-kicker">Director Queue</p>
              <h4>{directorQueueCount} items awaiting review</h4>
              <p>Process director-level approvals and rejections.</p>
            </Link>
            <Link className="priority-card" to="/approvals/cao">
              <p className="priority-kicker">CAO Queue</p>
              <h4>{caoQueueCount} items awaiting review</h4>
              <p>Complete executive approvals for publication readiness.</p>
            </Link>
            <Link className="priority-card" to="/public">
              <p className="priority-kicker">Public Transparency</p>
              <h4>{publicReleaseCount} records published</h4>
              <p>Verify what citizens can currently view.</p>
            </Link>
            <Link className="priority-card" to="/admin/login">
              <p className="priority-kicker">Access Governance</p>
              <h4>{(user?.roles ?? []).length} active role(s)</h4>
              <p>Manage permissions for operational resilience.</p>
            </Link>
            <div className="priority-card priority-card-static">
              <p className="priority-kicker">Assigned User</p>
              <h4>{user?.displayName ?? user?.email ?? 'Unknown user'}</h4>
              <div className="pill-list">
                {(user?.roles ?? []).map((role) => (
                  <span className="pill" key={role}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <Link className="priority-card" to="/reports">
              <p className="priority-kicker">Report Operations</p>
              <h4>{reports.length} reports in workflow</h4>
              <p>Move draft and pending reports to published status.</p>
            </Link>
          </div>
        </article>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Workflow Workspace</h2>
            <p>Open operational modules and continue active review work.</p>
          </div>
        </header>
        <div className="card-body link-card-grid">
          <Link className="link-card" to="/meetings">
            <h3>Meetings</h3>
            <p>Track meeting schedule, status, and agenda alignment.</p>
          </Link>
          <Link className="link-card" to="/agendas">
            <h3>Agendas</h3>
            <p>Review agenda progress and publication readiness.</p>
          </Link>
          <Link className="link-card" to="/reports">
            <h3>Reports</h3>
            <p>Manage report drafting, submission, and final publication.</p>
          </Link>
          <Link className="link-card" to="/minutes">
            <h3>Minutes</h3>
            <p>Capture live minutes and publish finalized records.</p>
          </Link>
          <Link className="link-card" to="/approvals/director">
            <h3>Director Queue</h3>
            <p>Process departmental report approvals and rejections.</p>
          </Link>
          <Link className="link-card" to="/approvals/cao">
            <h3>CAO Queue</h3>
            <p>Complete executive review and final governance approvals.</p>
          </Link>
          <Link className="link-card" to="/public">
            <h3>Public Portal</h3>
            <p>Validate externally published meeting content.</p>
          </Link>
          <Link className="link-card" to="/admin/login">
            <h3>Admin Portal</h3>
            <p>Open governance settings for users, roles, templates, and integrations.</p>
          </Link>
        </div>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Upcoming Meetings</h2>
            <p>Earliest five meetings from the current register.</p>
          </div>
          <span className="pill">{upcomingMeetings.length} in upcoming view</span>
        </header>
        <div className="card-body">
          {upcomingMeetings.length === 0 ? (
            <div className="empty-state">No meeting records available.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table" aria-label="Upcoming meetings">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Status</th>
                    <th>Start</th>
                    <th>Location</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingMeetings.map((meeting) => (
                    <tr key={meeting.id}>
                      <td>
                        <strong>{meeting.title}</strong>
                        <div className="muted">{meeting.meetingTypeCode}</div>
                      </td>
                      <td>
                        <StatusBadge status={meeting.status} />
                      </td>
                      <td>{new Date(meeting.startsAt).toLocaleString()}</td>
                      <td>{meeting.location ?? 'Not specified'}</td>
                      <td>
                        <Link className="btn" to={`/meetings/${meeting.id}`}>
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
