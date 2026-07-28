import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MarketplaceShell } from '../components/AppShell';
import { useAuthStore } from '../features/auth/authStore';
import { api, ApiError } from '../lib/api';

export function ProfileSettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.me();
        if (cancelled) return;
        setName(data.user.name);
        setEmail(data.user.email);
        setPhone(data.user.phone ?? '');
        updateUser(data.user);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Could not load profile');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, navigate, updateUser]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const data = await api.updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      updateUser(data.user);
      setName(data.user.name);
      setEmail(data.user.email);
      setPhone(data.user.phone ?? '');
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  if (!user && !loading) {
    return (
      <MarketplaceShell title="Profile">
        <p className="text-mute">Please sign in to edit your profile.</p>
        <Link to="/login" className="sv-btn-primary mt-4 inline-flex">
          Log in
        </Link>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell
      title="Profile settings"
      subtitle="Update your display name, email, and mobile number."
    >
      <div className="mx-auto max-w-lg">
        <form
          onSubmit={onSubmit}
          className="sv-ticket space-y-5 rounded-md border border-line bg-paper p-6 shadow-card"
        >
          {loading ? (
            <p className="text-sm text-mute">Loading profile…</p>
          ) : (
            <>
              <label className="block text-sm font-semibold text-ink">
                Display name
                <input
                  className="sv-input mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                />
              </label>

              <label className="block text-sm font-semibold text-ink">
                Email
                <input
                  className="sv-input mt-1.5"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>

              <label className="block text-sm font-semibold text-ink">
                Mobile number
                <input
                  className="sv-input mt-1.5"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  autoComplete="tel"
                  inputMode="tel"
                />
                <span className="mt-1 block text-xs font-normal text-mute">
                  Used for enquiries and institution follow-ups.
                </span>
              </label>

              {user ? (
                <p className="rounded-lg bg-chalk px-3 py-2 text-xs text-mute">
                  Signed in as <strong className="text-ink">{user.role.replace('_', ' ')}</strong>
                </p>
              ) : null}

              {error ? (
                <p className="rounded-lg bg-spark-soft px-3 py-2 text-sm font-semibold text-[#b45309]" role="alert">
                  {error}
                </p>
              ) : null}

              {saved ? (
                <p className="rounded-lg bg-teal-soft px-3 py-2 text-sm font-semibold text-teal" role="status">
                  Profile saved.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-1">
                <button type="submit" disabled={saving} className="sv-btn-primary disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <Link to="/" className="sv-btn-ghost">
                  Back to home
                </Link>
              </div>
            </>
          )}
        </form>
      </div>
    </MarketplaceShell>
  );
}
