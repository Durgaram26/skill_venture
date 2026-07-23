import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ListingSummary } from '@skillventures/shared-types';
import { AppShell } from '../components/AppShell';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';
import { useCompareStore } from '../features/compare/compareStore';

export function BookmarksPage() {
  const user = useAuthStore((s) => s.user);
  const toggleCompare = useCompareStore((s) => s.toggle);
  const hasCompare = useCompareStore((s) => s.has);
  const [items, setItems] = useState<{ id: string; listingId: string; listing: ListingSummary }[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'student') return;
    void api
      .myBookmarks()
      .then((data) => setItems(data.items))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load bookmarks');
      });
  }, [user]);

  if (user?.role !== 'student') {
    return (
      <AppShell>
        <p>Student access only.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Saved listings">
      {error ? <p className="text-coral">{error}</p> : null}
      <ul className="mt-4 space-y-4">
        {items.map((b) => (
          <li
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-mist pb-4"
          >
            <div>
              <Link className="font-semibold text-lagoon" to={`/listings/${b.listing.slug}`}>
                {b.listing.title}
              </Link>
              <p className="text-sm text-ink/60">
                {b.listing.type} · ₹{b.listing.fee.amount.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-ink/15 px-3 py-1 text-xs font-semibold"
                onClick={() => toggleCompare(b.listingId)}
              >
                {hasCompare(b.listingId) ? 'In compare' : 'Compare'}
              </button>
              <button
                type="button"
                className="rounded-md border border-ink/15 px-3 py-1 text-xs font-semibold"
                onClick={() =>
                  void api.removeBookmark(b.listingId).then(() => {
                    setItems((prev) => prev.filter((x) => x.listingId !== b.listingId));
                  })
                }
              >
                Remove
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="text-sm text-ink/60">
            No bookmarks yet.{' '}
            <Link className="text-lagoon" to="/listings">
              Browse programs
            </Link>
          </li>
        ) : null}
      </ul>
    </AppShell>
  );
}
