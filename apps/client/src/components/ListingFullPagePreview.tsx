import type { ListingDraft } from '../features/listings/listingDraft';

const TYPE_TINT: Record<string, string> = {
  course: 'from-[#7c3aed] to-[#a78bfa]',
  bootcamp: 'from-[#111827] to-[#7c3aed]',
  hackathon: 'from-[#1e1b2e] to-[#f59e0b]',
};

export function ListingFullPagePreview({ draft }: { draft: ListingDraft }) {
  const tint = TYPE_TINT[draft.type] ?? TYPE_TINT.course;
  const feeLabel = draft.amount === 0 ? 'Free' : `₹${draft.amount.toLocaleString('en-IN')}`;
  const title = draft.title.trim() || 'Your program title';
  const description =
    draft.description.trim() || 'Your description will appear here for students browsing the program.';

  return (
    <article className="sv-listing-full-preview">
      <header className="relative overflow-hidden">
        <div className="sv-hero-curve relative aspect-[21/9] min-h-[220px] bg-gradient-to-br from-void via-ink to-teal">
          {draft.coverUrl ? (
            <img src={draft.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className={`absolute inset-0 bg-gradient-to-br ${tint}`} aria-hidden />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-void via-void/55 to-void/20" />
          <figcaption className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            <p className="flex flex-wrap gap-2">
              <span className="sv-stamp border-white/80 text-white">{draft.type}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">
                {draft.category || 'Category'}
              </span>
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-2xl font-extrabold leading-tight text-white md:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-white/75">by {draft.institutionName}</p>
            <p className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
              <span>★ New program</span>
              <span>{draft.mode}</span>
              <span className="font-display text-lg font-bold text-white">{feeLabel}</span>
            </p>
          </figcaption>
        </div>
      </header>

      <div className="grid gap-8 p-5 md:grid-cols-[1fr_280px] md:p-8">
        <section className="space-y-8">
          <section>
            <h2 className="font-display text-xl font-bold">About this program</h2>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink/85">{description}</p>
            {draft.eligibility ? (
              <p className="mt-4 rounded-xl border border-line bg-paper p-4 text-sm">
                <span className="font-semibold">Eligibility: </span>
                {draft.eligibility}
              </p>
            ) : null}
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">What you get</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['Duration', `${draft.durationValue} ${draft.durationUnit}`],
                ['Mode', draft.mode],
                ['Location', draft.city || 'Online / flexible'],
                ['Placement support', draft.placementSupport ? 'Yes' : 'No'],
                ['Certificate', draft.certificateProvided ? 'Yes' : 'No'],
                ['Fee', feeLabel],
              ].map(([key, value]) => (
                <div key={key} className="rounded-xl border border-line bg-paper px-4 py-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-mute">{key}</dt>
                  <dd className="mt-1 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {draft.type === 'bootcamp' ? (
            <section>
              <h2 className="font-display text-xl font-bold">Bootcamp schedule</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink/80">
                {draft.bootcampStart ? <li>Starts {draft.bootcampStart}</li> : null}
                {draft.bootcampEnd ? <li>Ends {draft.bootcampEnd}</li> : null}
                {draft.bootcampSessionMode ? <li>Sessions: {draft.bootcampSessionMode}</li> : null}
                {draft.bootcampSeats ? <li>Seats: {draft.bootcampSeats}</li> : null}
              </ul>
            </section>
          ) : null}

          {draft.type === 'hackathon' ? (
            <section>
              <h2 className="font-display text-xl font-bold">Hackathon details</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink/80">
                {draft.hackathonStart ? <li>Starts {draft.hackathonStart}</li> : null}
                {draft.hackathonEnd ? <li>Ends {draft.hackathonEnd}</li> : null}
                {draft.hackathonPrizePool ? (
                  <li>Prize pool: ₹{Number(draft.hackathonPrizePool).toLocaleString('en-IN')}</li>
                ) : null}
                {draft.hackathonTeamSize ? <li>Max team size: {draft.hackathonTeamSize}</li> : null}
                {draft.hackathonSponsors ? <li>Sponsors: {draft.hackathonSponsors}</li> : null}
              </ul>
            </section>
          ) : null}
        </section>

        <aside>
          <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-lift">
            <div className="border-b border-line bg-chalk px-5 py-4">
              <p className="font-display text-3xl font-extrabold">{feeLabel}</p>
              <p className="mt-1 text-sm text-mute">
                {draft.durationValue} {draft.durationUnit} · {draft.mode}
              </p>
            </div>
            <div className="space-y-3 p-5">
              <button type="button" className="sv-btn-accent w-full text-base" disabled>
                Enquire now
              </button>
              <p className="text-center text-xs text-mute">Preview only — enquiry is disabled here.</p>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
