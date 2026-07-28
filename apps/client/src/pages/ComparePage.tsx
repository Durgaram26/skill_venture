import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ListingSummary } from '@skillventures/shared-types';
import { MarketplaceShell } from '../components/AppShell';
import { LazyImage } from '../components/LazyImage';
import { api, ApiError } from '../lib/api';
import { useCompareStore } from '../features/compare/compareStore';

const TYPE_TINT: Record<string, string> = {
  course: 'from-[#7c3aed] to-[#a78bfa]',
  bootcamp: 'from-[#111827] to-[#7c3aed]',
  hackathon: 'from-[#1e1b2e] to-[#f59e0b]',
};

type RowDef = {
  label: string;
  value: (l: ListingSummary) => string;
  render?: (l: ListingSummary) => ReactNode;
};

type Section = { title: string; rows: RowDef[] };

function feeLabel(l: ListingSummary) {
  return l.fee.isFree ? 'Free' : `₹${l.fee.amount.toLocaleString('en-IN')}`;
}

function YesNo({ value }: { value: boolean }) {
  return (
    <span className={`sv-compare-pill ${value ? 'yes' : 'no'}`}>{value ? 'Yes' : 'No'}</span>
  );
}

function CompareColumnHeader({
  listing,
  onRemove,
}: {
  listing: ListingSummary;
  onRemove: () => void;
}) {
  const cover = listing.images?.[0];
  const tint = TYPE_TINT[listing.type] ?? TYPE_TINT.course;

  return (
    <div className="min-w-[10rem] max-w-[14rem]">
      <div className="sv-compare-slot-thumb mb-2.5">
        {cover ? (
          <LazyImage src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${tint}`} aria-hidden />
        )}
      </div>
      <span className="sv-stamp mb-2 border-teal text-teal">{listing.type}</span>
      <Link
        to={`/listings/${listing.slug}`}
        className="block font-display text-base font-bold leading-snug tracking-tight text-ink hover:text-teal"
      >
        {listing.title}
      </Link>
      <p className="mt-1.5 font-display text-lg font-extrabold text-ink">{feeLabel(listing)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to={`/listings/${listing.slug}`} className="sv-btn-primary text-xs">
          View
        </Link>
        <button type="button" className="sv-btn-ghost text-xs" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}

function EmptySlot({ index }: { index: number }) {
  return (
    <div className="sv-compare-slot">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-line bg-paper font-display text-sm font-bold text-mute">
        {index + 1}
      </div>
      <div>
        <p className="text-sm font-semibold text-mute">Empty slot</p>
        <Link to="/listings" className="mt-0.5 inline-block text-xs font-semibold text-teal hover:underline">
          Add from Explore →
        </Link>
      </div>
    </div>
  );
}

export function ComparePage() {
  const ids = useCompareStore((s) => s.ids);
  const clear = useCompareStore((s) => s.clear);
  const toggle = useCompareStore((s) => s.toggle);
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void api
      .compareListings(ids)
      .then((data) => setItems(data.items))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Compare failed');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [ids]);

  const sections: Section[] = useMemo(
    () => [
      {
        title: 'Overview',
        rows: [
          { label: 'Category', value: (l) => l.category },
          {
            label: 'Rating',
            value: (l) => `${l.rating.avg.toFixed(1)} (${l.rating.count} reviews)`,
          },
        ],
      },
      {
        title: 'Logistics',
        rows: [
          { label: 'Mode', value: (l) => l.mode },
          { label: 'Duration', value: (l) => `${l.duration.value} ${l.duration.unit}` },
          { label: 'City', value: (l) => l.location?.city ?? 'Remote / online' },
        ],
      },
      {
        title: 'Outcomes',
        rows: [
          {
            label: 'Placement support',
            value: (l) => (l.placementSupport ? 'Yes' : 'No'),
            render: (l) => <YesNo value={l.placementSupport} />,
          },
          {
            label: 'Certificate',
            value: (l) => (l.certificateProvided ? 'Yes' : 'No'),
            render: (l) => <YesNo value={l.certificateProvided} />,
          },
          {
            label: 'Fee',
            value: feeLabel,
            render: (l) => <span className="sv-compare-pill fee">{feeLabel(l)}</span>,
          },
        ],
      },
      {
        title: 'Type details',
        rows: [
          {
            label: 'Bootcamp start',
            value: (l) =>
              l.bootcamp?.startDate
                ? new Date(l.bootcamp.startDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—',
          },
          {
            label: 'Hackathon prize',
            value: (l) =>
              l.hackathon?.prizePool != null
                ? `₹${l.hackathon.prizePool.toLocaleString('en-IN')}`
                : '—',
          },
        ],
      },
    ],
    [],
  );

  const listingsById = useMemo(() => new Map(items.map((l) => [l.id, l])), [items]);
  const orderedItems = useMemo(
    () => ids.map((id) => listingsById.get(id)).filter(Boolean) as ListingSummary[],
    [ids, listingsById],
  );

  function rowDiffers(row: RowDef) {
    if (orderedItems.length < 2) return false;
    const first = row.value(orderedItems[0]!);
    return orderedItems.some((l) => row.value(l) !== first);
  }

  const slots = [0, 1, 2].map((i) => orderedItems[i] ?? null);

  return (
    <MarketplaceShell>
      <header className="mb-6 animate-rise md:mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">Decision desk</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
              Compare programs
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-mute">
              Line up 2–3 programs side by side. Differences are highlighted so you can decide faster.
            </p>
          </div>
          {ids.length > 0 ? (
            <button type="button" onClick={clear} className="sv-btn-ghost text-xs">
              Clear all ({ids.length})
            </button>
          ) : null}
        </div>
      </header>

      {/* Selection progress */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {loading && ids.length >= 2
          ? [
              ...ids.map((id) => (
                <div key={id} className="sv-compare-slot is-filled animate-pulse">
                  <div className="sv-compare-slot-thumb bg-line" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-line" />
                    <div className="h-4 w-1/2 rounded bg-line/80" />
                  </div>
                </div>
              )),
              ...Array.from({ length: Math.max(0, 3 - ids.length) }).map((_, i) => (
                <EmptySlot key={`load-empty-${i}`} index={ids.length + i} />
              )),
            ]
          : slots.map((listing, i) =>
              listing ? (
                <div key={listing.id} className="sv-compare-slot is-filled is-card animate-course-in">
                  <CompareColumnHeader listing={listing} onRemove={() => toggle(listing.id)} />
                </div>
              ) : (
                <EmptySlot key={`empty-${i}`} index={i} />
              ),
            )}
      </div>

      <p className="mb-4 text-sm font-semibold text-ink">
        {ids.length === 0
          ? 'No programs selected yet'
          : ids.length === 1
            ? '1 of 2 minimum — add one more to compare'
            : `${ids.length} of 3 selected`}
      </p>

      {error ? (
        <p className="mb-4 rounded-lg bg-spark-soft px-4 py-3 text-sm font-semibold text-[#b45309]" role="alert">
          {error}
        </p>
      ) : null}

      {ids.length < 2 ? (
        <div className="sv-ticket animate-course-in rounded-md p-10 text-center">
          <img src="/images/empty-listings.svg" alt="" className="mx-auto mb-4 max-h-36 w-auto opacity-90" />
          <p className="font-display text-xl font-bold">Pick at least two programs</p>
          <p className="mt-2 text-sm text-mute">
            Tap <strong>Compare</strong> on any program card in Explore, then come back here.
          </p>
          <Link to="/listings" className="sv-btn-primary mt-5 inline-flex">
            Browse programs
          </Link>
        </div>
      ) : loading ? (
        <div className="sv-compare-shell animate-pulse p-6">
          <div className="h-8 w-1/3 rounded bg-line" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-line/70" />
            ))}
          </div>
        </div>
      ) : orderedItems.length >= 2 ? (
        <div className="sv-compare-shell animate-rise">
          <div className="border-b border-line bg-chalk px-4 py-3 sm:px-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-mute">Side-by-side</p>
            <p className="mt-0.5 text-sm text-mute">
              Highlighted rows differ between your picks.
            </p>
          </div>
          <div className="sv-compare-table-wrap">
            <table className="sv-compare-table">
              <thead>
                <tr>
                  <th scope="col">Attribute</th>
                  {orderedItems.map((l) => (
                    <th key={l.id} scope="col">
                      <span className="line-clamp-2 font-display text-sm font-bold text-ink">
                        {l.title}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <Fragment key={section.title}>
                    <tr className="section-row">
                      <td colSpan={orderedItems.length + 1}>{section.title}</td>
                    </tr>
                    {section.rows.map((row) => {
                      const diff = rowDiffers(row);
                      return (
                        <tr key={row.label} className="data-row">
                          <td>{row.label}</td>
                          {orderedItems.map((l) => (
                            <td key={l.id} className={diff ? 'is-diff capitalize' : 'capitalize'}>
                              {row.render ? row.render(l) : row.value(l)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-chalk px-4 py-4 sm:px-5">
            <p className="text-sm text-mute">Ready to choose?</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/listings" className="sv-btn-ghost text-xs">
                Add another
              </Link>
              {orderedItems[0] ? (
                <Link to={`/listings/${orderedItems[0].slug}`} className="sv-btn-primary text-xs">
                  View top pick
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </MarketplaceShell>
  );
}
