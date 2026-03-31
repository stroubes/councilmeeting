import { useEffect, useState } from 'react';
import { listBylaws, createBylaw, updateBylaw, amendBylaw, repealBylaw, deleteBylaw } from '../api/bylaws.api';
import type { BylawRecord, BylawStatus, CreateBylawPayload, UpdateBylawPayload } from '../api/types/bylaw.types';
import Icon from './ui/Icon';
import DataTable from './ui/DataTable';
import Drawer from './ui/Drawer';

const STATUS_LABELS: Record<BylawStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Repealed',
  DELETED: 'Deleted',
};

const STATUS_CLASS: Record<BylawStatus, string> = {
  ACTIVE: 'status-success',
  INACTIVE: 'status-muted',
  DELETED: 'status-error',
};

interface BylawsManagementPanelProps {
  meetingId?: string;
}

interface BylawForm {
  bylawNumber: string;
  title: string;
  description: string;
  contentJson: string;
  adoptedAt: string;
}

export default function BylawsManagementPanel({ meetingId }: BylawsManagementPanelProps): JSX.Element {
  const [bylaws, setBylaws] = useState<BylawRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BylawForm>({
    bylawNumber: '',
    title: '',
    description: '',
    contentJson: '{}',
    adoptedAt: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = showActiveOnly ? await listBylaws('ACTIVE') : await listBylaws();
        setBylaws(data);
      } catch {
        setError('Failed to load bylaws.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [showActiveOnly]);

  const refresh = async (): Promise<void> => {
    const data = showActiveOnly ? await listBylaws('ACTIVE') : await listBylaws();
    setBylaws(data);
  };

  const handleAdd = (): void => {
    setEditingId(null);
    setForm({ bylawNumber: '', title: '', description: '', contentJson: '{}', adoptedAt: '' });
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleEdit = (id: string): void => {
    const existing = bylaws.find((b) => b.id === id);
    if (!existing) return;
    setEditingId(id);
    setForm({
      bylawNumber: existing.bylawNumber,
      title: existing.title,
      description: existing.description ?? '',
      contentJson: JSON.stringify(existing.contentJson, null, 2),
      adoptedAt: existing.adoptedAt ? existing.adoptedAt.slice(0, 16) : '',
    });
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleSave = async (): Promise<void> => {
    setFormSaving(true);
    setFormError(null);
    try {
      let contentJson: Record<string, unknown> = {};
      try {
        if (form.contentJson.trim()) {
          contentJson = JSON.parse(form.contentJson);
        }
      } catch {
        setFormError('Content JSON is invalid.');
        setFormSaving(false);
        return;
      }

      const payload: CreateBylawPayload | UpdateBylawPayload = {
        bylawNumber: form.bylawNumber,
        title: form.title,
        description: form.description || undefined,
        contentJson,
        adoptedAt: form.adoptedAt ? new Date(form.adoptedAt).toISOString() : undefined,
      };

      if (editingId) {
        await updateBylaw(editingId, payload);
      } else {
        await createBylaw(payload as CreateBylawPayload);
      }
      setDrawerOpen(false);
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save bylaw.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleAmend = async (id: string): Promise<void> => {
    const existing = bylaws.find((b) => b.id === id);
    if (!existing) return;
    const amendment = window.prompt(`Amend "${existing.bylawNumber} — ${existing.title}"?\n\nEnter the new bylaw title (leave blank to keep current):`);
    if (amendment === null) return;
    const newTitle = amendment.trim() || existing.title;
    try {
      await amendBylaw(id, { title: newTitle });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to amend bylaw.');
    }
  };

  const handleRepeal = async (id: string): Promise<void> => {
    if (!meetingId) {
      setError('A meeting must be selected to repeal a bylaw.');
      return;
    }
    const existing = bylaws.find((b) => b.id === id);
    if (!existing) return;
    if (!window.confirm(`Repeal "${existing.bylawNumber} — ${existing.title}"?\n\nThis action is permanent and links the repeal to this meeting.`)) return;
    try {
      await repealBylaw(id, meetingId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to repeal bylaw.');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm('Soft-delete this bylaw record? This cannot be undone.')) return;
    try {
      await deleteBylaw(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bylaw.');
    }
  };

  const columns = [
    {
      key: 'bylawNumber',
      header: 'Number',
      render: (row: BylawRecord) => <strong>{row.bylawNumber}</strong>,
    },
    {
      key: 'title',
      header: 'Title',
      render: (row: BylawRecord) => row.title,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: BylawRecord) => (
        <span className={`status-badge ${STATUS_CLASS[row.status]}`}>{STATUS_LABELS[row.status]}</span>
      ),
    },
    {
      key: 'adoptedAt',
      header: 'Adopted',
      render: (row: BylawRecord) =>
        row.adoptedAt ? new Date(row.adoptedAt).toLocaleDateString() : '—',
    },
    {
      key: 'amendedAt',
      header: 'Amended',
      render: (row: BylawRecord) =>
        row.amendedAt ? new Date(row.amendedAt).toLocaleDateString() : '—',
    },
    {
      key: 'actions',
      header: '',
      render: (row: BylawRecord) => (
        <div className="table-actions">
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => handleEdit(row.id)}>Edit</button>
          {row.status === 'ACTIVE' && (
            <>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => handleAmend(row.id)} title="Record an amendment">Amend</button>
              {meetingId && (
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => handleRepeal(row.id)} title="Repeal this bylaw">Repeal</button>
              )}
            </>
          )}
          <button type="button" className="btn btn-quiet btn-sm btn-danger" onClick={() => handleDelete(row.id)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Bylaws Registry</h2>
          <p className="muted">Municipal bylaws adopted under the Community Charter (BC) and Local Government Act.</p>
        </div>
        <div className="section-header-actions">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
            />
            Active only
          </label>
          <button type="button" className="btn" onClick={handleAdd}>
            <Icon name="plus" size={16} /> New Bylaw
          </button>
        </div>
      </div>

      {error ? <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div> : null}

      {isLoading ? (
        <p className="muted">Loading bylaws…</p>
      ) : (
        <DataTable
          columns={columns}
          data={bylaws}
          emptyMessage="No bylaws recorded yet. Create your first bylaw to get started."
          rowKey={(row: BylawRecord) => row.id}
        />
      )}

      <Drawer
        isOpen={drawerOpen}
        title={editingId ? 'Edit Bylaw' : 'Add New Bylaw'}
        onClose={() => setDrawerOpen(false)}
      >
        {formError ? <p className="inline-alert">{formError}</p> : null}

        <div className="form-field">
          <label htmlFor="bylawNumber">Bylaw Number</label>
          <input
            type="text"
            id="bylawNumber"
            value={form.bylawNumber}
            onChange={(e) => setForm((f) => ({ ...f, bylawNumber: e.target.value }))}
            placeholder="e.g., Bylaw No. 1234"
            disabled={!!editingId}
          />
        </div>

        <div className="form-field">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g., Council Procedure Bylaw"
          />
        </div>

        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description of this bylaw's purpose"
            rows={3}
          />
        </div>

        <div className="form-field">
          <label htmlFor="adoptedAt">Date Adopted</label>
          <input
            type="date"
            id="adoptedAt"
            value={form.adoptedAt}
            onChange={(e) => setForm((f) => ({ ...f, adoptedAt: e.target.value }))}
          />
        </div>

        <div className="form-field">
          <label htmlFor="contentJson">Content (JSON)</label>
          <textarea
            id="contentJson"
            value={form.contentJson}
            onChange={(e) => setForm((f) => ({ ...f, contentJson: e.target.value }))}
            placeholder="{}"
            rows={6}
            style={{ fontFamily: 'monospace' }}
          />
        </div>

        <div className="drawer-actions">
          <button type="button" className="btn" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={formSaving || !form.bylawNumber || !form.title}
          >
            {formSaving ? 'Saving…' : editingId ? 'Update' : 'Create'}
          </button>
        </div>
      </Drawer>
    </section>
  );
}
