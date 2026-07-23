import type { ListingSummary } from '@skillventures/shared-types';
import { Link } from 'react-router-dom';
import { LazyImage } from './LazyImage';

const TYPE_TINT: Record<string, string> = {
  course: 'from-[#0D7A6F] to-[#2BB5A5]',
  bootcamp: 'from-[#102A28] to-[#0D7A6F]',
  hackathon: 'from-[#06141F] to-[#D9773A]',
};

function Stars({ avg }: { avg: number }) {
  const full = Math.round(avg);
  return (
    <span className="inline-flex items-center gap-0.5 text-spark" aria-label={`${avg} stars`}>
      {'★★★★★'.slice(0, full)}
      <span className="text-line">{'★★★★★'.slice(full)}</span>
      <span className="ml-1 text-xs font-semibold text-mute">{avg.toFixed(1)}</span>
    </span>
  );
}

export function ListingCard({
  listing,
  onCompare,
  comparing,
  index = 0,
  animate = true,
}: {
  listing: ListingSummary;
  onCompare?: () => void;
  comparing?: boolean;
  /** Stagger delay index for entrance animation */
  index?: number;
  animate?: boolean;
}) {
  const tint = TYPE_TINT[listing.type] ?? TYPE_TINT.course;
  const cover = listing.images?.[0];
  const delayMs = Math.min(index, 12) * 55;

  return (
    <article
      className={`sv-ticket sv-listing-card group flex flex-col overflow-hidden rounded-md ${
        animate ? 'animate-course-in' : ''
      }`}
      style={animate ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <Link
        to={`/listings/${listing.slug}`}
        className="relative block aspect-[16/10] overflow-hidden border-b border-dashed border-ink/25"
      >
        {cover ? (
          <LazyImage
            src={cover}
            alt=""
            className="sv-listing-cover absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className={`sv-listing-cover absolute inset-0 bg-gradient-to-br ${tint}`}
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-void/20 to-transparent transition-opacity duration-300 group-hover:opacity-95" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="sv-stamp border-white/80 text-white">{listing.type}</span>
          {listing.isFeatured ? (
            <span className="sv-stamp animate-stamp border-spark bg-void/40 text-spark">Featured</span>
          ) : null}
        </div>
        <div className="absolute bottom-3 left-3 right-3 transition-transform duration-300 group-hover:translate-y-[-2px]">
          <p className="line-clamp-2 font-display text-lg font-bold leading-snug tracking-tight text-white">
            {listing.title}
          </p>
        </div>
      </Link>

      <div className="sv-listing-body flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">
            {listing.category}
          </p>
          <span className="rounded-full border border-line bg-chalk px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mute">
            {listing.mode}
          </span>
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed text-mute">{listing.description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed border-line pt-3">
          <div>
            <Stars avg={listing.rating.avg || 0} />
            <p className="mt-0.5 text-xs text-mute">
              {listing.location?.city ? listing.location.city : 'Remote-friendly'}
            </p>
          </div>
          <p className="font-display text-xl font-extrabold tracking-tight text-ink transition-colors duration-200 group-hover:text-teal">
            {listing.fee.isFree ? 'Free' : `₹${listing.fee.amount.toLocaleString('en-IN')}`}
          </p>
        </div>
        <div className="mt-1 flex gap-2">
          <Link to={`/listings/${listing.slug}`} className="sv-btn-primary flex-1 text-center text-xs">
            View program
          </Link>
          {onCompare ? (
            <button
              type="button"
              onClick={onCompare}
              aria-pressed={comparing}
              className={`sv-btn-ghost text-xs ${
                comparing ? 'border-teal bg-teal-soft text-teal' : ''
              }`}
            >
              {comparing ? 'Added ✓' : 'Compare'}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
