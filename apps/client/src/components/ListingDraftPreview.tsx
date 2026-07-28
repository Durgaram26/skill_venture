import type { ListingSummary } from '@skillventures/shared-types';
import type { ListingDraft } from '../features/listings/listingDraft';
import { ListingCard } from './ListingCard';

const TYPE_TINT: Record<string, string> = {
  course: 'from-[#7c3aed] to-[#a78bfa]',
  bootcamp: 'from-[#111827] to-[#7c3aed]',
  hackathon: 'from-[#1e1b2e] to-[#f59e0b]',
};

function toPreviewListing(draft: ListingDraft): ListingSummary {
  return {
    id: 'preview',
    slug: 'preview',
    institutionId: 'preview',
    type: draft.type,
    title: draft.title.trim() || 'Your program title',
    description:
      draft.description.trim() || 'Your description will appear here as students browse Explore.',
    category: draft.category.trim() || 'Category',
    fee: {
      amount: draft.amount,
      currency: 'INR',
      isFree: draft.amount === 0,
    },
    duration: {
      value: draft.durationValue || 1,
      unit: draft.durationUnit,
    },
    mode: draft.mode,
    location:
      draft.city || draft.state
        ? { city: draft.city || 'City', state: draft.state || 'State' }
        : undefined,
    status: 'draft',
    rating: { avg: 0, count: 0 },
    stats: { views: 0, enquiries: 0 },
    isFeatured: false,
    placementSupport: draft.placementSupport,
    certificateProvided: draft.certificateProvided,
    images: draft.coverUrl ? [draft.coverUrl] : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function ListingDraftPreview({ draft }: { draft: ListingDraft }) {
  const listing = toPreviewListing(draft);
  const tint = TYPE_TINT[draft.type] ?? TYPE_TINT.course;
  const feeLabel = draft.amount === 0 ? 'Free' : `₹${draft.amount.toLocaleString('en-IN')}`;

  return (
    <section className="space-y-4">
      <header className="rounded-md border border-line bg-paper p-3 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Live preview</p>
        <p className="mt-0.5 text-xs text-mute">Updates as you type — this is how students will see it.</p>
      </header>

      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-mute">Explore card</p>
        <ListingCard listing={listing} animate={false} />
      </section>

      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-mute">Detail page hero</p>
        <article className="overflow-hidden rounded-md border border-line shadow-card">
          <figure className="relative aspect-[21/9] min-h-[140px] bg-gradient-to-br from-void via-ink to-teal">
            {draft.coverUrl ? (
              <img src={draft.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className={`absolute inset-0 bg-gradient-to-br ${tint}`} aria-hidden />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-void via-void/55 to-void/20" />
            <figcaption className="absolute inset-0 flex flex-col justify-end p-4">
              <p className="flex flex-wrap gap-2">
                <span className="sv-stamp border-white/80 text-white">{draft.type}</span>
                {draft.category ? (
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {draft.category}
                  </span>
                ) : null}
              </p>
              <h3 className="mt-2 line-clamp-2 font-display text-lg font-extrabold leading-tight text-white">
                {draft.title.trim() || 'Your program title'}
              </h3>
              <p className="mt-1 text-xs text-white/75">{draft.institutionName}</p>
            </figcaption>
          </figure>
          <dl className="grid grid-cols-2 gap-3 border-t border-line bg-paper p-3 text-sm">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-mute">Fee</dt>
              <dd className="font-display font-bold">{feeLabel}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-mute">Duration</dt>
              <dd className="font-semibold">
                {draft.durationValue} {draft.durationUnit}
              </dd>
            </div>
          </dl>
        </article>
      </section>
    </section>
  );
}
