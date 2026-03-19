import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  addAgendaItem,
  approveAgendaByCao,
  approveAgendaByDirector,
  createAgenda,
  deleteAgenda,
  deleteAgendaItem,
  listAgendas,
  publishAgenda,
  rejectAgenda,
  submitAgendaForDirector,
} from '../../api/agendas.api';
import { listTemplates } from '../../api/templates.api';
import type { AgendaItemRecord, AgendaRecord } from '../../api/types/agenda.types';
import { listMeetings } from '../../api/meetings.api';
import type { MeetingRecord } from '../../api/types/meeting.types';
import type { TemplateRecord } from '../../api/types/template.types';
import {
  inferAgendaTemplateProfile,
  MUNICIPAL_PROFILE,
  normalizeTitle,
  REQUIRED_AGENDA_SECTION_TITLES,
} from '../../config/municipalProfile';
import AppShell from '../../components/layout/AppShell';
import Drawer from '../../components/ui/Drawer';
import StatusBadge from '../../components/ui/StatusBadge';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useToast } from '../../hooks/useToast';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function parsePage(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? null : parsed;
}

function validateCreateAgendaForm(form: { meetingId: string; title: string }): string | null {
  if (!form.meetingId.trim()) {
    return 'Meeting selection is required.';
  }

  if (form.title.trim().length < 5) {
    return 'Agenda title must be at least 5 characters.';
  }

  return null;
}

function getAgendaSubmissionIssues(agenda: AgendaRecord, templates: TemplateRecord[]): string[] {
  const issues: string[] = [];

  if (agenda.items.length === 0) {
    issues.push('Add at least one agenda item before submitting.');
    return issues;
  }

  const hasInCameraItems = agenda.items.some((item) => item.isInCamera);
  const hasClosedAuthorityItem = agenda.items.some((item) => normalizeTitle(item.title).includes('closed session authority'));
  if (hasInCameraItems && !hasClosedAuthorityItem) {
    issues.push('In-camera content requires a Closed Session Authority item.');
  }

  if (!agenda.templateId) {
    return issues;
  }

  const template = templates.find((candidate) => candidate.id === agenda.templateId);
  if (!template) {
    issues.push('Selected template was not found. Reload and try again.');
    return issues;
  }

  const profile = inferAgendaTemplateProfile(template);
  const requiredSections = REQUIRED_AGENDA_SECTION_TITLES[profile];
  const existingTitles = new Set(agenda.items.map((item) => normalizeTitle(item.title)));

  for (const sectionTitle of requiredSections) {
    if (!existingTitles.has(normalizeTitle(sectionTitle))) {
      issues.push(`Missing required section: ${sectionTitle}.`);
    }
  }

  return issues;
}

function validateCreateAgendaItemForm(form: { title: string }): string | null {
  if (form.title.trim().length < 3) {
    return 'Agenda item title must be at least 3 characters.';
  }

  return null;
}

