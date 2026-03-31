import { useEffect, useState } from 'react';
import { listMeetingAttendees, getQuorumStatus, createAttendee, updateAttendee, deleteAttendee, recordArrival, recordDeparture } from '../api/attendees.api';
import { listManagedUsers } from '../api/users.api';
import type { AttendeeRecord, AttendeeStatus, AttendanceRole, QuorumStatus } from '../api/types/attendee.types';
import type { ManagedUserRecord } from '../api/types/admin.types';
import Icon from './ui/Icon';
import DataTable from './ui/DataTable';
import Drawer from './ui/Drawer';

interface QuorumBannerProps {
  quorum: QuorumStatus | null;
}

function QuorumBanner({ quorum }: QuorumBannerProps): JSX.Element | null {
  if (!quorum) return null;
  if (quorum.councilSize === 0) {
    return (
      <div className="alert alert-warn">
        <Icon name="alert-triangle" size={16} />
        <span>Council size not configured for this meeting type. Configure council size in Meeting Types to enable quorum tracking.</span>
      </div>
    );
  }
  if (quorum.isQuorumMet) {
    return (
      <div className="alert alert-success">
        <Icon name="check" size={16} />
        <span>
          Quorum met: <strong>{quorum.presentCount}/{quorum.councilSize}</strong> council members present (minimum required: {quorum.requiredCount})
        </span>
      </div>
    );
  }
  return (
    <div className="alert alert-error">
      <Icon name="alert-triangle" size={16} />
      <span>
        Quorum not met: <strong>{quorum.presentCount}/{quorum.councilSize}</strong> council members present (minimum required: {quorum.requiredCount})
      </span>
    </div>
  );
}

const STATUS_LABELS: Record<AttendeeStatus, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  EXCUSED: 'Excused',
  LATE: 'Late',
  EARLY_DEPARTURE: 'Left Early',
};

const STATUS_CLASS: Record<AttendeeStatus, string> = {
  PRESENT: 'status-success',
  ABSENT: 'status-error',
  EXCUSED: 'status-warn',
  LATE: 'status-warn',
  EARLY_DEPARTURE: 'status-warn',
};

const ROLE_LABELS: Record<AttendanceRole, string> = {
  CHAIR: 'Chair',
  COUNCIL_MEMBER: 'Council Member',
  STAFF: 'Staff',
  GUEST: 'Guest',
};

interface AttendeesPanelProps {
  meetingId: string;
}

interface AddAttendeeForm {
  userId: string;
  role: AttendanceRole;
  status: AttendeeStatus;
  arrivedAt?: string;
  notes?: string;
}

