import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../features/auth/authStore';
import { AdminShell, EmptyQueue, FilterTabs } from './AdminShell';

type UserItem = Awaited<ReturnType<typeof api.adminUsers>>['items'][number];
type RoleFilter = 'all' | 'student' | 'institution' | 'admin';

const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All roles' },
  { value: 'student', label: 'Students' },
  { value: 'institution', label: 'Institutions' },
  { value: 'admin', label: 'Admins' },
];

export function AdminUsersPage() {
  const user = useAuthStore((s) => s.user);
  const [role, setRole] = useState<RoleFilter>('all');
  const [items, setItems] = useState<UserItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const result = await api.adminUsers(role === 'all' ? undefined : { role });
    setItems(result.items);
  }, [role]);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'super_admin') return;
    setLoading(true);
    void reload()
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load users');
      })
      .finally(() => setLoading(false));
  }, [user, reload]);

  async function runAction(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell
      title="Users"
      subtitle="Suspend accounts that abuse the marketplace."
      error={error}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs value={role} options={FILTERS} onChange={setRole} />
        <p className="text-xs font-semibold text-mute">
          {loading ? 'Loading…' : `${items.length} user${items.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-mute">Loading users…</p>
      ) : items.length === 0 ? (
        <EmptyQueue title="No users found" hint="Try another role filter." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-paper">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-chalk text-[11px] font-bold uppercase tracking-[0.1em] text-mute">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((u) => {
                const isAdmin = u.role === 'admin' || u.role === 'super_admin';
                return (
                  <tr key={u.id} className="hover:bg-chalk/60">
                    <td className="px-4 py-3 font-semibold text-ink">{u.name}</td>
                    <td className="px-4 py-3 text-mute">{u.email}</td>
                    <td className="px-4 py-3 capitalize">{u.role.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      {u.isBanned ? (
                        <span className="font-bold text-spark">Banned</span>
                      ) : u.isVerified ? (
                        <span className="font-semibold text-teal">Verified</span>
                      ) : (
                        <span className="text-mute">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin ? (
                        <span className="text-xs text-mute">Protected</span>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          className="sv-btn-ghost text-xs disabled:opacity-50"
                          onClick={() =>
                            void runAction(u.id, () => api.banUser(u.id, !u.isBanned))
                          }
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
