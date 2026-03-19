import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';

export default function AdminPortalHome(): JSX.Element {
  return (
    <AppShell
      title="Admin Portal"
      subtitle="Governance control center for platform configuration, access, and communications."
      workspaceVariant="admin"
    >
      <section className="module-overview">
        <article className="metric-tile metric-tile-primary">
          <p className="metric-label">Administrative Domains</p>
          <p className="metric-value">7</p>
          <p className="metric-foot">Users, roles, meeting types, templates, KPIs, notifications, and API settings</p>
        </article>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Administration Modules</h2>
            <p>Open a governance module to manage operational configuration and controls.</p>
          </div>
        </header>
        <div className="card-body link-card-grid">
          <Link className="link-card" to="/admin-portal/users">
            <h3>Users</h3>
            <p>Provision municipal accounts and assign operational roles.</p>
          </Link>
          <Link className="link-card" to="/admin-portal/roles">
            <h3>Roles</h3>
            <p>Review and audit role-to-permission governance matrix.</p>
          </Link>
          <Link className="link-card" to="/admin-portal/templates">
            <h3>Templates</h3>
            <p>Manage standard report and agenda templates for consistency.</p>
          </Link>
          <Link className="link-card" to="/admin-portal/meeting-types">
            <h3>Meeting Types</h3>
            <p>Create the meeting type options used by the meeting scheduler dropdown.</p>
          </Link>
          <Link className="link-card" to="/admin-portal/notifications">
            <h3>Notifications</h3>
            <p>Configure workflow alerts, escalations, and delivery channels.</p>
          </Link>
          <Link className="link-card" to="/admin-portal/executive-kpis">
            <h3>Executive KPIs</h3>
            <p>Monitor cycle-time, approvals pressure, publication performance, and digest health.</p>
          </Link>
          <Link className="link-card" to="/admin-portal/api-settings">
            <h3>API Settings</h3>
            <p>Manage integration endpoints, keys, and environment connections.</p>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
