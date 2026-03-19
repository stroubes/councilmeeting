import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  addTemplateSection,
  createTemplate,
  deleteTemplate,
  listTemplates,
  removeTemplateSection,
  reorderTemplateSections,
  updateTemplate,
  updateTemplateSection,
} from '../../api/templates.api';
import type { TemplateRecord, TemplateSectionRecord, TemplateType } from '../../api/types/template.types';
import AppShell from '../../components/layout/AppShell';
import { useToast } from '../../hooks/useToast';

type TemplateTab = 'AGENDA' | 'STAFF_REPORT';
type AgendaProfile = 'REGULAR_COUNCIL' | 'SPECIAL_COUNCIL' | 'COMMITTEE_OF_WHOLE' | 'IN_CAMERA';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface StaffReportSectionPreset {
  key: string;
  title: string;
  description: string;
  isRequired: boolean;
}

interface AgendaSectionPreset {
  key: string;
  title: string;
  description: string;
  isRequired: boolean;
}

const STAFF_REPORT_SECTION_PRESETS: StaffReportSectionPreset[] = [
  {
    key: 'HEADER_INFORMATION',
    title: 'Header/Information',
    description: 'Date, To (Council), From (Staff), Subject.',
    isRequired: true,
  },
  {
    key: 'RECOMMENDATION',
    title: 'Recommendation',
    description: 'The specific action or motion staff proposes council adopt.',
    isRequired: true,
  },
  {
    key: 'PURPOSE',
    title: 'Purpose',
    description: 'A brief summary of why the report is being presented.',
    isRequired: true,
  },
  {
    key: 'BACKGROUND',
    title: 'Background',
    description: 'History, previous council resolutions, and context for the issue.',
    isRequired: true,
  },
  {
    key: 'DISCUSSION_ANALYSIS',
    title: 'Discussion/Analysis',
    description: 'Detailed evaluation of options, policy compliance, and impacts.',
    isRequired: true,
  },
  {
    key: 'FINANCIAL_IMPLICATIONS',
    title: 'Financial Implications',
    description: 'Budgetary impact, funding sources, and long-term costs.',
    isRequired: true,
  },
  {
    key: 'COMMUNICATION_ENGAGEMENT',
    title: 'Communication/Engagement',
    description: 'Consultation conducted with public, stakeholders, or other agencies.',
    isRequired: false,
  },
  {
    key: 'ALTERNATIVE_RECOMMENDATIONS',
    title: 'Alternative Recommendations',
    description: 'Other options available to council.',
    isRequired: false,
  },
  {
    key: 'CONCLUSION_NEXT_STEPS',
    title: 'Conclusion/Next Steps',
    description: 'Summary of final recommendations and future actions.',
    isRequired: true,
  },
];

const AGENDA_PROFILE_LABELS: Record<AgendaProfile, string> = {
  REGULAR_COUNCIL: 'Regular Council Meeting',
  SPECIAL_COUNCIL: 'Special Council Meeting',
  COMMITTEE_OF_WHOLE: 'Committee of the Whole',
  IN_CAMERA: 'In-Camera Meeting',
};

const AGENDA_PROFILE_TEMPLATE_CODES: Record<AgendaProfile, string> = {
  REGULAR_COUNCIL: 'REGULAR_COUNCIL',
  SPECIAL_COUNCIL: 'SPECIAL_COUNCIL',
  COMMITTEE_OF_WHOLE: 'COMMITTEE_OF_WHOLE',
  IN_CAMERA: 'IN_CAMERA',
};

function inferAgendaProfile(template?: { code?: string; name?: string } | null): AgendaProfile {
  const source = `${template?.code ?? ''} ${template?.name ?? ''}`.toLowerCase();
  if (source.includes('in camera') || source.includes('in-camera') || source.includes('incamera') || source.includes('closed')) {
    return 'IN_CAMERA';
  }
  if (source.includes('committee of the whole') || source.includes('c.o.w') || source.includes('cow')) {
    return 'COMMITTEE_OF_WHOLE';
  }
  if (source.includes('special')) {
    return 'SPECIAL_COUNCIL';
  }
  return 'REGULAR_COUNCIL';
}

