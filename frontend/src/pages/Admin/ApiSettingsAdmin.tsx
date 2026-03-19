import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  deleteApiSetting,
  getApiRuntimeMetadata,
  listApiSettings,
  upsertApiSetting,
} from '../../api/apiSettings.api';
import {
  getGovernanceActiveProfile,
  listGovernanceProfiles,
  setGovernanceActiveProfile,
  type MunicipalProfileRecord,
} from '../../api/governance.api';
import type { ApiRuntimeMetadata, ApiSettingRecord } from '../../api/types/api-settings.types';
import AppShell from '../../components/layout/AppShell';
import { useToast } from '../../hooks/useToast';

export default function ApiSettingsAdmin(): JSX.Element {
  const [settings, setSettings] = useState<ApiSettingRecord[]>([]);
  const [runtimeMetadata, setRuntimeMetadata] = useState<ApiRuntimeMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<MunicipalProfileRecord[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<MunicipalProfileRecord['id']>('BC_BASELINE');
  const { addToast } = useToast();

  const [form, setForm] = useState({
    key: '',
    label: '',
    category: 'INTEGRATIONS',
    value: '',
    isSecret: false,
  });

  const load = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [settingData, metadata, availableProfiles, activeProfile] = await Promise.all([
        listApiSettings(),
        getApiRuntimeMetadata(),
        listGovernanceProfiles(),
        getGovernanceActiveProfile(),
      ]);
      setSettings(settingData);
      setRuntimeMetadata(metadata);
      setProfiles(availableProfiles);
      setActiveProfileId(activeProfile.id);
    } catch {
      setError('Could not load API settings.');
      addToast('Could not load API settings.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const configuredIntegrationCount = useMemo(
    () => runtimeMetadata?.integrations.filter((entry) => entry.configured).length ?? 0,
    [runtimeMetadata],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await upsertApiSetting({
        key: form.key.trim(),
        label: form.label.trim(),
        category: form.category.trim() || undefined,
        value: form.value,
        isSecret: form.isSecret,
      });
      setForm({ key: '', label: '', category: 'INTEGRATIONS', value: '', isSecret: false });
      await load();
      addToast('API setting saved.', 'success');
    } catch {
      setError('Could not save API setting.');
      addToast('Could not save API setting.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (record: ApiSettingRecord): Promise<void> => {
    if (!window.confirm(`Delete API setting "${record.label}"?`)) {
      return;
    }

    setDeletingId(record.id);
    setError(null);
    try {
      await deleteApiSetting(record.id);
      await load();
      addToast('API setting deleted.', 'success');
    } catch {
      setError('Could not delete API setting.');
      addToast('Could not delete API setting.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetActiveProfile = async (): Promise<void> => {
    setIsSavingProfile(true);
    setError(null);
    try {
      const profile = await setGovernanceActiveProfile(activeProfileId);
      await load();
      addToast(`Active municipal profile set to ${profile.displayName}.`, 'success');
    } catch {
      setError('Could not update active municipal profile.');
      addToast('Could not update active municipal profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <AppShell
      title="API Settings"
      subtitle="Manage integration and security settings for external municipal systems."
      workspaceVariant="admin"
    >
      <section className="module-overview">
        <article className="metric-tile metric-tile-primary">
          <p className="metric-label">Stored Settings</p>
          <p className="metric-value">{settings.length}</p>
          <p className="metric-foot">Admin-managed runtime configuration entries</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Configured Integrations</p>
          <p className="metric-value">{configuredIntegrationCount}</p>
          <p className="metric-foot">Detected from runtime environment metadata</p>
        </article>
        <article className="metric-tile">
          <p className="metric-label">Policy Profile</p>
          <p className="metric-value">{runtimeMetadata?.profileId ?? 'BC_BASELINE'}</p>
          <p className="metric-foot">Active municipal baseline profile id</p>
        </article>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>
              <span className="panel-icon">POL</span>
              Municipal Policy Profile
            </h2>
            <p>Switch active jurisdiction baseline profile without requiring backend environment file edits.</p>
          </div>
        </header>
        <div className="card-body">
          <div className="page-actions">
            <select
              className="field"
              value={activeProfileId}
              onChange={(event) => setActiveProfileId(event.target.value as MunicipalProfileRecord['id'])}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.displayName} ({profile.jurisdiction})
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" disabled={isSavingProfile} onClick={() => void handleSetActiveProfile()}>
              {isSavingProfile ? 'Applying...' : 'Set Active Profile'}
            </button>
          </div>
          <p className="muted">Profile changes immediately affect readiness rules and policy-pack responses.</p>
        </div>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>
              <span className="panel-icon">API</span>
              Integration Settings
            </h2>
            <p>Store and review integration settings with secure value masking for secret entries.</p>
          </div>
        </header>
        <div className="card-body">
          <form onSubmit={(event) => void handleSubmit(event)} className="form-grid">
            <div className="form-field">
              <label htmlFor="api-setting-key">Key</label>
              <input
                id="api-setting-key"
                className="field"
                required
                value={form.key}
                onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
                placeholder="SHAREPOINT_WEBHOOK_URL"
              />
            </div>
            <div className="form-field">
              <label htmlFor="api-setting-label">Label</label>
              <input
                id="api-setting-label"
                className="field"
                required
                value={form.label}
                onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                placeholder="SharePoint Webhook URL"
              />
            </div>
            <div className="form-field">
              <label htmlFor="api-setting-category">Category</label>
              <input
                id="api-setting-category"
                className="field"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="INTEGRATIONS"
              />
            </div>
            <div className="form-field">
              <label htmlFor="api-setting-value">Value</label>
              <input
                id="api-setting-value"
                className="field"
                required
                value={form.value}
                onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="form-field">
              <label htmlFor="api-setting-secret">Secret</label>
              <select
                id="api-setting-secret"
                className="field"
                value={form.isSecret ? 'YES' : 'NO'}
                onChange={(event) => setForm((current) => ({ ...current, isSecret: event.target.value === 'YES' }))}
              >
                <option value="NO">No</option>
                <option value="YES">Yes</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Setting'}
              </button>
            </div>
          </form>

          {isLoading ? <p className="muted">Loading API settings...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}

          {!isLoading && settings.length === 0 ? (
            <div className="empty-state">No API settings saved yet.</div>
          ) : null}

          {settings.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="API settings register">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Key</th>
                    <th>Category</th>
                    <th>Value</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map((record) => (
                    <tr key={record.id}>
                      <td>{record.label}</td>
                      <td>{record.key}</td>
                      <td>{record.category ?? '-'}</td>
                      <td>{record.hasValue ? record.valuePreview : '(empty)'}</td>
                      <td>{new Date(record.updatedAt).toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger"
                          disabled={deletingId === record.id}
                          onClick={() => void handleDelete(record)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="card" style={{ marginTop: '1rem' }}>
            <header className="card-header">
              <div>
                <h3>Runtime Metadata Snapshot</h3>
                <p>Visibility-only environment metadata. Secrets are never returned.</p>
              </div>
            </header>
            <div className="card-body">
              {runtimeMetadata ? (
                <div className="table-wrap">
                  <table className="data-table" aria-label="Runtime integration metadata">
                    <thead>
                      <tr>
                        <th>Integration Key</th>
                        <th>Configured</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runtimeMetadata.integrations.map((entry) => (
                        <tr key={entry.key}>
                          <td>{entry.key}</td>
                          <td>{entry.configured ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
