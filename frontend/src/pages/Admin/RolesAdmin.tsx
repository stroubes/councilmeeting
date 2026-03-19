import { useEffect, useState } from 'react';
import { listSystemRoles } from '../../api/roles.api';
import type { SystemRoleRecord } from '../../api/types/admin.types';
import AppShell from '../../components/layout/AppShell';

export default function RolesAdmin(): JSX.Element {
  const [roles, setRoles] = useState<SystemRoleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        setRoles(await listSystemRoles());
      } catch {
        setError('Could not load role definitions.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <AppShell title="Roles" subtitle="Role-to-permission matrix for governance controls." workspaceVariant="admin">
      <section className="module-overview">
        <article className="metric-tile metric-tile-primary">
          <p className="metric-label">System Roles</p>
          <p className="metric-value">{roles.length}</p>
          <p className="metric-foot">Defined role bundles in authorization model</p>
        </article>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>
              <span className="panel-icon">RLS</span>
              System Role Matrix
            </h2>
            <p>Current role permission bundles used at authorization time.</p>
          </div>
        </header>
        <div className="card-body">
          {isLoading ? <p className="muted">Loading role definitions...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && roles.length === 0 ? (
            <div className="empty-state">No role definitions found for this environment.</div>
          ) : null}
          {roles.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="Role matrix">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.code}>
                      <td>
                        <strong>{role.code}</strong>
                      </td>
                      <td>{role.permissions.join(', ') || 'No permissions assigned'}</td>
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
