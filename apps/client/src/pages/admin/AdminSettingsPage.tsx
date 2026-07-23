import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../features/auth/authStore';
import { AdminShell, SuperAdminGate } from './AdminShell';

type Settings = Awaited<ReturnType<typeof api.adminSettings>>['settings'];

export function AdminSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categoriesText, setCategoriesText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    setLoading(true);
    void api
      .adminSettings()
      .then((r) => {
        setSettings(r.settings);
        setCategoriesText(r.settings.categories.join('\n'));
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load settings');
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const categories = categoriesText
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean);
      const result = await api.updateAdminSettings({
        heroHeadline: settings.heroHeadline,
        heroSubheadline: settings.heroSubheadline,
        categories,
        featureFlags: settings.featureFlags,
      });
      setSettings(result.settings as Settings);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SuperAdminGate>
      <AdminShell
        title="Platform settings"
        subtitle="Homepage copy, discovery categories, and feature toggles."
        error={error}
      >
        {loading || !settings ? (
          <p className="text-sm text-mute">Loading settings…</p>
        ) : (
          <div className="max-w-xl space-y-5">
            <label className="block">
              <span className="sv-filter-label">Hero headline</span>
              <input
                className="sv-input"
                value={settings.heroHeadline}
                onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="sv-filter-label">Hero subheadline</span>
              <textarea
                className="sv-input min-h-[5rem]"
                value={settings.heroSubheadline}
                onChange={(e) => setSettings({ ...settings, heroSubheadline: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="sv-filter-label">Categories (one per line)</span>
              <textarea
                className="sv-input min-h-[8rem] font-mono text-sm"
                value={categoriesText}
                onChange={(e) => setCategoriesText(e.target.value)}
              />
            </label>

            <div className="space-y-3 rounded-md border border-line bg-chalk p-4">
              <p className="text-sm font-bold text-ink">Feature flags</p>
              {(
                [
                  ['registrationsOpen', 'Student registrations'],
                  ['institutionSignupsOpen', 'Institution sign-ups'],
                  ['featuredListingsEnabled', 'Featured listing purchases'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-3 text-sm">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={settings.featureFlags[key]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        featureFlags: { ...settings.featureFlags, [key]: e.target.checked },
                      })
                    }
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="sv-btn-primary"
                disabled={saving}
                onClick={() => void save()}
              >
                {saving ? 'Saving…' : 'Save settings'}
              </button>
              {saved ? <span className="text-sm font-semibold text-teal">Saved</span> : null}
            </div>
          </div>
        )}
      </AdminShell>
    </SuperAdminGate>
  );
}