export default function AttendeesPanel({ meetingId }: AttendeesPanelProps): JSX.Element {
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
  const [quorum, setQuorum] = useState<QuorumStatus | null>(null);
  const [users, setUsers] = useState<ManagedUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddAttendeeForm>({
    userId: '',
    role: 'COUNCIL_MEMBER',
    status: 'PRESENT',
    arrivedAt: new Date().toISOString().slice(0, 16),
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const [attendeeList, quorumStatus, userList] = await Promise.all([
          listMeetingAttendees(meetingId),
          getQuorumStatus(meetingId),
          listManagedUsers(),
        ]);
        setAttendees(attendeeList);
        setQuorum(quorumStatus);
        setUsers(userList);
      } catch {
        setError('Failed to load attendees.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [meetingId]);

  const refresh = async (): Promise<void> => {
    const [attendeeList, quorumStatus] = await Promise.all([
      listMeetingAttendees(meetingId),
      getQuorumStatus(meetingId),
    ]);
    setAttendees(attendeeList);
    setQuorum(quorumStatus);
  };

  const handleAdd = (): void => {
    setEditingId(null);
    setForm({ userId: '', role: 'COUNCIL_MEMBER', status: 'PRESENT', arrivedAt: new Date().toISOString().slice(0, 16), notes: '' });
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleEdit = (id: string): void => {
    const existing = attendees.find((a) => a.id === id);
    if (!existing) return;
    setEditingId(id);
    setForm({
      userId: existing.userId,
      role: existing.role,
      status: existing.status,
      arrivedAt: existing.arrivedAt ? existing.arrivedAt.slice(0, 16) : '',
      notes: existing.notes ?? '',
    });
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleSave = async (): Promise<void> => {
    setFormSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await updateAttendee(editingId, {
          role: form.role,
          status: form.status,
          arrivedAt: form.arrivedAt ? new Date(form.arrivedAt).toISOString() : undefined,
          notes: form.notes || undefined,
        });
      } else {
        await createAttendee({
          meetingId,
          userId: form.userId,
          role: form.role,
          status: form.status,
          arrivedAt: form.arrivedAt ? new Date(form.arrivedAt).toISOString() : undefined,
          notes: form.notes,
        });
      }
      setDrawerOpen(false);
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save attendee.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm('Remove this attendee record?')) return;
    try {
      await deleteAttendee(id);
      await refresh();
    } catch {
      setError('Failed to delete attendee.');
    }
  };

  const handleArrival = async (userId: string): Promise<void> => {
    try {
      await recordArrival(meetingId, userId);
      await refresh();
    } catch {
      setError('Failed to record arrival.');
    }
  };

  const handleDeparture = async (userId: string): Promise<void> => {
    try {
      await recordDeparture(meetingId, userId);
      await refresh();
    } catch {
      setError('Failed to record departure.');
    }
  };

  const userMap = new Map(users.map((u) => [u.id, u]));

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row: AttendeeRecord) => {
        const user = userMap.get(row.userId);
        return user?.displayName ?? row.userId;
      },
    },
    { key: 'role', header: 'Role', render: (row: AttendeeRecord) => ROLE_LABELS[row.role] ?? row.role },
    {
      key: 'status',
      header: 'Status',
      render: (row: AttendeeRecord) => (
        <span className={`status-badge ${STATUS_CLASS[row.status]}`}>{STATUS_LABELS[row.status]}</span>
      ),
    },
    {
      key: 'arrivedAt',
      header: 'Arrived',
      render: (row: AttendeeRecord) => row.arrivedAt ? new Date(row.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    },
    {
      key: 'departedAt',
      header: 'Departed',
      render: (row: AttendeeRecord) => row.departedAt ? new Date(row.departedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    },
    {
      key: 'isConflictOfInterest',
      header: 'COI',
      render: (row: AttendeeRecord) => row.isConflictOfInterest ? <span className="status-badge status-warn">COI</span> : '—',
    },
    {
      key: 'actions',
      header: '',
      render: (row: AttendeeRecord) => (
        <div className="table-actions">
          {row.status !== 'PRESENT' && row.status !== 'LATE' && row.status !== 'EARLY_DEPARTURE' ? (
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => handleArrival(row.userId)} title="Record arrival">
              <Icon name="clock" size={14} /> In
            </button>
          ) : null}
          {row.status === 'PRESENT' || row.status === 'LATE' ? (
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => handleDeparture(row.userId)} title="Record departure">
              <Icon name="clock" size={14} /> Out
            </button>
          ) : null}
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => handleEdit(row.id)}>Edit</button>
          <button type="button" className="btn btn-quiet btn-sm btn-danger" onClick={() => handleDelete(row.id)}>Remove</button>
        </div>
      ),
    },
  ];

  const availableUsers = users.filter((u) => !attendees.some((a) => a.userId === u.id));

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Attendees &amp; Quorum</h2>
          <p className="muted">Track who was present at this meeting and monitor quorum status per BC Community Charter s.128.</p>
        </div>
        <button type="button" className="btn" onClick={handleAdd}>
          <Icon name="plus" size={16} /> Add Attendee
        </button>
      </div>

      <QuorumBanner quorum={quorum} />

      {error ? <p className="inline-alert">{error}</p> : null}

      {isLoading ? (
        <p className="muted">Loading attendees…</p>
      ) : (
        <DataTable
          columns={columns}
          data={attendees}
          emptyMessage="No attendees recorded for this meeting yet."
          rowKey={(row: AttendeeRecord) => row.id}
        />
      )}

      <Drawer
        isOpen={drawerOpen}
        title={editingId ? 'Edit Attendee' : 'Add Attendee'}
        onClose={() => setDrawerOpen(false)}
      >
        {formError ? <p className="inline-alert">{formError}</p> : null}

        {!editingId && (
          <div className="form-field">
            <label htmlFor="userId">Person</label>
            <select
              id="userId"
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
            >
              <option value="">Select a person…</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-field">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AttendanceRole }))}
          >
            <option value="CHAIR">Chair</option>
            <option value="COUNCIL_MEMBER">Council Member</option>
            <option value="STAFF">Staff</option>
            <option value="GUEST">Guest</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AttendeeStatus }))}
          >
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="EXCUSED">Excused</option>
            <option value="LATE">Late</option>
            <option value="EARLY_DEPARTURE">Early Departure</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="arrivedAt">Arrival Time</label>
          <input
            type="datetime-local"
            id="arrivedAt"
            value={form.arrivedAt ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, arrivedAt: e.target.value }))}
          />
        </div>

        <div className="form-field">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={form.notes ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="drawer-actions">
          <button type="button" className="btn" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={formSaving || (!editingId && !form.userId)}>
            {formSaving ? 'Saving…' : editingId ? 'Update' : 'Add'}
          </button>
        </div>
      </Drawer>
    </section>
  );
}