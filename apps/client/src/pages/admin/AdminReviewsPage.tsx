import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../features/auth/authStore';
import { AdminShell, EmptyQueue, FilterTabs } from './AdminShell';

type ReviewItem = Awaited<ReturnType<typeof api.adminReviews>>['items'][number];
type StatusFilter = 'flagged' | 'visible' | 'removed' | 'all';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'flagged', label: 'Flagged' },
  { value: 'visible', label: 'Visible' },
  { value: 'removed', label: 'Removed' },
  { value: 'all', label: 'All' },
];

export function AdminReviewsPage() {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<StatusFilter>('flagged');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const result = await api.adminReviews(status);
    setItems(result.items);
  }, [status]);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'super_admin') return;
    setLoading(true);
    void reload()
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load reviews');
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
      title="Reviews"
      subtitle="Remove abusive or fake reviews; restore honest ones."
      error={error}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs value={status} options={FILTERS} onChange={setStatus} />
        <p className="text-xs font-semibold text-mute">
          {loading ? 'Loading…' : `${items.length} review${items.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-mute">Loading reviews…</p>
      ) : items.length === 0 ? (
        <EmptyQueue
          title="Queue clear"
          hint="No reviews match this filter. Flagged reviews appear here automatically."
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((r) => (
            <li key={r.id} className="sv-ticket rounded-md p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base font-bold tracking-tight">
                      {r.rating}/5 stars
                    </p>
                    <span className="sv-stamp border-line text-mute">{r.moderationStatus}</span>
                    {r.isVerifiedApplicant ? (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-teal">
                        Verified applicant
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-ink">
                    {r.comment?.trim() || 'No written comment.'}
                  </p>
                  <p className="mt-1.5 text-xs text-mute">
                    Listing {r.listingId.slice(-6)} · {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.moderationStatus !== 'visible' ? (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      className="sv-btn-primary text-xs disabled:opacity-50"
                      onClick={() =>
                        void runAction(r.id, () => api.moderateReview(r.id, 'visible'))
                      }
                    >
                      Restore
                    </button>
                  ) : null}
                  {r.moderationStatus !== 'removed' ? (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      className="sv-btn-ghost text-xs disabled:opacity-50"
                      onClick={() =>
                        void runAction(r.id, () =>
                          api.moderateReview(r.id, 'removed', 'Abusive or fake content'),
                        )
                      }
                    >
                      Remove
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
