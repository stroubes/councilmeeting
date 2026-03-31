import { useEffect, useMemo, useState } from 'react';
import {
  createConflictDeclaration,
  deleteConflictDeclaration,
  listConflictDeclarationsByMeeting,
  updateConflictDeclaration,
} from '../api/conflictDeclarations.api';
import { listAgendas } from '../api/agendas.api';
import { listMeetingAttendees } from '../api/attendees.api';
import { listManagedUsers } from '../api/users.api';
import type { ConflictDeclarationRecord } from '../api/types/conflict-declaration.types';
import type { AgendaItemRecord } from '../api/types/agenda.types';
import type { ManagedUserRecord } from '../api/types/admin.types';
import type { AttendeeRecord } from '../api/types/attendee.types';
import DataTable from './ui/DataTable';
import Drawer from './ui/Drawer';
import Icon from './ui/Icon';

interface ConflictDeclarationsPanelProps {
  meetingId: string;
}

interface DeclarationForm {
  userId: string;
  agendaItemId: string;
  reason: string;
}

const INITIAL_FORM: DeclarationForm = {
  userId: '',
  agendaItemId: '',
  reason: '',
};

export default function ConflictDeclarationsPanel({ meetingId }: ConflictDeclarationsPanelProps): JSX.Element {
  const [declarations, setDeclarations] = useState<ConflictDeclarationRecord[]>([]);
  const [users, setUsers] = useState<ManagedUserRecord[]>([]);
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItemRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDeclaration, setEditingDeclaration] = useState<ConflictDeclarationRecord | null>(null);
  const [form, setForm] = useState<DeclarationForm>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const [declarationData, userData, attendeeData, agendaData] = await Promise.all([
        listConflictDeclarationsByMeeting(meetingId),
        listManagedUsers(),
        listMeetingAttendees(meetingId),
        listAgendas(meetingId),
      ]);
      setDeclarations(declarationData);
      setUsers(userData);
      setAttendees(attendeeData);
      setAgendaItems(agendaData.flatMap((agenda) => agenda.items));
    } catch {
      setError('Could not load conflict declarations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [meetingId]);

  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const agendaItemMap = useMemo(() => new Map(agendaItems.map((item) => [item.id, item])), [agendaItems]);

  const attendeeUserIds = useMemo(() => new Set(attendees.map((attendee) => attendee.userId)), [attendees]);
  const attendeeUsers = useMemo(
    () => users.filter((user) => attendeeUserIds.has(user.id)),
    [users, attendeeUserIds],
  );
  const candidateUsers = attendeeUsers.length > 0 ? attendeeUsers : users;

  const openCreateDrawer = (): void => {
    setEditingDeclaration(null);
    setForm(INITIAL_FORM);
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (declaration: ConflictDeclarationRecord): void => {
    setEditingDeclaration(declaration);
    setForm({
      userId: declaration.userId,
      agendaItemId: declaration.agendaItemId ?? '',
      reason: declaration.reason ?? '',
    });
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleSave = async (): Promise<void> => {
    const reason = form.reason.trim();
    if (!form.userId && !editingDeclaration) {
      setFormError('Select a person before saving this declaration.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingDeclaration) {
        await updateConflictDeclaration(editingDeclaration.id, {
          reason: reason || undefined,
        });
      } else {
        await createConflictDeclaration({
          meetingId,
          userId: form.userId,
          agendaItemId: form.agendaItemId || undefined,
          reason: reason || undefined,
        });
      }
      setDrawerOpen(false);
      await load();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Could not save declaration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (declaration: ConflictDeclarationRecord): Promise<void> => {
    const userLabel = userMap.get(declaration.userId)?.displayName ?? declaration.userId;
    if (!window.confirm(`Remove the conflict declaration for ${userLabel}?`)) {
      return;
    }

    try {
      await deleteConflictDeclaration(declaration.id);
      await load();
    } catch {
      setError('Could not remove conflict declaration.');
    }
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Conflict Declarations</h2>
          <p className="muted">Record and maintain conflict-of-interest declarations tied to this meeting and agenda record.</p>
        </div>
        <button type="button" className="btn" onClick={openCreateDrawer}>
          <Icon name="plus" size={16} /> Add Declaration
        </button>
      </div>

      {error ? <p className="inline-alert">{error}</p> : null}

      {isLoading ? (
        <p className="muted">Loading conflict declarations...</p>
      ) : (
        <DataTable
          columns={[
            {
              key: 'person',
              header: 'Person',
              render: (declaration: ConflictDeclarationRecord) =>
                userMap.get(declaration.userId)?.displayName ?? declaration.userId,
            },
            {
              key: 'agendaItem',
              header: 'Agenda Item',
              render: (declaration: ConflictDeclarationRecord) => {
                if (!declaration.agendaItemId) {
                  return 'Entire meeting';
                }
                return agendaItemMap.get(declaration.agendaItemId)?.title ?? declaration.agendaItemId.slice(0, 8);
              },
            },
            {
              key: 'reason',
              header: 'Reason',
              render: (declaration: ConflictDeclarationRecord) => declaration.reason ?? 'Not provided',
            },
            {
              key: 'declaredAt',
              header: 'Declared',
              render: (declaration: ConflictDeclarationRecord) => new Date(declaration.declaredAt).toLocaleString(),
            },
            {
              key: 'actions',
              header: '',
              render: (declaration: ConflictDeclarationRecord) => (
                <div className="table-actions">
                  <button type="button" className="btn btn-quiet btn-sm" onClick={() => openEditDrawer(declaration)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-quiet btn-sm btn-danger"
                    onClick={() => void handleDelete(declaration)}
                  >
                    Remove
                  </button>
                </div>
              ),
            },
          ]}
          data={declarations}
          emptyMessage="No conflict declarations have been recorded for this meeting."
          rowKey={(declaration: ConflictDeclarationRecord) => declaration.id}
        />
      )}

      <Drawer
        isOpen={drawerOpen}
        title={editingDeclaration ? 'Edit Conflict Declaration' : 'Record Conflict Declaration'}
        subtitle="Track declarations for governance transparency and voting integrity."
        onClose={() => setDrawerOpen(false)}
      >
        {formError ? <p className="inline-alert">{formError}</p> : null}

        {!editingDeclaration ? (
          <div className="form-field">
            <label htmlFor="coi-person">Person</label>
            <select
              id="coi-person"
              className="field"
              value={form.userId}
              onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
            >
              <option value="">Select a person...</option>
              {candidateUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName} ({user.email})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="muted">Person: {userMap.get(editingDeclaration.userId)?.displayName ?? editingDeclaration.userId}</p>
        )}

        {!editingDeclaration ? (
          <div className="form-field">
            <label htmlFor="coi-agenda-item">Agenda Item (optional)</label>
            <select
              id="coi-agenda-item"
              className="field"
              value={form.agendaItemId}
              onChange={(event) => setForm((current) => ({ ...current, agendaItemId: event.target.value }))}
            >
              <option value="">Entire meeting</option>
              {agendaItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemNumber || item.sortOrder}. {item.title}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="muted">
            Agenda Item:{' '}
            {editingDeclaration.agendaItemId
              ? agendaItemMap.get(editingDeclaration.agendaItemId)?.title ?? editingDeclaration.agendaItemId
              : 'Entire meeting'}
          </p>
        )}

        <div className="form-field">
          <label htmlFor="coi-reason">Reason (optional)</label>
          <textarea
            id="coi-reason"
            className="field"
            rows={4}
            value={form.reason}
            onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
            placeholder="Describe the nature of the conflict for governance recordkeeping"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-quiet" onClick={() => setDrawerOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? 'Saving...' : editingDeclaration ? 'Save Changes' : 'Record Declaration'}
          </button>
        </div>
      </Drawer>
    </section>
  );
}