const AGENDA_SECTION_PRESETS: Record<AgendaProfile, AgendaSectionPreset[]> = {
  REGULAR_COUNCIL: [
    { key: 'CALL_TO_ORDER', title: 'Call to Order', description: 'Opening of the regular council meeting.', isRequired: true },
    {
      key: 'LAND_ACKNOWLEDGEMENT',
      title: 'Land Acknowledgement',
      description: 'Acknowledgement of Indigenous territories, where practiced by the municipality.',
      isRequired: false,
    },
    {
      key: 'APPROVAL_OF_AGENDA',
      title: 'Approval of Agenda',
      description: 'Council adopts the agenda and any late additions.',
      isRequired: true,
    },
    {
      key: 'DISCLOSURE_OF_INTEREST',
      title: 'Disclosure of Pecuniary Interest',
      description: 'Declarations of conflict or pecuniary interest.',
      isRequired: true,
    },
    {
      key: 'ADOPTION_OF_MINUTES',
      title: 'Adoption of Previous Minutes',
      description: 'Confirmation of minutes from the prior meeting.',
      isRequired: true,
    },
    {
      key: 'DELEGATIONS_PRESENTATIONS',
      title: 'Delegations and Presentations',
      description: 'Public delegations and scheduled presentations.',
      isRequired: false,
    },
    {
      key: 'CONSENT_AGENDA',
      title: 'Consent Agenda',
      description: 'Routine items grouped for a single motion.',
      isRequired: false,
    },
    {
      key: 'REPORTS_CORRESPONDENCE',
      title: 'Staff Reports and Correspondence',
      description: 'Administrative and departmental reports for decision.',
      isRequired: true,
    },
    { key: 'BYLAWS', title: 'Bylaws', description: 'Readings and adoption of bylaws.', isRequired: true },
    {
      key: 'MOTIONS_NOTICES',
      title: 'Motions and Notices of Motion',
      description: 'Motions introduced and notices for future meetings.',
      isRequired: false,
    },
    {
      key: 'NEW_BUSINESS',
      title: 'New Business',
      description: 'Additional business raised by council.',
      isRequired: false,
    },
    {
      key: 'CLOSED_SESSION_NOTICE',
      title: 'Closed Session (if required)',
      description: 'Motion to move in-camera for legislated closed-session matters.',
      isRequired: false,
    },
    {
      key: 'CONFIRMING_BYLAW',
      title: 'Confirming Bylaw',
      description: 'Bylaw confirming proceedings and decisions of the meeting.',
      isRequired: true,
    },
    { key: 'ADJOURNMENT', title: 'Adjournment', description: 'Formal close of the meeting.', isRequired: true },
  ],
  SPECIAL_COUNCIL: [
    { key: 'CALL_TO_ORDER', title: 'Call to Order', description: 'Opening of the special council meeting.', isRequired: true },
    {
      key: 'APPROVAL_OF_AGENDA',
      title: 'Approval of Agenda',
      description: 'Adoption of the special-meeting agenda.',
      isRequired: true,
    },
    {
      key: 'DISCLOSURE_OF_INTEREST',
      title: 'Disclosure of Pecuniary Interest',
      description: 'Declarations of conflict or pecuniary interest.',
      isRequired: true,
    },
    {
      key: 'SPECIAL_BUSINESS',
      title: 'Special Business',
      description: 'Business for which the special meeting was called.',
      isRequired: true,
    },
    {
      key: 'CLOSED_SESSION_NOTICE',
      title: 'Closed Session (if required)',
      description: 'Motion to move in-camera if needed for statutory reasons.',
      isRequired: false,
    },
    {
      key: 'CONFIRMING_BYLAW',
      title: 'Confirming Bylaw',
      description: 'Bylaw confirming proceedings and decisions of the meeting.',
      isRequired: true,
    },
    { key: 'ADJOURNMENT', title: 'Adjournment', description: 'Formal close of the meeting.', isRequired: true },
  ],
  COMMITTEE_OF_WHOLE: [
    { key: 'CALL_TO_ORDER', title: 'Call to Order', description: 'Opening of the committee meeting.', isRequired: true },
    {
      key: 'APPROVAL_OF_AGENDA',
      title: 'Approval of Agenda',
      description: 'Adoption of the committee agenda.',
      isRequired: true,
    },
    {
      key: 'DISCLOSURE_OF_INTEREST',
      title: 'Disclosure of Pecuniary Interest',
      description: 'Declarations of conflict or pecuniary interest.',
      isRequired: true,
    },
    {
      key: 'DELEGATIONS_PRESENTATIONS',
      title: 'Delegations and Presentations',
      description: 'Delegations, presentations, and public input.',
      isRequired: false,
    },
    {
      key: 'REPORTS_DISCUSSION',
      title: 'Staff Reports and Discussion Items',
      description: 'Detailed consideration of reports and policy matters.',
      isRequired: true,
    },
    {
      key: 'RECOMMENDATIONS_TO_COUNCIL',
      title: 'Recommendations to Council',
      description: 'Committee recommendations forwarded for council decision.',
      isRequired: true,
    },
    {
      key: 'OTHER_BUSINESS',
      title: 'Other Business',
      description: 'Additional committee business and information.',
      isRequired: false,
    },
    { key: 'ADJOURNMENT', title: 'Adjournment', description: 'Formal close of the meeting.', isRequired: true },
  ],
  IN_CAMERA: [
    { key: 'CALL_TO_ORDER', title: 'Call to Order', description: 'Opening of the in-camera meeting.', isRequired: true },
    {
      key: 'APPROVAL_OF_IN_CAMERA_AGENDA',
      title: 'Approval of In-Camera Agenda',
      description: 'Adoption of the in-camera meeting agenda.',
      isRequired: true,
    },
    {
      key: 'DISCLOSURE_OF_INTEREST',
      title: 'Disclosure of Pecuniary Interest',
      description: 'Declarations of conflict or pecuniary interest.',
      isRequired: true,
    },
    {
      key: 'CLOSED_SESSION_AUTHORITY',
      title: 'Closed Session Authority',
      description: 'Recorded legislative authority for closed-session discussion topics.',
      isRequired: true,
    },
    {
      key: 'IN_CAMERA_ITEMS',
      title: 'In-Camera Discussion Items',
      description: 'Confidential matters (personnel, legal, property, negotiations, etc.).',
      isRequired: true,
    },
    {
      key: 'RISE_AND_REPORT',
      title: 'Rise and Report',
      description: 'Motion to reconvene in public and report out where applicable.',
      isRequired: true,
    },
    {
      key: 'ADJOURNMENT',
      title: 'Adjournment',
      description: 'Formal close of the in-camera meeting.',
      isRequired: true,
    },
  ],
};

