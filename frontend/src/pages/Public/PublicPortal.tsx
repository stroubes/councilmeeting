import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  createPublicSubscription,
  deletePublicSubscription,
  getPublicSummary,
  listPublicPackages,
  listPublicSubscriptions,
  previewPublicSubscription,
  updatePublicSubscription,
} from '../../api/public.api';
import type {
  PublicMeetingPackage,
  PublicSubscriptionPreview,
  PublicSubscriptionRecord,
  PublicSummaryResponse,
} from '../../api/types/public.types';
import type { MeetingRecord } from '../../api/types/meeting.types';
import AppShell from '../../components/layout/AppShell';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toLocalDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function PublicPortal(): JSX.Element {
  const [summary, setSummary] = useState<PublicSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionEmail, setSubscriptionEmail] = useState('');
  const [manageEmail, setManageEmail] = useState('');
  const [topics, setTopics] = useState<string[]>(['MEETINGS', 'AGENDAS']);
  const [frequency, setFrequency] = useState<'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST'>('IMMEDIATE');
  const [keywordInput, setKeywordInput] = useState('');
  const [subscriptions, setSubscriptions] = useState<PublicSubscriptionRecord[]>([]);
  const [preview, setPreview] = useState<PublicSubscriptionPreview | null>(null);
  const [isSavingSubscription, setIsSavingSubscription] = useState(false);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [meetingsView, setMeetingsView] = useState<'list' | 'calendar'>('calendar');
  const [packageQuery, setPackageQuery] = useState('');
  const [packages, setPackages] = useState<PublicMeetingPackage[]>([]);
  const [expandedPackageMeetingId, setExpandedPackageMeetingId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const publicMeetings = summary?.meetings ?? [];

  const meetingsByDay = useMemo(() => {
    const grouped = new Map<string, MeetingRecord[]>();
    for (const meeting of publicMeetings) {
      const key = toLocalDateKey(meeting.startsAt);
      const current = grouped.get(key) ?? [];
      current.push(meeting);
      grouped.set(key, current);
    }

    for (const dayMeetings of grouped.values()) {
      dayMeetings.sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
    }
    return grouped;
  }, [publicMeetings]);

  const monthLabel = useMemo(
    () =>
      calendarMonth.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [calendarMonth],
  );

  const calendarWeeks = useMemo(() => {
    const startOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const endOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const firstGridDay = new Date(startOfMonth);
    firstGridDay.setDate(startOfMonth.getDate() - startOfMonth.getDay());
    const lastGridDay = new Date(endOfMonth);
    lastGridDay.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));

    const weeks: Array<
      Array<{ date: Date; key: string; inCurrentMonth: boolean; meetings: MeetingRecord[] }>
    > = [];
    let cursor = new Date(firstGridDay);

    while (cursor <= lastGridDay) {
      const week: Array<{ date: Date; key: string; inCurrentMonth: boolean; meetings: MeetingRecord[] }> = [];
      for (let index = 0; index < 7; index += 1) {
        const key = toLocalDateKey(cursor);
        week.push({
          date: new Date(cursor),
          key,
          inCurrentMonth: cursor.getMonth() === calendarMonth.getMonth(),
          meetings: meetingsByDay.get(key) ?? [],
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    return weeks;
  }, [calendarMonth, meetingsByDay]);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPublicSummary();
        setSummary(data);
        const packageData = await listPublicPackages();
        setPackages(packageData);
      } catch {
        setError('Could not load public meetings.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const loadSubscriptions = async (email: string): Promise<void> => {
    if (!email.trim()) {
      setSubscriptions([]);
      setPreview(null);
      return;
    }

    setIsLoadingSubscriptions(true);
    setError(null);
    try {
      const records = await listPublicSubscriptions(email.trim());
      setSubscriptions(records);
    } catch {
      setError('Could not load subscriptions for this email address.');
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const handleSearchPackages = async (): Promise<void> => {
    try {
      const packageData = await listPublicPackages(packageQuery || undefined);
      setPackages(packageData);
    } catch {
      setError('Could not search public meeting packages.');
    }
  };

  const handleCreateSubscription = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!subscriptionEmail.trim()) {
      setError('Enter an email address to subscribe.');
      return;
    }
    if (topics.length === 0) {
      setError('Choose at least one topic for the watchlist.');
      return;
    }

    setIsSavingSubscription(true);
    setError(null);
    try {
      const watchKeywords = keywordInput
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      await createPublicSubscription({
        email: subscriptionEmail.trim(),
        topics,
        watchKeywords,
        frequency,
      });

      setManageEmail(subscriptionEmail.trim());
      await loadSubscriptions(subscriptionEmail.trim());
      setKeywordInput('');
    } catch {
      setError('Could not create subscription. Please verify values and try again.');
    } finally {
      setIsSavingSubscription(false);
    }
  };

  const toggleTopic = (topic: string): void => {
    setTopics((current) => {
      if (current.includes(topic)) {
        return current.filter((entry) => entry !== topic);
      }
      return [...current, topic];
    });
  };

  const handlePreview = async (id: string): Promise<void> => {
    setError(null);
    try {
      const data = await previewPublicSubscription(id);
      setPreview(data);
    } catch {
      setError('Could not load subscription preview.');
    }
  };

  const handleToggleActive = async (record: PublicSubscriptionRecord): Promise<void> => {
    setError(null);
    try {
      await updatePublicSubscription(record.id, { isActive: !record.isActive });
      await loadSubscriptions(manageEmail);
    } catch {
      setError('Could not update subscription status.');
    }
  };

  const handleDelete = async (record: PublicSubscriptionRecord): Promise<void> => {
    if (!window.confirm('Remove this public alert subscription?')) {
      return;
    }

    setError(null);
    try {
      await deletePublicSubscription(record.id);
      await loadSubscriptions(manageEmail);
      if (preview?.subscription.id === record.id) {
        setPreview(null);
      }
    } catch {
      setError('Could not remove subscription.');
    }
  };

  return (
    <AppShell
      title="Public Portal"
      subtitle="Citizen-facing publication view for approved and released council materials."
    >
      <section className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">Published Meetings</p>
          <p className="stat-value">{summary?.counts.meetings ?? 0}</p>
          <p className="stat-delta">Live feed from public meetings endpoint</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Published Agendas</p>
          <p className="stat-value">{summary?.counts.agendas ?? 0}</p>
          <p className="stat-delta">Published agenda packages only</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Published Reports</p>
          <p className="stat-value">{summary?.counts.reports ?? 0}</p>
          <p className="stat-delta">Public-safe staff reports</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Published Minutes</p>
          <p className="stat-value">{summary?.counts.minutes ?? 0}</p>
          <p className="stat-delta">Finalized and released minutes</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Public Motions</p>
          <p className="stat-value">{summary?.counts.motions ?? 0}</p>
          <p className="stat-delta">Motion outcomes linked to meetings</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Adopted Resolutions</p>
          <p className="stat-value">{summary?.counts.resolutions ?? 0}</p>
          <p className="stat-delta">Legislative actions and bylaws</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Open Action Items</p>
          <p className="stat-value">{summary?.counts.actions ?? 0}</p>
          <p className="stat-delta">Follow-up commitments currently active</p>
        </article>
      </section>

      <Card>
        <CardHeader
          title="Citizen Watchlist Subscriptions"
          description="Subscribe to topics and keyword watchlists to follow council activity that matters to you."
        />
        <CardBody>
          <form className="form-grid" onSubmit={(event) => void handleCreateSubscription(event)}>
            <div className="form-field">
              <label htmlFor="subscription-email">Email</label>
              <input
                id="subscription-email"
                className="field"
                type="email"
                required
                value={subscriptionEmail}
                onChange={(event) => setSubscriptionEmail(event.target.value)}
                placeholder="resident@example.com"
              />
            </div>
            <div className="form-field">
              <label htmlFor="subscription-frequency">Delivery Frequency</label>
              <select
                id="subscription-frequency"
                className="field"
                value={frequency}
                onChange={(event) =>
                  setFrequency(event.target.value as 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST')
                }
              >
                <option value="IMMEDIATE">Immediate</option>
                <option value="DAILY_DIGEST">Daily Digest</option>
                <option value="WEEKLY_DIGEST">Weekly Digest</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="subscription-keywords">Keywords (comma separated)</label>
              <input
                id="subscription-keywords"
                className="field"
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="zoning, parks, waterfront"
              />
            </div>
            <div className="form-field">
              <label>Topics</label>
              <div className="page-actions" role="group" aria-label="Subscription topics">
                {['MEETINGS', 'AGENDAS', 'REPORTS', 'MINUTES', 'BUDGET'].map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className={`btn ${topics.includes(topic) ? 'btn-primary' : ''}`}
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSavingSubscription}>
                {isSavingSubscription ? 'Subscribing...' : 'Create Watchlist'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: '1rem' }}>
            <Card>
              <CardHeader
                title="Manage Existing Subscriptions"
                description="Enter an email address to view and manage existing watchlists."
                actions={
                  <>
                    <input
                      className="field"
                      type="email"
                      value={manageEmail}
                      onChange={(event) => setManageEmail(event.target.value)}
                      placeholder="resident@example.com"
                    />
                    <button type="button" className="btn" onClick={() => void loadSubscriptions(manageEmail)}>
                      Load
                    </button>
                  </>
                }
              />
              <CardBody>
                {isLoadingSubscriptions ? <p className="muted">Loading subscriptions...</p> : null}
                {!isLoadingSubscriptions && manageEmail.trim() && subscriptions.length === 0 ? (
                  <div className="empty-state">No subscriptions found for this email.</div>
                ) : null}

                {subscriptions.length > 0 ? (
                  <div className="table-wrap">
                    <table className="data-table" aria-label="Public subscriptions">
                      <thead>
                        <tr>
                          <th>Topics</th>
                          <th>Keywords</th>
                          <th>Frequency</th>
                          <th>Active</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((record) => (
                          <tr key={record.id}>
                            <td>{record.topics.join(', ')}</td>
                            <td>{record.watchKeywords.join(', ') || 'All published items'}</td>
                            <td>{record.frequency}</td>
                            <td>{record.isActive ? 'Yes' : 'No'}</td>
                            <td>
                              <div className="page-actions">
                                <button type="button" className="btn btn-quiet" onClick={() => void handlePreview(record.id)}>
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => void handleToggleActive(record)}
                                >
                                  {record.isActive ? 'Pause' : 'Resume'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  onClick={() => void handleDelete(record)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {preview ? (
                  <div style={{ marginTop: '1rem' }}>
                    <Card>
                      <CardHeader
                        title="Subscription Preview"
                        description="Recent public items matching this watchlist."
                      />
                      <CardBody>
                        {preview.matches.length === 0 ? (
                          <div className="empty-state">No matching public items for current keywords/topics yet.</div>
                        ) : (
                          <div className="table-wrap">
                            <table className="data-table" aria-label="Subscription preview">
                              <thead>
                                <tr>
                                  <th>Topic</th>
                                  <th>Title</th>
                                  <th>Source</th>
                                </tr>
                              </thead>
                              <tbody>
                                {preview.matches.map((match) => (
                                  <tr key={`${match.source}:${match.id}`}>
                                    <td>{match.topic}</td>
                                    <td>{match.title}</td>
                                    <td>{match.source}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Public Experience"
          description="Showcases published meetings, agendas, minutes, and supporting documents."
          actions={
            <>
              <button
                type="button"
                className={`btn ${meetingsView === 'calendar' ? 'btn-primary' : 'btn-quiet'}`}
                onClick={() => setMeetingsView('calendar')}
              >
                Calendar View
              </button>
              <button
                type="button"
                className={`btn ${meetingsView === 'list' ? 'btn-primary' : 'btn-quiet'}`}
                onClick={() => setMeetingsView('list')}
              >
                List View
              </button>
            </>
          }
        />
        <CardBody>
          {isLoading ? <p className="muted">Loading public meetings...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && (summary?.meetings.length ?? 0) === 0 ? (
            <div className="empty-state">No public meetings are available yet.</div>
          ) : null}

          {(summary?.meetings.length ?? 0) > 0 && meetingsView === 'calendar' ? (
            <>
              <div className="meeting-calendar-toolbar" style={{ marginBottom: '0.8rem' }}>
                <div className="meeting-calendar-toolbar-left">
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() =>
                      setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                    }
                  >
                    Previous Month
                  </button>
                </div>
                <div className="meeting-calendar-toolbar-center">
                  <p className="meeting-calendar-kicker">Public Meetings Calendar</p>
                  <h3 className="meeting-calendar-title">{monthLabel}</h3>
                </div>
                <div className="meeting-calendar-toolbar-right">
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => {
                      const now = new Date();
                      setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() =>
                      setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                    }
                  >
                    Next Month
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table meetings-calendar-table" aria-label="Public meetings calendar">
                  <thead>
                    <tr>
                      <th>Sun</th>
                      <th>Mon</th>
                      <th>Tue</th>
                      <th>Wed</th>
                      <th>Thu</th>
                      <th>Fri</th>
                      <th>Sat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendarWeeks.map((week) => (
                      <tr key={week.map((day) => day.key).join('|')}>
                        {week.map((day) => (
                          <td
                            key={day.key}
                            className={`meetings-calendar-day-cell ${day.inCurrentMonth ? '' : 'meetings-calendar-day-outside'}`}
                          >
                            <span
                              className={`meetings-calendar-day-number ${
                                day.inCurrentMonth ? '' : 'meetings-calendar-day-number-outside'
                              }`}
                            >
                              {day.date.getDate()}
                            </span>
                            {day.meetings.length > 0 ? (
                              <div className="meetings-calendar-day-list">
                                {day.meetings.map((meeting) => (
                                  <article key={meeting.id} className="meetings-calendar-item">
                                    <strong>{meeting.title}</strong>
                                    <p className="meetings-calendar-item-meta">{formatTime(meeting.startsAt)}</p>
                                    <p className="meetings-calendar-item-meta">{meeting.location ?? 'Location TBD'}</p>
                                  </article>
                                ))}
                              </div>
                            ) : (
                              <p className="muted meetings-calendar-empty">No meetings</p>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {(summary?.meetings.length ?? 0) > 0 && meetingsView === 'list' ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="Public meetings">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Status</th>
                    <th>Start Time</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary?.meetings ?? []).map((meeting: MeetingRecord) => (
                    <tr key={meeting.id}>
                      <td>
                        <strong>{meeting.title}</strong>
                        <div className="muted">{meeting.meetingTypeCode}</div>
                      </td>
                      <td>
                        <StatusBadge status={meeting.status} />
                      </td>
                      <td>{formatDateTime(meeting.startsAt)}</td>
                      <td>{meeting.location ?? 'Not specified'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {(summary?.agendas.length ?? 0) > 0 ? (
            <>
              <h3>Published Agendas</h3>
              <div className="table-wrap">
                <table className="data-table" aria-label="Public agendas">
                  <thead>
                    <tr>
                      <th>Agenda</th>
                      <th>Status</th>
                      <th>Items</th>
                      <th>Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.agendas.map((agenda) => (
                      <tr key={agenda.id}>
                        <td>{agenda.title}</td>
                        <td>
                          <StatusBadge status={agenda.status} />
                        </td>
                        <td>{agenda.items.length}</td>
                        <td>
                          <Link className="btn btn-quiet" to={`/public/agendas/${agenda.id}`}>
                            Open Agenda
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {(summary?.reports.length ?? 0) > 0 ? (
            <>
              <h3>Published Reports</h3>
              <div className="table-wrap">
                <table className="data-table" aria-label="Public reports">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.reports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.title}</td>
                        <td>
                          <StatusBadge status={report.workflowStatus} />
                        </td>
                        <td>{report.department ?? 'General Administration'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {(summary?.minutes.length ?? 0) > 0 ? (
            <>
              <h3>Published Minutes</h3>
              <div className="table-wrap">
                <table className="data-table" aria-label="Public minutes">
                  <thead>
                    <tr>
                      <th>Meeting ID</th>
                      <th>Status</th>
                      <th>Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.minutes.map((record) => (
                      <tr key={record.id}>
                        <td>{record.meetingId.slice(0, 8)}</td>
                        <td>
                          <StatusBadge status={record.status} />
                        </td>
                        <td>{record.publishedAt ? new Date(record.publishedAt).toLocaleString() : 'Not published'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {(summary?.motions.length ?? 0) > 0 ? (
            <>
              <h3>Public Motions</h3>
              <div className="table-wrap">
                <table className="data-table" aria-label="Public motions">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Result Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.motions.map((motion) => (
                      <tr key={motion.id}>
                        <td>{motion.title}</td>
                        <td><StatusBadge status={motion.status} /></td>
                        <td>{motion.resultNote ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {(summary?.resolutions.length ?? 0) > 0 ? (
            <>
              <h3>Adopted Resolutions</h3>
              <div className="table-wrap">
                <table className="data-table" aria-label="Public resolutions">
                  <thead>
                    <tr>
                      <th>Resolution #</th>
                      <th>Title</th>
                      <th>Vote</th>
                      <th>Bylaw #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.resolutions.map((resolution) => (
                      <tr key={resolution.id}>
                        <td>{resolution.resolutionNumber}</td>
                        <td>{resolution.title}</td>
                        <td>{`${resolution.voteFor}-${resolution.voteAgainst}-${resolution.voteAbstain}`}</td>
                        <td>{resolution.bylawNumber ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {(summary?.actions.length ?? 0) > 0 ? (
            <>
              <h3>Open Action Items</h3>
              <div className="table-wrap">
                <table className="data-table" aria-label="Public action items">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.actions.map((action) => (
                      <tr key={action.id}>
                        <td>{action.title}</td>
                        <td>{action.priority}</td>
                        <td>{action.status}</td>
                        <td>{action.dueDate ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          <h3>Meeting Packages</h3>
          <div className="workspace-toolbar-row" style={{ marginBottom: '0.65rem' }}>
            <input
              className="field"
              value={packageQuery}
              onChange={(event) => setPackageQuery(event.target.value)}
              placeholder="Search package by meeting, report, or resolution"
            />
            <button type="button" className="btn" onClick={() => void handleSearchPackages()}>
              Search Packages
            </button>
          </div>
          {packages.length === 0 ? (
            <div className="empty-state">No public packages available.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table" aria-label="Public meeting packages">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Agenda</th>
                    <th>Reports</th>
                    <th>Minutes</th>
                    <th>Motions</th>
                    <th>Resolutions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((record) => (
                    <tr key={record.meetingId}>
                      <td>
                        {record.meetingTitle}
                        <div>
                          <button
                            type="button"
                            className="btn btn-quiet"
                            onClick={() =>
                              setExpandedPackageMeetingId((current) =>
                                current === record.meetingId ? null : record.meetingId,
                              )
                            }
                          >
                            {expandedPackageMeetingId === record.meetingId ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>
                      </td>
                      <td>{record.agenda?.title ?? 'Not published'}</td>
                      <td>{record.reports.length}</td>
                      <td>{record.minutes ? 'Published' : 'None'}</td>
                      <td>{record.motions.length}</td>
                      <td>{record.resolutions.length}</td>
                    </tr>
                  ))}
                  {packages
                    .filter((record) => expandedPackageMeetingId === record.meetingId)
                    .map((record) => (
                      <tr key={`${record.meetingId}:details`}>
                        <td>
                          <div className="muted">Reports: {record.reports.map((report) => report.title).join(', ') || 'None'}</div>
                          <div className="muted">Motions: {record.motions.map((motion) => motion.title).join(', ') || 'None'}</div>
                          <div className="muted">
                            Resolutions: {record.resolutions.map((resolution) => resolution.resolutionNumber).join(', ') || 'None'}
                          </div>
                        </td>
                        <td colSpan={5}></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </AppShell>
  );
}
