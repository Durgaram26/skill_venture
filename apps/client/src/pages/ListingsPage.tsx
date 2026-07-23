import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ListingSummary } from '@skillventures/shared-types';
import { MarketplaceShell } from '../components/AppShell';
import { ListingCard } from '../components/ListingCard';
import { api, ApiError } from '../lib/api';
import { useCompareStore } from '../features/compare/compareStore';

const TYPES = [
  { value: '', label: 'All programs' },
  { value: 'course', label: 'Courses' },
  { value: 'bootcamp', label: 'Bootcamps' },
  { value: 'hackathon', label: 'Hackathons' },
] as const;

const MODES = [
  { value: '', label: 'Any mode' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

const CATEGORIES = [
  'Web Development',
  'Data Science',
  'AI',
  'Mobile',
  'Design',
  'Business',
  'Cloud',
];

const CITY_SUGGESTIONS = ['Bengaluru', 'Chennai', 'Mumbai', 'Hyderabad', 'Delhi', 'Pune', 'Remote'];

export function ListingsPage() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const toggleCompare = useCompareStore((s) => s.toggle);
  const hasCompare = useCompareStore((s) => s.has);
  const clearCompare = useCompareStore((s) => s.clear);
  const compareCount = useCompareStore((s) => s.ids.length);

  const q = params.get('q') ?? '';
  const type = params.get('type') ?? '';
  const mode = params.get('mode') ?? '';
  const city = params.get('city') ?? '';
  const category = params.get('category') ?? '';
  const freeOnly = params.get('maxFee') === '0';

  const [draftQ, setDraftQ] = useState(q);
  const [draftCity, setDraftCity] = useState(city);

  useEffect(() => {
    setDraftQ(q);
  }, [q]);
  useEffect(() => {
    setDraftCity(city);
  }, [city]);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  function toggleFree() {
    const next = new URLSearchParams(params);
    if (freeOnly) next.delete('maxFee');
    else next.set('maxFee', '0');
    setParams(next);
  }

  function clearFilters() {
    setParams(new URLSearchParams());
    setDraftQ('');
    setDraftCity('');
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (draftQ !== q) setFilter('q', draftQ.trim());
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce draft only
  }, [draftQ]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (draftCity !== city) setFilter('city', draftCity.trim());
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftCity]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const search = new URLSearchParams();
        if (q) search.set('q', q);
        if (type) search.set('type', type);
        if (mode) search.set('mode', mode);
        if (city) search.set('city', city);
        if (category) search.set('category', category);
        if (freeOnly) search.set('maxFee', '0');
        const data = await api.listListings(search);
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load listings');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [q, type, mode, city, category, freeOnly]);

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (type) {
    activeFilters.push({
      key: 'type',
      label: TYPES.find((t) => t.value === type)?.label ?? type,
      clear: () => setFilter('type', ''),
    });
  }
  if (mode) {
    activeFilters.push({
      key: 'mode',
      label: MODES.find((m) => m.value === mode)?.label ?? mode,
      clear: () => setFilter('mode', ''),
    });
  }
  if (category) {
    activeFilters.push({
      key: 'category',
      label: category,
      clear: () => setFilter('category', ''),
    });
  }
  if (city) {
    activeFilters.push({
      key: 'city',
      label: city,
      clear: () => {
        setDraftCity('');
        setFilter('city', '');
      },
    });
  }
  if (q) {
    activeFilters.push({
      key: 'q',
      label: `“${q}”`,
      clear: () => {
        setDraftQ('');
        setFilter('q', '');
      },
    });
  }
  if (freeOnly) {
    activeFilters.push({
      key: 'free',
      label: 'Free only',
      clear: () => {
        const next = new URLSearchParams(params);
        next.delete('maxFee');
        setParams(next);
      },
    });
  }

  const filterPanel = (
    <>
      <div className="sv-filter-section">
        <label className="sv-filter-label" htmlFor="explore-keyword">
          Search
        </label>
        <div className="sv-filter-search">
          <span className="sv-filter-search-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="explore-keyword"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            className="sv-input"
            placeholder="Skill, topic, or title…"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="sv-filter-section">
        <label className="sv-filter-label" htmlFor="explore-type">
          Type
        </label>
        <select
          id="explore-type"
          className="sv-filter-select"
          value={type}
          onChange={(e) => setFilter('type', e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t.value || 'all'} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sv-filter-section">
        <label className="sv-filter-label" htmlFor="explore-mode">
          Mode
        </label>
        <select
          id="explore-mode"
          className="sv-filter-select"
          value={mode}
          onChange={(e) => setFilter('mode', e.target.value)}
        >
          {MODES.map((m) => (
            <option key={m.value || 'any'} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sv-filter-section">
        <label className="sv-filter-label" htmlFor="explore-category">
          Category
        </label>
        <select
          id="explore-category"
          className="sv-filter-select"
          value={category}
          onChange={(e) => setFilter('category', e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="sv-filter-section">
        <label className="sv-filter-label" htmlFor="explore-city">
          Location
        </label>
        <input
          id="explore-city"
          list="explore-city-list"
          value={draftCity}
          onChange={(e) => setDraftCity(e.target.value)}
          className="sv-input"
          placeholder="City or Remote"
          autoComplete="off"
        />
        <datalist id="explore-city-list">
          {CITY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="sv-filter-section">
        <div className="sv-toggle-row">
          <div>
            <p>Free only</p>
            <span>Hide paid programs</span>
          </div>
          <button
            type="button"
            className="sv-toggle"
            role="switch"
            aria-checked={freeOnly}
            aria-label="Show free programs only"
            onClick={toggleFree}
          />
        </div>
      </div>

      {activeFilters.length > 0 ? (
        <div className="pt-3">
          <button type="button" className="sv-btn-ghost w-full text-xs" onClick={clearFilters}>
            Reset filters
          </button>
        </div>
      ) : null}
    </>
  );

  useEffect(() => {
    if (activeFilters.length > 0) setFiltersOpen(true);
  }, [activeFilters.length]);

  const showFilterSidebar = filtersOpen;

  return (
    <MarketplaceShell>
      <header className="mb-6 animate-rise md:mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">Catalogue</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
              Explore programs
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-mute">
              {activeFilters.length > 0
                ? 'Refine results with filters below.'
                : 'Browse all programs — open filters when you want to narrow down.'}
            </p>
          </div>
          <button
            type="button"
            className="sv-btn-ghost text-xs"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersOpen
              ? 'Hide filters'
              : `Filters${activeFilters.length ? ` (${activeFilters.length})` : ''}`}
          </button>
        </div>
      </header>

      <div className={showFilterSidebar ? 'grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8' : undefined}>
        {showFilterSidebar ? (
        <aside className="sv-filter-panel h-fit animate-rise p-4 lg:sticky lg:top-24">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-ink">Filters</p>
            {activeFilters.length > 0 ? (
              <button
                type="button"
                className="text-xs font-semibold text-teal hover:underline"
                onClick={clearFilters}
              >
                Clear
              </button>
            ) : null}
          </div>
          {filterPanel}
        </aside>
        ) : null}

        <div className={compareCount > 0 ? 'pb-32' : undefined}>
          {!filtersOpen ? (
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="sv-filter-label" htmlFor="explore-type-quick">
                  Type
                </label>
                <select
                  id="explore-type-quick"
                  className="sv-filter-select"
                  value={type}
                  onChange={(e) => setFilter('type', e.target.value)}
                >
                  {TYPES.map((t) => (
                    <option key={t.value || 'all'} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="sv-filter-label" htmlFor="explore-mode-quick">
                  Mode
                </label>
                <select
                  id="explore-mode-quick"
                  className="sv-filter-select"
                  value={mode}
                  onChange={(e) => setFilter('mode', e.target.value)}
                >
                  {MODES.map((m) => (
                    <option key={m.value || 'any'} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden sm:block">
                <label className="sv-filter-label" htmlFor="explore-category-quick">
                  Category
                </label>
                <select
                  id="explore-category-quick"
                  className="sv-filter-select"
                  value={category}
                  onChange={(e) => setFilter('category', e.target.value)}
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-ink">
                {loading
                  ? 'Finding programs…'
                  : `${items.length} program${items.length === 1 ? '' : 's'}`}
              </p>
              <p className="text-xs text-mute">
                {activeFilters.length > 0
                  ? `${activeFilters.length} filter${activeFilters.length === 1 ? '' : 's'} applied`
                  : 'Featured first · newest next'}
              </p>
            </div>
            {compareCount > 0 ? (
              <Link to="/compare" className="sv-btn-primary text-xs">
                Open compare ({compareCount})
              </Link>
            ) : null}
          </div>

          {activeFilters.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-1.5" aria-label="Active filters">
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className="sv-chip-dismiss"
                  onClick={f.clear}
                  aria-label={`Remove ${f.label} filter`}
                >
                  {f.label}
                  <span aria-hidden>×</span>
                </button>
              ))}
            </div>
          ) : null}

          {error ? (
            <p
              className="mb-4 rounded-lg bg-spark-soft px-4 py-3 text-sm font-semibold text-[#9a4f1f]"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {!loading && !error && items.length === 0 ? (
            <div className="sv-ticket animate-course-in rounded-md p-10 text-center">
              <img
                src="/images/empty-listings.svg"
                alt=""
                className="mx-auto mb-4 max-h-40 w-auto"
              />
              <p className="font-display text-xl font-bold">No exact matches</p>
              <p className="mt-2 text-sm text-mute">
                Try a program topic (like “react”) or an institution name (like “nimbus”). You can also
                clear filters and browse everything.
              </p>
              <button type="button" className="sv-btn-primary mt-4" onClick={clearFilters}>
                Show all programs
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="sv-ticket animate-pulse overflow-hidden rounded-md"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="aspect-[16/10] bg-line/70" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-1/3 rounded bg-line" />
                    <div className="h-3 w-full rounded bg-line/80" />
                    <div className="h-3 w-2/3 rounded bg-line/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <div
              key={`${q}|${type}|${mode}|${city}|${category}|${freeOnly}`}
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            >
              {items.map((item, i) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  index={i}
                  comparing={hasCompare(item.id)}
                  onCompare={() => toggleCompare(item.id)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {compareCount > 0 ? (
        <div className="sv-compare-tray" role="status">
          <p className="text-sm font-semibold">
            {compareCount} selected
            <span className="ml-1 font-normal text-white/65">· ready to compare</span>
          </p>
          <button
            type="button"
            className="rounded-full px-2 py-1 text-xs font-semibold text-white/70 hover:text-white"
            onClick={() => clearCompare()}
          >
            Clear
          </button>
          <Link to="/compare" className="sv-btn-accent text-xs">
            Compare now
          </Link>
        </div>
      ) : null}
    </MarketplaceShell>
  );
}
