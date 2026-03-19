import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  createPublicSubscription,
  deletePublicSubscription,
  getPublicSummary,
  listPublicSubscriptions,
  previewPublicSubscription,
  updatePublicSubscription,
} from '../../api/public.api';
import type {
  PublicSubscriptionPreview,
  PublicSubscriptionRecord,
  PublicSummaryResponse,
} from '../../api/types/public.types';
import type { MeetingRecord } from '../../api/types/meeting.types';
import AppShell from '../../components/layout/AppShell';
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

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPublicSummary();
        setSummary(data);
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
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Citizen Watchlist Subscriptions</h2>
            <p>Subscribe to topics and keyword watchlists to follow council activity that matters to you.</p>
          </div>
        </header>
        <div className="card-body">
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

          <div className="card" style={{ marginTop: '1rem' }}>
            <header className="card-header">
              <div>
                <h3>Manage Existing Subscriptions</h3>
                <p>Enter an email address to view and manage existing watchlists.</p>
              </div>
              <div className="card-header-meta page-actions">
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
              </div>
            </header>
            <div className="card-body">
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
                <div className="card" style={{ marginTop: '1rem' }}>
                  <header className="card-header">
                    <div>
                      <h3>Subscription Preview</h3>
                      <p>Recent public items matching this watchlist.</p>
                    </div>
                  </header>
                  <div className="card-body">
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
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Public Experience</h2>
            <p>Showcases published meetings, agendas, minutes, and supporting documents.</p>
          </div>
        </header>
        <div className="card-body">
          {isLoading ? <p className="muted">Loading public meetings...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && (summary?.meetings.length ?? 0) === 0 ? (
            <div className="empty-state">No public meetings are available yet.</div>
          ) : null}
          {(summary?.meetings.length ?? 0) > 0 ? (
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
        </div>
      </section>
    </AppShell>
  );
}
