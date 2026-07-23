import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ListingSummary } from '@skillventures/shared-types';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../features/auth/authStore';
import { AdminShell, EmptyQueue, formatType } from './AdminShell';

interface PendingInstitution {
  id: string;
  name: string;
  type: string;
  verificationStatus: string;
  location: { city: string; state: string };
}

type Analytics = Awaited<ReturnType<typeof api.adminAnalytics>>;

const STAT_LINKS: {
  key: keyof Analytics;
  label: string;
  hint: string;
  to?: string;
}[] = [
  { key: 'students', label: 'Students', hint: 'Registered learners', to: '/admin/users' },
  { key: 'institutions', label: 'Institutions', hint: 'Total partners', to: '/admin/institutions' },
  {
    key: 'pendingInstitutions',
    label: 'Pending partners',
    hint: 'Awaiting verification',
    to: '/admin/institutions',
  },
  {
    key: 'publishedListings',
    label: 'Live programs',
    hint: 'Publicly listed',
    to: '/admin/listings',
  },
  {
    key: 'pendingListings',
    label: 'In review',
    hint: 'Listing moderation queue',
    to: '/admin/listings',
  },
  { key: 'flaggedReviews', label: 'Flagged reviews', hint: 'Need moderation', to: '/admin/reviews' },
];

function isAdmin(role?: string) {
  return role === 'admin' || role === 'super_admin';
}

export function AdminOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const [institutions, setInstitutions] = useState<PendingInstitution[]>([]);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [inst, list, stats] = await Promise.all([
      api.adminInstitutions('pending'),
      api.adminListings('pending_review'),
      api.adminAnalytics(),
    ]);
    setInstitutions(inst.items as unknown as PendingInstitution[]);
    setListings(list.items);
    setAnalytics(stats);
  }, []);

  useEffect(() => {
    if (!isAdmin(user?.role)) return;
    setLoading(true);
    void reload()
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load admin data');
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

  const queueCount =
    (analytics?.pendingInstitutions ?? institutions.length) +
    (analytics?.pendingListings ?? listings.length) +
    (analytics?.flaggedReviews ?? 0);

  return (
    <AdminShell
      title="Admin panel"
      subtitle="Verify partners, publish programs, and keep the marketplace trustworthy."
      error={error}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-ink bg-ink px-5 py-3.5 text-white">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-bright">Today</p>
          <p className="mt-0.5 font-display text-lg font-bold">
            {loading
              ? 'Loading queues…'
              : `${queueCount} item${queueCount === 1 ? '' : 's'} need${queueCount === 1 ? 's' : ''} attention`}
          </p>
        </div>
        <button
          type="button"
          className="sv-btn-ghost border-white/20 bg-white/10 text-white hover:bg-white/20"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            void reload()
              .catch((err: unknown) => {
                setError(err instanceof ApiError ? err.message : 'Refresh failed');
              })
              .finally(() => setLoading(false));
          }}
        >
          Refresh
        </button>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">Platform pulse</h2>
            <p className="text-sm text-mute">Tap a metric to open its workspace.</p>
          </div>
          <Link to="/admin/analytics" className="text-xs font-semibold text-teal hover:underline">
            Full analytics →
          </Link>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {STAT_LINKS.map((stat) => {
            const value = analytics?.[stat.key];
            const inner = (
              <>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
                  {stat.label}
                </p>
                <p className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-ink">
                  {loading || value == null ? '—' : Number(value).toLocaleString('en-IN')}
                </p>
                <p className="mt-0.5 text-xs text-mute">{stat.hint}</p>
              </>
            );
            return stat.to ? (
              <Link
                key={stat.key}
                to={stat.to}
                className="rounded-md border border-line bg-paper p-3.5 shadow-card transition hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-lift"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={stat.key}
                className="rounded-md border border-line bg-paper p-3.5 shadow-card"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">Partner verification</h2>
              <p className="text-sm text-mute">Approve institutions before they go live.</p>
            </div>
            <Link
              to="/admin/institutions"
              className="rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-bold text-teal hover:underline"
            >
              View all · {institutions.length}
            </Link>
          </div>

          <ul className="space-y-2.5">
            {institutions.slice(0, 5).map((i) => (
              <li key={i.id} className="sv-ticket rounded-md p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold tracking-tight">{i.name}</p>
                    <p className="mt-0.5 text-sm text-mute">
                      {formatType(i.type)} · {i.location.city}, {i.location.state}
                    </p>
                    <span className="sv-stamp mt-2 border-spark text-spark">Pending</span>
                  </div>
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
                </div>
              </li>
            ))}
            {!loading && institutions.length === 0 ? (
              <li>
                <EmptyQueue
                  title="Queue clear"
                  hint="No institutions waiting for verification."
                />
              </li>
            ) : null}
          </ul>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">Listing moderation</h2>
              <p className="text-sm text-mute">Publish or reject programs in review.</p>
            </div>
            <Link
              to="/admin/listings"
              className="rounded-full bg-spark-soft px-2.5 py-0.5 text-xs font-bold text-spark hover:underline"
            >
              View all · {listings.length}
            </Link>
          </div>

          <ul className="space-y-2.5">
            {listings.slice(0, 5).map((l) => (
              <li key={l.id} className="sv-ticket rounded-md p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold tracking-tight">{l.title}</p>
                    <p className="mt-0.5 text-sm capitalize text-mute">
                      {l.type} · {l.category} ·{' '}
                      {l.fee.isFree ? 'Free' : `₹${l.fee.amount.toLocaleString('en-IN')}`}
                    </p>
                    <Link
                      to={`/listings/${l.slug}`}
                      className="mt-1.5 inline-block text-xs font-semibold text-teal hover:underline"
                    >
                      Preview →
                    </Link>
                  </div>
                  <div className="flex shrink-0 gap-2">
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
                  </div>
                </div>
              </li>
            ))}
            {!loading && listings.length === 0 ? (
              <li>
                <EmptyQueue
                  title="Nothing to moderate"
                  hint="No listings awaiting review right now."
                />
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}
