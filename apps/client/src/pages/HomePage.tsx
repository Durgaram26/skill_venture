import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ListingSummary } from '@skillventures/shared-types';
import { MarketplaceShell } from '../components/AppShell';
import { ListingCard } from '../components/ListingCard';
import { api } from '../lib/api';

export function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [featured, setFeatured] = useState<ListingSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([
    'Web Development',
    'Data Science',
    'AI',
    'Mobile',
    'Design',
    'Business',
    'Cloud',
  ]);
  const [heroHeadline, setHeroHeadline] = useState('Your next program, stamped and ready.');
  const [heroSubheadline, setHeroSubheadline] = useState(
    'Discover courses, bootcamps, and hackathons from verified partners.',
  );

  useEffect(() => {
    void Promise.all([
      api.listListings(new URLSearchParams()),
      api.platformSettings().catch(() => null),
    ]).then(([listings, platform]) => {
      const sorted = [...listings.items].sort(
        (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
      );
      setFeatured(sorted.slice(0, 6));
      if (platform?.settings) {
        setCategories(platform.settings.categories);
        setHeroHeadline(platform.settings.heroHeadline);
        setHeroSubheadline(platform.settings.heroSubheadline);
      }
    });
  }, []);

  function search(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    navigate(`/listings?${params.toString()}`);
  }

  return (
    <MarketplaceShell bare>
      {/* Full-bleed hero — brand thesis + workshop atmosphere */}
      <section className="sv-hero-curve relative min-h-[88vh] overflow-hidden bg-void text-white">
        <img
          src="/images/hero-workshop.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(6,20,31,0.92) 0%, rgba(6,20,31,0.35) 18%, transparent 32%), linear-gradient(105deg, rgba(6,20,31,0.94) 0%, rgba(6,20,31,0.78) 42%, rgba(6,20,31,0.35) 68%, rgba(6,20,31,0.55) 100%)',
          }}
        />

        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 md:justify-center md:px-6 md:pb-24 md:pt-20">
          <p className="animate-rise font-display text-4xl font-extrabold tracking-tight md:text-6xl">
            Skill<span className="text-teal-bright">Ventures</span>
          </p>
          <h1
            className="mt-5 max-w-xl animate-rise font-display text-3xl font-bold leading-[1.08] tracking-tight md:text-5xl"
            style={{ animationDelay: '80ms' }}
          >
            {heroHeadline}
          </h1>
          <p
            className="mt-4 max-w-md animate-rise text-base leading-relaxed text-white/70 md:text-lg"
            style={{ animationDelay: '140ms' }}
          >
            {heroSubheadline}
          </p>

          <form
            onSubmit={search}
            className="mt-8 flex max-w-xl animate-rise flex-col gap-2 sm:flex-row"
            style={{ animationDelay: '200ms' }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="What skill are you building?"
              className="sv-input flex-1 border-0 text-base shadow-lift"
            />
            <button type="submit" className="sv-btn-accent px-8 text-base">
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2 animate-rise" style={{ animationDelay: '260ms' }}>
            {categories.map((c) => (
              <Link
                key={c}
                to={`/listings?category=${encodeURIComponent(c)}`}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur hover:border-teal-bright hover:text-teal-bright"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">Open passes</p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">
              Programs accepting enquiries
            </h2>
          </div>
          <Link
            to="/listings"
            className="text-sm font-semibold text-teal hover:underline"
            onClick={() => window.scrollTo(0, 0)}
          >
            See all →
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((l, i) => (
            <div key={l.id}>
              <ListingCard listing={l} index={i} />
            </div>
          ))}
          {featured.length === 0 ? (
            <div className="sv-ticket col-span-full rounded-md p-10 text-center">
              <p className="font-display text-xl font-bold">No open programs yet</p>
              <p className="mt-2 text-sm text-mute">
                Institutions can{' '}
                <Link className="font-semibold text-teal" to="/register?role=institution">
                  list a program
                </Link>{' '}
                and start receiving enquiries.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-y border-line bg-paper">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">How it works</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
              One enquiry. A clear pipeline.
            </h2>
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-mute">
              <li>
                <strong className="text-ink">Browse without signing up</strong> — fees, mode, and reviews first.
              </li>
              <li>
                <strong className="text-ink">Enquire once</strong> — your profile pre-fills every application.
              </li>
              <li>
                <strong className="text-ink">Track status</strong> — Sent → Contacted → Enrolled, both sides.
              </li>
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-md border border-ink bg-chalk p-6 shadow-ticket">
            <img
              src="/images/partner-illustration.png"
              alt=""
              className="mx-auto max-h-56 w-full object-contain"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <p className="mt-4 font-display text-lg font-bold text-ink">
              Verified reviews only from converted applicants — not anonymous noise.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="overflow-hidden rounded-md border border-ink bg-gradient-to-br from-ink to-void p-8 text-white shadow-ticket md:flex md:items-center md:justify-between md:p-12">
          <div className="max-w-xl">
            <p className="sv-stamp border-teal-bright text-teal-bright">Partners</p>
            <p className="mt-4 font-display text-2xl font-bold md:text-3xl">Teach on SkillVentures</p>
            <p className="mt-2 text-white/70">
              Reach students searching for your next cohort. Publish listings, manage leads, boost visibility.
            </p>
          </div>
          <Link to="/register?role=institution" className="sv-btn-accent mt-6 shrink-0 md:mt-0">
            Become a partner
          </Link>
        </div>
      </section>

      <footer className="sv-site-footer">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between md:px-6">
          <p className="font-display text-lg font-bold text-[#f1f5f4]">
            Skill<span className="sv-footer-brand-accent">Ventures</span>
          </p>
          <div className="sv-capsule-nav">
            <Link to="/listings">Explore</Link>
            <Link to="/compare">Compare</Link>
            <Link to="/register">Join</Link>
          </div>
          <p className="sv-footer-muted text-sm">© {new Date().getFullYear()} SkillVentures</p>
        </div>
      </footer>
    </MarketplaceShell>
  );
}
