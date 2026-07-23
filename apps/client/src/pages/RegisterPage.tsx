import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';
import { getRoleHomePath } from '../features/auth/roleHome';
import { track } from '../lib/analytics';
import { AuthLayout } from '../components/AuthLayout';

type RoleTab = 'student' | 'institution';

export function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const initialRole = useMemo<RoleTab>(
    () => (params.get('role') === 'institution' ? 'institution' : 'student'),
    [params],
  );
  const [role, setRole] = useState<RoleTab>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      if (role === 'student') {
        const data = await api.registerStudent({
          name: String(form.get('name') ?? ''),
          email: String(form.get('email') ?? ''),
          phone: String(form.get('phone') ?? '') || undefined,
          password: String(form.get('password') ?? ''),
          city: String(form.get('city') ?? '') || undefined,
        });
        setSession(data.user, data.accessToken);
        track('sign_up', { role: 'student' });
        navigate(getRoleHomePath(data.user.role));
        return;
      } else {
        const data = await api.registerInstitution({
          name: String(form.get('name') ?? ''),
          email: String(form.get('email') ?? ''),
          phone: String(form.get('phone') ?? '') || undefined,
          password: String(form.get('password') ?? ''),
          institutionName: String(form.get('institutionName') ?? ''),
          institutionType: String(form.get('institutionType') ?? 'training-institute'),
          city: String(form.get('city') ?? ''),
          state: String(form.get('state') ?? ''),
          website: String(form.get('website') ?? '') || undefined,
        });
        setSession(data.user, data.accessToken);
        track('sign_up', { role: 'institution' });
        navigate(getRoleHomePath(data.user.role));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        role === 'student'
          ? 'Save programs, enquire in one click, and track every reply.'
          : 'Publish listings, manage leads, and reach students searching for your next cohort.'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link className="font-semibold text-[#0d7a6f] hover:underline" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <div
        className="sv-auth-tabs mb-5 grid grid-cols-2 gap-1 rounded-xl border border-[#d5e0dc] bg-[#eef3f1] p-1"
        role="tablist"
        aria-label="Account type"
      >
        <button
          type="button"
          role="tab"
          aria-selected={role === 'student'}
          className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
            role === 'student'
              ? 'bg-white text-[#102a28] shadow-sm'
              : 'text-[#5a736c] hover:text-[#102a28]'
          }`}
          onClick={() => setRole('student')}
        >
          Student
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === 'institution'}
          className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
            role === 'institution'
              ? 'bg-white text-[#102a28] shadow-sm'
              : 'text-[#5a736c] hover:text-[#102a28]'
          }`}
          onClick={() => setRole('institution')}
        >
          Institution
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="sv-auth-card space-y-4 rounded-2xl border border-[#d5e0dc] bg-white p-5 shadow-card sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Your name" required autoComplete="name" />
          <Field name="email" label="Email" type="email" required autoComplete="email" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="phone" label="Phone" type="tel" autoComplete="tel" />
          <Field
            name="password"
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            hint="At least 8 characters"
          />
        </div>

        {role === 'student' ? (
          <Field name="city" label="City (optional)" autoComplete="address-level2" />
        ) : (
          <>
            <Field name="institutionName" label="Institution name" required />
            <label className="block text-sm font-semibold text-[#102a28]">
              Institution type
              <select
                name="institutionType"
                className="sv-input mt-1.5"
                defaultValue="training-institute"
              >
                <option value="college">College</option>
                <option value="university">University</option>
                <option value="training-institute">Training institute</option>
                <option value="edtech">EdTech</option>
                <option value="bootcamp-provider">Bootcamp provider</option>
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="city" label="City" required autoComplete="address-level2" />
              <Field name="state" label="State" required autoComplete="address-level1" />
            </div>
            <Field name="website" label="Website (optional)" type="url" autoComplete="url" />
          </>
        )}

        {error ? (
          <p className="rounded-lg bg-[#f8e6d8] px-3 py-2 text-sm font-semibold text-[#9a4f1f]" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className="sv-btn-accent w-full disabled:opacity-60">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  autoComplete,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[#102a28]">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder=" "
        className="sv-input mt-1.5"
      />
      {hint ? <span className="mt-1 block text-xs font-normal text-[#5a736c]">{hint}</span> : null}
    </label>
  );
}
