import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';
import { getRoleHomePath } from '../features/auth/roleHome';
import { track } from '../lib/analytics';
import { AuthLayout } from '../components/AuthLayout';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.login({ email, password });
      setSession(data.user, data.accessToken);
      track('login', { role: data.user.role });
      navigate(getRoleHomePath(data.user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to enquire, save programs, and track applications."
      footer={
        <>
          New here?{' '}
          <Link className="font-semibold text-[#7c3aed] hover:underline" to="/register">
            Create an account
          </Link>
          {' · '}
          <Link className="font-semibold text-[#7c3aed] hover:underline" to="/register?role=institution">
            List a program
          </Link>
        </>
      }
    >
      <form
        onSubmit={onSubmit}
        className="sv-auth-card space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-card sm:p-6"
      >
        <label className="block text-sm font-semibold text-[#111827]">
          Email
          <input
            className="sv-input mt-1.5"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=" "
          />
        </label>
        <label className="block text-sm font-semibold text-[#111827]">
          Password
          <input
            className="sv-input mt-1.5"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=" "
          />
        </label>
        {error ? (
          <p className="rounded-lg bg-[#fef3c7] px-3 py-2 text-sm font-semibold text-[#b45309]" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={loading} className="sv-btn-primary w-full disabled:opacity-60">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
