import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';
import { EmptyState, InstitutionShell } from './institution/InstitutionShell';

type Analytics = Awaited<ReturnType<typeof api.myAnalytics>>;

const SUMMARY_STATS: {
  key: keyof Analytics['summary'];
  label: string;
  hint: string;
  format?: (v: number) => string;
}[] = [
  { key: 'publishedListings', label: 'Live programs', hint: 'On Explore now' },
  { key: 'totalViews', label: 'Total views', hint: 'Across all listings' },
  { key: 'totalEnquiries', label: 'Enquiries', hint: 'All time' },
  { key: 'contacted', label: 'Contacted', hint: 'Leads you replied to' },
  { key: 'converted', label: 'Converted', hint: 'Enrolled or closed won' },
  {
    key: 'conversionRate',
    label: 'Conversion rate',
    hint: 'Enquiries → converted',
    format: (v) => `${v}%`,
  },
];

export function InstitutionAnalyticsPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'institution') return;
    setLoading(true);
    void api
      .myAnalytics()
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.code === 'PLAN_UPGRADE_REQUIRED') {
          setNeedsUpgrade(true);
        } else {
          setError(err instanceof ApiError ? err.message : 'Failed to load analytics');
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (needsUpgrade) {
    return (
      <InstitutionShell title="Analytics" subtitle="See what’s working across your programs.">
        <div className="sv-inst-upgrade rounded-md border border-line bg-paper p-8 text-center shadow-card">
          <p className="font-display text-xl font-bold">Unlock performance insights</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-mute">
            Analytics are included on Standard and Premium. Upgrade to track views, conversion rate,
            and your top-performing listings.
          </p>
          <Link to="/institution/billing" className="sv-btn-accent mt-5 inline-flex">
            View plans
          </Link>
        </div>
      </InstitutionShell>
    );
  }

  return (
    <InstitutionShell
      title="Analytics"
      subtitle="Track views, enquiries, and which programs convert best."
      error={error}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SUMMARY_STATS.map((stat) => {
          const raw = data?.summary[stat.key];
          const value =
            loading || raw == null
              ? '—'
              : stat.format
                ? stat.format(raw)
                : Number(raw).toLocaleString('en-IN');
          return (
            <div key={stat.key} className="sv-inst-stat">
              <p className="sv-inst-stat-label">{stat.label}</p>
              <p className="sv-inst-stat-value">{value}</p>
              <p className="sv-inst-stat-hint">{stat.hint}</p>
            </div>
          );
        })}
      </div>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold tracking-tight">Top listings</h2>
          <p className="text-sm text-mute">Ranked by enquiries, then views.</p>
        </div>

        {!loading && data && data.topListings.length === 0 ? (
          <EmptyState
            title="No data yet"
            hint="Publish a program and start receiving enquiries to see performance here."
            action={
              <Link to="/institution" className="sv-btn-primary">
                Back to hub
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {(data?.topListings ?? []).map((listing, index) => (
              <li key={listing.id} className="sv-inst-enquiry">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="sv-inst-rank" aria-hidden>
                      {index + 1}
                    </span>
                    <div>
                      <Link
                        to={`/listings/${listing.slug}`}
                        className="font-display text-base font-bold text-ink hover:text-teal"
                      >
                        {listing.title}
                      </Link>
                      <p className="mt-1 text-sm text-mute">
                        {listing.views.toLocaleString('en-IN')} views ·{' '}
                        {listing.enquiries.toLocaleString('en-IN')} enquiries
                        {listing.isFeatured ? ' · Featured' : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-mute">
                    {listing.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </li>
            ))}
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="sv-inst-enquiry animate-pulse">
                    <div className="h-4 w-48 rounded bg-line" />
                    <div className="mt-2 h-3 w-32 rounded bg-line/80" />
                  </li>
                ))
              : null}
          </ul>
        )}
      </section>
    </InstitutionShell>
  );
}
