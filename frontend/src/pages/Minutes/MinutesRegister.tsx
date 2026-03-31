import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  autoPopulateMinutes,
  createMinutes,
  finalizeMinutes,
  listMinutes,
  publishMinutes,
  startMinutes,
  adoptMinutes,
  updateMinutes,
} from '../../api/minutes.api';
import { listMeetings } from '../../api/meetings.api';
import { getActionDashboard } from '../../api/actions.api';
import { listResolutions } from '../../api/resolutions.api';
import type {
  ActionItemStatus,
  MinutesActionItem,
  MinutesAttendanceEntry,
  MinutesContent,
  MinutesMotionEntry,
  MinutesRecord,
  MinutesVoteEntry,
  MotionOutcome,
  VoteMethod,
} from '../../api/types/minutes.types';
import type { MeetingRecord } from '../../api/types/meeting.types';
import AppShell from '../../components/layout/AppShell';
import Drawer from '../../components/ui/Drawer';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../hooks/useToast';
import { formatMeetingSelectionLabel, formatMeetingTableLabel } from '../../utils/meetingDisplay';
import MetricTile from '../../components/ui/MetricTile';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import RichTextEditor from '../../components/ui/RichTextEditor';

function buildDefaultMinutesContent() {
  return {
    schemaVersion: 1 as const,
    summary: '',
    attendance: [],
    motions: [],
    votes: [],
    actionItems: [],
    notes: [],
  };
}

