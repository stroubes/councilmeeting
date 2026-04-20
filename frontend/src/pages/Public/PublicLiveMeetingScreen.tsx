import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getPublicMeetingDisplayState,
  getPublicMeetingDisplayStreamUrl,
  getPublicPresentationContentUrl,
} from '../../api/meetingDisplay.api';
import { listPublicMeetings } from '../../api/public.api';
import sookeLogoPrimary from '../../assets/logos/district-of-sooke-primary-transparent.png';
import type { MeetingDisplayState } from '../../api/types/meeting-display.types';
import type { MeetingRecord } from '../../api/types/meeting.types';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const OUTCOME_DISPLAY_MS = 10_000;

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function PublicLiveMeetingScreen(): JSX.Element {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [displayState, setDisplayState] = useState<MeetingDisplayState | null>(null);
  const [recentOutcomeExpiry, setRecentOutcomeExpiry] = useState<number | null>(null);
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [presentationDocument, setPresentationDocument] = useState<PDFDocumentProxy | null>(null);
  const [presentationRenderError, setPresentationRenderError] = useState<string | null>(null);
  const presentationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const presentationFrameRef = useRef<HTMLDivElement | null>(null);
  const presentationRenderTaskRef = useRef<{ cancel: () => void; promise: Promise<unknown> } | null>(null);
  const presentationRenderNonceRef = useRef(0);

  const applyIncomingState = (state: MeetingDisplayState): void => {
    setDisplayState((previousState) => {
      const previousRecentOutcomeId = previousState?.motion.recentOutcomeMotion?.id;
      const nextRecentOutcome = state.motion.recentOutcomeMotion;

      if (
        state.displayMode === 'MOTION' &&
        !state.motion.liveMotion &&
        nextRecentOutcome &&
        nextRecentOutcome.id !== previousRecentOutcomeId
      ) {
        setRecentOutcomeExpiry(Date.now() + OUTCOME_DISPLAY_MS);
      }

      if (state.displayMode !== 'MOTION' || state.motion.liveMotion) {
        setRecentOutcomeExpiry(null);
      }

      return state;
    });
  };

  useEffect(() => {
    if (!meetingId) {
      setError('Meeting id missing in URL.');
      return;
    }

    let isDisposed = false;
    let pollingInterval: number | null = null;
    let stream: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let reconnectAttempts = 0;
    const INITIAL_RECONNECT_DELAY_MS = 1000;
    const MAX_RECONNECT_DELAY_MS = 30_000;

    const loadState = async (): Promise<void> => {
      try {
        const state = await getPublicMeetingDisplayState(meetingId);
        if (isDisposed) {
          return;
        }
        applyIncomingState(state);
        setError(null);
      } catch {
        if (!isDisposed) {
          setError('Unable to load live meeting display. Check backend API and meeting id.');
        }
      }
    };

    const stopPolling = (): void => {
      if (pollingInterval !== null) {
        window.clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const startPolling = (): void => {
      if (pollingInterval !== null) {
        return;
      }
      void loadState();
      pollingInterval = window.setInterval(() => {
        void loadState();
      }, 2000);
    };

    const scheduleReconnect = (): void => {
      if (isDisposed || reconnectTimer !== null) {
        return;
      }
      const exponent = Math.min(reconnectAttempts, 5);
      const base = INITIAL_RECONNECT_DELAY_MS * Math.pow(2, exponent);
      const jitter = Math.random() * 500;
      const delay = Math.min(base + jitter, MAX_RECONNECT_DELAY_MS);
      reconnectAttempts += 1;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connectStream();
      }, delay);
    };

    const connectStream = (): void => {
      if (isDisposed) {
        return;
      }
      try {
        stream = new EventSource(getPublicMeetingDisplayStreamUrl(meetingId));
      } catch {
        startPolling();
        scheduleReconnect();
        return;
      }

      stream.onopen = () => {
        if (isDisposed) {
          return;
        }
        reconnectAttempts = 0;
        stopPolling();
        setError(null);
      };

      stream.addEventListener('meeting-display-state', (event: MessageEvent) => {
        if (isDisposed) {
          return;
        }
        try {
          const state = JSON.parse(event.data as string) as MeetingDisplayState;
          applyIncomingState(state);
          setError(null);
        } catch {
          setError('Received an invalid live display update payload.');
        }
      });

      stream.onerror = () => {
        if (stream) {
          stream.close();
          stream = null;
        }
        if (isDisposed) {
          return;
        }
        setError('Live stream unavailable. Falling back to 2-second refresh while reconnecting.');
        startPolling();
        scheduleReconnect();
      };
    };

    void loadState();
    startPolling();
    connectStream();

    return () => {
      isDisposed = true;
      stopPolling();
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (stream) {
        stream.close();
      }
    };
  }, [meetingId]);

  useEffect(() => {
    if (!meetingId) {
      return;
    }

    const loadMeeting = async (): Promise<void> => {
      try {
        const meetings = await listPublicMeetings();
        setMeeting(meetings.find((entry) => entry.id === meetingId) ?? null);
      } catch {
        setMeeting(null);
      }
    };

    void loadMeeting();
  }, [meetingId]);

  useEffect(() => {
    if (!displayState || recentOutcomeExpiry === null) {
      return;
    }

    const remainingMs = recentOutcomeExpiry - Date.now();
    if (remainingMs <= 0) {
      setRecentOutcomeExpiry(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      setRecentOutcomeExpiry(null);
    }, remainingMs);

    return () => window.clearTimeout(timeout);
  }, [displayState, recentOutcomeExpiry]);

  const meetingLabel = useMemo(() => {
    if (!meeting) {
      return 'Council Meeting';
    }
    const startsAt = new Date(meeting.startsAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${meeting.title} - ${startsAt}`;
  }, [meeting]);

  const mode = displayState?.displayMode ?? 'AGENDA';
  const agendaItem = displayState?.agenda.currentItem ?? null;
  const liveMotion = displayState?.motion.liveMotion ?? null;
  const recentOutcomeMotion = displayState?.motion.recentOutcomeMotion ?? null;
  const presentation = displayState?.presentation.currentPresentation ?? null;
  const displayMotion = liveMotion ?? (recentOutcomeExpiry ? recentOutcomeMotion : null);
  const presentationSlideNumber = displayState?.presentation.currentSlideNumber ?? 1;
  const presentationTotalSlides = displayState?.presentation.totalSlides ?? 0;
  const presentationDocUrl = meetingId && presentation ? getPublicPresentationContentUrl(meetingId) : null;
  const presentationDocKey = meetingId && presentation ? `${meetingId}:${presentation.id}` : null;
  const nowLabel = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  useEffect(() => {
    if (!presentationDocUrl || !presentationDocKey) {
      setPresentationDocument((current) => {
        if (current) {
          void current.destroy();
        }
        return null;
      });
      return;
    }

    let cancelled = false;
    const loadingTask = getDocument({ url: presentationDocUrl });

    void loadingTask.promise
      .then((doc) => {
        if (cancelled) {
          void doc.destroy();
          return;
        }
        setPresentationDocument((current) => {
          if (current) {
            void current.destroy();
          }
          return doc;
        });
        setPresentationRenderError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setPresentationRenderError('Could not render the presentation slide.');
        }
      });

    return () => {
      cancelled = true;
      void loadingTask.destroy();
    };
  }, [presentationDocUrl, presentationDocKey]);

  useEffect(() => {
    if (mode !== 'PRESENTATION' || !presentationDocument || !presentationCanvasRef.current) {
      return;
    }

    let cancelled = false;
    let animationFrameId: number | null = null;

    const renderSlide = async (): Promise<void> => {
      if (!presentationCanvasRef.current) {
        return;
      }

      const nonce = ++presentationRenderNonceRef.current;
      if (presentationRenderTaskRef.current) {
        presentationRenderTaskRef.current.cancel();
        presentationRenderTaskRef.current = null;
      }

      const safeSlideNumber = Math.max(1, Math.min(presentationSlideNumber, presentationDocument.numPages));
      const page = await presentationDocument.getPage(safeSlideNumber);
      if (cancelled || nonce !== presentationRenderNonceRef.current) {
        return;
      }
      const resolvedRotation = page.rotate;
      const baseViewport = page.getViewport({ scale: 1, rotation: resolvedRotation });
      const frameWidth = presentationFrameRef.current?.clientWidth ?? baseViewport.width;
      const frameHeight = presentationFrameRef.current?.clientHeight ?? baseViewport.height;
      const widthScale = frameWidth > 0 ? (frameWidth - 8) / baseViewport.width : 1;
      const heightScale = frameHeight > 0 ? (frameHeight - 8) / baseViewport.height : 1;
      const cssScale = Math.max(0.1, Math.min(widthScale, heightScale));
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: cssScale, rotation: resolvedRotation });

      const canvas = presentationCanvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) {
        setPresentationRenderError('Could not initialize slide rendering context.');
        return;
      }

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, viewport.width, viewport.height);

      const task = page.render({ canvasContext: context, canvas, viewport });
      presentationRenderTaskRef.current = task;

      try {
        await task.promise;
      } finally {
        if (presentationRenderTaskRef.current === task) {
          presentationRenderTaskRef.current = null;
        }
      }

      if (cancelled || nonce !== presentationRenderNonceRef.current) {
        return;
      }

      if (!cancelled) {
        setPresentationRenderError(null);
      }
    };

    const triggerRender = (): void => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = window.requestAnimationFrame(() => {
        void renderSlide().catch(() => {
          if (!cancelled) {
            setPresentationRenderError('Could not render the presentation slide.');
          }
        });
      });
    };

    triggerRender();

    const handleResize = (): void => {
      triggerRender();
    };

    const observer = new ResizeObserver(() => {
      triggerRender();
    });

    if (presentationFrameRef.current) {
      observer.observe(presentationFrameRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      cancelled = true;
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      if (presentationRenderTaskRef.current) {
        presentationRenderTaskRef.current.cancel();
        presentationRenderTaskRef.current = null;
      }
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [mode, presentationDocument, presentationSlideNumber]);

  useEffect(() => {
    return () => {
      if (presentationDocument) {
        void presentationDocument.destroy();
      }
    };
  }, [presentationDocument]);

  return (
    <main
      className={`motion-screen sooke-live-screen live-meeting-screen${mode === 'PRESENTATION' ? ' live-meeting-screen-presentation' : ''}`}
    >
      <header className="motion-screen-header sooke-live-header">
        <img className="sooke-live-logo" src={sookeLogoPrimary} alt="District of Sooke logo" />
        <div className="sooke-live-heading">
          <p className="motion-screen-kicker">District of Sooke</p>
          <h1>{meetingLabel}</h1>
          <p className="sooke-live-subtitle">Council Meeting Live Display</p>
        </div>
        <div className="sooke-live-meta">
          <p className="motion-screen-mode">
            {mode === 'MOTION' ? 'Live Motion Mode' : mode === 'PRESENTATION' ? 'Presentation Mode' : 'Agenda Mode'}
          </p>
          <p className="sooke-live-time">{nowLabel}</p>
        </div>
      </header>

      {error ? <p className="inline-alert">{error}</p> : null}

      {mode === 'MOTION' ? (
        displayMotion ? (
          <section className="motion-screen-card sooke-live-card" aria-live="polite">
            <p className="motion-screen-status">{liveMotion ? liveMotion.status : `Result - ${displayMotion.status}`}</p>
            <h2>{displayMotion.title}</h2>
            <p className="motion-screen-body">{displayMotion.body}</p>
            <p className="motion-screen-updated">Updated {new Date(displayMotion.updatedAt).toLocaleTimeString()}</p>
          </section>
        ) : (
          <section className="motion-screen-card motion-screen-empty sooke-live-card">
            <h2>Awaiting Live Motion</h2>
            <p>The clerk has switched to motion mode. Set a motion live to display it.</p>
          </section>
        )
      ) : mode === 'PRESENTATION' ? (
        presentation ? (
          <section className="motion-screen-card sooke-live-card presentation-live-card" aria-live="polite">
            <p className="motion-screen-status">
              Presentation - Slide {presentationSlideNumber} of {presentationTotalSlides}
            </p>
            <div className="presentation-screen-stage" ref={presentationFrameRef}>
              {presentationRenderError ? <p className="inline-alert">{presentationRenderError}</p> : null}
              <canvas
                className="presentation-screen-canvas"
                ref={presentationCanvasRef}
                aria-label={`${presentation.title} slide ${presentationSlideNumber}`}
              />
            </div>
          </section>
        ) : (
          <section className="motion-screen-card motion-screen-empty sooke-live-card">
            <h2>Awaiting Presentation</h2>
            <p>The clerk has switched to presentation mode. Select a presentation to begin.</p>
          </section>
        )
      ) : agendaItem ? (
        <section className="motion-screen-card sooke-live-card" aria-live="polite">
          <p className="motion-screen-status">Agenda Item {agendaItem.sortOrder}</p>
          <h2>{agendaItem.title}</h2>
          {agendaItem.description ? <p className="motion-screen-body">{agendaItem.description}</p> : null}
          <p className="motion-screen-updated">Updated {new Date(displayState?.updatedAt ?? '').toLocaleTimeString()}</p>
        </section>
      ) : (
        <section className="motion-screen-card motion-screen-empty sooke-live-card">
          <h2>Awaiting Agenda Slide</h2>
          <p>The clerk has not selected an agenda slide yet.</p>
        </section>
      )}

      {mode !== 'PRESENTATION' ? (
        <footer className="motion-screen-footer">
          <Link to="/public">Return to Public Portal</Link>
        </footer>
      ) : null}
    </main>
  );
}
