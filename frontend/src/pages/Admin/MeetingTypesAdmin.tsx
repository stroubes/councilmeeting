import { useEffect, useState, type FormEvent } from 'react';
import { createMeetingType, deleteMeetingType, listMeetingTypes } from '../../api/meetingTypes.api';
import type { MeetingTypeRecord } from '../../api/types/meeting-type.types';
import AppShell from '../../components/layout/AppShell';
import { useToast } from '../../hooks/useToast';

export default function MeetingTypesAdmin(): JSX.Element {
  const [meetingTypes, setMeetingTypes] = useState<MeetingTypeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    isInCamera: false,
  });

  const loadMeetingTypes = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listMeetingTypes({ includeInactive: true });
      setMeetingTypes(response);
    } catch {
      setError('Could not load meeting types.');
      addToast('Could not load meeting types.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMeetingTypes();
  }, []);

  const handleCreateMeetingType = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    try {
      await createMeetingType({
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        isInCamera: form.isInCamera,
      });
      setForm({ code: '', name: '', description: '', isInCamera: false });
      await loadMeetingTypes();
      addToast('Meeting type created.', 'success');
    } catch {
      setError('Could not create meeting type.');
      addToast('Could not create meeting type.', 'error');
    }
  };

  const handleDeleteMeetingType = async (meetingType: MeetingTypeRecord): Promise<void> => {
    if (!window.confirm(`Delete meeting type \"${meetingType.name}\"?`)) {
      return;
    }
    setError(null);
    try {
      await deleteMeetingType(meetingType.id);
      await loadMeetingTypes();
      addToast('Meeting type deleted.', 'success');
    } catch {
      setError('Could not delete meeting type.');
      addToast('Could not delete meeting type.', 'error');
    }
  };

  return (
    <AppShell
      title="Meeting Types"
      subtitle="Create and manage the list of meeting types used when scheduling meetings."
      workspaceVariant="admin"
    >
      <section className="module-overview">
        <article className="metric-tile metric-tile-primary">
          <p className="metric-label">Meeting Types</p>
          <p className="metric-value">{meetingTypes.length}</p>
          <p className="metric-foot">Available in the meeting scheduler</p>
        </article>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>
              <span className="panel-icon">MTP</span>
              Create Meeting Type
            </h2>
            <p>Add a meeting type for staff to select in the new meeting form.</p>
          </div>
        </header>
        <div className="card-body">
          <form onSubmit={(event) => void handleCreateMeetingType(event)}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="meeting-type-code">Code</label>
                <input
                  id="meeting-type-code"
                  className="field"
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/\s+/g, '_') }))
                  }
                  placeholder="COUNCIL"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="meeting-type-name">Display Name</label>
                <input
                  id="meeting-type-name"
                  className="field"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Council Meeting"
                  required
                />
              </div>
              <div className="form-field span-all">
                <label htmlFor="meeting-type-description">Description</label>
                <textarea
                  id="meeting-type-description"
                  className="field"
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </div>
              <div className="form-field">
                <label htmlFor="meeting-type-camera">Visibility Type</label>
                <select
                  id="meeting-type-camera"
                  className="field"
                  value={form.isInCamera ? 'IN_CAMERA' : 'PUBLIC'}
                  onChange={(event) => setForm((current) => ({ ...current, isInCamera: event.target.value === 'IN_CAMERA' }))}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="IN_CAMERA">In-Camera</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create Meeting Type
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Configured Meeting Types</h2>
            <p>These values appear in the Meeting Type dropdown when creating and editing meetings.</p>
          </div>
        </header>
        <div className="card-body">
          {isLoading ? <p className="muted">Loading meeting types...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && meetingTypes.length === 0 ? <div className="empty-state">No meeting types configured yet.</div> : null}
          {meetingTypes.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="Meeting types">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Visibility</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meetingTypes.map((meetingType) => (
                    <tr key={meetingType.id}>
                      <td>{meetingType.name}</td>
                      <td>{meetingType.code}</td>
                      <td>{meetingType.isInCamera ? 'In-Camera' : 'Public'}</td>
                      <td>{meetingType.description ?? 'No description provided'}</td>
                      <td>
                        <button type="button" className="btn btn-danger" onClick={() => void handleDeleteMeetingType(meetingType)}>
                          Delete
                        </button>
                      </td>
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
