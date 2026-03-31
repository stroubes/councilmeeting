import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listPublicAgendas, listPublicMeetings, listPublicReports } from '../../api/public.api';
import type { AgendaRecord } from '../../api/types/agenda.types';
import type { MeetingRecord } from '../../api/types/meeting.types';
import type { StaffReportRecord } from '../../api/types/report.types';
import AppShell from '../../components/layout/AppShell';
import StatusBadge from '../../components/ui/StatusBadge';

interface PublicAgendaDetailsState {
  agenda: AgendaRecord | null;
  meeting: MeetingRecord | null;
  reports: StaffReportRecord[];
}

function formatMeetingDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMeetingTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toMeetingLabel(code?: string): string {
  if (!code) {
    return 'Regular Council Meeting';
  }
  return code
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (segment) => segment.toUpperCase());
}

export default function PublicAgendaDetails(): JSX.Element {
  const { agendaId } = useParams<{ agendaId: string }>();
  const [state, setState] = useState<PublicAgendaDetailsState>({
    agenda: null,
    meeting: null,
    reports: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!agendaId) {
        setError('Agenda id was not provided.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [agendas, reports, meetings] = await Promise.all([listPublicAgendas(), listPublicReports(), listPublicMeetings()]);
        const agenda = agendas.find((candidate) => candidate.id === agendaId) ?? null;
        if (!agenda) {
          setState({ agenda: null, meeting: null, reports: [] });
          setError('Agenda was not found or is not publicly available.');
          return;
        }

        const meeting = meetings.find((candidate) => candidate.id === agenda.meetingId) ?? null;
        const agendaItemIds = new Set(agenda.items.map((item) => item.id));
        const relatedReports = reports.filter((report) => agendaItemIds.has(report.agendaItemId));
        setState({ agenda, meeting, reports: relatedReports });
      } catch {
        setError('Could not load public agenda details.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [agendaId]);

  const staffReportItems = useMemo(
    () => state.agenda?.items.filter((item) => item.itemType === 'STAFF_REPORT') ?? [],
    [state.agenda],
  );

  const orderedAgendaItems = useMemo(() => {
    if (!state.agenda) {
      return [];
    }

    const sorted = [...state.agenda.items].sort((left, right) => left.sortOrder - right.sortOrder);
    const detailedStaffReports = sorted.filter(
      (item) => item.itemType === 'STAFF_REPORT' && item.title.toLowerCase().startsWith('staff report:'),
    );
    const baseItems = sorted.filter(
      (item) => !(item.itemType === 'STAFF_REPORT' && item.title.toLowerCase().startsWith('staff report:')),
    );

    if (detailedStaffReports.length === 0) {
      return baseItems;
    }

    const anchorIndex = baseItems.findIndex((item) => item.title.toLowerCase().includes('staff reports and correspondence'));
    if (anchorIndex < 0) {
      return [...baseItems, ...detailedStaffReports];
    }

    return [
      ...baseItems.slice(0, anchorIndex + 1),
      ...detailedStaffReports,
      ...baseItems.slice(anchorIndex + 1),
    ];
  }, [state.agenda]);

  return (
    <AppShell
      title="Public Agenda"
      subtitle="Council-style agenda layout for HTML viewing and PDF-ready export."
      actions={
        <div className="public-agenda-actions">
          <Link to="/public" className="btn btn-quiet">
            Back to Public Portal
          </Link>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Save as PDF
          </button>
        </div>
      }
    >
      {isLoading ? <p className="muted">Loading public agenda package...</p> : null}
      {error ? <p className="inline-alert">{error}</p> : null}

      {!isLoading && !error && state.agenda ? (
        <div className="public-agenda-document">
          <header className="agenda-doc-header">
            <div className="agenda-doc-crest">District of Sooke</div>
            <div className="agenda-doc-title-block">
              <p className="agenda-doc-main-title">AGENDA</p>
              <p className="agenda-doc-line">District of Sooke</p>
              <p className="agenda-doc-line">{state.meeting ? formatMeetingDate(state.meeting.startsAt) : 'Regular Council Meeting'}</p>
              <p className="agenda-doc-line">
                {state.meeting ? toMeetingLabel(state.meeting.meetingTypeCode) : 'Council Meeting'}
                {state.meeting ? ` at ${formatMeetingTime(state.meeting.startsAt)}` : ''}
              </p>
              <p className="agenda-doc-line">in Council Chambers</p>
              <p className="agenda-doc-line">{state.meeting?.location ?? 'District Hall, Sooke, BC'}</p>
            </div>
            <div className="agenda-doc-page">Page</div>
          </header>

          <p className="agenda-doc-notice">
            Please note: The open portion of this meeting may be webcast live. Written and verbal submissions become part of
            the public record and are subject to the Freedom of Information and Protection of Privacy Act.
          </p>

          <div className="agenda-doc-sections">
            {orderedAgendaItems.map((item, index) => {
                const linkedReport = state.reports.find((report) => report.agendaItemId === item.id);
                return (
                  <article className="agenda-doc-section" key={item.id}>
                    <div className="agenda-doc-section-title">
                      <span>{index + 1}.</span>
                      <strong>{item.title.toUpperCase()}</strong>
                    </div>
                    {linkedReport ? (
                      <div className="agenda-doc-subentry">
                        <p className="agenda-doc-subtitle">{linkedReport.title}</p>
                        {linkedReport.executiveSummary ? <p>{linkedReport.executiveSummary}</p> : null}
                        {linkedReport.recommendations ? <p className="agenda-doc-motion">{linkedReport.recommendations}</p> : null}
                      </div>
                    ) : item.description ? (
                      <p className="agenda-doc-description">{item.description}</p>
                    ) : null}
                  </article>
                );
              })}
          </div>

          {state.reports.length > 0 ? (
            <section className="agenda-doc-report-pack">
              <h3>Report Package</h3>
              {state.reports.map((report, index) => (
                <article key={report.id} className="agenda-report-page">
                  <header className="agenda-report-header">
                    <div className="agenda-report-logo">District of Sooke</div>
                    <h4>{report.title}</h4>
                  </header>
                  <div className="agenda-report-recommendation">
                    <strong>RECOMMENDATION:</strong>
                    <p>{report.recommendations ?? 'THAT Council receive this report for information.'}</p>
                  </div>
                  <p>{report.executiveSummary ?? 'Report details available in the published agenda package.'}</p>
                  <p>
                    <strong>Department:</strong> {report.department ?? 'General Administration'}
                  </p>
                </article>
              ))}
            </section>
          ) : null}

          {staffReportItems.length > 0 ? (
            <p className="muted">Staff report agenda items included: {staffReportItems.length}</p>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
