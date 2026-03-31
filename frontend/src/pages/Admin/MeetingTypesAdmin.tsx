import { useEffect, useState, type FormEvent } from 'react';
import { createMeetingType, deleteMeetingType, listMeetingTypes, updateMeetingType } from '../../api/meetingTypes.api';
import type { MeetingTypeRecord } from '../../api/types/meeting-type.types';
import AppShell from '../../components/layout/AppShell';
import { useToast } from '../../hooks/useToast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import MetricTile from '../../components/ui/MetricTile';

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
    defaultAgendaTemplateId: '',
    defaultWorkflowCode: '',
    publishWindowHours: 0,
    carryForwardEnabled: true,
    standingItemsText: 'SECTION|Call to Order|Opening item|false\nSECTION|Reports|Department reports|true',
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
        wizardConfig: {
          defaultAgendaTemplateId: form.defaultAgendaTemplateId || undefined,
          defaultWorkflowCode: form.defaultWorkflowCode || undefined,
          publishWindowHours: Number(form.publishWindowHours || 0),
          carryForwardEnabled: form.carryForwardEnabled,
        },
        standingItems: form.standingItemsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [itemType, title, description, carryForward] = line.split('|');
            return {
              itemType: itemType || 'SECTION',
              title: title || 'Untitled',
              description: description || undefined,
              carryForwardToNext: carryForward === 'true',
            };
          }),
      });
      setForm({
        code: '',
        name: '',
        description: '',
        isInCamera: false,
        defaultAgendaTemplateId: '',
        defaultWorkflowCode: '',
        publishWindowHours: 0,
        carryForwardEnabled: true,
        standingItemsText: 'SECTION|Call to Order|Opening item|false\nSECTION|Reports|Department reports|true',
      });
      await loadMeetingTypes();
      addToast('Meeting type created.', 'success');
    } catch {
      setError('Could not create meeting type.');
      addToast('Could not create meeting type.', 'error');
    }
  };

  const handleQuickWizardEnable = async (meetingType: MeetingTypeRecord): Promise<void> => {
    setError(null);
    try {
      await updateMeetingType(meetingType.id, {
        wizardConfig: {
          defaultAgendaTemplateId: meetingType.wizardConfig?.defaultAgendaTemplateId,
          defaultWorkflowCode: meetingType.wizardConfig?.defaultWorkflowCode,
          publishWindowHours: meetingType.wizardConfig?.publishWindowHours ?? 0,
          carryForwardEnabled: true,
        },
      });
      await loadMeetingTypes();
      addToast('Meeting type wizard updated.', 'success');
    } catch {
      setError('Could not update meeting type wizard settings.');
      addToast('Could not update meeting type wizard settings.', 'error');
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
        <MetricTile label="Meeting Types" value={meetingTypes.length} foot="Available in the meeting scheduler" variant="primary" />
      </section>

      <Card>
        <CardHeader
          title="Create Meeting Type"
          description="Add a meeting type for staff to select in the new meeting form."
        />
        <CardBody>
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
              <div className="form-field">
                <label htmlFor="meeting-type-publish-window">Publish Window Hours</label>
                <input
                  id="meeting-type-publish-window"
                  className="field"
                  type="number"
                  min={0}
                  value={form.publishWindowHours}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, publishWindowHours: Math.max(Number(event.target.value || '0'), 0) }))
                  }
                />
              </div>
              <div className="form-field">
                <label htmlFor="meeting-type-default-workflow">Default Workflow Code</label>
                <input
                  id="meeting-type-default-workflow"
                  className="field"
                  value={form.defaultWorkflowCode}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, defaultWorkflowCode: event.target.value.toUpperCase() }))
                  }
                />
              </div>
              <div className="form-field span-all">
                <label htmlFor="meeting-type-standing-items">Standing Items (itemType|title|description|carryForward)</label>
                <textarea
                  id="meeting-type-standing-items"
                  className="field"
                  rows={4}
                  value={form.standingItemsText}
                  onChange={(event) => setForm((current) => ({ ...current, standingItemsText: event.target.value }))}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create Meeting Type
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Configured Meeting Types"
          description="These values appear in the Meeting Type dropdown when creating and editing meetings."
        />
        <CardBody>
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
                    <th>Wizard</th>
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
                        {meetingType.wizardConfig?.carryForwardEnabled ? 'Carry-forward enabled' : 'Default'}
                      </td>
                      <td>
                        <button type="button" className="btn" onClick={() => void handleQuickWizardEnable(meetingType)}>
                          Enable Wizard
                        </button>
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
        </CardBody>
      </Card>
    </AppShell>
  );
}
