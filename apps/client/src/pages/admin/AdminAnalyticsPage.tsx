import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { useAuthStore } from '../../features/auth/authStore';
import { AdminShell, isSuperAdminRole } from './AdminShell';

type Analytics = Awaited<ReturnType<typeof api.adminAnalytics>>;
type Financial = Awaited<ReturnType<typeof api.adminFinancialReport>>;

const PLATFORM: { key: keyof Analytics; label: string; hint: string; to?: string }[] = [
  { key: 'students', label: 'Students', hint: 'Registered learners', to: '/admin/users' },
  { key: 'institutions', label: 'Institutions', hint: 'Total partners', to: '/admin/institutions' },
  {
    key: 'pendingInstitutions',
    label: 'Pending partners',
    hint: 'Verification queue',
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
    hint: 'Moderation queue',
    to: '/admin/listings',
  },
  { key: 'enquiries', label: 'Enquiries', hint: 'All-time student leads' },
  {
    key: 'flaggedReviews',
    label: 'Flagged reviews',
    hint: 'Awaiting decision',
    to: '/admin/reviews',
  },
  { key: 'bannedUsers', label: 'Banned users', hint: 'Suspended accounts', to: '/admin/users' },
];

const REVENUE: { key: keyof Analytics; label: string; hint: string; prefix?: string }[] = [
  {
    key: 'revenueInr',
    label: 'Paid volume',
    hint: 'Sum of successful Razorpay orders',
    prefix: '₹',
  },
  {
    key: 'activeSubscriptions',
    label: 'Paid subscriptions',
    hint: 'Active standard / premium plans',
  },
  { key: 'paidOrders', label: 'Paid orders', hint: 'Subscriptions + featured boosts' },
  { key: 'featuredListings', label: 'Featured listings', hint: 'Currently boosted programs' },
];

export function AdminAnalyticsPage() {
  const user = useAuthStore((s) => s.user);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [financial, setFinancial] = useState<Financial | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isSuper = isSuperAdminRole(user?.role);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'super_admin') return;
    setLoading(true);
    const loads: Promise<void>[] = [
      api
        .adminAnalytics()
        .then(setAnalytics)
        .then(() => undefined),
    ];
    if (isSuper) {
      loads.push(
        api
          .adminFinancialReport()
          .then(setFinancial)
          .then(() => undefined),
      );
    }
    void Promise.all(loads)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load analytics');
      })
      .finally(() => setLoading(false));
  }, [user, isSuper]);

  function renderCard(
    key: string,
    label: string,
    hint: string,
    value: number | undefined,
    opts?: { to?: string; prefix?: string },
  ) {
    const display =
      loading || value == null
        ? '—'
        : `${opts?.prefix ?? ''}${value.toLocaleString('en-IN')}`;
    const body = (
      <>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mute">{label}</p>
        <p className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-ink">
          {display}
        </p>
        <p className="mt-0.5 text-xs text-mute">{hint}</p>
      </>
    );
    if (opts?.to) {
      return (
        <Link
          key={key}
          to={opts.to}
          className="rounded-md border border-line bg-paper p-3.5 shadow-card transition hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-lift"
        >
          {body}
        </Link>
      );
    }
    return (
      <div key={key} className="rounded-md border border-line bg-paper p-3.5 shadow-card">
        {body}
      </div>
    );
  }

  return (
    <AdminShell
      title="Analytics"
      subtitle="Platform health, queues, and revenue at a glance."
      error={error}
    >
      <section className="mb-8">
        <h2 className="font-display text-lg font-bold tracking-tight">Marketplace</h2>
        <p className="mt-0.5 text-sm text-mute">Learners, partners, programs, and trust signals.</p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORM.map((s) =>
            renderCard(s.key, s.label, s.hint, analytics?.[s.key], { to: s.to }),
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold tracking-tight">Revenue</h2>
        <p className="mt-0.5 text-sm text-mute">
          Subscriptions and featured listing purchases (paid orders only).
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {REVENUE.map((s) =>
            renderCard(s.key, s.label, s.hint, analytics?.[s.key], { prefix: s.prefix }),
          )}
        </div>
      </section>

      {isSuper && financial ? (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold tracking-tight">Financial detail</h2>
          <p className="mt-0.5 text-sm text-mute">Super admin view — revenue breakdown by type and month.</p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-md border border-line bg-paper p-3.5 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mute">Total revenue</p>
              <p className="mt-1.5 font-display text-2xl font-extrabold text-ink">
                ₹{financial.totalRevenueInr.toLocaleString('en-IN')}
              </p>
            </div>
            {financial.revenueByType.map((r) => (
              <div key={r.type} className="rounded-md border border-line bg-paper p-3.5 shadow-card">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mute">{r.type}</p>
                <p className="mt-1.5 font-display text-2xl font-extrabold text-ink">
                  ₹{r.revenueInr.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-mute">{r.count} orders</p>
              </div>
            ))}
          </div>
          {financial.monthlyRevenue.length > 0 ? (
            <ul className="mt-4 space-y-2 rounded-md border border-line bg-chalk p-4 text-sm">
              {financial.monthlyRevenue.map((m) => (
                <li key={m.month} className="flex justify-between">
                  <span className="text-mute">{m.month}</span>
                  <span className="font-semibold">₹{m.revenueInr.toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </AdminShell>
  );
}
