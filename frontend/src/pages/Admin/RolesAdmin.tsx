import { useEffect, useState } from 'react';
import { listSystemRoles } from '../../api/roles.api';
import type { SystemRoleRecord } from '../../api/types/admin.types';
import AppShell from '../../components/layout/AppShell';
import MetricTile from '../../components/ui/MetricTile';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';

interface RoleColumn {
  key: string;
  header: string;
  render?: (row: SystemRoleRecord) => JSX.Element;
}

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

  const columns: RoleColumn[] = [
    {
      key: 'code',
      header: 'Role',
      render: (row) => <strong>{row.code}</strong>,
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (row) => <>{row.permissions.join(', ') || 'No permissions assigned'}</>,
    },
  ];

  return (
    <AppShell title="Roles" subtitle="Role-to-permission matrix for governance controls." workspaceVariant="admin">
      <section className="module-overview">
        <MetricTile
          label="System Roles"
          value={roles.length}
          foot="Defined role bundles in authorization model"
          icon="lock"
          variant="primary"
        />
      </section>

      <Card>
        <CardHeader
          title="System Role Matrix"
          description="Current role permission bundles used at authorization time."
        />
        <CardBody>
          {isLoading ? <p className="muted">Loading role definitions...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && roles.length === 0 ? (
            <div className="empty-state">No role definitions found for this environment.</div>
          ) : null}
          {roles.length > 0 ? (
            <DataTable
              rowKey={(row) => (row as unknown as { code: string }).code}
              data={roles as unknown as { id: string | number }[]}
              columns={columns as unknown as { key: string; header: string; render?: (row: { id: string | number }) => JSX.Element }[]}
              emptyMessage="No role definitions found for this environment."
            />
          ) : null}
        </CardBody>
      </Card>
    </AppShell>
  );
}
