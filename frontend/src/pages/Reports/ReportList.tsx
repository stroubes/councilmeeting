import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  addReportAttachment,
  createReport,
  deleteReport,
  importDocxReport,
  listReportAttachments,
  listReports,
  publishReport,
  removeReportAttachment,
  submitReport,
  updateReport,
} from '../../api/reports.api';
import { listWorkflowConfigurations } from '../../api/workflows.api';
import { listAgendas } from '../../api/agendas.api';
import { listTemplates } from '../../api/templates.api';
import type { AgendaRecord } from '../../api/types/agenda.types';
import type { ReportAttachmentRecord, StaffReportRecord } from '../../api/types/report.types';
import type { TemplateRecord } from '../../api/types/template.types';
import type { WorkflowRecord } from '../../api/types/workflow.types';
import { MUNICIPAL_PROFILE } from '../../config/municipalProfile';
import AppShell from '../../components/layout/AppShell';
import Drawer from '../../components/ui/Drawer';
import StatusBadge from '../../components/ui/StatusBadge';
import WorkflowHistoryPanel from '../../components/ui/WorkflowHistoryPanel';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useToast } from '../../hooks/useToast';
import MetricTile from '../../components/ui/MetricTile';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';

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

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function validateCreateReportForm(
  form: {
    title: string;
    agendaItemId: string;
    executiveSummary: string;
    recommendations: string;
    financialImpact: string;
    templateId: string;
  },
  templates: TemplateRecord[],
): string | null {
  if (form.title.trim().length < 5) {
    return 'Title must be at least 5 characters.';
  }

  if (!form.agendaItemId.trim()) {
    return 'Agenda item selection is required.';
  }

  if (form.executiveSummary.trim().length < 12) {
    return 'Executive summary must be at least 12 characters.';
  }

  if (form.recommendations.trim().length < 12) {
    return 'Recommendation must be at least 12 characters.';
  }

  if (requiresFinancialImplications(form.templateId, templates) && form.financialImpact.trim().length < 8) {
    return 'Financial implications are required by the selected template.';
  }

  return null;
}

function validateEditReportForm(
  form: { title: string; executiveSummary: string; recommendations: string; financialImpact: string; templateId: string },
  templates: TemplateRecord[],
): string | null {
  if (form.title.trim().length < 5) {
    return 'Title must be at least 5 characters.';
  }

  if (form.executiveSummary.trim().length < 12) {
    return 'Executive summary must be at least 12 characters.';
  }

  if (form.recommendations.trim().length < 12) {
    return 'Recommendation must be at least 12 characters.';
  }

  if (requiresFinancialImplications(form.templateId, templates) && form.financialImpact.trim().length < 8) {
    return 'Financial implications are required by the selected template.';
  }

  return null;
}

function requiresFinancialImplications(templateId: string, templates: TemplateRecord[]): boolean {
  if (!templateId) {
    return false;
  }

  const template = templates.find((candidate) => candidate.id === templateId);
  if (!template) {
    return false;
  }

  return template.sections.some((section) => {
    const source = `${section.sectionType ?? ''} ${section.title}`.toLowerCase();
    return section.isRequired && source.includes('financial');
  });
}

function getReportSubmissionIssues(report: StaffReportRecord, templates: TemplateRecord[]): string[] {
  const issues: string[] = [];

  if (!report.title?.trim() || report.title.trim().length < 5) {
    issues.push('Title is required before submission.');
  }

  if (!report.executiveSummary?.trim() || report.executiveSummary.trim().length < 12) {
    issues.push('Executive summary is required before submission.');
  }

  if (!report.recommendations?.trim() || report.recommendations.trim().length < 12) {
    issues.push('Recommendation is required before submission.');
  }

  if (requiresFinancialImplications(report.templateId ?? '', templates) && !report.financialImpact?.trim()) {
    issues.push('Financial implications are required before submission.');
  }

  return issues;
}

