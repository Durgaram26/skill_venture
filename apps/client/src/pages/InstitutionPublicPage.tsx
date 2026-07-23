import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { InstitutionSummary, ListingSummary, ListingType } from '@skillventures/shared-types';
import { MarketplaceShell } from '../components/AppShell';
import { ListingCard } from '../components/ListingCard';
import { api, ApiError } from '../lib/api';
import { useCompareStore } from '../features/compare/compareStore';
import { usePageSeo } from '../hooks/usePageSeo';

type TypeFilter = 'all' | ListingType;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'course', label: 'Courses' },
  { value: 'bootcamp', label: 'Bootcamps' },
  { value: 'hackathon', label: 'Hackathons' },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatType(type: string) {
  return type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function InstitutionPublicPage() {
  const { id } = useParams();
  const toggleCompare = useCompareStore((s) => s.toggle);
  const hasCompare = useCompareStore((s) => s.has);
  const [institution, setInstitution] = useState<InstitutionSummary | null>(null);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void Promise.all([api.getInstitution(id), api.getInstitutionListings(id)])
      .then(([inst, list]) => {
        setInstitution(inst.institution);
        setListings(list.items);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Not found');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return listings;
    return listings.filter((l) => l.type === typeFilter);
  }, [listings, typeFilter]);

  const typeCounts = useMemo(() => {
    return {
      course: listings.filter((l) => l.type === 'course').length,
      bootcamp: listings.filter((l) => l.type === 'bootcamp').length,
      hackathon: listings.filter((l) => l.type === 'hackathon').length,
    };
  }, [listings]);

  usePageSeo({
    title: institution ? `${institution.name} | SkillVentures` : 'Institution | SkillVentures',
    description:
      institution?.description?.slice(0, 160) ??
      (institution
        ? `Explore programs from ${institution.name} in ${institution.location.city}.`
        : 'Browse training partners on SkillVentures.'),
  });

  if (error && !institution) {
    return (
      <MarketplaceShell>
        <div className="sv-ticket rounded-md p-10 text-center">
          <p className="font-display text-xl font-bold text-spark">{error}</p>
          <p className="mt-2 text-sm text-mute">This partner page could not be found.</p>
          <Link to="/listings" className="sv-btn-primary mt-5 inline-flex">
            Explore programs
          </Link>
        </div>
      </MarketplaceShell>
    );
  }

  if (loading || !institution) {
    return (
      <MarketplaceShell>
        <div className="animate-pulse space-y-6">
          <div className="h-40 rounded-md bg-line/60" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-md bg-line/50" />
            ))}
          </div>
        </div>
      </MarketplaceShell>
    );
  }

  const verified = institution.verificationStatus === 'verified';
  const ratingLabel =
    institution.rating.count > 0
      ? `${institution.rating.avg.toFixed(1)} · ${institution.rating.count} review${institution.rating.count === 1 ? '' : 's'}`
      : 'New on SkillVentures';

  return (
    <MarketplaceShell>
      <nav className="mb-5 text-sm text-mute">
        <Link to="/listings" className="font-semibold text-teal hover:underline">
          Explore
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-ink">{institution.name}</span>
      </nav>

      <header className="sv-inst-public-hero">
        <div className="flex flex-wrap items-start gap-5">
          <div className="sv-inst-public-logo" aria-hidden>
            {institution.logo ? (
              <img src={institution.logo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{initials(institution.name)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {verified ? (
                <span className="sv-stamp border-teal text-teal">Verified institution</span>
              ) : (
                <span className="sv-stamp border-line text-mute">{formatType(institution.type)}</span>
              )}
              <span className="rounded-full border border-line bg-chalk px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mute">
                {formatType(institution.type)}
              </span>
            </div>

            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
              {institution.name}
            </h1>

            <p className="mt-2 text-sm text-mute">
              {institution.location.city}, {institution.location.state}
              {institution.location.address ? ` · ${institution.location.address}` : ''}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold text-ink">★ {ratingLabel}</span>
              <span className="text-mute">
                {listings.length} live program{listings.length === 1 ? '' : 's'}
              </span>
            </div>

            {institution.description ? (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/85">{institution.description}</p>
            ) : (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mute">
                Browse live courses, bootcamps, and hackathons from this training partner.
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {institution.website ? (
                <a
                  href={institution.website}
                  target="_blank"
                  rel="noreferrer"
                  className="sv-btn-ghost text-xs"
                >
                  Visit website
                </a>
              ) : null}
              <a href="#programs" className="sv-btn-primary text-xs">
                View programs
              </a>
            </div>
          </div>
        </div>

        <dl className="sv-inst-public-stats">
          <div>
            <dt>Programs</dt>
            <dd>{listings.length}</dd>
          </div>
          <div>
            <dt>Courses</dt>
            <dd>{typeCounts.course}</dd>
          </div>
          <div>
            <dt>Bootcamps</dt>
            <dd>{typeCounts.bootcamp}</dd>
          </div>
          <div>
            <dt>Hackathons</dt>
            <dd>{typeCounts.hackathon}</dd>
          </div>
        </dl>
      </header>

      <section id="programs" className="mt-10 scroll-mt-28">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Programs</h2>
            <p className="mt-1 text-sm text-mute">
              Compare options and enquire directly from each program page.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by type">
            {TYPE_FILTERS.map((opt) => {
              const count =
                opt.value === 'all'
                  ? listings.length
                  : listings.filter((l) => l.type === opt.value).length;
              const active = typeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={active ? 'sv-inst-pill is-active' : 'sv-inst-pill'}
                  onClick={() => setTypeFilter(opt.value)}
                >
                  {opt.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="sv-ticket rounded-md p-10 text-center">
            <img
              src="/images/empty-listings.svg"
              alt=""
              className="mx-auto mb-4 max-h-32 w-auto opacity-90"
            />
            <p className="font-display text-lg font-bold">
              {listings.length === 0 ? 'No published programs yet' : 'Nothing in this filter'}
            </p>
            <p className="mt-1 text-sm text-mute">
              {listings.length === 0
                ? 'Check back soon — this partner is still setting up their catalog.'
                : 'Try another program type.'}
            </p>
            <Link to="/listings" className="sv-btn-primary mt-5 inline-flex">
              Browse all programs
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                index={index}
                comparing={hasCompare(listing.id)}
                onCompare={() => toggleCompare(listing.id)}
              />
            ))}
          </div>
        )}
      </section>
    </MarketplaceShell>
  );
}
