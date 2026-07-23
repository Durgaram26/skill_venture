import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../features/auth/authStore';
import { AdminShell, EmptyQueue, FilterTabs, formatType } from './AdminShell';

interface AdminInstitution {
  id: string;
  name: string;
  type: string;
  verificationStatus: string;
  location: { city: string; state: string };
  website?: string;
  createdAt: string;
}

type StatusFilter = 'pending' | 'verified' | 'rejected' | 'all';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

export function AdminInstitutionsPage() {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [items, setItems] = useState<AdminInstitution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const result = await api.adminInstitutions(status === 'all' ? undefined : status);
    setItems(result.items as unknown as AdminInstitution[]);
  }, [status]);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'super_admin') return;
    setLoading(true);
    void reload()
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load partners');
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
      title="Partners"
      subtitle="Verify institutions before they publish programs."
      error={error}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs value={status} options={FILTERS} onChange={setStatus} />
        <p className="text-xs font-semibold text-mute">
          {loading ? 'Loading…' : `${items.length} partner${items.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-mute">Loading partners…</p>
      ) : items.length === 0 ? (
        <EmptyQueue title="No partners here" hint="Try another filter or wait for new sign-ups." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((i) => (
            <li key={i.id} className="sv-ticket rounded-md p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold tracking-tight">{i.name}</p>
                  <p className="mt-0.5 text-sm text-mute">
                    {formatType(i.type)} · {i.location.city}, {i.location.state}
                    {i.website ? ` · ${i.website}` : ''}
                  </p>
                  <span
                    className={`sv-stamp mt-2 ${
                      i.verificationStatus === 'verified'
                        ? 'border-teal text-teal'
                        : i.verificationStatus === 'rejected'
                          ? 'border-spark text-spark'
                          : 'border-spark text-spark'
                    }`}
                  >
                    {i.verificationStatus}
                  </span>
                </div>
                {i.verificationStatus === 'pending' ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busyId === i.id}
                      className="sv-btn-primary text-xs disabled:opacity-50"
                      onClick={() =>
                        void runAction(i.id, () => api.verifyInstitution(i.id, 'verified'))
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === i.id}
                      className="sv-btn-ghost text-xs disabled:opacity-50"
                      onClick={() =>
                        void runAction(i.id, () =>
                          api.verifyInstitution(i.id, 'rejected', 'Incomplete documentation'),
                        )
                      }
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
