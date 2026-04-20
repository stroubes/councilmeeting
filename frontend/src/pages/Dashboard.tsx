import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/types';
import { useAuth } from '../hooks/useAuth';
import { listAgendas } from '../api/agendas.api';
import { listMeetings } from '../api/meetings.api';
import { listReports } from '../api/reports.api';
import { getCaoQueue, getDirectorQueue } from '../api/workflows.api';
import { listMinutes } from '../api/minutes.api';
import { getPublicSummary } from '../api/public.api';
import type { AgendaRecord } from '../api/types/agenda.types';
import type { MeetingRecord } from '../api/types/meeting.types';
import type { StaffReportRecord } from '../api/types/report.types';

const CIVIC = {
  primary: '#1e3a5f',
  accent: '#c8922a',
  muted: '#7a8da8',
  success: '#3dac87',
  danger: '#d95050',
  ink: '#1a2535',
  subtle: '#f7f9fc',
  purple: '#7b6fc5',
};

const MONTH_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

interface StatConfig {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: IconName;
}

function Card({
  children,
  padding = 24,
  style,
}: {
  children: React.ReactNode;
  padding?: number;
  style?: React.CSSProperties;
}): JSX.Element {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 2px 16px rgba(0,0,0,0.055)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function userGreeting(name: string): string {
  return `${greeting()}, ${name}`;
}

function formatMeetingTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function toDayMonth(iso: string): { day: number; month: string } {
  const date = new Date(iso);
  return { day: date.getDate(), month: MONTH_SHORT[date.getMonth()] };
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Dashboard(): JSX.Element {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [agendas, setAgendas] = useState<AgendaRecord[]>([]);
  const [reports, setReports] = useState<StaffReportRecord[]>([]);
  const [directorQueueCount, setDirectorQueueCount] = useState(0);
  const [caoQueueCount, setCaoQueueCount] = useState(0);
  const [minutesPublishedCount, setMinutesPublishedCount] = useState(0);
  const [minutesTotalCount, setMinutesTotalCount] = useState(0);
  const [publicReleaseCount, setPublicReleaseCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const [meetingData, agendaData, reportData, directorQueue, caoQueue, minutesData, publicSummary] = await Promise.all([
          listMeetings(),
          listAgendas(),
          listReports(),
          getDirectorQueue(),
          getCaoQueue(),
          listMinutes(),
          getPublicSummary(),
        ]);
        setMeetings(meetingData);
        setAgendas(agendaData);
        setReports(reportData);
        setDirectorQueueCount(directorQueue.length);
        setCaoQueueCount(caoQueue.length);
        setMinutesTotalCount(minutesData.length);
        setMinutesPublishedCount(minutesData.filter((m) => m.status === 'PUBLISHED').length);
        setPublicReleaseCount(
          publicSummary.counts.meetings +
            publicSummary.counts.agendas +
            publicSummary.counts.reports +
            publicSummary.counts.minutes,
        );
      } catch {
        setError('Could not load dashboard metrics.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const now = useMemo(() => new Date(), []);
  const sortedMeetings = useMemo(
    () => [...meetings].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [meetings],
  );
  const liveMeeting = useMemo(
    () => sortedMeetings.find((m) => m.status === 'IN_PROGRESS') ?? null,
    [sortedMeetings],
  );
  const todayMeeting = useMemo(
    () => sortedMeetings.find((m) => isSameDay(new Date(m.startsAt), now)) ?? null,
    [sortedMeetings, now],
  );
  const upcomingMeetings = useMemo(
    () => sortedMeetings.filter((m) => new Date(m.startsAt).getTime() >= now.getTime() - 2 * 60 * 60 * 1000).slice(0, 3),
    [sortedMeetings, now],
  );
  const featuredMeeting = liveMeeting ?? todayMeeting ?? upcomingMeetings[0] ?? null;

  const publishedAgendas = agendas.filter((a) => a.status === 'PUBLISHED').length;
  const publishedReports = reports.filter((r) => r.workflowStatus === 'PUBLISHED').length;
  const approvalPressure = directorQueueCount + caoQueueCount;

  const todayLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const featuredStatusLabel = liveMeeting
    ? `${liveMeeting.title} currently in session`
    : featuredMeeting
      ? `Next: ${featuredMeeting.title}`
      : 'No meetings scheduled';

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'there';

  const stats: StatConfig[] = [
    {
      label: "Today's Meeting",
      value: featuredMeeting ? formatMeetingTime(featuredMeeting.startsAt) : '—',
      sub: featuredMeeting?.title ?? 'No meeting today',
      color: CIVIC.primary,
      icon: 'calendar',
    },
    {
      label: 'Agenda Packages',
      value: agendas.length,
      sub: `${publishedAgendas} published`,
      color: CIVIC.accent,
      icon: 'file-text',
    },
    {
      label: 'Reports in Workflow',
      value: reports.length,
      sub: `${publishedReports} published`,
      color: CIVIC.success,
      icon: 'file-text',
    },
    {
      label: 'Pending Approvals',
      value: approvalPressure,
      sub: `Director ${directorQueueCount} · CAO ${caoQueueCount}`,
      color: CIVIC.purple,
      icon: 'check-circle',
    },
  ];

  const progressPercent = 28;

  return (
    <AppShell title={userGreeting(displayName)} subtitle={`${todayLabel}  ·  ${featuredStatusLabel}`}>
      {isLoading ? (
        <p style={{ color: CIVIC.muted, fontSize: 13, marginBottom: 14 }}>Loading dashboard metrics…</p>
      ) : null}
      {error ? (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            background: '#fff1f0',
            color: CIVIC.danger,
            borderRadius: 12,
            marginBottom: 14,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 14,
          marginBottom: 16,
        }}
      >
        {stats.map((stat) => (
          <Card key={stat.label} padding={20}>
            <div
              aria-hidden="true"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: `${stat.color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Icon name={stat.icon} size={19} color={stat.color} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: CIVIC.ink, lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: CIVIC.muted, marginTop: 5 }}>{stat.label}</div>
            <div style={{ fontSize: 11.5, color: stat.color, marginTop: 3, fontWeight: 600 }}>
              {stat.sub}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 14 }}>
        <Card>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: CIVIC.primary }}>Upcoming Meetings</div>
            <Link
              to="/meetings"
              style={{ fontSize: 12, fontWeight: 600, color: CIVIC.primary, textDecoration: 'none' }}
            >
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcomingMeetings.length === 0 ? (
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  color: CIVIC.muted,
                  fontSize: 13,
                  background: CIVIC.subtle,
                  borderRadius: 14,
                }}
              >
                No upcoming meetings scheduled.
              </div>
            ) : (
              upcomingMeetings.map((meeting) => {
                const isLive = meeting.status === 'IN_PROGRESS';
                const { day, month } = toDayMonth(meeting.startsAt);
                return (
                  <Link
                    key={meeting.id}
                    to={`/meetings/${meeting.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 16px',
                      borderRadius: 14,
                      background: isLive ? CIVIC.primary : CIVIC.subtle,
                      textDecoration: 'none',
                      border: isLive ? 'none' : '1px solid #eef0f4',
                      transition: 'all 0.13s',
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        flexShrink: 0,
                        background: isLive ? 'rgba(255,255,255,0.14)' : `${CIVIC.primary}12`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          color: isLive ? '#fff' : CIVIC.primary,
                          lineHeight: 1,
                        }}
                      >
                        {day}
                      </div>
                      <div
                        style={{
                          fontSize: 9.5,
                          fontWeight: 600,
                          color: isLive ? 'rgba(255,255,255,0.65)' : CIVIC.muted,
                          marginTop: 2,
                        }}
                      >
                        {month}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isLive ? '#fff' : CIVIC.primary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {meeting.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: isLive ? 'rgba(255,255,255,0.6)' : CIVIC.muted,
                          marginTop: 2,
                        }}
                      >
                        {formatMeetingTime(meeting.startsAt)}
                        {meeting.location ? ` · ${meeting.location}` : ''}
                      </div>
                    </div>
                    {isLive ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: 20,
                          background: CIVIC.danger,
                          color: '#fff',
                          animation: 'civic-pulse 2s infinite',
                        }}
                      >
                        LIVE
                      </span>
                    ) : null}
                    <Icon
                      name="chevron-right"
                      size={16}
                      color={isLive ? 'rgba(255,255,255,0.5)' : CIVIC.muted}
                    />
                  </Link>
                );
              })
            )}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card padding={20}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: liveMeeting ? CIVIC.danger : CIVIC.muted,
                  animation: liveMeeting ? 'civic-live-dot 1.5s infinite' : 'none',
                }}
              />
              <div style={{ fontSize: 13.5, fontWeight: 600, color: CIVIC.primary }}>
                {liveMeeting ? 'Session in Progress' : 'No Live Session'}
              </div>
            </div>
            {liveMeeting ? (
              <>
                <div style={{ fontSize: 11.5, color: CIVIC.muted, marginBottom: 5 }}>Current meeting</div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: CIVIC.primary,
                    marginBottom: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {liveMeeting.title}
                </div>
                <div style={{ height: 5, borderRadius: 4, background: '#f0f2f6', marginBottom: 6 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      borderRadius: 4,
                      background: CIVIC.accent,
                      transition: 'width 1s',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11.5, color: CIVIC.muted }}>
                    Started {formatMeetingTime(liveMeeting.startsAt)}
                  </span>
                  <span style={{ fontSize: 11.5, color: CIVIC.muted }}>
                    {progressPercent}% estimated
                  </span>
                </div>
                <Link
                  to="/motions"
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: 14,
                    padding: 10,
                    borderRadius: 12,
                    background: CIVIC.primary,
                    color: '#fff',
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Join Live Session →
                </Link>
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: CIVIC.muted, lineHeight: 1.5 }}>
                No meeting is currently in session. When a meeting starts, its live controls will appear
                here.
              </div>
            )}
          </Card>

          <Card padding={20}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: CIVIC.primary, marginBottom: 14 }}>
              Workflow at a Glance
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <WorkflowRow label="Public Releases" value={publicReleaseCount} href="/public" />
              <WorkflowRow
                label="Minutes Published"
                value={`${minutesPublishedCount} / ${minutesTotalCount}`}
                href="/minutes"
              />
              <WorkflowRow label="My Approvals" value={null} href="/approvals/my" isLink />
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function WorkflowRow({
  label,
  value,
  href,
  isLink = false,
}: {
  label: string;
  value: string | number | null;
  href: string;
  isLink?: boolean;
}): JSX.Element {
  return (
    <Link
      to={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: 10,
        background: CIVIC.subtle,
        textDecoration: 'none',
        color: CIVIC.primary,
        fontSize: 12.5,
        fontWeight: 600,
      }}
    >
      <span>{label}</span>
      {isLink ? (
        <span style={{ color: CIVIC.accent, fontSize: 12 }}>Open →</span>
      ) : (
        <span style={{ color: CIVIC.ink, fontWeight: 700 }}>{value}</span>
      )}
    </Link>
  );
}