const ATTENDANCE_ROLES = ['CHAIR', 'COUNCIL_MEMBER', 'STAFF', 'GUEST'] as const;
const MOTION_OUTCOMES: MotionOutcome[] = ['PENDING', 'CARRIED', 'DEFEATED', 'WITHDRAWN', 'TABLED', 'DEFERRED', 'REFERRED'];
const VOTE_METHODS: VoteMethod[] = ['RECORDED', 'VOICE', 'HANDS'];
const ACTION_STATUSES: ActionItemStatus[] = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function MinutesRegister(): JSX.Element {
  const [minutes, setMinutes] = useState<MinutesRecord[]>([]);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [meetingId, setMeetingId] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [resolutionCount, setResolutionCount] = useState(0);
  const [overdueActions, setOverdueActions] = useState(0);
  const [editingMinutes, setEditingMinutes] = useState<MinutesRecord | null>(null);
  const [richTextContent, setRichTextContent] = useState<Record<string, unknown> | undefined>();
  const [structuredContent, setStructuredContent] = useState<MinutesContent>(buildDefaultMinutesContent());
  const [showInCameraOnly, setShowInCameraOnly] = useState(false);
  const { addToast } = useToast();

  const load = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [minutesData, meetingData, resolutionsData, actionDashboard] = await Promise.all([
        listMinutes(undefined, showInCameraOnly ? true : undefined),
        listMeetings(),
        listResolutions(),
        getActionDashboard(),
      ]);
      setMinutes(minutesData);
      setMeetings(meetingData);
      setResolutionCount(resolutionsData.length);
      setOverdueActions(actionDashboard.overdue);
      if (!meetingId && meetingData.length > 0) {
        setMeetingId(meetingData[0].id);
      }
    } catch {
      setError('Could not load minutes register.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [showInCameraOnly]);

  const handleCreate = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!meetingId) {
      addToast('Select a meeting before creating minutes.', 'error');
      return;
    }

    try {
      await createMinutes({ meetingId, contentJson: buildDefaultMinutesContent() });
      setIsCreateOpen(false);
      await load();
      addToast('Minutes record created.', 'success');
    } catch {
      setError('Could not create minutes.');
      addToast('Could not create minutes.', 'error');
    }
  };

  const runAction = async (
    minutesId: string,
    action: 'start' | 'finalize' | 'adopt' | 'publish',
  ): Promise<void> => {
    setPendingAction(`${minutesId}:${action}`);
    setError(null);
    try {
      if (action === 'start') {
        await startMinutes(minutesId);
      } else if (action === 'finalize') {
        await finalizeMinutes(minutesId);
      } else if (action === 'adopt') {
        await adoptMinutes(minutesId);
      } else {
        await publishMinutes(minutesId);
      }
      await load();
      addToast(`Minutes ${action} action completed.`, 'success');
    } catch {
      setError(`Could not ${action} minutes.`);
      addToast(`Could not ${action} minutes.`, 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const openEditDrawer = (record: MinutesRecord): void => {
    setEditingMinutes(record);
    setRichTextContent(record.richTextSummary);
    setStructuredContent(JSON.parse(JSON.stringify(record.contentJson)) as MinutesContent);
  };

  const handleSaveMinutesContent = async (): Promise<void> => {
    if (!editingMinutes) return;
    try {
      await updateMinutes(editingMinutes.id, {
        richTextSummary: richTextContent,
        contentJson: structuredContent,
      });
      await load();
      setEditingMinutes(null);
      addToast('Minutes content saved.', 'success');
    } catch {
      addToast('Could not save minutes content.', 'error');
    }
  };

  const handleAutoPopulate = async (record: MinutesRecord): Promise<void> => {
    setPendingAction(`${record.id}:auto-populate`);
    setError(null);
    try {
      await autoPopulateMinutes(record.id);
      await load();
      addToast('Minutes content synchronized from attendees, motions, and votes.', 'success');
    } catch {
      setError('Could not auto-populate minutes content.');
      addToast('Could not auto-populate minutes content.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const updateAttendanceEntry = (id: string, patch: Partial<MinutesAttendanceEntry>): void => {
    setStructuredContent((current) => ({
      ...current,
      attendance: current.attendance.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    }));
  };

  const updateMotionEntry = (id: string, patch: Partial<MinutesMotionEntry>): void => {
    setStructuredContent((current) => ({
      ...current,
      motions: current.motions.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    }));
  };

  const updateVoteEntry = (id: string, patch: Partial<MinutesVoteEntry>): void => {
    setStructuredContent((current) => ({
      ...current,
      votes: current.votes.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    }));
  };

  const updateActionItem = (id: string, patch: Partial<MinutesActionItem>): void => {
    setStructuredContent((current) => ({
      ...current,
      actionItems: current.actionItems.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    }));
  };

  const addAttendanceEntry = (): void => {
    setStructuredContent((current) => ({
      ...current,
      attendance: [
        ...current.attendance,
        {
          id: newId(),
          personName: '',
          role: 'COUNCIL_MEMBER',
          present: true,
        },
      ],
    }));
  };

  const addMotionEntry = (): void => {
    setStructuredContent((current) => ({
      ...current,
      motions: [
        ...current.motions,
        {
          id: newId(),
          title: '',
          outcome: 'PENDING',
        },
      ],
    }));
  };

  const addVoteEntry = (): void => {
    setStructuredContent((current) => ({
      ...current,
      votes: [
        ...current.votes,
        {
          id: newId(),
          method: 'VOICE',
          yesCount: 0,
          noCount: 0,
          abstainCount: 0,
          recordedVotes: [],
        },
      ],
    }));
  };

  const addActionItem = (): void => {
    setStructuredContent((current) => ({
      ...current,
      actionItems: [
        ...current.actionItems,
        {
          id: newId(),
          description: '',
          status: 'OPEN',
        },
      ],
    }));
  };

  const addNote = (): void => {
    setStructuredContent((current) => ({
      ...current,
      notes: [...current.notes, ''],
    }));
  };

  const removeAttendanceEntry = (id: string): void => {
    setStructuredContent((current) => ({
      ...current,
      attendance: current.attendance.filter((entry) => entry.id !== id),
    }));
  };

  const removeMotionEntry = (id: string): void => {
    setStructuredContent((current) => ({
      ...current,
      motions: current.motions.filter((entry) => entry.id !== id),
    }));
  };

  const removeVoteEntry = (id: string): void => {
    setStructuredContent((current) => ({
      ...current,
      votes: current.votes.filter((entry) => entry.id !== id),
    }));
  };

  const removeActionItem = (id: string): void => {
    setStructuredContent((current) => ({
      ...current,
      actionItems: current.actionItems.filter((entry) => entry.id !== id),
    }));
  };

  const removeNote = (index: number): void => {
    setStructuredContent((current) => ({
      ...current,
      notes: current.notes.filter((_, noteIndex) => noteIndex !== index),
    }));
  };

  const updateNote = (index: number, value: string): void => {
    setStructuredContent((current) => ({
      ...current,
      notes: current.notes.map((entry, noteIndex) => (noteIndex === index ? value : entry)),
    }));
  };

  const publishedCount = useMemo(
    () => minutes.filter((record) => record.status === 'PUBLISHED').length,
    [minutes],
  );

  return (
    <AppShell
      title="Minutes"
      subtitle="Minute taking lifecycle from draft through finalized and published."
      actions={
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            Create Minutes
          </button>
        </div>
      }
    >
      <section className="module-overview">
        <MetricTile
          variant="primary"
          label="Minutes Records"
          value={minutes.length}
          foot="Tracked across council meetings"
        />
        <MetricTile
          label="Published"
          value={publishedCount}
          foot="Released to the public portal"
        />
        <MetricTile
          label="Resolutions Logged"
          value={resolutionCount}
          foot="Linked legislative decisions available"
        />
        <MetricTile
          label="Overdue Actions"
          value={overdueActions}
          foot="Follow-up items requiring attention"
        />
      </section>

      <Card>
        <CardHeader
          title="Minutes Register"
          description="Track minute taking status and publishing readiness."
        />
        <CardBody>
          {isLoading ? <p className="muted">Loading minutes operations...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}

          <div className="table-controls">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showInCameraOnly}
                onChange={(e) => setShowInCameraOnly(e.target.checked)}
              />
              <span>Show in-camera minutes only</span>
            </label>
          </div>

          <DataTable
            columns={[
              {
                key: 'isInCamera',
                header: '',
                render: (record: MinutesRecord) =>
                  record.isInCamera ? (
                    <span className="in-camera-badge" title="In-Camera Minutes">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                  ) : null,
              },
              {
                key: 'meetingId',
                header: 'Meeting',
                render: (record: MinutesRecord) => {
                  const meeting = meetings.find((entry) => entry.id === record.meetingId);
                  return meeting ? formatMeetingTableLabel(meeting) : record.meetingId.slice(0, 8);
                },
              },
              {
                key: 'status',
                header: 'Status',
                render: (record: MinutesRecord) => <StatusBadge status={record.status} />,
              },
              {
                key: 'attendance',
                header: 'Attendance',
                render: (record: MinutesRecord) => record.contentJson.attendance.filter((entry) => entry.present).length,
              },
              {
                key: 'motions',
                header: 'Motions',
                render: (record: MinutesRecord) => record.contentJson.motions.length,
              },
              {
                key: 'actionItems',
                header: 'Action Items',
                render: (record: MinutesRecord) => record.contentJson.actionItems.length,
              },
              {
                key: 'updatedAt',
                header: 'Updated',
                render: (record: MinutesRecord) => new Date(record.updatedAt).toLocaleString(),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (record: MinutesRecord) => {
                  const actionKey = (action: string) => `${record.id}:${action}`;
                  return (
                    <div className="page-actions">
                      {record.status !== 'PUBLISHED' ? (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => openEditDrawer(record)}
                        >
                          Edit
                        </button>
                      ) : null}
                      {record.status !== 'PUBLISHED' ? (
                        <button
                          type="button"
                          className="btn btn-quiet"
                          disabled={pendingAction === actionKey('auto-populate')}
                          onClick={() => void handleAutoPopulate(record)}
                        >
                          {pendingAction === actionKey('auto-populate') ? 'Syncing...' : 'Auto-Populate'}
                        </button>
                      ) : null}
                      {record.status === 'DRAFT' ? (
                        <button
                          type="button"
                          className="btn"
                          disabled={pendingAction === actionKey('start')}
                          onClick={() => void runAction(record.id, 'start')}
                        >
                          Begin Session
                        </button>
                      ) : null}
                      {record.status === 'DRAFT' || record.status === 'IN_PROGRESS' ? (
                        <button
                          type="button"
                          className="btn"
                          disabled={pendingAction === actionKey('finalize')}
                          onClick={() => void runAction(record.id, 'finalize')}
                        >
                          Finalize Draft
                        </button>
                      ) : null}
                      {record.status === 'FINALIZED' ? (
                        <>
                          <button
                            type="button"
                            className="btn"
                            disabled={pendingAction === actionKey('adopt')}
                            onClick={() => void runAction(record.id, 'adopt')}
                          >
                            Adopt Minutes
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={pendingAction === actionKey('publish')}
                            onClick={() => void runAction(record.id, 'publish')}
                          >
                            Publish
                          </button>
                        </>
                      ) : null}
                      {record.status === 'ADOPTED' ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={pendingAction === actionKey('publish')}
                          onClick={() => void runAction(record.id, 'publish')}
                        >
                          Publish
                        </button>
                      ) : null}
                    </div>
                  );
                },
              },
            ]}
            data={minutes}
            isLoading={isLoading}
            emptyMessage="No minutes records yet. Start by creating minutes for the next meeting."
            rowKey={(record) => record.id}
          />
        </CardBody>
      </Card>

      <Drawer
        isOpen={isCreateOpen}
        title="Create Minutes"
        subtitle="Initialize a minutes record for the selected meeting."
        onClose={() => setIsCreateOpen(false)}
      >
        <form onSubmit={(event) => void handleCreate(event)}>
          <div className="form-grid">
            <div className="form-field span-all">
              <label htmlFor="create-minutes-meeting">Meeting</label>
              <select
                id="create-minutes-meeting"
                className="field"
                value={meetingId}
                onChange={(event) => setMeetingId(event.target.value)}
                disabled={meetings.length === 0}
              >
                {meetings.length === 0 ? <option value="">No meetings found</option> : null}
                {meetings.map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>
                    {formatMeetingSelectionLabel(meeting)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!meetingId || meetings.length === 0}>
              Create Minutes
            </button>
          </div>
        </form>
      </Drawer>

      <Drawer
        isOpen={Boolean(editingMinutes)}
        title="Edit Minutes Content"
        subtitle={editingMinutes ? `Editing minutes for meeting ${editingMinutes.meetingId.slice(0, 8)}...` : 'Edit minutes content'}
        onClose={() => setEditingMinutes(null)}
      >
        <div className="form-grid">
          {editingMinutes ? (
            <div className="form-field span-all">
              <p className="muted" style={{ margin: 0 }}>
                Structured record snapshot: {structuredContent.attendance.length} attendance entries,{' '}
                {structuredContent.motions.length} motions, {structuredContent.votes.length} vote records,{' '}
                {structuredContent.actionItems.length} action items.
              </p>
            </div>
          ) : null}
          <div className="form-field span-all">
            <label htmlFor="minutes-summary-text">Structured Summary</label>
            <textarea
              id="minutes-summary-text"
              className="field"
              rows={3}
              value={structuredContent.summary}
              onChange={(event) =>
                setStructuredContent((current) => ({
                  ...current,
                  summary: event.target.value,
                }))
              }
              placeholder="Concise plain-language summary used for governance records"
            />
          </div>

          <div className="form-field span-all">
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>
              <div>
                <h3>Attendance</h3>
                <p className="muted">Track attendance for quorum and statutory record requirements.</p>
              </div>
              <button type="button" className="btn btn-quiet" onClick={addAttendanceEntry}>
                Add Attendance
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table" aria-label="Minutes attendance entries">
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Role</th>
                    <th>Present</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {structuredContent.attendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">No attendance entries yet.</td>
                    </tr>
                  ) : (
                    structuredContent.attendance.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <input
                            className="field"
                            value={entry.personName}
                            onChange={(event) => updateAttendanceEntry(entry.id, { personName: event.target.value })}
                            placeholder="Councillor name"
                          />
                        </td>
                        <td>
                          <select
                            className="field"
                            value={entry.role}
                            onChange={(event) => updateAttendanceEntry(entry.id, { role: event.target.value as MinutesAttendanceEntry['role'] })}
                          >
                            {ATTENDANCE_ROLES.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <label className="toggle-label">
                            <input
                              type="checkbox"
                              checked={entry.present}
                              onChange={(event) => updateAttendanceEntry(entry.id, { present: event.target.checked })}
                            />
                            <span>{entry.present ? 'Yes' : 'No'}</span>
                          </label>
                        </td>
                        <td>
                          <input
                            className="field"
                            value={entry.notes ?? ''}
                            onChange={(event) => updateAttendanceEntry(entry.id, { notes: event.target.value || undefined })}
                            placeholder="Optional note"
                          />
                        </td>
                        <td>
                          <button type="button" className="btn btn-danger btn-quiet" onClick={() => removeAttendanceEntry(entry.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-field span-all">
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>
              <div>
                <h3>Motions</h3>
                <p className="muted">Maintain final motion outcomes in one structured register.</p>
              </div>
              <button type="button" className="btn btn-quiet" onClick={addMotionEntry}>
                Add Motion
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table" aria-label="Minutes motions entries">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Outcome</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {structuredContent.motions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted">No motion entries yet.</td>
                    </tr>
                  ) : (
                    structuredContent.motions.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <input
                            className="field"
                            value={entry.title}
                            onChange={(event) => updateMotionEntry(entry.id, { title: event.target.value })}
                            placeholder="Motion title"
                          />
                        </td>
                        <td>
                          <select
                            className="field"
                            value={entry.outcome}
                            onChange={(event) => updateMotionEntry(entry.id, { outcome: event.target.value as MotionOutcome })}
                          >
                            {MOTION_OUTCOMES.map((outcome) => (
                              <option key={outcome} value={outcome}>{outcome}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="field"
                            value={entry.notes ?? ''}
                            onChange={(event) => updateMotionEntry(entry.id, { notes: event.target.value || undefined })}
                            placeholder="Optional note"
                          />
                        </td>
                        <td>
                          <button type="button" className="btn btn-danger btn-quiet" onClick={() => removeMotionEntry(entry.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-field span-all">
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>
              <div>
                <h3>Votes</h3>
                <p className="muted">Capture official tallies and method for each voted motion.</p>
              </div>
              <button type="button" className="btn btn-quiet" onClick={addVoteEntry}>
                Add Vote
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table" aria-label="Minutes vote entries">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Yes</th>
                    <th>No</th>
                    <th>Abstain</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {structuredContent.votes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">No vote entries yet.</td>
                    </tr>
                  ) : (
                    structuredContent.votes.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <select
                            className="field"
                            value={entry.method}
                            onChange={(event) => updateVoteEntry(entry.id, { method: event.target.value as VoteMethod })}
                          >
                            {VOTE_METHODS.map((method) => (
                              <option key={method} value={method}>{method}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="field"
                            type="number"
                            min={0}
                            value={entry.yesCount}
                            onChange={(event) =>
                              updateVoteEntry(entry.id, { yesCount: Math.max(0, Number.parseInt(event.target.value || '0', 10) || 0) })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="field"
                            type="number"
                            min={0}
                            value={entry.noCount}
                            onChange={(event) =>
                              updateVoteEntry(entry.id, { noCount: Math.max(0, Number.parseInt(event.target.value || '0', 10) || 0) })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="field"
                            type="number"
                            min={0}
                            value={entry.abstainCount}
                            onChange={(event) =>
                              updateVoteEntry(entry.id, { abstainCount: Math.max(0, Number.parseInt(event.target.value || '0', 10) || 0) })
                            }
                          />
                        </td>
                        <td>
                          <button type="button" className="btn btn-danger btn-quiet" onClick={() => removeVoteEntry(entry.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-field span-all">
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>
              <div>
                <h3>Action Items</h3>
                <p className="muted">Track assigned follow-up work from motions and resolutions.</p>
              </div>
              <button type="button" className="btn btn-quiet" onClick={addActionItem}>
                Add Action Item
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table" aria-label="Minutes action items entries">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Owner</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {structuredContent.actionItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">No action items yet.</td>
                    </tr>
                  ) : (
                    structuredContent.actionItems.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <input
                            className="field"
                            value={entry.description}
                            onChange={(event) => updateActionItem(entry.id, { description: event.target.value })}
                            placeholder="Action description"
                          />
                        </td>
                        <td>
                          <input
                            className="field"
                            value={entry.owner ?? ''}
                            onChange={(event) => updateActionItem(entry.id, { owner: event.target.value || undefined })}
                            placeholder="Owner"
                          />
                        </td>
                        <td>
                          <input
                            className="field"
                            value={entry.dueDate ?? ''}
                            onChange={(event) => updateActionItem(entry.id, { dueDate: event.target.value || undefined })}
                            placeholder="YYYY-MM-DD"
                          />
                        </td>
                        <td>
                          <select
                            className="field"
                            value={entry.status}
                            onChange={(event) => updateActionItem(entry.id, { status: event.target.value as ActionItemStatus })}
                          >
                            {ACTION_STATUSES.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button type="button" className="btn btn-danger btn-quiet" onClick={() => removeActionItem(entry.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-field span-all">
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>
              <div>
                <h3>Clerk Notes</h3>
                <p className="muted">Internal notes retained in the structured minutes record.</p>
              </div>
              <button type="button" className="btn btn-quiet" onClick={addNote}>
                Add Note
              </button>
            </div>
            <div className="form-grid">
              {structuredContent.notes.length === 0 ? (
                <p className="muted">No notes added yet.</p>
              ) : (
                structuredContent.notes.map((note, index) => (
                  <div className="form-field span-all" key={`minutes-note-${index}`}>
                    <div className="page-actions" style={{ alignItems: 'center' }}>
                      <input
                        className="field"
                        value={note}
                        onChange={(event) => updateNote(index, event.target.value)}
                        placeholder="Meeting note"
                      />
                      <button type="button" className="btn btn-danger btn-quiet" onClick={() => removeNote(index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="form-field span-all">
            <label>Meeting Summary</label>
            <RichTextEditor
              content={richTextContent}
              onChange={setRichTextContent}
              placeholder="Enter meeting summary with formatting..."
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-quiet" onClick={() => setEditingMinutes(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void handleSaveMinutesContent()}>
            Save Changes
          </button>
        </div>
      </Drawer>
    </AppShell>
  );
}