export default function ReportList(): JSX.Element {
  const [reports, setReports] = useState<StaffReportRecord[]>([]);
  const [agendas, setAgendas] = useState<AgendaRecord[]>([]);
  const [reportTemplates, setReportTemplates] = useState<TemplateRecord[]>([]);
  const [reportWorkflows, setReportWorkflows] = useState<WorkflowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = usePersistentState('reports.query', '');
  const [statusFilter, setStatusFilter] = usePersistentState('reports.statusFilter', 'ALL');
  const [sortField, setSortField] = usePersistentState<'title' | 'status' | 'updatedAt'>(
    'reports.sortField',
    'updatedAt',
  );
  const [sortDirection, setSortDirection] = usePersistentState<'asc' | 'desc'>('reports.sortDirection', 'desc');
  const [page, setPage] = usePersistentState('reports.page', 1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showImportAdvanced, setShowImportAdvanced] = useState(false);
  const [attachmentReport, setAttachmentReport] = useState<StaffReportRecord | null>(null);
  const [showAttachmentAdvanced, setShowAttachmentAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingReportId, setSubmittingReportId] = useState<string | null>(null);
  const [publishingReportId, setPublishingReportId] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<StaffReportRecord | null>(null);
  const [selectedReport, setSelectedReport] = useState<StaffReportRecord | null>(null);
  const [attachments, setAttachments] = useState<ReportAttachmentRecord[]>([]);
  const [isAttachmentLoading, setIsAttachmentLoading] = useState(false);
  const [isAttachmentSubmitting, setIsAttachmentSubmitting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  const [createForm, setCreateForm] = useState({
    title: '',
    agendaItemId: '',
    workflowConfigId: '',
    templateId: '',
    department: '',
    executiveSummary: '',
    recommendations: '',
    financialImpact: '',
  });

  const [importForm, setImportForm] = useState({
    agendaItemId: '',
    workflowConfigId: '',
    fileName: '',
    contentBase64: '',
    sharePointDriveId: '',
    sharePointItemId: '',
    sharePointWebUrl: '',
  });

  const [editForm, setEditForm] = useState({
    title: '',
    workflowConfigId: '',
    templateId: '',
    department: '',
    executiveSummary: '',
    recommendations: '',
    financialImpact: '',
  });

  const [attachmentForm, setAttachmentForm] = useState({
    fileName: '',
    mimeType: '',
    sizeBytes: 0,
    contentBase64: '',
    sharePointDriveId: '',
    sharePointItemId: '',
    sharePointWebUrl: '',
  });

  const loadReports = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [reportData, agendaData, templateData, workflowData] = await Promise.all([
        listReports(),
        listAgendas(),
        listTemplates({ type: 'STAFF_REPORT' }),
        listWorkflowConfigurations({ domain: 'REPORT' }),
      ]);
      setReports(reportData);
      setAgendas(agendaData);
      setReportTemplates(templateData);
      setReportWorkflows(workflowData);
    } catch {
      setError('Could not load reports.');
      addToast('Could not load reports.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  useEffect(() => {
    if (searchParams.get('quick') === 'new-report') {
      setIsCreateOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('quick');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const queryParam = searchParams.get('q');
    const statusParam = searchParams.get('status');
    const sortFieldParam = searchParams.get('sortField') as 'title' | 'status' | 'updatedAt' | null;
    const sortDirectionParam = searchParams.get('sortDirection') as 'asc' | 'desc' | null;
    const pageParam = parsePage(searchParams.get('page'));

    if (queryParam !== null && queryParam !== query) {
      setQuery(queryParam);
    }

    if (statusParam && statusParam !== statusFilter) {
      setStatusFilter(statusParam);
    }

    if (sortFieldParam && ['title', 'status', 'updatedAt'].includes(sortFieldParam) && sortFieldParam !== sortField) {
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

  const agendaItems = useMemo(
    () => agendas.flatMap((agenda) => agenda.items.map((item) => ({ ...item, agendaTitle: agenda.title }))),
    [agendas],
  );

  const defaultWorkflowId = useMemo(
    () => reportWorkflows.find((workflow) => workflow.isDefault)?.id ?? reportWorkflows[0]?.id ?? '',
    [reportWorkflows],
  );

  useEffect(() => {
    if (!createForm.agendaItemId && agendaItems.length > 0) {
      setCreateForm((current) => ({ ...current, agendaItemId: agendaItems[0].id }));
    }
    if (!importForm.agendaItemId && agendaItems.length > 0) {
      setImportForm((current) => ({ ...current, agendaItemId: agendaItems[0].id }));
    }
  }, [agendaItems]);

  useEffect(() => {
    if (!defaultWorkflowId) {
      return;
    }
    setCreateForm((current) => (current.workflowConfigId ? current : { ...current, workflowConfigId: defaultWorkflowId }));
    setImportForm((current) => (current.workflowConfigId ? current : { ...current, workflowConfigId: defaultWorkflowId }));
  }, [defaultWorkflowId]);

  const openAttachmentsDrawer = async (report: StaffReportRecord): Promise<void> => {
    setAttachmentReport(report);
    setShowAttachmentAdvanced(false);
    setAttachments([]);
    setAttachmentFile(null);
    setAttachmentForm({
      fileName: '',
      mimeType: '',
      sizeBytes: 0,
      contentBase64: '',
      sharePointDriveId: '',
      sharePointItemId: '',
      sharePointWebUrl: '',
    });
    setIsAttachmentLoading(true);
    try {
      const data = await listReportAttachments(report.id);
      setAttachments(data);
    } catch {
      setError('Could not load report attachments.');
      addToast('Could not load report attachments.', 'error');
    } finally {
      setIsAttachmentLoading(false);
    }
  };

  const handleCreateDemo = async (): Promise<void> => {
    setError(null);
    if (agendaItems.length === 0) {
      setError('Add an agenda item before creating a demo report.');
      addToast('Add an agenda item before creating a demo report.', 'error');
      return;
    }

    try {
      const created = await createReport({
        agendaItemId: agendaItems[0].id,
        workflowConfigId: defaultWorkflowId || undefined,
        title: `Demo Report ${new Date().toLocaleTimeString()}`,
        executiveSummary: 'Auto-generated report for workflow testing.',
      });
      setReports((current) => [created, ...current]);
      addToast('Demo report created.', 'success');
    } catch {
      setError('Could not create demo report.');
      addToast('Could not create demo report.', 'error');
    }
  };

  const handleSubmit = async (reportId: string): Promise<void> => {
    setError(null);

    const report = reports.find((candidate) => candidate.id === reportId);
    if (!report) {
      setError('Could not find the selected report. Refresh and try again.');
      addToast('Could not find the selected report.', 'error');
      return;
    }

    const preflightIssues = getReportSubmissionIssues(report, reportTemplates);
    if (preflightIssues.length > 0) {
      const message = `This report is not ready for submission: ${preflightIssues.join(' ')}`;
      setError(message);
      addToast(message, 'error');
      return;
    }

    setSubmittingReportId(reportId);
    try {
      const updated = await submitReport(reportId);
      setReports((current) => current.map((report) => (report.id === updated.id ? updated : report)));
      addToast('Report submitted to workflow.', 'success');
    } catch {
      setError('Could not submit report.');
      addToast('Could not submit report.', 'error');
    } finally {
      setSubmittingReportId(null);
    }
  };

  const handlePublish = async (reportId: string): Promise<void> => {
    setError(null);
    setPublishingReportId(reportId);
    try {
      const updated = await publishReport(reportId);
      setReports((current) => current.map((report) => (report.id === updated.id ? updated : report)));
      addToast('Report published to public portal.', 'success');
    } catch {
      setError('Could not publish report.');
      addToast('Could not publish report.', 'error');
    } finally {
      setPublishingReportId(null);
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const contentBase64 = await fileToBase64(file);

    setImportForm((current) => ({
      ...current,
      fileName: file.name,
      contentBase64,
    }));
  };

  const handleImportReport = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const created = await importDocxReport({
        agendaItemId: importForm.agendaItemId,
        workflowConfigId: importForm.workflowConfigId || undefined,
        fileName:
          importForm.fileName ||
          (importForm.sharePointItemId ? `sharepoint-${importForm.sharePointItemId}.docx` : 'imported.docx'),
        contentBase64: importForm.contentBase64 || undefined,
        sharePointDriveId: importForm.sharePointDriveId || undefined,
        sharePointItemId: importForm.sharePointItemId || undefined,
        sharePointWebUrl: importForm.sharePointWebUrl || undefined,
      });
      setReports((current) => [created, ...current]);
      setImportForm({
        agendaItemId: importForm.agendaItemId,
        workflowConfigId: importForm.workflowConfigId,
        fileName: '',
        contentBase64: '',
        sharePointDriveId: '',
        sharePointItemId: '',
        sharePointWebUrl: '',
      });
      setShowImportAdvanced(false);
      setIsImportOpen(false);
      addToast('DOCX report imported successfully.', 'success');
    } catch {
      setError('Could not import DOCX report.');
      addToast('Could not import DOCX report.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttachmentFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setAttachmentFile(file);
    setAttachmentForm((current) => ({
      ...current,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      contentBase64: '',
      sharePointItemId: '',
      sharePointWebUrl: '',
    }));
    const contentBase64 = await fileToBase64(file);
    setAttachmentForm((current) => ({
      ...current,
      contentBase64,
    }));
  };

  const handleAddAttachment = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!attachmentReport) {
      return;
    }
    setIsAttachmentSubmitting(true);
    setError(null);
    try {
      const created = await addReportAttachment(attachmentReport.id, {
        fileName: attachmentForm.fileName,
        mimeType: attachmentForm.mimeType || undefined,
        sizeBytes: attachmentForm.sizeBytes || undefined,
        contentBase64: attachmentForm.contentBase64 || undefined,
        sharePointDriveId: attachmentForm.sharePointDriveId || undefined,
        sharePointItemId: attachmentForm.sharePointItemId || undefined,
        sharePointWebUrl: attachmentForm.sharePointWebUrl || undefined,
      });
      setAttachments((current) => [created, ...current]);
      setAttachmentFile(null);
      setAttachmentForm((current) => ({
        ...current,
        fileName: '',
        mimeType: '',
        sizeBytes: 0,
        contentBase64: '',
        sharePointItemId: '',
        sharePointWebUrl: '',
      }));
      addToast('Attachment added to report.', 'success');
    } catch {
      setError('Could not add report attachment.');
      addToast('Could not add report attachment.', 'error');
    } finally {
      setIsAttachmentSubmitting(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId: string): Promise<void> => {
    if (!attachmentReport) {
      return;
    }
    setError(null);
    try {
      await removeReportAttachment(attachmentReport.id, attachmentId);
      setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
      addToast('Attachment removed.', 'success');
    } catch {
      setError('Could not remove attachment.');
      addToast('Could not remove attachment.', 'error');
    }
  };

  const filteredReports = useMemo(() => {
    const baseFiltered = reports
      .filter((report) => {
        const search = query.toLowerCase();
        const matchesQuery =
          report.title.toLowerCase().includes(search) ||
          (report.department ?? '').toLowerCase().includes(search) ||
          (report.reportNumber ?? '').toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'ALL' || report.workflowStatus === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((left, right) => {
        let comparison = 0;

        if (sortField === 'title') {
          comparison = left.title.localeCompare(right.title);
        } else if (sortField === 'status') {
          comparison = left.workflowStatus.localeCompare(right.workflowStatus);
        } else {
          comparison = new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });

    return baseFiltered;
  }, [reports, query, statusFilter, sortField, sortDirection]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedReports = filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const draftCount = reports.filter((report) => report.workflowStatus === 'DRAFT').length;
  const pendingCount = reports.filter((report) => report.workflowStatus.includes('PENDING')).length;
  const publishedCount = reports.filter((report) => report.workflowStatus === 'PUBLISHED').length;
  const createReportValidationError = validateCreateReportForm(createForm, reportTemplates);
  const editReportValidationError = validateEditReportForm(editForm, reportTemplates);

  const handleCreateReport = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createReport({
        agendaItemId: createForm.agendaItemId,
        workflowConfigId: createForm.workflowConfigId || undefined,
        templateId: createForm.templateId || undefined,
        title: createForm.title,
        department: createForm.department || undefined,
        executiveSummary: createForm.executiveSummary || undefined,
        recommendations: createForm.recommendations || undefined,
        financialImpact: createForm.financialImpact || undefined,
      });
      setReports((current) => [created, ...current]);
      setCreateForm({
        title: '',
        agendaItemId: '',
        workflowConfigId: defaultWorkflowId,
        templateId: '',
        department: '',
        executiveSummary: '',
        recommendations: '',
        financialImpact: '',
      });
      setIsCreateOpen(false);
      addToast('Report created successfully.', 'success');
    } catch {
      setError('Could not create report.');
      addToast('Could not create report.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (report: StaffReportRecord): void => {
    setEditingReport(report);
    setEditForm({
      title: report.title,
      workflowConfigId: report.workflowConfigId ?? defaultWorkflowId,
      templateId: report.templateId ?? '',
      department: report.department ?? '',
      executiveSummary: report.executiveSummary ?? '',
      recommendations: report.recommendations ?? '',
      financialImpact: report.financialImpact ?? '',
    });
  };

  const handleEditReport = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!editingReport) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await updateReport(editingReport.id, {
        title: editForm.title,
        workflowConfigId: editForm.workflowConfigId || undefined,
        templateId: editForm.templateId || undefined,
        department: editForm.department || undefined,
        executiveSummary: editForm.executiveSummary || undefined,
        recommendations: editForm.recommendations || undefined,
        financialImpact: editForm.financialImpact || undefined,
      });
      setReports((current) => current.map((report) => (report.id === updated.id ? updated : report)));
      setEditingReport(null);
      addToast('Report updated successfully.', 'success');
    } catch {
      setError('Could not update report.');
      addToast('Could not update report.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (report: StaffReportRecord): Promise<void> => {
    if (!window.confirm(`Delete report \"${report.title}\"?`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await deleteReport(report.id);
      setReports((current) => current.filter((candidate) => candidate.id !== report.id));
      if (selectedReport?.id === report.id) {
        setSelectedReport(null);
      }
      if (attachmentReport?.id === report.id) {
        setAttachmentReport(null);
        setAttachments([]);
      }
      if (editingReport?.id === report.id) {
        setEditingReport(null);
      }
      addToast('Report deleted.', 'success');
    } catch {
      setError('Could not delete report.');
      addToast('Could not delete report.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Staff Reports"
      subtitle={`Create, submit, and monitor reports using ${MUNICIPAL_PROFILE.name} governance checks.`}
      actions={
        <div className="page-actions">
          <button type="button" className="btn" onClick={() => void handleCreateDemo()}>
            Create Demo
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setShowImportAdvanced(false);
              setIsImportOpen(true);
            }}
          >
            Import Word
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            New Report
          </button>
        </div>
      }
    >
      <section className="module-overview">
        <MetricTile
          variant="primary"
          label="Total Reports"
          value={reports.length}
          foot="Workflow inventory"
          icon="file-text"
        />
        <MetricTile
          label="Draft / Revision"
          value={draftCount}
          foot="Authoring and updates required"
          icon="edit"
        />
        <MetricTile
          label="Pending Review"
          value={pendingCount}
          foot="Director + CAO queue load"
          icon="clock"
        />
        <MetricTile
          label="Published"
          value={publishedCount}
          foot="Available on public portal"
          icon="check-circle"
        />
      </section>

      <Card>
        <CardHeader
          title="Report Register"
          description="Visibility into report ownership, status, and submission readiness."
          actions={
            <>
              <span className="pill">{filteredReports.length} visible</span>
              <span className="pill">Page {currentPage}</span>
            </>
          }
        />
        <CardBody>
          <div className="workspace-toolbar">
            <div className="workspace-toolbar-row">
              <input
                className="field"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, department, or report number"
                aria-label="Search reports"
              />
              <select
                className="field"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by report status"
              >
                <option value="ALL">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_DIRECTOR_APPROVAL">Pending Director Approval</option>
                <option value="PENDING_CAO_APPROVAL">Pending CAO Approval</option>
                <option value="PENDING_WORKFLOW_APPROVAL">Pending Workflow Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            <div className="workspace-toolbar-row workspace-toolbar-row-compact">
              <select
                className="field"
                value={sortField}
                onChange={(event) => setSortField(event.target.value as 'title' | 'status' | 'updatedAt')}
                aria-label="Sort reports by"
              >
                <option value="updatedAt">Sort by updated date</option>
                <option value="title">Sort by title</option>
                <option value="status">Sort by status</option>
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
          {isLoading ? <p className="muted">Loading reports...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}

          <DataTable
            columns={[
              {
                key: 'title',
                header: 'Title',
                render: (report: StaffReportRecord) => {
                  const canSubmit = report.workflowStatus === 'DRAFT' || report.workflowStatus === 'REJECTED';
                  const readinessIssues = getReportSubmissionIssues(report, reportTemplates);
                  return (
                    <>
                      <strong>{report.title}</strong>
                      <div className="muted">
                        {report.reportNumber ? `Report #: ${report.reportNumber}` : 'No report number yet'}
                      </div>
                      {report.currentWorkflowStageKey ? (
                        <div className="muted">Current stage: {report.currentWorkflowStageKey}</div>
                      ) : null}
                      {canSubmit ? (
                        <div className="muted">
                          Readiness:{' '}
                          {readinessIssues.length === 0
                            ? 'Ready to submit'
                            : `Needs updates (${readinessIssues.length})`}
                        </div>
                      ) : null}
                      {canSubmit && readinessIssues.length > 0 ? (
                        <div className="muted">Checklist: {readinessIssues.join(' ')}</div>
                      ) : null}
                    </>
                  );
                },
              },
              {
                key: 'workflowStatus',
                header: 'Status',
                render: (report: StaffReportRecord) => <StatusBadge status={report.workflowStatus} />,
              },
              {
                key: 'department',
                header: 'Department',
                render: (report: StaffReportRecord) => report.department ?? 'General Administration',
              },
              {
                key: 'updatedAt',
                header: 'Updated',
                render: (report: StaffReportRecord) => formatDate(report.updatedAt),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (report: StaffReportRecord) => {
                  const canSubmit = report.workflowStatus === 'DRAFT' || report.workflowStatus === 'REJECTED';
                  const canPublish = report.workflowStatus === 'APPROVED';
                  return (
                    <div className="page-actions">
                      {canSubmit ? (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => void handleSubmit(report.id)}
                          disabled={submittingReportId === report.id}
                        >
                          {submittingReportId === report.id ? 'Submitting...' : 'Submit'}
                        </button>
                      ) : null}
                      {canPublish ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => void handlePublish(report.id)}
                          disabled={publishingReportId === report.id}
                        >
                          {publishingReportId === report.id ? 'Publishing...' : 'Publish'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn-quiet"
                        onClick={() => setSelectedReport(report)}
                      >
                        History
                      </button>
                      <button
                        type="button"
                        className="btn btn-quiet"
                        onClick={() => void openAttachmentsDrawer(report)}
                      >
                        Attachments
                      </button>
                      <button
                        type="button"
                        className="btn btn-quiet"
                        onClick={() => openEditDrawer(report)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={isSubmitting}
                        onClick={() => void handleDeleteReport(report)}
                      >
                        Delete
                      </button>
                    </div>
                  );
                },
              },
            ]}
            data={pagedReports}
            isLoading={isLoading}
            emptyMessage="No staff reports match the current filters."
            rowKey={(report) => report.id}
          />

          {filteredReports.length > 0 ? (
            <div className="page-controls">
              <span className="muted">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredReports.length)} of{' '}
                {filteredReports.length}
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Drawer
        isOpen={isCreateOpen}
        title="Create Staff Report"
        subtitle="Add a new report and push it into the approval workflow."
        onClose={() => setIsCreateOpen(false)}
      >
        <form onSubmit={(event) => void handleCreateReport(event)}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="create-report-title">Title</label>
              <input
                id="create-report-title"
                className="field"
                required
                value={createForm.title}
                onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="create-report-agenda">Agenda Item</label>
              <select
                id="create-report-agenda"
                className="field"
                required
                value={createForm.agendaItemId}
                onChange={(event) => setCreateForm((current) => ({ ...current, agendaItemId: event.target.value }))}
              >
                {agendaItems.length === 0 ? <option value="">No agenda items found</option> : null}
                {agendaItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.agendaTitle})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="create-report-workflow">Approval Workflow</label>
              <select
                id="create-report-workflow"
                className="field"
                value={createForm.workflowConfigId}
                onChange={(event) => setCreateForm((current) => ({ ...current, workflowConfigId: event.target.value }))}
              >
                {reportWorkflows.length === 0 ? <option value="">No active workflows found</option> : null}
                {reportWorkflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                    {workflow.isDefault ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="create-report-department">Department</label>
              <input
                id="create-report-department"
                className="field"
                value={createForm.department}
                onChange={(event) => setCreateForm((current) => ({ ...current, department: event.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="create-report-template">Staff Report Template (optional)</label>
              <select
                id="create-report-template"
                className="field"
                value={createForm.templateId}
                onChange={(event) => {
                  const templateId = event.target.value;
                  const template = reportTemplates.find((candidate) => candidate.id === templateId);
                  setCreateForm((current) => ({
                    ...current,
                    templateId,
                    executiveSummary:
                      current.executiveSummary || !template
                        ? current.executiveSummary
                        : `Sections: ${template.sections
                            .sort((left, right) => left.sortOrder - right.sortOrder)
                            .map((section) => section.title)
                            .join(', ')}`,
                  }));
                }}
              >
                <option value="">No template</option>
                {reportTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field span-all">
              <label htmlFor="create-report-summary">Executive Summary</label>
              <textarea
                id="create-report-summary"
                className="field"
                rows={5}
                value={createForm.executiveSummary}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, executiveSummary: event.target.value }))
                }
              />
            </div>
            <div className="form-field span-all">
              <label htmlFor="create-report-recommendations">Recommendations</label>
              <textarea
                id="create-report-recommendations"
                className="field"
                rows={5}
                value={createForm.recommendations}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, recommendations: event.target.value }))
                }
              />
            </div>
            <div className="form-field span-all">
              <label htmlFor="create-report-financial-impact">Financial Implications</label>
              <textarea
                id="create-report-financial-impact"
                className="field"
                rows={4}
                value={createForm.financialImpact}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, financialImpact: event.target.value }))
                }
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
              disabled={isSubmitting || Boolean(createReportValidationError)}
            >
              {isSubmitting ? 'Saving...' : 'Create Report'}
            </button>
          </div>
          {createReportValidationError ? <p className="form-error">{createReportValidationError}</p> : null}
        </form>
      </Drawer>

      <Drawer
        isOpen={Boolean(editingReport)}
        title="Edit Report"
        subtitle="Revise report metadata before submission."
        onClose={() => setEditingReport(null)}
      >
        <form onSubmit={(event) => void handleEditReport(event)}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="edit-report-title">Title</label>
              <input
                id="edit-report-title"
                className="field"
                required
                value={editForm.title}
                onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="edit-report-department">Department</label>
              <input
                id="edit-report-department"
                className="field"
                value={editForm.department}
                onChange={(event) => setEditForm((current) => ({ ...current, department: event.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="edit-report-workflow">Approval Workflow</label>
              <select
                id="edit-report-workflow"
                className="field"
                value={editForm.workflowConfigId}
                onChange={(event) => setEditForm((current) => ({ ...current, workflowConfigId: event.target.value }))}
              >
                {reportWorkflows.length === 0 ? <option value="">No active workflows found</option> : null}
                {reportWorkflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                    {workflow.isDefault ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="edit-report-template">Staff Report Template (optional)</label>
              <select
                id="edit-report-template"
                className="field"
                value={editForm.templateId}
                onChange={(event) => setEditForm((current) => ({ ...current, templateId: event.target.value }))}
              >
                <option value="">No template</option>
                {reportTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field span-all">
              <label htmlFor="edit-report-summary">Executive Summary</label>
              <textarea
                id="edit-report-summary"
                className="field"
                rows={6}
                value={editForm.executiveSummary}
                onChange={(event) => setEditForm((current) => ({ ...current, executiveSummary: event.target.value }))}
              />
            </div>
            <div className="form-field span-all">
              <label htmlFor="edit-report-recommendations">Recommendations</label>
              <textarea
                id="edit-report-recommendations"
                className="field"
                rows={6}
                value={editForm.recommendations}
                onChange={(event) => setEditForm((current) => ({ ...current, recommendations: event.target.value }))}
              />
            </div>
            <div className="form-field span-all">
              <label htmlFor="edit-report-financial-impact">Financial Implications</label>
              <textarea
                id="edit-report-financial-impact"
                className="field"
                rows={4}
                value={editForm.financialImpact}
                onChange={(event) => setEditForm((current) => ({ ...current, financialImpact: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setEditingReport(null)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || Boolean(editReportValidationError)}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {editReportValidationError ? <p className="form-error">{editReportValidationError}</p> : null}
        </form>
      </Drawer>

      <Drawer
        isOpen={isImportOpen}
        title="Import Word Report"
        subtitle="Import a DOCX file directly or by SharePoint drive/item IDs."
        onClose={() => {
          setShowImportAdvanced(false);
          setIsImportOpen(false);
        }}
      >
        <form onSubmit={(event) => void handleImportReport(event)}>
          <div className="form-grid">
            <div className="form-field span-all">
              <label htmlFor="import-report-agenda">Agenda Item</label>
              <select
                id="import-report-agenda"
                className="field"
                value={importForm.agendaItemId}
                onChange={(event) => setImportForm((current) => ({ ...current, agendaItemId: event.target.value }))}
                required
              >
                {agendaItems.length === 0 ? <option value="">No agenda items found</option> : null}
                {agendaItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.agendaTitle})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field span-all">
              <label htmlFor="import-report-workflow">Approval Workflow</label>
              <select
                id="import-report-workflow"
                className="field"
                value={importForm.workflowConfigId}
                onChange={(event) => setImportForm((current) => ({ ...current, workflowConfigId: event.target.value }))}
              >
                {reportWorkflows.length === 0 ? <option value="">No active workflows found</option> : null}
                {reportWorkflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                    {workflow.isDefault ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field span-all">
              <label htmlFor="import-report-file">DOCX File Upload</label>
              <input id="import-report-file" className="field" type="file" accept=".docx" onChange={(event) => void handleImportFile(event)} />
            </div>

            <div className="form-field span-all">
              <button type="button" className="btn btn-quiet" onClick={() => setShowImportAdvanced((current) => !current)}>
                {showImportAdvanced ? 'Hide SharePoint ID import' : 'Use SharePoint IDs instead of file upload'}
              </button>
            </div>

            {showImportAdvanced ? (
              <>
                <div className="form-field">
                  <label htmlFor="import-report-drive">SharePoint Drive ID</label>
                  <input
                    id="import-report-drive"
                    className="field"
                    value={importForm.sharePointDriveId}
                    onChange={(event) =>
                      setImportForm((current) => ({ ...current, sharePointDriveId: event.target.value }))
                    }
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="import-report-item">SharePoint Item ID</label>
                  <input
                    id="import-report-item"
                    className="field"
                    value={importForm.sharePointItemId}
                    onChange={(event) =>
                      setImportForm((current) => ({ ...current, sharePointItemId: event.target.value }))
                    }
                  />
                </div>

                <div className="form-field span-all">
                  <label htmlFor="import-report-weburl">SharePoint Web URL (optional)</label>
                  <input
                    id="import-report-weburl"
                    className="field"
                    value={importForm.sharePointWebUrl}
                    onChange={(event) =>
                      setImportForm((current) => ({ ...current, sharePointWebUrl: event.target.value }))
                    }
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => {
                setShowImportAdvanced(false);
                setIsImportOpen(false);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                isSubmitting ||
                !importForm.agendaItemId ||
                (!importForm.contentBase64 && !(importForm.sharePointDriveId && importForm.sharePointItemId))
              }
            >
              {isSubmitting ? 'Importing...' : 'Import DOCX'}
            </button>
          </div>
        </form>
      </Drawer>

      <Drawer
        isOpen={Boolean(attachmentReport)}
        title="Supporting Attachments"
        subtitle={attachmentReport ? `Manage supporting files for ${attachmentReport.title}` : 'Manage supporting files'}
        onClose={() => {
          setAttachmentReport(null);
          setAttachments([]);
          setAttachmentFile(null);
          setShowAttachmentAdvanced(false);
        }}
      >
        {attachmentReport ? (
          <>
            {isAttachmentLoading ? <p className="muted">Loading attachments...</p> : null}
            {!isAttachmentLoading && attachments.length === 0 ? (
              <div className="empty-state">No supporting documents attached yet.</div>
            ) : null}
            {attachments.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table" aria-label="Report attachments">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Source</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attachments.map((attachment) => (
                      <tr key={attachment.id}>
                        <td>
                          <strong>{attachment.fileName}</strong>
                          {attachment.mimeType ? <div className="muted">{attachment.mimeType}</div> : null}
                        </td>
                        <td>
                          {attachment.sourceSharePointWebUrl ? (
                            <a href={attachment.sourceSharePointWebUrl} target="_blank" rel="noreferrer">
                              Open in SharePoint
                            </a>
                          ) : (
                            <span className="muted">Drive: {attachment.sourceSharePointDriveId ?? 'n/a'}</span>
                          )}
                        </td>
                        <td>{formatDate(attachment.createdAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => void handleRemoveAttachment(attachment.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <form onSubmit={(event) => void handleAddAttachment(event)}>
              <h3>Add Attachment</h3>
              <div className="form-grid">
                <div className="form-field span-all">
                  <label htmlFor="report-attachment-file">Upload File (PDF, PPT, DOCX, etc.)</label>
                  <input
                    id="report-attachment-file"
                    className="field"
                    type="file"
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={(event) => void handleAttachmentFile(event)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="report-attachment-name">File Name</label>
                  <input
                    id="report-attachment-name"
                    className="field"
                    required
                    value={attachmentForm.fileName}
                    onChange={(event) => setAttachmentForm((current) => ({ ...current, fileName: event.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="report-attachment-drive">SharePoint Drive ID</label>
                  <input
                    id="report-attachment-drive"
                    className="field"
                    value={attachmentForm.sharePointDriveId}
                    onChange={(event) =>
                      setAttachmentForm((current) => ({ ...current, sharePointDriveId: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field span-all">
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => setShowAttachmentAdvanced((current) => !current)}
                  >
                    {showAttachmentAdvanced ? 'Hide optional SharePoint fields' : 'Show optional SharePoint fields'}
                  </button>
                </div>
                {showAttachmentAdvanced ? (
                  <>
                    <div className="form-field">
                      <label htmlFor="report-attachment-item">Existing SharePoint Item ID (optional)</label>
                      <input
                        id="report-attachment-item"
                        className="field"
                        value={attachmentForm.sharePointItemId}
                        onChange={(event) =>
                          setAttachmentForm((current) => ({ ...current, sharePointItemId: event.target.value }))
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="report-attachment-web">SharePoint Web URL (optional)</label>
                      <input
                        id="report-attachment-web"
                        className="field"
                        value={attachmentForm.sharePointWebUrl}
                        onChange={(event) =>
                          setAttachmentForm((current) => ({ ...current, sharePointWebUrl: event.target.value }))
                        }
                      />
                    </div>
                  </>
                ) : null}
              </div>
              {attachmentFile ? <p className="muted">Uploading: {attachmentFile.name}</p> : null}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={
                  isAttachmentSubmitting ||
                  !attachmentForm.fileName ||
                  !attachmentForm.sharePointDriveId ||
                  (!attachmentForm.contentBase64 && !attachmentForm.sharePointItemId)
                }>
                  {isAttachmentSubmitting ? 'Saving...' : 'Add Attachment'}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </Drawer>

      {selectedReport ? (
        <WorkflowHistoryPanel
          reportId={selectedReport.id}
          reportTitle={selectedReport.title}
          onClose={() => setSelectedReport(null)}
        />
      ) : null}
    </AppShell>
  );
}
