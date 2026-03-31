import { useEffect, useState, type FormEvent } from 'react';
import { listSystemRoles } from '../../api/roles.api';
import { assignManagedUserRole, listManagedUsers, upsertManagedUser } from '../../api/users.api';
import type { ManagedUserRecord, SystemRoleRecord } from '../../api/types/admin.types';
import AppShell from '../../components/layout/AppShell';
import { useToast } from '../../hooks/useToast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import MetricTile from '../../components/ui/MetricTile';

export default function UsersAdmin(): JSX.Element {
  const [users, setUsers] = useState<ManagedUserRecord[]>([]);
  const [roles, setRoles] = useState<SystemRoleRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ microsoftOid: '', email: '', displayName: '', roleCode: 'STAFF' });
  const { addToast } = useToast();

  const load = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, rolesData] = await Promise.all([listManagedUsers(), listSystemRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch {
      setError('Could not load user administration data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    try {
      await upsertManagedUser({
        microsoftOid: form.microsoftOid,
        email: form.email,
        displayName: form.displayName,
        roles: [form.roleCode],
      });
      await load();
      setForm({ microsoftOid: '', email: '', displayName: '', roleCode: form.roleCode });
      addToast('Managed user saved.', 'success');
    } catch {
      setError('Could not save user record.');
      addToast('Could not save user record.', 'error');
    }
  };

  const handleAssignRole = async (userId: string, roleCode: string): Promise<void> => {
    try {
      await assignManagedUserRole(userId, roleCode);
      await load();
      addToast('Role assigned.', 'success');
    } catch {
      setError('Could not assign role.');
      addToast('Could not assign role.', 'error');
    }
  };

  return (
    <AppShell title="Users" subtitle="Manage staff identities and role assignments." workspaceVariant="admin">
      <section className="module-overview">
        <MetricTile label="Managed Users" value={users.length} foot="Active records in governance access model" variant="primary" />
        <MetricTile label="Available Roles" value={roles.length} foot="Assignable permission bundles" />
      </section>

      <Card>
        <CardHeader
          title="Add or Update Managed User"
          description="Provision user profile data and initial role assignment."
        />
        <CardBody>
          <form onSubmit={(event) => void handleCreate(event)}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="managed-user-oid">Microsoft OID</label>
                <input
                  id="managed-user-oid"
                  className="field"
                  value={form.microsoftOid}
                  onChange={(event) => setForm((current) => ({ ...current, microsoftOid: event.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="managed-user-email">Email</label>
                <input
                  id="managed-user-email"
                  className="field"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="managed-user-name">Display Name</label>
                <input
                  id="managed-user-name"
                  className="field"
                  value={form.displayName}
                  onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="managed-user-role">Initial Role</label>
                <select
                  id="managed-user-role"
                  className="field"
                  value={form.roleCode}
                  onChange={(event) => setForm((current) => ({ ...current, roleCode: event.target.value }))}
                >
                  {roles.map((role) => (
                    <option key={role.code} value={role.code}>
                      {role.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Save Access Record
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Managed Users" description="Current local role assignments used for operational governance." />
        <CardBody>
          {isLoading ? <p className="muted">Loading access records...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && users.length === 0 ? (
            <div className="empty-state">No managed users found. Create a user profile to begin role assignments.</div>
          ) : null}
          {users.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="Managed users">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Add Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.displayName}</td>
                      <td>{user.email}</td>
                      <td>{user.roles.join(', ')}</td>
                      <td>
                        <div className="page-actions">
                          {roles
                            .filter((role) => !user.roles.includes(role.code))
                            .map((role) => (
                              <button
                                key={role.code}
                                type="button"
                                className="btn btn-quiet"
                                onClick={() => void handleAssignRole(user.id, role.code)}
                              >
                                Assign {role.code}
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </AppShell>
  );
}
