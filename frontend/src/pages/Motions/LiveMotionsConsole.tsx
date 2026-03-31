import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { listAgendas } from '../../api/agendas.api';
import {
  nextPresentationSlide,
  getMeetingDisplayState,
  nextAgendaDisplayItem,
  previousAgendaDisplayItem,
  previousPresentationSlide,
  setLivePresentation,
  setLiveAgendaItem,
  showAgendaDisplay,
  showMotionDisplay,
  showPresentationDisplay,
  setPresentationSlide,
} from '../../api/meetingDisplay.api';
import { createMotion, deleteMotion, listMotions, setMotionLive, setMotionOutcome, updateMotion } from '../../api/motions.api';
import { listMeetings } from '../../api/meetings.api';
import { createPresentation, deletePresentation, listPresentations } from '../../api/presentations.api';
import { createResolution } from '../../api/resolutions.api';
import type { AgendaItemRecord } from '../../api/types/agenda.types';
import type { MeetingDisplayState } from '../../api/types/meeting-display.types';
import type { MeetingRecord } from '../../api/types/meeting.types';
import type { MotionRecord } from '../../api/types/motion.types';
import type { PresentationRecord } from '../../api/types/presentation.types';
import AppShell from '../../components/layout/AppShell';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../hooks/useToast';
import { formatMeetingSelectionLabel } from '../../utils/meetingDisplay';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export default function LiveMotionsConsole(): JSX.Element {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [motions, setMotions] = useState<MotionRecord[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItemRecord[]>([]);
  const [presentations, setPresentations] = useState<PresentationRecord[]>([]);
  const [displayState, setDisplayState] = useState<MeetingDisplayState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [editingMotionId, setEditingMotionId] = useState<string | null>(null);
  const [presentationForm, setPresentationForm] = useState({ title: '', fileName: '', mimeType: '', contentBase64: '' });
  const [presentationSlideInput, setPresentationSlideInput] = useState('1');
  const [isAgendaSectionOpen, setIsAgendaSectionOpen] = useState(false);
  const [isPresentationSectionOpen, setIsPresentationSectionOpen] = useState(false);
  const [isMotionSectionOpen, setIsMotionSectionOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', body: '', agendaItemId: '' });
  const [editForm, setEditForm] = useState({ title: '', body: '', agendaItemId: '' });
  const { addToast } = useToast();

  const selectedMeeting = useMemo(
    () => meetings.find((meeting) => meeting.id === selectedMeetingId) ?? null,
    [meetings, selectedMeetingId],
  );

  const liveMotion = useMemo(() => motions.find((motion) => motion.isCurrentLive) ?? null, [motions]);

  const loadMeetings = async (): Promise<void> => {
    const meetingData = await listMeetings();
    setMeetings(meetingData);
    if (!selectedMeetingId && meetingData.length > 0) {
      setSelectedMeetingId(meetingData[0].id);
    }
  };

  const loadMeetingContext = async (meetingId: string): Promise<void> => {
    const [motionData, agendaData, meetingDisplayData, presentationData] = await Promise.all([
      listMotions(meetingId),
      listAgendas(meetingId),
      getMeetingDisplayState(meetingId),
      listPresentations(meetingId),
    ]);
    setMotions(motionData);
    setAgendaItems(
      agendaData
        .flatMap((agenda) => agenda.items)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    );
    setDisplayState(meetingDisplayData);
    setPresentations(presentationData);
    setPresentationSlideInput(String(meetingDisplayData.presentation.currentSlideNumber || 1));
  };

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await loadMeetings();
      } catch {
        setError('Could not load meeting list for live meeting display.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!selectedMeetingId) {
      return;
    }
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await loadMeetingContext(selectedMeetingId);
      } catch {
        setError('Could not load live display context for selected meeting.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [selectedMeetingId]);

  const applyDisplayAction = async (
    actionName: string,
    action: () => Promise<MeetingDisplayState>,
    successMessage: string,
  ): Promise<void> => {
    setPendingAction(actionName);
    setError(null);
    try {
      const nextState = await action();
      setDisplayState(nextState);
      addToast(successMessage, 'success');
    } catch {
      setError('Could not update live meeting display.');
      addToast('Could not update live meeting display.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const runHotkeyAction = async (
    action:
      | 'next-slide'
      | 'previous-slide'
      | 'show-agenda'
      | 'show-motion'
      | 'show-presentation'
      | 'carried'
      | 'defeated'
      | 'withdrawn',
  ): Promise<void> => {
    if (!selectedMeetingId || pendingAction) {
      return;
    }

    if (action === 'next-slide') {
      if (displayState?.displayMode === 'PRESENTATION') {
        await applyDisplayAction(
          `next-presentation-slide:${selectedMeetingId}`,
          () => nextPresentationSlide(selectedMeetingId),
          'Advanced to next presentation slide.',
        );
      } else {
        await applyDisplayAction(
          `next-slide:${selectedMeetingId}`,
          () => nextAgendaDisplayItem(selectedMeetingId),
          'Advanced to next agenda slide.',
        );
      }
      return;
    }

    if (action === 'previous-slide') {
      if (displayState?.displayMode === 'PRESENTATION') {
        await applyDisplayAction(
          `previous-presentation-slide:${selectedMeetingId}`,
          () => previousPresentationSlide(selectedMeetingId),
          'Moved to previous presentation slide.',
        );
      } else {
        await applyDisplayAction(
          `previous-slide:${selectedMeetingId}`,
          () => previousAgendaDisplayItem(selectedMeetingId),
          'Moved to previous agenda slide.',
        );
      }
      return;
    }

    if (action === 'show-agenda') {
      await applyDisplayAction(
        `show-agenda:${selectedMeetingId}`,
        () => showAgendaDisplay(selectedMeetingId),
        'Agenda is now on all displays.',
      );
      return;
    }

    if (action === 'show-motion') {
      await applyDisplayAction(
        `show-motion:${selectedMeetingId}`,
        () => showMotionDisplay(selectedMeetingId),
        'Motion mode is now on all displays.',
      );
      return;
    }

    if (action === 'show-presentation') {
      await applyDisplayAction(
        `show-presentation:${selectedMeetingId}`,
        () => showPresentationDisplay(selectedMeetingId),
        'Presentation mode is now on all displays.',
      );
      return;
    }

    if (!liveMotion) {
      addToast('Set a live motion before marking carried/defeated/withdrawn.', 'error');
      return;
    }

    if (action === 'carried') {
      await runMotionAction(liveMotion.id, 'carried');
      return;
    }

    if (action === 'defeated') {
      await runMotionAction(liveMotion.id, 'defeated');
      return;
    }

    await runMotionAction(liveMotion.id, 'withdrawn');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const tag = target.tagName.toLowerCase();
      const isTypingField =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target.isContentEditable;

      if (isTypingField) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'n') {
        event.preventDefault();
        void runHotkeyAction('next-slide');
      } else if (key === 'p') {
        event.preventDefault();
        void runHotkeyAction('previous-slide');
      } else if (key === 'a') {
        event.preventDefault();
        void runHotkeyAction('show-agenda');
      } else if (key === 'm') {
        event.preventDefault();
        void runHotkeyAction('show-motion');
      } else if (key === 'r') {
        event.preventDefault();
        void runHotkeyAction('show-presentation');
      } else if (key === 'c') {
        event.preventDefault();
        void runHotkeyAction('carried');
      } else if (key === 'd') {
        event.preventDefault();
        void runHotkeyAction('defeated');
      } else if (key === 'w') {
        event.preventDefault();
        void runHotkeyAction('withdrawn');
      } else if (
        event.key === 'ArrowRight' ||
        event.key === 'ArrowDown' ||
        event.key === 'PageDown' ||
        event.key === ' ' ||
        event.key === 'Enter'
      ) {
        event.preventDefault();
        void runHotkeyAction('next-slide');
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'Backspace') {
        event.preventDefault();
        void runHotkeyAction('previous-slide');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMeetingId, pendingAction, liveMotion, displayState?.displayMode]);

  const handleCreateMotion = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedMeetingId) {
      addToast('Select a meeting first.', 'error');
      return;
    }
    if (createForm.title.trim().length < 3 || createForm.body.trim().length < 8) {
      addToast('Enter a title and motion body before creating.', 'error');
      return;
    }

    setPendingAction('create');
    setError(null);
    try {
      await createMotion({
        meetingId: selectedMeetingId,
        agendaItemId: createForm.agendaItemId || undefined,
        title: createForm.title.trim(),
        body: createForm.body.trim(),
      });
      setCreateForm({ title: '', body: '', agendaItemId: '' });
      await loadMeetingContext(selectedMeetingId);
      addToast('Motion created.', 'success');
    } catch {
      setError('Could not create motion.');
      addToast('Could not create motion.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const beginEdit = (motion: MotionRecord): void => {
    setEditingMotionId(motion.id);
    setEditForm({ title: motion.title, body: motion.body, agendaItemId: motion.agendaItemId ?? '' });
  };

  const handleSaveEdit = async (motionId: string): Promise<void> => {
    if (!selectedMeetingId) {
      return;
    }
    setPendingAction(`save:${motionId}`);
    setError(null);
    try {
      await updateMotion(motionId, {
        title: editForm.title.trim(),
        body: editForm.body.trim(),
        agendaItemId: editForm.agendaItemId || undefined,
      });
      setEditingMotionId(null);
      await loadMeetingContext(selectedMeetingId);
      addToast('Motion updated.', 'success');
    } catch {
      setError('Could not update motion.');
      addToast('Could not update motion.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const runMotionAction = async (
    motionId: string,
    action: 'live' | 'carried' | 'defeated' | 'withdrawn',
  ): Promise<void> => {
    if (!selectedMeetingId) {
      return;
    }
    setPendingAction(`${action}:${motionId}`);
    setError(null);
    try {
      if (action === 'live') {
        await setMotionLive(motionId);
      } else {
        await setMotionOutcome(motionId, {
          status: action === 'carried' ? 'CARRIED' : action === 'defeated' ? 'DEFEATED' : 'WITHDRAWN',
        });
      }
      await loadMeetingContext(selectedMeetingId);
      addToast('Motion state updated.', 'success');
    } catch {
      setError('Could not update motion state.');
      addToast('Could not update motion state.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteMotion = async (motion: MotionRecord): Promise<void> => {
    if (!selectedMeetingId) {
      return;
    }
    if (!window.confirm(`Delete motion \"${motion.title}\"?`)) {
      return;
    }
    setPendingAction(`delete:${motion.id}`);
    setError(null);
    try {
      await deleteMotion(motion.id);
      if (editingMotionId === motion.id) {
        setEditingMotionId(null);
      }
      await loadMeetingContext(selectedMeetingId);
      addToast('Motion deleted.', 'success');
    } catch {
      setError('Could not delete motion.');
      addToast('Could not delete motion.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const handleCreateResolutionFromMotion = async (motion: MotionRecord): Promise<void> => {
    if (!selectedMeetingId) {
      return;
    }
    setPendingAction(`resolution:${motion.id}`);
    setError(null);
    try {
      await createResolution({
        meetingId: selectedMeetingId,
        motionId: motion.id,
        agendaItemId: motion.agendaItemId,
        resolutionNumber: `RES-${new Date().getFullYear()}-${String(motion.sortOrder).padStart(3, '0')}`,
        title: motion.title,
        body: motion.body,
      });
      addToast('Resolution created from motion.', 'success');
    } catch {
      setError('Could not create resolution from motion.');
      addToast('Could not create resolution from motion.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const handleSetAgendaSlide = async (agendaItemId: string): Promise<void> => {
    if (!selectedMeetingId) {
      return;
    }

    await applyDisplayAction(
      `set-agenda-slide:${agendaItemId}`,
      () => setLiveAgendaItem(selectedMeetingId, agendaItemId),
      'Agenda slide pushed to display.',
    );
  };

  const handlePresentationFile = async (event: FormEvent<HTMLInputElement>): Promise<void> => {
    const target = event.currentTarget;
    const file = target.files?.[0];
    if (!file) {
      return;
    }

    const contentBase64 = await fileToBase64(file);
    setPresentationForm((current) => ({
      ...current,
      fileName: file.name,
      mimeType: file.type,
      contentBase64,
      title: current.title || file.name.replace(/\.[^.]+$/, ''),
    }));
  };

  const handleUploadPresentation = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedMeetingId) {
      addToast('Select a meeting first.', 'error');
      return;
    }
    if (!presentationForm.fileName || !presentationForm.contentBase64) {
      addToast('Choose a PDF, PPT, or PPTX file first.', 'error');
      return;
    }

    setPendingAction('upload-presentation');
    setError(null);
    try {
      await createPresentation({
        meetingId: selectedMeetingId,
        fileName: presentationForm.fileName,
        mimeType: presentationForm.mimeType || undefined,
        title: presentationForm.title.trim() || undefined,
        contentBase64: presentationForm.contentBase64,
      });
      setPresentationForm({ title: '', fileName: '', mimeType: '', contentBase64: '' });
      await loadMeetingContext(selectedMeetingId);
      addToast('Presentation uploaded.', 'success');
    } catch {
      setError('Could not upload presentation.');
      addToast('Could not upload presentation.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const handleSetPresentation = async (presentationId: string): Promise<void> => {
    if (!selectedMeetingId) {
      return;
    }
    await applyDisplayAction(
      `set-presentation:${presentationId}`,
      () => setLivePresentation(selectedMeetingId, presentationId),
      'Presentation pushed to display.',
    );
  };

  const handleDeletePresentation = async (presentationId: string): Promise<void> => {
    if (!selectedMeetingId) {
      return;
    }
    if (!window.confirm('Delete this presentation from the meeting?')) {
      return;
    }
    setPendingAction(`delete-presentation:${presentationId}`);
    setError(null);
    try {
      await deletePresentation(presentationId);
      await loadMeetingContext(selectedMeetingId);
      addToast('Presentation deleted.', 'success');
    } catch {
      setError('Could not delete presentation.');
      addToast('Could not delete presentation.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const handleSetPresentationSlide = async (): Promise<void> => {
    if (!selectedMeetingId) {
      return;
    }
    const slideNumber = Number.parseInt(presentationSlideInput, 10);
    if (!Number.isFinite(slideNumber) || slideNumber < 1) {
      addToast('Enter a valid slide number.', 'error');
      return;
    }
    await applyDisplayAction(
      `set-presentation-slide:${selectedMeetingId}`,
      () => setPresentationSlide(selectedMeetingId, slideNumber),
      `Moved to slide ${slideNumber}.`,
    );
  };

  return (
    <AppShell
      title="Live Meeting Display"
      subtitle="Run agenda slides and motions from one console without switching screens."
      actions={
        <a
          className="btn"
          href={selectedMeetingId ? `/public/live-meeting/${selectedMeetingId}` : '/public'}
          target="_blank"
          rel="noreferrer"
        >
          Open Public Screen
        </a>
      }
    >
      <Card>
        <CardHeader title="Display Console" description="Agenda stays primary. Switch to motions instantly when needed." />
        <CardBody>
          <div className="workspace-toolbar-row">
            <select
              className="field"
              value={selectedMeetingId}
              onChange={(event) => setSelectedMeetingId(event.target.value)}
              aria-label="Select meeting for live meeting display"
            >
              {meetings.length === 0 ? <option value="">No meetings available</option> : null}
              {meetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>
                  {formatMeetingSelectionLabel(meeting)}
                </option>
              ))}
            </select>

            <span className="pill">
              {displayState?.displayMode === 'MOTION'
                ? 'Display Mode: Motion'
                : displayState?.displayMode === 'PRESENTATION'
                  ? 'Display Mode: Presentation'
                  : 'Display Mode: Agenda'}
            </span>
          </div>

          {selectedMeeting ? (
            <p className="muted">
              Public display URL: <code>{`${window.location.origin}/public/live-meeting/${selectedMeeting.id}`}</code>
            </p>
          ) : null}

          <p className="muted">
            Hotkeys: <code>N</code> next slide, <code>P</code> previous slide, <code>A</code> show agenda, <code>M</code>{' '}
            show motion, <code>R</code> show presentation, <code>C</code> carried, <code>D</code> defeated, <code>W</code>{' '}
            withdrawn. Presenter remotes are supported using arrows, page up/down, space, enter, and back keys.
          </p>

          {isLoading ? <p className="muted">Loading live display...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}

          <div className="page-actions">
            <button
              type="button"
              className={displayState?.displayMode === 'AGENDA' ? 'btn btn-primary' : 'btn'}
              aria-pressed={displayState?.displayMode === 'AGENDA'}
              disabled={!selectedMeetingId || pendingAction === `show-agenda:${selectedMeetingId}`}
              onClick={() =>
                void applyDisplayAction(
                  `show-agenda:${selectedMeetingId}`,
                  () => showAgendaDisplay(selectedMeetingId),
                  'Agenda is now on all displays.',
                )
              }
            >
              Show Agenda
            </button>
            <button
              type="button"
              className={displayState?.displayMode === 'PRESENTATION' ? 'btn btn-primary' : 'btn'}
              aria-pressed={displayState?.displayMode === 'PRESENTATION'}
              disabled={!selectedMeetingId || pendingAction === `show-presentation:${selectedMeetingId}`}
              onClick={() =>
                void applyDisplayAction(
                  `show-presentation:${selectedMeetingId}`,
                  () => showPresentationDisplay(selectedMeetingId),
                  'Presentation mode is now on all displays.',
                )
              }
            >
              Show Presentation
            </button>
            <button
              type="button"
              className={displayState?.displayMode === 'MOTION' ? 'btn btn-primary' : 'btn'}
              aria-pressed={displayState?.displayMode === 'MOTION'}
              disabled={!selectedMeetingId || pendingAction === `show-motion:${selectedMeetingId}`}
              onClick={() =>
                void applyDisplayAction(
                  `show-motion:${selectedMeetingId}`,
                  () => showMotionDisplay(selectedMeetingId),
                  'Motion mode is now on all displays.',
                )
              }
            >
              Show Live Motion
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              disabled={
                !selectedMeetingId ||
                pendingAction ===
                  `${displayState?.displayMode === 'PRESENTATION' ? 'previous-presentation-slide' : 'previous-slide'}:${selectedMeetingId}`
              }
              onClick={() =>
                void applyDisplayAction(
                  `${displayState?.displayMode === 'PRESENTATION' ? 'previous-presentation-slide' : 'previous-slide'}:${selectedMeetingId}`,
                  () =>
                    displayState?.displayMode === 'PRESENTATION'
                      ? previousPresentationSlide(selectedMeetingId)
                      : previousAgendaDisplayItem(selectedMeetingId),
                  displayState?.displayMode === 'PRESENTATION'
                    ? 'Moved to previous presentation slide.'
                    : 'Moved to previous agenda slide.',
                )
              }
            >
              Previous Slide
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              disabled={
                !selectedMeetingId ||
                pendingAction ===
                  `${displayState?.displayMode === 'PRESENTATION' ? 'next-presentation-slide' : 'next-slide'}:${selectedMeetingId}`
              }
              onClick={() =>
                void applyDisplayAction(
                  `${displayState?.displayMode === 'PRESENTATION' ? 'next-presentation-slide' : 'next-slide'}:${selectedMeetingId}`,
                  () =>
                    displayState?.displayMode === 'PRESENTATION'
                      ? nextPresentationSlide(selectedMeetingId)
                      : nextAgendaDisplayItem(selectedMeetingId),
                  displayState?.displayMode === 'PRESENTATION'
                    ? 'Advanced to next presentation slide.'
                    : 'Advanced to next agenda slide.',
                )
              }
            >
              Next Slide
            </button>
          </div>

          <section className="live-display-preview" aria-live="polite">
            <p className="live-display-preview-kicker">Currently On Screen</p>
            <p className="live-display-preview-mode">
              {displayState?.displayMode === 'MOTION'
                ? 'Live Motion Mode'
                : displayState?.displayMode === 'PRESENTATION'
                  ? 'Presentation Mode'
                  : 'Agenda Mode'}
            </p>
            {displayState?.displayMode === 'MOTION' ? (
              liveMotion ? (
                <>
                  <h3>{liveMotion.title}</h3>
                  <p>{liveMotion.body}</p>
                </>
              ) : (
                <p>No live motion is currently set.</p>
              )
            ) : displayState?.displayMode === 'PRESENTATION' ? (
              displayState.presentation.currentPresentation ? (
                <>
                  <h3>{displayState.presentation.currentPresentation.title}</h3>
                  <p>
                    Slide {displayState.presentation.currentSlideNumber} of {displayState.presentation.totalSlides}
                  </p>
                  <p>{displayState.presentation.currentPresentation.fileName}</p>
                </>
              ) : (
                <p>No presentation is currently selected.</p>
              )
            ) : displayState?.agenda.currentItem ? (
              <>
                <h3>{displayState.agenda.currentItem.title}</h3>
                <p>{displayState.agenda.currentItem.description ?? 'No note for this slide.'}</p>
              </>
            ) : (
              <p>No agenda slide is currently selected.</p>
            )}
          </section>

          <div style={{ marginTop: '0.95rem' }}>
            <Card>
              <CardHeader
                title="Agenda Slides"
              description="Jump to a specific slide without scrolling the full agenda page."
              actions={
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => setIsAgendaSectionOpen((current) => !current)}
                  aria-expanded={isAgendaSectionOpen}
                >
                  {isAgendaSectionOpen ? 'Collapse' : 'Expand'}
                </button>
              }
            />
            {isAgendaSectionOpen ? (
              <CardBody>
                <div className="table-wrap">
                  <table className="data-table" aria-label="Agenda display slides">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Agenda Slide</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayState?.agenda.orderedItems.length ? (
                        displayState.agenda.orderedItems.map((item) => {
                          const isCurrent = displayState.agenda.currentItem?.id === item.id;
                          return (
                            <tr key={item.id} className={isCurrent ? 'live-display-active-row' : undefined}>
                              <td>{item.sortOrder}</td>
                              <td>
                                <strong>{item.title}</strong>
                                {item.description ? <div className="muted">{item.description}</div> : null}
                                {isCurrent ? <div className="muted">Currently selected slide</div> : null}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn"
                                  disabled={pendingAction === `set-agenda-slide:${item.id}`}
                                  onClick={() => void handleSetAgendaSlide(item.id)}
                                >
                                  Show This Slide
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="muted">
                            No agenda slides available yet. Add agenda items (non-motion) first.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            ) : null}
          </Card>
          </div>

          <div style={{ marginTop: '0.95rem' }}>
            <Card>
              <CardHeader
                title="Presentation Decks"
              description="Upload PDF/PPT/PPTX, then run slides from this same console."
              actions={
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => setIsPresentationSectionOpen((current) => !current)}
                  aria-expanded={isPresentationSectionOpen}
                >
                  {isPresentationSectionOpen ? 'Collapse' : 'Expand'}
                </button>
              }
            />
            {isPresentationSectionOpen ? <CardBody>
              <form onSubmit={(event) => void handleUploadPresentation(event)}>
                <div className="form-grid">
                  <div className="form-field span-all">
                    <label htmlFor="presentation-title">Presentation title (optional)</label>
                    <input
                      id="presentation-title"
                      className="field"
                      value={presentationForm.title}
                      onChange={(event) =>
                        setPresentationForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-field span-all">
                    <label htmlFor="presentation-file">Upload file (PDF, PPT, PPTX)</label>
                    <input
                      id="presentation-file"
                      type="file"
                      className="field"
                      accept=".pdf,.ppt,.pptx"
                      onInput={(event) => void handlePresentationFile(event)}
                    />
                    {presentationForm.fileName ? <p className="muted">Selected: {presentationForm.fileName}</p> : null}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={pendingAction === 'upload-presentation'}>
                    {pendingAction === 'upload-presentation' ? 'Uploading...' : 'Upload Presentation'}
                  </button>
                </div>
              </form>

              <div className="workspace-toolbar-row" style={{ marginTop: '0.85rem' }}>
                <input
                  className="field"
                  type="number"
                  min={1}
                  value={presentationSlideInput}
                  onChange={(event) => setPresentationSlideInput(event.target.value)}
                  aria-label="Go to presentation slide number"
                />
                <button type="button" className="btn" onClick={() => void handleSetPresentationSlide()}>
                  Go To Slide
                </button>
              </div>

              <div className="table-wrap" style={{ marginTop: '0.85rem' }}>
                <table className="data-table" aria-label="Meeting presentations table">
                  <thead>
                    <tr>
                      <th>Presentation</th>
                      <th>Pages</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presentations.length > 0 ? (
                      presentations.map((presentation) => {
                        const isCurrent = displayState?.presentation.currentPresentation?.id === presentation.id;
                        return (
                          <tr key={presentation.id} className={isCurrent ? 'live-display-active-row' : undefined}>
                            <td>
                              <strong>{presentation.title}</strong>
                              <div className="muted">{presentation.fileName}</div>
                            </td>
                            <td>{presentation.pageCount}</td>
                            <td>{new Date(presentation.updatedAt).toLocaleTimeString()}</td>
                            <td>
                              <button
                                type="button"
                                className="btn"
                                disabled={pendingAction === `set-presentation:${presentation.id}`}
                                onClick={() => void handleSetPresentation(presentation.id)}
                              >
                                Show Presentation
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger"
                                disabled={pendingAction === `delete-presentation:${presentation.id}`}
                                onClick={() => void handleDeletePresentation(presentation.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="muted">
                          No presentations uploaded for this meeting yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody> : null}
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Motion Controls"
          description="Prepare and publish motions without leaving this page."
          actions={
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => setIsMotionSectionOpen((current) => !current)}
              aria-expanded={isMotionSectionOpen}
            >
              {isMotionSectionOpen ? 'Collapse' : 'Expand'}
            </button>
          }
        />
        {isMotionSectionOpen ? <CardBody>
          <div className="workspace-toolbar-row">
            <span className="pill">{liveMotion ? `Live: ${liveMotion.title}` : 'No live motion'}</span>
          </div>

          <form onSubmit={(event) => void handleCreateMotion(event)}>
            <h3>Add Motion</h3>
            <div className="form-grid">
              <div className="form-field span-all">
                <label htmlFor="motion-title">Title</label>
                <input
                  id="motion-title"
                  className="field"
                  value={createForm.title}
                  onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                />
              </div>
              <div className="form-field span-all">
                <label htmlFor="motion-body">Motion Text</label>
                <textarea
                  id="motion-body"
                  className="field"
                  rows={4}
                  value={createForm.body}
                  onChange={(event) => setCreateForm((current) => ({ ...current, body: event.target.value }))}
                />
              </div>
              <div className="form-field span-all">
                <label htmlFor="motion-agenda-item">Linked Agenda Item (optional)</label>
                <select
                  id="motion-agenda-item"
                  className="field"
                  value={createForm.agendaItemId}
                  onChange={(event) => setCreateForm((current) => ({ ...current, agendaItemId: event.target.value }))}
                >
                  <option value="">No linked agenda item</option>
                  {agendaItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sortOrder}. {item.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={pendingAction === 'create'}>
                {pendingAction === 'create' ? 'Creating...' : 'Create Motion'}
              </button>
            </div>
          </form>

          <h3>Meeting Motions</h3>
          {motions.length === 0 ? (
            <div className="empty-state">No motions yet for this meeting.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table" aria-label="Live motions table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {motions.map((motion) => {
                    const isEditing = editingMotionId === motion.id;
                    return (
                      <tr key={motion.id}>
                        <td>{motion.sortOrder}</td>
                        <td>
                          {isEditing ? (
                            <div className="form-grid">
                              <div className="form-field span-all">
                                <input
                                  className="field"
                                  value={editForm.title}
                                  onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                                />
                              </div>
                              <div className="form-field span-all">
                                <textarea
                                  className="field"
                                  rows={3}
                                  value={editForm.body}
                                  onChange={(event) => setEditForm((current) => ({ ...current, body: event.target.value }))}
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <strong>{motion.title}</strong>
                              <div className="muted">{motion.body}</div>
                            </>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={motion.status} />
                          {motion.isCurrentLive ? <div className="muted">Currently live motion</div> : null}
                        </td>
                        <td>{new Date(motion.updatedAt).toLocaleTimeString()}</td>
                        <td>
                          <div className="page-actions">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  disabled={pendingAction === `save:${motion.id}`}
                                  onClick={() => void handleSaveEdit(motion.id)}
                                >
                                  Save
                                </button>
                                <button type="button" className="btn btn-quiet" onClick={() => setEditingMotionId(null)}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" className="btn btn-quiet" onClick={() => beginEdit(motion)}>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  disabled={pendingAction === `live:${motion.id}`}
                                  onClick={() => void runMotionAction(motion.id, 'live')}
                                >
                                  Set Live
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  disabled={pendingAction === `carried:${motion.id}`}
                                  onClick={() => void runMotionAction(motion.id, 'carried')}
                                >
                                  Carried
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  disabled={pendingAction === `defeated:${motion.id}`}
                                  onClick={() => void runMotionAction(motion.id, 'defeated')}
                                >
                                  Defeated
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  disabled={pendingAction === `withdrawn:${motion.id}`}
                                  onClick={() => void runMotionAction(motion.id, 'withdrawn')}
                                >
                                  Withdrawn
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  disabled={pendingAction === `delete:${motion.id}`}
                                  onClick={() => void handleDeleteMotion(motion)}
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  disabled={pendingAction === `resolution:${motion.id}`}
                                  onClick={() => void handleCreateResolutionFromMotion(motion)}
                                >
                                  Create Resolution
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody> : null}
      </Card>
      </CardBody>
      </Card>
    </AppShell>
  );
}
