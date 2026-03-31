import { useEffect, useState, type FormEvent } from 'react';
import { createActionItem, deleteActionItem, getActionDashboard, listActionItems, updateActionItem } from '../../api/actions.api';
import type { ActionItemRecord } from '../../api/types/action.types';
import AppShell from '../../components/layout/AppShell';
import MetricTile from '../../components/ui/MetricTile';
import { Card, CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';

export default function ActionTracker(): JSX.Element {
  const [items, setItems] = useState<ActionItemRecord[]>([]);
  const [dashboard, setDashboard] = useState({ open: 0, inProgress: 0, blocked: 0, overdue: 0, completed: 0 });
  const [form, setForm] = useState({ title: '', dueDate: '' });
  const [error, setError] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    try {
      const [rows, summary] = await Promise.all([listActionItems(), getActionDashboard()]);
      setItems(rows);
      setDashboard(summary);
    } catch {
      setError('Could not load action tracker.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    try {
      await createActionItem({ title: form.title, dueDate: form.dueDate || undefined });
      setForm({ title: '', dueDate: '' });
      await load();
    } catch {
      setError('Could not create action item.');
    }
  };

  const handleComplete = async (item: ActionItemRecord): Promise<void> => {
    try {
      await updateActionItem(item.id, { status: 'COMPLETED' });
      await load();
    } catch {
      setError('Could not update action item.');
    }
  };

  const handleDelete = async (item: ActionItemRecord): Promise<void> => {
    if (!window.confirm(`Delete action item "${item.title}"?`)) {
      return;
    }
    try {
      await deleteActionItem(item.id);
      await load();
    } catch {
      setError('Could not delete action item.');
    }
  };

  return (
    <AppShell title="Action Tracker" subtitle="Track follow-up actions from motions and resolutions.">
      <section className="module-overview">
        <MetricTile variant="primary" label="Open" value={dashboard.open} />
        <MetricTile label="In Progress" value={dashboard.inProgress} />
        <MetricTile label="Blocked" value={dashboard.blocked} />
        <MetricTile label="Overdue" value={dashboard.overdue} />
      </section>

      <Card>
        <CardBody>
          <form className="form-grid" onSubmit={(event) => void handleCreate(event)}>
            <div className="form-field"><label htmlFor="action-title">Title</label><input id="action-title" className="field" value={form.title} onChange={(event) => setForm((c) => ({ ...c, title: event.target.value }))} required /></div>
            <div className="form-field"><label htmlFor="action-due">Due Date</label><input id="action-due" className="field" type="date" value={form.dueDate} onChange={(event) => setForm((c) => ({ ...c, dueDate: event.target.value }))} /></div>
            <div className="form-actions"><button type="submit" className="btn btn-primary">Add Action</button></div>
          </form>
          {error ? <p className="inline-alert">{error}</p> : null}

          <DataTable
            columns={[
              { key: 'title', header: 'Title', render: (item: ActionItemRecord) => item.title },
              { key: 'status', header: 'Status', render: (item: ActionItemRecord) => item.status },
              { key: 'dueDate', header: 'Due', render: (item: ActionItemRecord) => item.dueDate ?? '-' },
              {
                key: 'actions',
                header: 'Actions',
                render: (item: ActionItemRecord) => (
                  <>
                    <button type="button" className="btn" onClick={() => void handleComplete(item)}>Complete</button>
                    <button type="button" className="btn btn-danger" onClick={() => void handleDelete(item)}>Delete</button>
                  </>
                ),
              },
            ]}
            data={items}
            emptyMessage="No action items recorded."
            rowKey={(item) => item.id}
          />
        </CardBody>
      </Card>
    </AppShell>
  );
}
