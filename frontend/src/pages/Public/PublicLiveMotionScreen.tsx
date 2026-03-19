import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPublicMotionState } from '../../api/motions.api';
import { listPublicMeetings } from '../../api/public.api';
import sookeLogoPrimary from '../../assets/logos/district-of-sooke-primary-transparent.png';
import type { MotionRecord } from '../../api/types/motion.types';
import type { MeetingRecord } from '../../api/types/meeting.types';

const OUTCOME_DISPLAY_MS = 10_000;

export default function PublicLiveMotionScreen(): JSX.Element {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [motion, setMotion] = useState<MotionRecord | null>(null);
  const [recentOutcomeMotion, setRecentOutcomeMotion] = useState<MotionRecord | null>(null);
  const [recentOutcomeExpiry, setRecentOutcomeExpiry] = useState<number | null>(null);
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meetingId) {
      setError('Meeting id missing in URL.');
      return;
    }

    const load = async (): Promise<void> => {
      try {
        const [publicState, meetings] = await Promise.all([getPublicMotionState(meetingId), listPublicMeetings()]);
        setMotion(publicState.liveMotion);
        if (!publicState.liveMotion && publicState.recentOutcomeMotion) {
          const hasChangedOutcome =
            !recentOutcomeMotion ||
            recentOutcomeMotion.id !== publicState.recentOutcomeMotion.id ||
            recentOutcomeMotion.updatedAt !== publicState.recentOutcomeMotion.updatedAt;

          if (hasChangedOutcome) {
            setRecentOutcomeMotion(publicState.recentOutcomeMotion);
            setRecentOutcomeExpiry(Date.now() + OUTCOME_DISPLAY_MS);
          }
        }
        if (publicState.liveMotion) {
          setRecentOutcomeMotion(null);
          setRecentOutcomeExpiry(null);
        }
        setMeeting(meetings.find((entry) => entry.id === meetingId) ?? null);
        setError(null);
      } catch {
        setError('Unable to load live motion feed. Check that backend API is running and this meeting id is valid.');
      }
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 2000);

    return () => window.clearInterval(interval);
  }, [meetingId, recentOutcomeMotion]);

  useEffect(() => {
    if (!recentOutcomeMotion || recentOutcomeExpiry === null) {
      return;
    }

    const remainingMs = recentOutcomeExpiry - Date.now();
    if (remainingMs <= 0) {
      setRecentOutcomeMotion(null);
      setRecentOutcomeExpiry(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      setRecentOutcomeMotion(null);
      setRecentOutcomeExpiry(null);
    }, remainingMs);

    return () => window.clearTimeout(timeout);
  }, [recentOutcomeMotion, recentOutcomeExpiry]);

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

  const displayMotion = motion ?? recentOutcomeMotion;
  const isOutcomeHold = !motion && Boolean(recentOutcomeMotion);
  const nowLabel = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <main className="motion-screen sooke-live-screen">
      <header className="motion-screen-header sooke-live-header">
        <img className="sooke-live-logo" src={sookeLogoPrimary} alt="District of Sooke logo" />
        <div className="sooke-live-heading">
          <p className="motion-screen-kicker">District of Sooke</p>
          <h1>{meetingLabel}</h1>
          <p className="sooke-live-subtitle">Council Motion Display</p>
        </div>
        <div className="sooke-live-meta">
          <p className="motion-screen-mode">Live Motion Mode</p>
          <p className="sooke-live-time">{nowLabel}</p>
        </div>
      </header>

      {error ? <p className="inline-alert">{error}</p> : null}

      {displayMotion ? (
        <section className="motion-screen-card sooke-live-card" aria-live="polite">
          <p className="motion-screen-status">{isOutcomeHold ? `Result - ${displayMotion.status}` : displayMotion.status}</p>
          <h2>{displayMotion.title}</h2>
          <p className="motion-screen-body">{displayMotion.body}</p>
          <p className="motion-screen-updated">Updated {new Date(displayMotion.updatedAt).toLocaleTimeString()}</p>
        </section>
      ) : (
        <section className="motion-screen-card motion-screen-empty sooke-live-card">
          <h2>Awaiting Live Motion</h2>
          <p>The clerk has not pushed a motion to screen yet.</p>
        </section>
      )}

      <footer className="motion-screen-footer">
        <Link to="/public">Return to Public Portal</Link>
      </footer>
    </main>
  );
}