export default function TemplatesAdmin(): JSX.Element {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TemplateTab>('AGENDA');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const { addToast } = useToast();

  const [templateForm, setTemplateForm] = useState({
    type: 'AGENDA' as TemplateType,
    agendaProfile: 'REGULAR_COUNCIL' as AgendaProfile,
    code: 'REGULAR_COUNCIL',
    name: '',
    description: '',
  });

  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: '',
    sectionType: '',
    itemType: '',
    isRequired: false,
  });

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [agendaProfile, setAgendaProfile] = useState<AgendaProfile>('REGULAR_COUNCIL');

  const loadTemplates = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listTemplates({ includeInactive: true });
      setTemplates(data);
    } catch {
      setError('Could not load templates.');
      addToast('Could not load templates.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const visibleTemplates = useMemo(
    () => templates.filter((template) => template.type === activeTab),
    [templates, activeTab],
  );

  const selectedTemplate = useMemo(
    () => visibleTemplates.find((template) => template.id === selectedTemplateId) ?? visibleTemplates[0] ?? null,
    [visibleTemplates, selectedTemplateId],
  );

  const selectedStaffPreset = useMemo(
    () => STAFF_REPORT_SECTION_PRESETS.find((preset) => preset.key === sectionForm.sectionType) ?? null,
    [sectionForm.sectionType],
  );

  const availableAgendaPresets = useMemo(
    () => AGENDA_SECTION_PRESETS[agendaProfile],
    [agendaProfile],
  );

  const selectedAgendaPreset = useMemo(
    () => availableAgendaPresets.find((preset) => preset.key === sectionForm.sectionType) ?? null,
    [availableAgendaPresets, sectionForm.sectionType],
  );

  useEffect(() => {
    if (!selectedTemplate && visibleTemplates.length > 0) {
      setSelectedTemplateId(visibleTemplates[0].id);
      return;
    }
    if (selectedTemplate && selectedTemplate.id !== selectedTemplateId) {
      setSelectedTemplateId(selectedTemplate.id);
    }
  }, [selectedTemplate, visibleTemplates, selectedTemplateId]);

  useEffect(() => {
    if (selectedTemplate?.type === 'AGENDA') {
      setAgendaProfile(inferAgendaProfile(selectedTemplate));
    }
  }, [selectedTemplate]);

  const handleCreateTemplate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    try {
      const created = await createTemplate({
        type: templateForm.type,
        code: templateForm.code,
        name: templateForm.name,
        description: templateForm.description || undefined,
      });
      setTemplates((current) => [created, ...current]);
      setTemplateForm((current) => ({
        ...current,
        code: current.type === 'AGENDA' ? AGENDA_PROFILE_TEMPLATE_CODES[current.agendaProfile] : '',
        name: '',
        description: '',
      }));
      setActiveTab(created.type);
      setSelectedTemplateId(created.id);
      addToast('Template created.', 'success');
    } catch {
      setError('Could not create template.');
      addToast('Could not create template.', 'error');
    }
  };

  const handleToggleTemplate = async (template: TemplateRecord): Promise<void> => {
    setError(null);
    try {
      const updated = await updateTemplate(template.id, { isActive: !template.isActive });
      setTemplates((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
      addToast(`Template ${updated.isActive ? 'activated' : 'disabled'}.`, 'success');
    } catch {
      setError('Could not update template status.');
      addToast('Could not update template status.', 'error');
    }
  };

  const handleDeleteTemplate = async (template: TemplateRecord): Promise<void> => {
    if (!window.confirm(`Delete template \"${template.name}\"?`)) {
      return;
    }
    setError(null);
    try {
      await deleteTemplate(template.id);
      setTemplates((current) => current.filter((candidate) => candidate.id !== template.id));
      if (selectedTemplateId === template.id) {
        setSelectedTemplateId('');
      }
      addToast('Template deleted.', 'success');
    } catch {
      setError('Could not delete template.');
      addToast('Could not delete template.', 'error');
    }
  };

  const handleSaveSection = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedTemplate) {
      return;
    }
    setError(null);
    try {
      const payload = {
        title: sectionForm.title,
        description: sectionForm.description || undefined,
        sectionType: sectionForm.sectionType || undefined,
        itemType: sectionForm.itemType || undefined,
        isRequired: sectionForm.isRequired,
      };
      const updated = editingSectionId
        ? await updateTemplateSection(selectedTemplate.id, editingSectionId, payload)
        : await addTemplateSection(selectedTemplate.id, payload);
      setTemplates((current) => current.map((template) => (template.id === updated.id ? updated : template)));
      setSectionForm({ title: '', description: '', sectionType: '', itemType: '', isRequired: false });
      setEditingSectionId(null);
      addToast(editingSectionId ? 'Section updated.' : 'Section added.', 'success');
    } catch {
      setError('Could not save section.');
      addToast('Could not save section.', 'error');
    }
  };

  const handleDeleteSection = async (sectionId: string): Promise<void> => {
    if (!selectedTemplate) {
      return;
    }
    setError(null);
    try {
      const updated = await removeTemplateSection(selectedTemplate.id, sectionId);
      setTemplates((current) => current.map((template) => (template.id === updated.id ? updated : template)));
      if (editingSectionId === sectionId) {
        setEditingSectionId(null);
        setSectionForm({ title: '', description: '', sectionType: '', itemType: '', isRequired: false });
      }
      addToast('Section removed.', 'success');
    } catch {
      setError('Could not remove section.');
      addToast('Could not remove section.', 'error');
    }
  };

  const beginEditSection = (section: TemplateSectionRecord): void => {
    setEditingSectionId(section.id);
    setSectionForm({
      title: section.title,
      description: section.description ?? '',
      sectionType: section.sectionType ?? '',
      itemType: section.itemType ?? '',
      isRequired: section.isRequired,
    });
  };

  const cancelEditSection = (): void => {
    setEditingSectionId(null);
    setSectionForm({ title: '', description: '', sectionType: '', itemType: '', isRequired: false });
  };

  const applyStaffReportPreset = (presetKey: string): void => {
    const preset = STAFF_REPORT_SECTION_PRESETS.find((candidate) => candidate.key === presetKey);
    if (!preset) {
      setSectionForm((current) => ({ ...current, sectionType: presetKey }));
      return;
    }
    setSectionForm((current) => ({
      ...current,
      title: preset.title,
      description: preset.description,
      sectionType: preset.key,
      itemType: 'STAFF_REPORT',
      isRequired: preset.isRequired,
    }));
  };

  const handleAddStandardStaffSections = async (): Promise<void> => {
    if (!selectedTemplate || selectedTemplate.type !== 'STAFF_REPORT') {
      return;
    }

    setError(null);
    let currentTemplate = selectedTemplate;
    let addedCount = 0;

    try {
      for (const preset of STAFF_REPORT_SECTION_PRESETS) {
        const alreadyExists = currentTemplate.sections.some(
          (section) => section.sectionType === preset.key || section.title === preset.title,
        );
        if (alreadyExists) {
          continue;
        }

        const updated = await addTemplateSection(selectedTemplate.id, {
          title: preset.title,
          description: preset.description,
          sectionType: preset.key,
          itemType: 'STAFF_REPORT',
          isRequired: preset.isRequired,
        });
        currentTemplate = updated;
        addedCount += 1;
      }

      setTemplates((current) =>
        current.map((template) => (template.id === currentTemplate.id ? currentTemplate : template)),
      );

      if (addedCount === 0) {
        addToast('All standard staff-report sections are already present.', 'info');
      } else {
        addToast(`Added ${addedCount} standard staff-report sections.`, 'success');
      }
    } catch {
      setError('Could not add standard staff-report sections.');
      addToast('Could not add standard staff-report sections.', 'error');
    }
  };

  const applyAgendaPreset = (presetKey: string): void => {
    const preset = availableAgendaPresets.find((candidate) => candidate.key === presetKey);
    if (!preset) {
      setSectionForm((current) => ({ ...current, sectionType: presetKey }));
      return;
    }
    setSectionForm((current) => ({
      ...current,
      title: preset.title,
      description: preset.description,
      sectionType: preset.key,
      itemType: 'SECTION',
      isRequired: preset.isRequired,
    }));
  };

  const handleAddStandardAgendaSections = async (): Promise<void> => {
    if (!selectedTemplate || selectedTemplate.type !== 'AGENDA') {
      return;
    }

    setError(null);
    let currentTemplate = selectedTemplate;
    let addedCount = 0;

    try {
      for (const preset of availableAgendaPresets) {
        const alreadyExists = currentTemplate.sections.some(
          (section) => section.sectionType === preset.key || section.title === preset.title,
        );
        if (alreadyExists) {
          continue;
        }

        const updated = await addTemplateSection(selectedTemplate.id, {
          title: preset.title,
          description: preset.description,
          sectionType: preset.key,
          itemType: 'SECTION',
          isRequired: preset.isRequired,
        });
        currentTemplate = updated;
        addedCount += 1;
      }

      setTemplates((current) =>
        current.map((template) => (template.id === currentTemplate.id ? currentTemplate : template)),
      );

      if (addedCount === 0) {
        addToast(`${AGENDA_PROFILE_LABELS[agendaProfile]} sections are already present.`, 'info');
      } else {
        addToast(`Added ${addedCount} ${AGENDA_PROFILE_LABELS[agendaProfile]} sections.`, 'success');
      }
    } catch {
      setError('Could not add standard agenda sections.');
      addToast('Could not add standard agenda sections.', 'error');
    }
  };

  const moveSection = async (targetId: string): Promise<void> => {
    if (!selectedTemplate || !draggingSectionId || draggingSectionId === targetId) {
      return;
    }
    const currentOrder = [...selectedTemplate.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const draggingIndex = currentOrder.findIndex((section) => section.id === draggingSectionId);
    const targetIndex = currentOrder.findIndex((section) => section.id === targetId);
    if (draggingIndex < 0 || targetIndex < 0) {
      return;
    }

    const reordered = [...currentOrder];
    const [dragged] = reordered.splice(draggingIndex, 1);
    reordered.splice(targetIndex, 0, dragged);

    try {
      const updated = await reorderTemplateSections(
        selectedTemplate.id,
        reordered.map((section) => section.id),
      );
      setTemplates((current) => current.map((template) => (template.id === updated.id ? updated : template)));
      addToast('Section order updated.', 'success');
    } catch {
      setError('Could not reorder sections.');
      addToast('Could not reorder sections.', 'error');
    } finally {
      setDraggingSectionId(null);
    }
  };

  const handleDownloadTemplateWord = async (): Promise<void> => {
    if (!selectedTemplate) {
      return;
    }
    try {
      const token = localStorage.getItem('cmms.access_token');
      const response = await fetch(`${API_BASE_URL}/templates/${selectedTemplate.id}/export-docx`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(String(response.status));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${selectedTemplate.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()}-template.docx`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      addToast('Word template downloaded.', 'success');
    } catch {
      setError('Could not export Word template.');
      addToast('Could not export Word template.', 'error');
    }
  };

  return (
    <AppShell
      title="Templates"
      subtitle="Create and maintain reusable agenda and staff-report structures with drag-and-drop section ordering."
      workspaceVariant="admin"
    >
      <section className="module-overview">
        <article className="metric-tile metric-tile-primary">
          <p className="metric-label">Total Templates</p>
          <p className="metric-value">{templates.length}</p>
          <p className="metric-foot">Agenda and staff-report definitions</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Agenda Templates</p>
          <p className="metric-value">{templates.filter((template) => template.type === 'AGENDA').length}</p>
          <p className="metric-foot">Council package structures</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Staff Report Templates</p>
          <p className="metric-value">{templates.filter((template) => template.type === 'STAFF_REPORT').length}</p>
          <p className="metric-foot">Authoring guides for staff</p>
        </article>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>
              <span className="panel-icon">TPL</span>
              Create Template
            </h2>
            <p>Add a new reusable structure for agenda packages or staff reports.</p>
          </div>
        </header>
        <div className="card-body">
          <form onSubmit={(event) => void handleCreateTemplate(event)}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="template-type">Template Type</label>
                <select
                  id="template-type"
                  className="field"
                  value={templateForm.type}
                  onChange={(event) => {
                    const type = event.target.value as TemplateType;
                    setTemplateForm((current) => ({
                      ...current,
                      type,
                      code:
                        type === 'AGENDA'
                          ? current.code || AGENDA_PROFILE_TEMPLATE_CODES[current.agendaProfile]
                          : current.code,
                    }));
                  }}
                >
                  <option value="AGENDA">Agenda Template</option>
                  <option value="STAFF_REPORT">Staff Report Template</option>
                </select>
              </div>
              {templateForm.type === 'AGENDA' ? (
                <div className="form-field">
                  <label htmlFor="template-agenda-meeting-type">Agenda Meeting Type</label>
                  <select
                    id="template-agenda-meeting-type"
                    className="field"
                    value={templateForm.agendaProfile}
                    onChange={(event) => {
                      const agendaProfile = event.target.value as AgendaProfile;
                      setTemplateForm((current) => ({
                        ...current,
                        agendaProfile,
                        code: AGENDA_PROFILE_TEMPLATE_CODES[agendaProfile],
                      }));
                    }}
                  >
                    {Object.entries(AGENDA_PROFILE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="form-field">
                <label htmlFor="template-code">Code</label>
                <input
                  id="template-code"
                  className="field"
                  value={templateForm.code}
                  onChange={(event) => setTemplateForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="REGULAR_COUNCIL"
                  required
                />
              </div>
              <div className="form-field span-all">
                <label htmlFor="template-name">Name</label>
                <input
                  id="template-name"
                  className="field"
                  value={templateForm.name}
                  onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </div>
              <div className="form-field span-all">
                <label htmlFor="template-description">Description</label>
                <textarea
                  id="template-description"
                  className="field"
                  rows={3}
                  value={templateForm.description}
                  onChange={(event) => setTemplateForm((current) => ({ ...current, description: event.target.value }))}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create Template
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Template Library</h2>
            <p>Choose a template and manage section order with drag and drop.</p>
          </div>
          <div className="page-actions">
            <button
              type="button"
              className={`btn ${activeTab === 'AGENDA' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('AGENDA')}
            >
              Agenda Templates
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'STAFF_REPORT' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('STAFF_REPORT')}
            >
              Staff Report Templates
            </button>
          </div>
        </header>
        <div className="card-body">
          {isLoading ? <p className="muted">Loading templates...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}

          {!isLoading && visibleTemplates.length === 0 ? (
            <div className="empty-state">No templates found for this category.</div>
          ) : null}

          {visibleTemplates.length > 0 ? (
            <>
              <div className="workspace-toolbar">
                <div className="workspace-toolbar-row">
                  <select
                    className="field"
                    value={selectedTemplate?.id ?? ''}
                    onChange={(event) => setSelectedTemplateId(event.target.value)}
                  >
                    {visibleTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.code})
                      </option>
                    ))}
                  </select>
                  {selectedTemplate ? (
                    <div className="page-actions">
                      {selectedTemplate.type === 'STAFF_REPORT' ? (
                        <button type="button" className="btn" onClick={() => void handleAddStandardStaffSections()}>
                          Add Standard Sections
                        </button>
                      ) : null}
                      {selectedTemplate.type === 'AGENDA' ? (
                        <button type="button" className="btn" onClick={() => void handleAddStandardAgendaSections()}>
                          Add {AGENDA_PROFILE_LABELS[agendaProfile]} Sections
                        </button>
                      ) : null}
                      {selectedTemplate.type === 'STAFF_REPORT' ? (
                        <button type="button" className="btn" onClick={() => void handleDownloadTemplateWord()}>
                          Export Word
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={`btn ${selectedTemplate.isActive ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => void handleToggleTemplate(selectedTemplate)}
                      >
                        {selectedTemplate.isActive ? 'Disable Template' : 'Activate Template'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => void handleDeleteTemplate(selectedTemplate)}
                      >
                        Delete Template
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {selectedTemplate ? (
                <>
                  <div className="table-wrap">
                    <table className="data-table" aria-label="Template sections">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Section</th>
                          <th>Type</th>
                          <th>Required</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTemplate.sections.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="muted">
                              No sections yet. Add your first section below.
                            </td>
                          </tr>
                        ) : (
                          [...selectedTemplate.sections]
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((section) => (
                              <tr
                                key={section.id}
                                draggable
                                onDragStart={() => setDraggingSectionId(section.id)}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => void moveSection(section.id)}
                              >
                                <td>{section.sortOrder}</td>
                                <td>
                                  <strong>{section.title}</strong>
                                  {section.description ? <div className="muted">{section.description}</div> : null}
                                </td>
                                <td>{section.itemType ?? section.sectionType ?? '-'}</td>
                                <td>{section.isRequired ? 'Yes' : 'No'}</td>
                                <td>
                                  <div className="page-actions">
                                    <button type="button" className="btn btn-quiet" onClick={() => beginEditSection(section)}>
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-danger"
                                      onClick={() => void handleDeleteSection(section.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <form onSubmit={(event) => void handleSaveSection(event)}>
                    <h3>{editingSectionId ? 'Edit Section' : 'Add Section'}</h3>
                    <div className="form-grid">
                      {activeTab === 'AGENDA' ? (
                        <div className="form-field span-all">
                          <label htmlFor="template-agenda-profile">Agenda Profile</label>
                          <select
                            id="template-agenda-profile"
                            className="field"
                            value={agendaProfile}
                            onChange={(event) => {
                              const profile = event.target.value as AgendaProfile;
                              setAgendaProfile(profile);
                              setSectionForm((current) => ({ ...current, title: '', description: '', sectionType: '' }));
                            }}
                          >
                            {Object.entries(AGENDA_PROFILE_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      {activeTab === 'STAFF_REPORT' ? (
                        <div className="form-field span-all">
                          <label htmlFor="template-section-preset">Staff Report Section</label>
                          <select
                            id="template-section-preset"
                            className="field"
                            value={sectionForm.sectionType}
                            onChange={(event) => applyStaffReportPreset(event.target.value)}
                            required
                          >
                            <option value="">Select section</option>
                            {STAFF_REPORT_SECTION_PRESETS.map((preset) => (
                              <option key={preset.key} value={preset.key}>
                                {preset.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      {activeTab === 'AGENDA' ? (
                        <div className="form-field span-all">
                          <label htmlFor="template-agenda-section-preset">Agenda Section</label>
                          <select
                            id="template-agenda-section-preset"
                            className="field"
                            value={sectionForm.sectionType}
                            onChange={(event) => applyAgendaPreset(event.target.value)}
                            required
                          >
                            <option value="">Select section</option>
                            {availableAgendaPresets.map((preset) => (
                              <option key={preset.key} value={preset.key}>
                                {preset.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      <div className="form-field">
                        <label htmlFor="template-section-title">Title</label>
                        <input
                          id="template-section-title"
                          className="field"
                          value={sectionForm.title}
                          onChange={(event) => setSectionForm((current) => ({ ...current, title: event.target.value }))}
                          readOnly={activeTab === 'STAFF_REPORT' || activeTab === 'AGENDA'}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="template-section-type">Section Type</label>
                        {activeTab === 'STAFF_REPORT' || activeTab === 'AGENDA' ? (
                          <input
                            id="template-section-type"
                            className="field"
                            value={sectionForm.sectionType}
                            readOnly
                            placeholder={
                              activeTab === 'STAFF_REPORT' ? 'Select from Staff Report Section' : 'Select from Agenda Section'
                            }
                          />
                        ) : (
                          <input
                            id="template-section-type"
                            className="field"
                            value={sectionForm.sectionType}
                            onChange={(event) =>
                              setSectionForm((current) => ({ ...current, sectionType: event.target.value }))
                            }
                            placeholder="SECTION"
                          />
                        )}
                      </div>
                      <div className="form-field">
                        <label htmlFor="template-item-type">Agenda Item Type (optional)</label>
                        <input
                          id="template-item-type"
                          className="field"
                          value={sectionForm.itemType}
                          onChange={(event) => setSectionForm((current) => ({ ...current, itemType: event.target.value }))}
                          readOnly={activeTab === 'STAFF_REPORT' || activeTab === 'AGENDA'}
                          placeholder="STAFF_REPORT"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="template-section-required">Required</label>
                        <select
                          id="template-section-required"
                          className="field"
                          value={sectionForm.isRequired ? 'yes' : 'no'}
                          onChange={(event) =>
                            setSectionForm((current) => ({ ...current, isRequired: event.target.value === 'yes' }))
                          }
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      <div className="form-field span-all">
                        <label htmlFor="template-section-description">Description</label>
                        <textarea
                          id="template-section-description"
                          className="field"
                          rows={3}
                          value={sectionForm.description}
                          onChange={(event) =>
                            setSectionForm((current) => ({ ...current, description: event.target.value }))
                          }
                          readOnly={
                            (activeTab === 'STAFF_REPORT' && Boolean(selectedStaffPreset)) ||
                            (activeTab === 'AGENDA' && Boolean(selectedAgendaPreset))
                          }
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      {editingSectionId ? (
                        <button type="button" className="btn btn-quiet" onClick={cancelEditSection}>
                          Cancel
                        </button>
                      ) : null}
                      <button type="submit" className="btn btn-primary">
                        {editingSectionId ? 'Save Section' : 'Add Section'}
                      </button>
                    </div>
                  </form>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
