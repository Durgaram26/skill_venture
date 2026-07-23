import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../features/auth/authStore';
import { AdminShell, SuperAdminGate } from './AdminShell';

type TeamMember = Awaited<ReturnType<typeof api.adminTeam>>['items'][number];
type StudentUser = Awaited<ReturnType<typeof api.adminUsers>>['items'][number];

export function AdminAdminsPage() {
  const user = useAuthStore((s) => s.user);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [candidates, setCandidates] = useState<StudentUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [t, students] = await Promise.all([
      api.adminTeam(),
      api.adminUsers({ role: 'student' }),
    ]);
    setTeam(t.items);
    setCandidates(students.items.slice(0, 10));
  }, []);

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    setLoading(true);
    void reload()
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load team');
      })
      .finally(() => setLoading(false));
  }, [user, reload]);

  async function changeRole(id: string, role: 'student' | 'admin' | 'super_admin') {
    setBusyId(id);
    setError(null);
    try {
      await api.setUserRole(id, role);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Role change failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SuperAdminGate>
      <AdminShell
        title="Admin team"
        subtitle="Promote trusted moderators or demote access when someone leaves."
        error={error}
      >
        <section className="mb-8">
          <h2 className="font-display text-lg font-bold">Current team</h2>
          {loading ? (
            <p className="mt-2 text-sm text-mute">Loading…</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {team.map((m) => (
                <li key={m.id} className="sv-ticket flex flex-wrap items-center justify-between gap-3 rounded-md p-3.5">
                  <div>
                    <p className="font-semibold text-ink">{m.name}</p>
                    <p className="text-sm text-mute">{m.email}</p>
                    <span
                      className={`sv-stamp mt-2 ${
                        m.role === 'super_admin' ? 'border-spark text-spark' : 'border-teal text-teal'
                      }`}
                    >
                      {m.role.replace('_', ' ')}
                    </span>
                  </div>
                  {m.role === 'admin' ? (
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      className="sv-btn-ghost text-xs disabled:opacity-50"
                      onClick={() => void changeRole(m.id, 'student')}
                    >
                      Remove admin
                    </button>
                  ) : null}
                  {m.id === user?.id ? (
                    <span className="text-xs text-mute">You</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg font-bold">Promote to admin</h2>
          <p className="mt-1 text-sm text-mute">Recent students — grant moderation access.</p>
          <ul className="mt-3 space-y-2">
            {candidates.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-paper px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-ink">{s.name}</p>
                  <p className="text-sm text-mute">{s.email}</p>
                </div>
                <button
                  type="button"
                  disabled={busyId === s.id}
                  className="sv-btn-primary text-xs disabled:opacity-50"
                  onClick={() => void changeRole(s.id, 'admin')}
                >
                  Make admin
                </button>
              </li>
            ))}
            {!loading && candidates.length === 0 ? (
              <li className="text-sm text-mute">No students to promote right now.</li>
            ) : null}
          </ul>
        </section>
      </AdminShell>
    </SuperAdminGate>
  );
}
