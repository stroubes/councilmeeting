import { useEffect, useState, type FormEvent } from 'react';
import { createResolution, exportResolutionSheet, listResolutions, updateResolution } from '../../api/resolutions.api';
import { listMeetings } from '../../api/meetings.api';
import type { ResolutionRecord } from '../../api/types/resolution.types';
import type { MeetingRecord } from '../../api/types/meeting.types';
import AppShell from '../../components/layout/AppShell';
import { useToast } from '../../hooks/useToast';
import { Card, CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';

export default function ResolutionsRegister(): JSX.Element {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [resolutions, setResolutions] = useState<ResolutionRecord[]>([]);
  const [sheet, setSheet] = useState('');
  const [form, setForm] = useState({ resolutionNumber: '', title: '', body: '', bylawNumber: '' });
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const load = async (meetingId?: string): Promise<void> => {
    try {
      const [meetingRows, resolutionRows] = await Promise.all([listMeetings(), listResolutions(meetingId)]);
      setMeetings(meetingRows);
      setResolutions(resolutionRows);
      if (!selectedMeetingId && meetingRows.length > 0) {
        setSelectedMeetingId(meetingRows[0].id);
      }
    } catch {
      setError('Could not load resolutions register.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (selectedMeetingId) {
      void load(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  const handleCreate = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!selectedMeetingId) {
      return;
    }
    try {
      await createResolution({
        meetingId: selectedMeetingId,
        resolutionNumber: form.resolutionNumber,
        title: form.title,
        body: form.body,
        bylawNumber: form.bylawNumber || undefined,
      });
      setForm({ resolutionNumber: '', title: '', body: '', bylawNumber: '' });
      await load(selectedMeetingId);
      addToast('Resolution created.', 'success');
    } catch {
      setError('Could not create resolution.');
    }
  };

  const handleExportSheet = async (): Promise<void> => {
    if (!selectedMeetingId) {
      return;
    }
    try {
      const result = await exportResolutionSheet(selectedMeetingId);
      setSheet(result.sheet);
    } catch {
      setError('Could not export resolution sheet.');
    }
  };

  const markAdopted = async (resolution: ResolutionRecord): Promise<void> => {
    try {
      await updateResolution(resolution.id, { status: 'ADOPTED' });
      await load(selectedMeetingId);
    } catch {
      setError('Could not update resolution status.');
    }
  };

  return (
    <AppShell title="Resolutions" subtitle="Maintain resolutions, bylaw references, and exportable resolution sheets.">
      <Card>
        <CardBody>
          <form className="form-grid" onSubmit={(event) => void handleCreate(event)}>
            <div className="form-field">
              <label htmlFor="resolution-meeting">Meeting</label>
              <select id="resolution-meeting" className="field" value={selectedMeetingId} onChange={(event) => setSelectedMeetingId(event.target.value)}>
                {meetings.map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>{meeting.title}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="resolution-number">Resolution Number</label>
              <input id="resolution-number" className="field" value={form.resolutionNumber} onChange={(event) => setForm((c) => ({ ...c, resolutionNumber: event.target.value }))} required />
            </div>
            <div className="form-field span-all">
              <label htmlFor="resolution-title">Title</label>
              <input id="resolution-title" className="field" value={form.title} onChange={(event) => setForm((c) => ({ ...c, title: event.target.value }))} required />
            </div>
            <div className="form-field span-all">
              <label htmlFor="resolution-body">Body</label>
              <textarea id="resolution-body" className="field" rows={4} value={form.body} onChange={(event) => setForm((c) => ({ ...c, body: event.target.value }))} required />
            </div>
            <div className="form-field">
              <label htmlFor="resolution-bylaw">Bylaw #</label>
              <input id="resolution-bylaw" className="field" value={form.bylawNumber} onChange={(event) => setForm((c) => ({ ...c, bylawNumber: event.target.value }))} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Create Resolution</button>
              <button type="button" className="btn" onClick={() => void handleExportSheet()}>Export Sheet</button>
            </div>
          </form>
          {error ? <p className="inline-alert">{error}</p> : null}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <DataTable
            columns={[
              { key: 'resolutionNumber', header: 'Number', render: (r: ResolutionRecord) => r.resolutionNumber },
              { key: 'title', header: 'Title', render: (r: ResolutionRecord) => r.title },
              { key: 'status', header: 'Status', render: (r: ResolutionRecord) => r.status },
              { key: 'bylawNumber', header: 'Bylaw', render: (r: ResolutionRecord) => r.bylawNumber ?? '-' },
              {
                key: 'actions',
                header: 'Actions',
                render: (r: ResolutionRecord) => (
                  <button type="button" className="btn" onClick={() => void markAdopted(r)}>Mark Adopted</button>
                ),
              },
            ]}
            data={resolutions}
            emptyMessage="No resolutions recorded for this meeting."
            rowKey={(r) => r.id}
          />
          {sheet ? <pre className="field" style={{ whiteSpace: 'pre-wrap' }}>{sheet}</pre> : null}
        </CardBody>
      </Card>
    </AppShell>
  );
}