export default function AgendaList(): JSX.Element {
  const [agendas, setAgendas] = useState<AgendaRecord[]>([]);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [agendaTemplates, setAgendaTemplates] = useState<TemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = usePersistentState('agendas.query', '');
  const [statusFilter, setStatusFilter] = usePersistentState('agendas.statusFilter', 'ALL');
  const [sortField, setSortField] = usePersistentState<'title' | 'status' | 'updatedAt' | 'version'>(
    'agendas.sortField',
    'updatedAt',
  );
  const [sortDirection, setSortDirection] = usePersistentState<'asc' | 'desc'>('agendas.sortDirection', 'desc');
  const [page, setPage] = usePersistentState('agendas.page', 1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaRecord | null>(null);
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionPending, setIsActionPending] = useState<string | null>(null);
  const [agendaToReject, setAgendaToReject] = useState<AgendaRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('Requires revisions for compliance and clarity.');
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  const [createForm, setCreateForm] = useState({
    meetingId: '',
    title: '',
    templateId: '',
  });

  const [createItemForm, setCreateItemForm] = useState({
    itemType: 'STAFF_REPORT',
    title: '',
    description: '',
    isInCamera: false,
  });

  const loadAgendas = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const [agendaResponse, meetingResponse, templatesResponse] = await Promise.all([
        listAgendas(),
        listMeetings(),
        listTemplates({ type: 'AGENDA' }),
      ]);
      setAgendas(agendaResponse);
      setMeetings(meetingResponse);
      setAgendaTemplates(templatesResponse);
    } catch {
      setError('Could not load agendas.');
      addToast('Could not load agendas.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAgendas();
  }, []);

  useEffect(() => {
    if (!createForm.meetingId && meetings.length > 0) {
      setCreateForm((current) => ({ ...current, meetingId: meetings[0].id }));
    }
  }, [meetings]);

  useEffect(() => {
    if (searchParams.get('quick') === 'new-agenda') {
      setIsCreateOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('quick');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const queryParam = searchParams.get('q');
    const statusParam = searchParams.get('status');
    const sortFieldParam = searchParams.get('sortField') as 'title' | 'status' | 'updatedAt' | 'version' | null;
    const sortDirectionParam = searchParams.get('sortDirection') as 'asc' | 'desc' | null;
    const pageParam = parsePage(searchParams.get('page'));

    if (queryParam !== null && queryParam !== query) {
      setQuery(queryParam);
    }

    if (statusParam && statusParam !== statusFilter) {
      setStatusFilter(statusParam);
    }

    if (sortFieldParam && ['title', 'status', 'updatedAt', 'version'].includes(sortFieldParam) && sortFieldParam !== sortField) {
      setSortField(sortFieldParam);
    }

    if (sortDirectionParam && ['asc', 'desc'].includes(sortDirectionParam) && sortDirectionParam !== sortDirection) {
      setSortDirection(sortDirectionParam);
    }

    if (pageParam && pageParam !== page) {
      setPage(pageParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('q', query);
    nextParams.set('status', statusFilter);
    nextParams.set('sortField', sortField);
    nextParams.set('sortDirection', sortDirection);
    nextParams.set('page', String(page));

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [query, statusFilter, sortField, sortDirection, page]);

  const filteredAgendas = useMemo(() => {
    const baseFiltered = agendas
      .filter((agenda) => {
        const matchesQuery = agenda.title.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || agenda.status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((left, right) => {
        let comparison = 0;
        if (sortField === 'title') {
          comparison = left.title.localeCompare(right.title);
        } else if (sortField === 'status') {
          comparison = left.status.localeCompare(right.status);
        } else if (sortField === 'version') {
          comparison = left.version - right.version;
        } else {
          comparison = new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });

    return baseFiltered;
  }, [agendas, query, statusFilter, sortField, sortDirection]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredAgendas.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedAgendas = filteredAgendas.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const publishedCount = agendas.filter((agenda) => agenda.status === 'PUBLISHED').length;
  const pendingCount = agendas.filter((agenda) => agenda.status.includes('PENDING')).length;
  const createAgendaValidationError = validateCreateAgendaForm(createForm);
  const createAgendaItemValidationError = validateCreateAgendaItemForm(createItemForm);

  const handleCreateAgenda = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createAgenda({
        meetingId: createForm.meetingId,
        title: createForm.title,
        templateId: createForm.templateId || undefined,
      });
      setIsCreateOpen(false);
      setCreateForm({ meetingId: '', title: '', templateId: '' });
      await loadAgendas();
      addToast('Agenda created successfully.', 'success');
    } catch {
      setError('Could not create agenda package.');
      addToast('Could not create agenda package.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openItemDrawer = (agenda: AgendaRecord): void => {
    setSelectedAgenda(agenda);
    setCreateItemForm({ itemType: 'STAFF_REPORT', title: '', description: '', isInCamera: false });
    setIsItemDrawerOpen(true);
  };

  const handleCreateAgendaItem = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedAgenda) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addAgendaItem(selectedAgenda.id, {
        itemType: createItemForm.itemType,
        title: createItemForm.title,
        description: createItemForm.description || undefined,
        isInCamera: createItemForm.isInCamera,
      });
      await loadAgendas();
      const refreshed = await listAgendas();
      setSelectedAgenda(refreshed.find((agenda) => agenda.id === selectedAgenda.id) ?? null);
      setCreateItemForm({ itemType: 'STAFF_REPORT', title: '', description: '', isInCamera: false });
      addToast('Agenda item added.', 'success');
    } catch {
      setError('Could not add agenda item.');
      addToast('Could not add agenda item.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAgendaItem = async (itemId: string): Promise<void> => {
    if (!selectedAgenda) {
      return;
    }
    if (!window.confirm('Delete this agenda item?')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updatedAgenda = await deleteAgendaItem(selectedAgenda.id, itemId);
      setAgendas((current) => current.map((agenda) => (agenda.id === updatedAgenda.id ? updatedAgenda : agenda)));
      setSelectedAgenda(updatedAgenda);
      addToast('Agenda item deleted.', 'success');
    } catch {
      setError('Could not delete agenda item.');
      addToast('Could not delete agenda item.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const runAgendaAction = async (agendaId: string, action: 'submit' | 'director' | 'cao' | 'reject' | 'publish') => {
    setIsActionPending(`${agendaId}:${action}`);
    setError(null);

    try {
      const targetAgenda = agendas.find((agenda) => agenda.id === agendaId);

      if (action === 'submit') {
        if (targetAgenda) {
          const issues = getAgendaSubmissionIssues(targetAgenda, agendaTemplates);
          if (issues.length > 0) {
            setError(issues[0]);
            addToast(issues[0], 'error');
            return;
          }
        }
        await submitAgendaForDirector(agendaId);
      } else if (action === 'director') {
        await approveAgendaByDirector(agendaId);
      } else if (action === 'cao') {
        await approveAgendaByCao(agendaId);
      } else if (action === 'publish') {
        if (targetAgenda) {
          const issues = getAgendaSubmissionIssues(targetAgenda, agendaTemplates);
          if (issues.length > 0) {
            setError(issues[0]);
            addToast(issues[0], 'error');
            return;
          }
        }
        await publishAgenda(agendaId);
      } else {
        if (!targetAgenda) {
          return;
        }
        setAgendaToReject(targetAgenda);
        setRejectReason('Requires revisions for compliance and clarity.');
        return;
      }

      await loadAgendas();
      addToast('Agenda workflow updated.', 'success');
    } catch {
      setError('Could not update agenda workflow state.');
      addToast('Could not update agenda workflow state.', 'error');
    } finally {
      setIsActionPending(null);
    }
  };

  const handleConfirmReject = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!agendaToReject) {
      return;
    }

    const reason = rejectReason.trim();
    if (reason.length < 5) {
      setError('Rejection reason must be at least 5 characters.');
      addToast('Rejection reason must be at least 5 characters.', 'error');
      return;
    }

    setIsActionPending(`${agendaToReject.id}:reject`);
    setError(null);
    try {
      await rejectAgenda(agendaToReject.id, { reason });
      setAgendaToReject(null);
      await loadAgendas();
      addToast('Agenda returned for revisions.', 'success');
    } catch {
      setError('Could not reject agenda package.');
      addToast('Could not reject agenda package.', 'error');
    } finally {
      setIsActionPending(null);
    }
  };

  const handleDeleteAgenda = async (agenda: AgendaRecord): Promise<void> => {
    if (!window.confirm(`Delete agenda \"${agenda.title}\"?`)) {
      return;
    }
    setIsActionPending(`${agenda.id}:delete`);
    setError(null);
    try {
      await deleteAgenda(agenda.id);
      if (selectedAgenda?.id === agenda.id) {
        setSelectedAgenda(null);
        setIsItemDrawerOpen(false);
      }
      await loadAgendas();
      addToast('Agenda deleted.', 'success');
    } catch {
      setError('Could not delete agenda package.');
      addToast('Could not delete agenda package.', 'error');
    } finally {
      setIsActionPending(null);
    }
  };

  return (
    <AppShell
      title="Agendas"
      subtitle={`Agenda package progress aligned to ${MUNICIPAL_PROFILE.name} requirements.`}
      actions={
        <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          New Agenda
        </button>
      }
    >
      <section className="module-overview">
        <article className="metric-tile metric-tile-primary">
          <p className="metric-label">Agenda Packages</p>
          <p className="metric-value">{agendas.length}</p>
          <p className="metric-foot">Items across current cycle</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Pending Approval</p>
          <p className="metric-value">{pendingCount}</p>
          <p className="metric-foot">Director and CAO stages</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Published</p>
          <p className="metric-value">{publishedCount}</p>
          <p className="metric-foot">Ready for public release</p>
        </article>
      </section>
      <section className="card">
        <header className="card-header">
          <div>
            <h2>Agenda Lifecycle Checks</h2>
            <p>Track drafting, approvals, and publication status by version.</p>
          </div>
          <div className="card-header-meta">
            <span className="pill">{filteredAgendas.length} visible</span>
            <span className="pill">Page {currentPage}</span>
          </div>
        </header>
        <div className="card-body">
          <div className="workspace-toolbar">
            <div className="workspace-toolbar-row">
              <input
                className="field"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search agenda title"
                aria-label="Search agendas"
              />
              <select
                className="field"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by agenda status"
              >
                <option value="ALL">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_DIRECTOR_APPROVAL">Pending Director Approval</option>
                <option value="PENDING_CAO_APPROVAL">Pending CAO Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            <div className="workspace-toolbar-row workspace-toolbar-row-compact">
              <select
                className="field"
                value={sortField}
                onChange={(event) => setSortField(event.target.value as 'title' | 'status' | 'updatedAt' | 'version')}
                aria-label="Sort agendas by"
              >
                <option value="updatedAt">Sort by updated date</option>
                <option value="title">Sort by title</option>
                <option value="status">Sort by status</option>
                <option value="version">Sort by version</option>
              </select>
              <select
                className="field"
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}
                aria-label="Sort direction"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
          {isLoading ? <p className="muted">Loading agendas...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && filteredAgendas.length === 0 ? (
            <div className="empty-state">No agendas match the current filters.</div>
          ) : null}
          {pagedAgendas.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="Agendas list">
                <thead>
                  <tr>
                    <th>Agenda</th>
                    <th>Status</th>
                    <th>Version</th>
                    <th>Items</th>
                    <th>Updated</th>
                    <th>Meeting</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedAgendas.map((agenda) => {
                    const actionKey = (action: string) => `${agenda.id}:${action}`;
                    const linkedMeeting = meetings.find((meeting) => meeting.id === agenda.meetingId);

                    return (
                      <tr key={agenda.id}>
                        <td>
                          <strong>{agenda.title}</strong>
                          <div className="muted">Workflow version v{agenda.version}</div>
                        </td>
                        <td>
                          <StatusBadge status={agenda.status} />
                        </td>
                        <td>v{agenda.version}</td>
                        <td>{agenda.items.length}</td>
                        <td>{formatDate(agenda.updatedAt)}</td>
                        <td>
                          <span className="pill">{linkedMeeting?.title ?? agenda.meetingId.slice(0, 8)}</span>
                        </td>
                        <td>
                          <div className="page-actions">
                            <button type="button" className="btn btn-quiet" onClick={() => openItemDrawer(agenda)}>
                              Items
                            </button>
                            {agenda.status === 'DRAFT' || agenda.status === 'REJECTED' ? (
                              <button
                                type="button"
                                className="btn"
                                disabled={isActionPending === actionKey('submit')}
                                onClick={() => void runAgendaAction(agenda.id, 'submit')}
                              >
                                Submit
                              </button>
                            ) : null}
                            {agenda.status === 'PENDING_DIRECTOR_APPROVAL' ? (
                              <button
                                type="button"
                                className="btn"
                                disabled={isActionPending === actionKey('director')}
                                onClick={() => void runAgendaAction(agenda.id, 'director')}
                              >
                                Approve Director
                              </button>
                            ) : null}
                            {agenda.status === 'PENDING_CAO_APPROVAL' ? (
                              <button
                                type="button"
                                className="btn"
                                disabled={isActionPending === actionKey('cao')}
                                onClick={() => void runAgendaAction(agenda.id, 'cao')}
                              >
                                Approve CAO
                              </button>
                            ) : null}
                            {agenda.status === 'APPROVED' ? (
                              <button
                                type="button"
                                className="btn btn-primary"
                                disabled={isActionPending === actionKey('publish')}
                                onClick={() => void runAgendaAction(agenda.id, 'publish')}
                              >
                                Publish
                              </button>
                            ) : null}
                            {agenda.status === 'PENDING_DIRECTOR_APPROVAL' || agenda.status === 'PENDING_CAO_APPROVAL' ? (
                              <button
                                type="button"
                                className="btn btn-danger"
                                disabled={isActionPending === actionKey('reject')}
                                onClick={() => void runAgendaAction(agenda.id, 'reject')}
                              >
                                Reject
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="btn btn-danger"
                              disabled={isActionPending === actionKey('delete')}
                              onClick={() => void handleDeleteAgenda(agenda)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
          {filteredAgendas.length > 0 ? (
            <div className="page-controls">
              <span className="muted">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredAgendas.length)} of{' '}
                {filteredAgendas.length}
              </span>
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-quiet"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Previous
                </button>
                <span className="pill">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-quiet"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <Drawer
        isOpen={isCreateOpen}
        title="Create Agenda"
        subtitle="Create an agenda package and connect it to a meeting schedule."
        onClose={() => setIsCreateOpen(false)}
      >
        <form onSubmit={(event) => void handleCreateAgenda(event)}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="create-agenda-meeting">Meeting</label>
              <select
                id="create-agenda-meeting"
                className="field"
                required
                value={createForm.meetingId}
                onChange={(event) => setCreateForm((current) => ({ ...current, meetingId: event.target.value }))}
              >
                {meetings.length === 0 ? <option value="">No meetings found</option> : null}
                {meetings.map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>
                    {meeting.title} ({new Date(meeting.startsAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
             <div className="form-field">
               <label htmlFor="create-agenda-template">Template (optional)</label>
               <select
                 id="create-agenda-template"
                 className="field"
                 value={createForm.templateId}
                 onChange={(event) => setCreateForm((current) => ({ ...current, templateId: event.target.value }))}
               >
                 <option value="">No template</option>
                 {agendaTemplates.map((template) => (
                   <option key={template.id} value={template.id}>
                     {template.name} ({template.code})
                   </option>
                 ))}
               </select>
             </div>
            <div className="form-field span-all">
              <label htmlFor="create-agenda-title">Agenda Title</label>
              <input
                id="create-agenda-title"
                className="field"
                required
                value={createForm.title}
                onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || Boolean(createAgendaValidationError)}
            >
              {isSubmitting ? 'Saving...' : 'Create Agenda'}
            </button>
          </div>
          {createAgendaValidationError ? <p className="form-error">{createAgendaValidationError}</p> : null}
        </form>
      </Drawer>

      <Drawer
        isOpen={isItemDrawerOpen}
        title="Agenda Items"
        subtitle={selectedAgenda ? `Manage items for ${selectedAgenda.title}` : 'Manage agenda items'}
        onClose={() => {
          setIsItemDrawerOpen(false);
          setSelectedAgenda(null);
        }}
      >
        {selectedAgenda ? (
          <>
            <div className="table-wrap">
              <table className="data-table" aria-label="Agenda items">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAgenda.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">
                        No items yet.
                      </td>
                    </tr>
                  ) : (
                    selectedAgenda.items.map((item: AgendaItemRecord) => (
                      <tr key={item.id}>
                        <td>{item.sortOrder}</td>
                        <td>{item.itemType}</td>
                        <td>{item.title}</td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-danger"
                            disabled={isSubmitting}
                            onClick={() => void handleDeleteAgendaItem(item.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <form onSubmit={(event) => void handleCreateAgendaItem(event)}>
              <h3>Add Item</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="create-agenda-item-type">Item Type</label>
                  <select
                    id="create-agenda-item-type"
                    className="field"
                    value={createItemForm.itemType}
                    onChange={(event) => setCreateItemForm((current) => ({ ...current, itemType: event.target.value }))}
                  >
                    <option value="STAFF_REPORT">Staff Report</option>
                    <option value="SECTION">Section</option>
                    <option value="MOTION">Motion</option>
                    <option value="BYLAW">Bylaw</option>
                    <option value="INFO_ITEM">Info Item</option>
                    <option value="CONSENT_ITEM">Consent Item</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-field span-all">
                  <label htmlFor="create-agenda-item-title">Title</label>
                  <input
                    id="create-agenda-item-title"
                    className="field"
                    value={createItemForm.title}
                    onChange={(event) => setCreateItemForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </div>
                <div className="form-field span-all">
                  <label htmlFor="create-agenda-item-description">Description</label>
                  <textarea
                    id="create-agenda-item-description"
                    className="field"
                    rows={4}
                    value={createItemForm.description}
                    onChange={(event) =>
                      setCreateItemForm((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || Boolean(createAgendaItemValidationError)}
                >
                  {isSubmitting ? 'Adding...' : 'Add Item'}
                </button>
              </div>
              {createAgendaItemValidationError ? <p className="form-error">{createAgendaItemValidationError}</p> : null}
            </form>
          </>
        ) : (
          <div className="empty-state">Select an agenda to manage items.</div>
        )}
      </Drawer>

      <Drawer
        isOpen={Boolean(agendaToReject)}
        title="Return Agenda for Revisions"
        subtitle={agendaToReject ? `Provide the reason for returning ${agendaToReject.title}.` : 'Provide rejection reason'}
        onClose={() => setAgendaToReject(null)}
      >
        <form onSubmit={(event) => void handleConfirmReject(event)}>
          <div className="form-grid">
            <div className="form-field span-all">
              <label htmlFor="agenda-reject-reason">Reason for Revisions</label>
              <textarea
                id="agenda-reject-reason"
                className="field"
                rows={4}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setAgendaToReject(null)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={!agendaToReject || isActionPending === `${agendaToReject.id}:reject`}
            >
              {agendaToReject && isActionPending === `${agendaToReject.id}:reject` ? 'Returning...' : 'Return for Revisions'}
            </button>
          </div>
        </form>
      </Drawer>
    </AppShell>
  );
}
