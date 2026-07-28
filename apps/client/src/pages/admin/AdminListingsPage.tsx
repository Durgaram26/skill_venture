import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ListingSummary } from '@skillventures/shared-types';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../features/auth/authStore';
import { AdminShell, EmptyQueue, FilterTabs } from './AdminShell';

type StatusFilter = 'pending_review' | 'published' | 'rejected' | 'paused' | 'draft' | 'all';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'pending_review', label: 'Submitted / in review' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paused', label: 'Paused' },
  { value: 'draft', label: 'Draft' },
  { value: 'all', label: 'All' },
];

export function AdminListingsPage() {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const result = await api.adminListings(status);
    setItems(result.items);
  }, [status]);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'super_admin') return;
    setLoading(true);
    void reload()
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load programs');
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
      title="Programs"
      subtitle="Moderate listings before they reach students."
      error={error}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs value={status} options={FILTERS} onChange={setStatus} />
        <p className="text-xs font-semibold text-mute">
          {loading ? 'Loading…' : `${items.length} program${items.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-mute">Loading programs…</p>
      ) : items.length === 0 ? (
        <EmptyQueue title="No programs here" hint="Try another status filter." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((l) => (
            <li key={l.id} className="sv-ticket rounded-md p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold tracking-tight">{l.title}</p>
                  <p className="mt-0.5 text-sm capitalize text-mute">
                    {l.status.replace(/_/g, ' ')} · {l.type} · {l.category} ·{' '}
                    {l.fee.isFree ? 'Free' : `₹${l.fee.amount.toLocaleString('en-IN')}`}
                  </p>
                  <Link
                    to={`/listings/${l.slug}`}
                    className="mt-1.5 inline-block text-xs font-semibold text-teal hover:underline"
                  >
                    Preview public page →
                  </Link>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {l.status !== 'published' ? (
                    <button
                      type="button"
                      disabled={busyId === l.id}
                      className="sv-btn-primary text-xs disabled:opacity-50"
                      onClick={() =>
                        void runAction(l.id, () => api.moderateListing(l.id, 'published'))
                      }
                    >
                      Publish
                    </button>
                  ) : null}
                  {l.status === 'published' ? (
                    <button
                      type="button"
                      disabled={busyId === l.id}
                      className="sv-btn-ghost text-xs disabled:opacity-50"
                      onClick={() =>
                        void runAction(l.id, () => api.moderateListing(l.id, 'paused'))
                      }
                    >
                      Pause
                    </button>
                  ) : null}
                  {l.status !== 'rejected' ? (
                    <button
                      type="button"
                      disabled={busyId === l.id}
                      className="sv-btn-ghost text-xs disabled:opacity-50"
                      onClick={() =>
                        void runAction(l.id, () =>
                          api.moderateListing(l.id, 'rejected', 'Needs clearer curriculum'),
                        )
                      }
                    >
                      Reject
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
