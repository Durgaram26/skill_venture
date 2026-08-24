import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { EnquirySummary, ListingSummary } from '@skillventures/shared-types';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';
import { LazyImage } from '../components/LazyImage';
import {
  EmptyState,
  InstitutionShell,
  StatusBadge,
} from './institution/InstitutionShell';

type ListingFilter = 'all' | 'published' | 'pending_review' | 'draft';
type EnquiryFilter = 'all' | 'new' | 'contacted' | 'converted' | 'lost';

const TYPE_TINT: Record<string, string> = {
  course: 'from-[#7c3aed] to-[#a78bfa]',
  bootcamp: 'from-[#111827] to-[#7c3aed]',
  hackathon: 'from-[#1e1b2e] to-[#f59e0b]',
};

function formatFee(listing: ListingSummary) {
  if (listing.fee.isFree) return 'Free';
  return `₹${listing.fee.amount.toLocaleString('en-IN')}`;
}

function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function HubStat({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="sv-inst-stat">
      <p className="sv-inst-stat-label">{label}</p>
      <p className="sv-inst-stat-value">{value}</p>
      <p className="sv-inst-stat-hint">{hint}</p>
    </div>
  );
}

function ListingHubCard({ listing }: { listing: ListingSummary }) {
  const cover = listing.images?.[0];
  const tint = TYPE_TINT[listing.type] ?? TYPE_TINT.course;

  return (
    <article className="sv-inst-listing-card">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line">
        {cover ? (
          <LazyImage src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${tint}`} aria-hidden />
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={listing.status} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
              {listing.type} · {listing.category}
            </p>
            <h3 className="mt-1 line-clamp-2 font-display text-base font-bold leading-snug">{listing.title}</h3>
          </div>
          <p className="shrink-0 text-sm font-bold text-ink">{formatFee(listing)}</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-mute">
          <span>{listing.stats.views} views</span>
          <span>{listing.stats.enquiries} enquiries</span>
          {listing.isFeatured ? <span className="font-semibold text-teal">Featured</span> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={`/institution/listings/${listing.id}/edit`}
            className="sv-inst-action"
          >
            Edit listing
          </Link>
          {listing.status === 'published' ? (
            <Link
              to={`/listings/${listing.slug}`}
              className="text-sm font-semibold text-teal hover:underline"
            >
              View public page →
            </Link>
          ) : (
            <span className="text-xs text-mute self-center">Not visible on Explore yet</span>
          )}
        </div>
      </div>
    </article>
  );
}

function FilterPills<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={active ? 'sv-inst-pill is-active' : 'sv-inst-pill'}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
            {opt.count !== undefined ? ` (${opt.count})` : ''}
          </button>
        );
      })}
    </div>
  );
}

export function InstitutionDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [enquiries, setEnquiries] = useState<EnquirySummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingFilter, setListingFilter] = useState<ListingFilter>('all');
  const [enquiryFilter, setEnquiryFilter] = useState<EnquiryFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const isEnquiriesTab = searchParams.get('tab') === 'enquiries';

  useEffect(() => {
    if (user?.role !== 'institution') return;
    setLoading(true);
    void Promise.all([api.myListings(), api.myInstitutionEnquiries()])
      .then(([l, e]) => {
        setListings(l.items);
        setEnquiries(e.items);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    const published = listings.filter((l) => l.status === 'published').length;
    const pending = listings.filter((l) => l.status === 'pending_review').length;
    const views = listings.reduce((sum, l) => sum + l.stats.views, 0);
    const newLeads = enquiries.filter((e) => e.status === 'new').length;
    return { published, pending, views, newLeads, totalEnquiries: enquiries.length };
  }, [listings, enquiries]);

  const filteredListings = useMemo(() => {
    if (listingFilter === 'all') return listings;
    return listings.filter((l) => l.status === listingFilter);
  }, [listings, listingFilter]);

  const filteredEnquiries = useMemo(() => {
    if (enquiryFilter === 'all') return enquiries;
    return enquiries.filter((e) => e.status === enquiryFilter);
  }, [enquiries, enquiryFilter]);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    try {
      const updated = await api.updateEnquiryStatus(id, status);
      setEnquiries((prev) => prev.map((e) => (e.id === id ? updated.enquiry : e)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update enquiry');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <InstitutionShell
      title={isEnquiriesTab ? 'Enquiry inbox' : 'Instructor hub'}
      subtitle={isEnquiriesTab ? 'Review and respond to student enquiries.' : 'Publish programs, manage leads, and keep every enquiry moving.'}
      error={error}
      enquiryCount={stats.totalEnquiries}
      actions={!isEnquiriesTab ? (
        <Link to="/institution/listings/new" className="sv-btn-accent">
          + Create listing
        </Link>
      ) : undefined}
    >
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sv-inst-stat animate-pulse">
              <div className="h-3 w-20 rounded bg-line" />
              <div className="mt-3 h-8 w-16 rounded bg-line/80" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <HubStat label="Live programs" value={stats.published} hint="Visible on Explore" />
          <HubStat label="New leads" value={stats.newLeads} hint="Awaiting your reply" />
          <HubStat label="Total enquiries" value={stats.totalEnquiries} hint="All time" />
          <HubStat label="Program views" value={stats.views} hint="Across all listings" />
        </div>
      )}

      {stats.pending > 0 ? (
        <div className="sv-inst-alert mt-6">
          <p className="font-semibold">{stats.pending} program{stats.pending === 1 ? '' : 's'} in review</p>
          <p className="mt-0.5 text-sm text-mute">We’ll notify you once they’re approved for Explore.</p>
        </div>
      ) : null}

      {!isEnquiriesTab ? <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">My listings</h2>
            <p className="text-sm text-mute">Programs you publish to SkillVentures.</p>
          </div>
          <FilterPills
            value={listingFilter}
            onChange={setListingFilter}
            options={[
              { value: 'all', label: 'All', count: listings.length },
              { value: 'published', label: 'Live', count: stats.published },
              {
                value: 'pending_review',
                label: 'In review',
                count: listings.filter((l) => l.status === 'pending_review').length,
              },
              {
                value: 'draft',
                label: 'Draft',
                count: listings.filter((l) => l.status === 'draft').length,
              },
            ]}
          />
        </div>

        {!loading && filteredListings.length === 0 ? (
          <EmptyState
            title={listingFilter === 'all' ? 'No listings yet' : 'Nothing in this filter'}
            hint={
              listingFilter === 'all'
                ? 'Create your first program to start receiving student enquiries.'
                : 'Try another filter or publish a new listing.'
            }
            action={
              listingFilter === 'all' ? (
                <Link to="/institution/listings/new" className="sv-btn-primary">
                  Create listing
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingHubCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section> : null}

      {isEnquiriesTab ? <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-end gap-3">
          <FilterPills
            value={enquiryFilter}
            onChange={setEnquiryFilter}
            options={[
              { value: 'all', label: 'All', count: enquiries.length },
              { value: 'new', label: 'New', count: enquiries.filter((e) => e.status === 'new').length },
              {
                value: 'contacted',
                label: 'Contacted',
                count: enquiries.filter((e) => e.status === 'contacted').length,
              },
              {
                value: 'converted',
                label: 'Converted',
                count: enquiries.filter((e) => e.status === 'converted').length,
              },
            ]}
          />
        </div>

        {!loading && filteredEnquiries.length === 0 ? (
          <EmptyState
            title="No enquiries yet"
            hint="When students enquire on your programs, they’ll show up here with contact details."
          />
        ) : (
          <ul className="space-y-3">
            {filteredEnquiries.map((e) => (
              <li key={e.id} className="sv-inst-enquiry">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="sv-profile-avatar" aria-hidden>
                    {initials(e.contactInfo.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display font-bold">{e.studentProfile ? <Link className="text-teal hover:underline" to={`/u/${e.studentProfile.id}`}>{e.studentProfile.name}</Link> : e.contactInfo.name} {e.studentProfile?.profile?.emojiTag ?? ''}</p>
                      <StatusBadge status={e.status} />
                      <span className="text-xs text-mute">{formatRelative(e.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-teal">
                      {e.listing?.title ?? 'Program enquiry'}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-mute">{e.message}</p>
                    <p className="mt-2 text-xs text-mute">
                      {e.contactInfo.email}
                      {e.contactInfo.phone ? ` · ${e.contactInfo.phone}` : ''}
                    </p>
                  </div>
                </div>
                {e.status !== 'converted' && e.status !== 'lost' ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                    {e.status === 'new' ? (
                      <button
                        type="button"
                        disabled={busyId === e.id}
                        className="sv-inst-action"
                        onClick={() => void setStatus(e.id, 'contacted')}
                      >
                        Mark contacted
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busyId === e.id}
                      className="sv-inst-action sv-inst-action--success"
                      onClick={() => void setStatus(e.id, 'converted')}
                    >
                      Mark converted
                    </button>
                    <button
                      type="button"
                      disabled={busyId === e.id}
                      className="sv-inst-action sv-inst-action--muted"
                      onClick={() => void setStatus(e.id, 'lost')}
                    >
                      Mark lost
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section> : null}
    </InstitutionShell>
  );
}
