import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ListingSummary } from '@skillventures/shared-types';
import { MarketplaceShell } from '../components/AppShell';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../features/auth/authStore';
import { useCompareStore } from '../features/compare/compareStore';
import { usePageSeo } from '../hooks/usePageSeo';
import { track } from '../lib/analytics';

export function ListingDetailPage() {
  const { slug } = useParams();
  const user = useAuthStore((s) => s.user);
  const toggleCompare = useCompareStore((s) => s.toggle);
  const inCompare = useCompareStore((s) => s.has);
  const [listing, setListing] = useState<ListingSummary | null>(null);
  const [institutionName, setInstitutionName] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [message, setMessage] = useState(
    'I am interested in this program. Please share the next steps.',
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!slug) return;
    void api
      .getListing(slug)
      .then((data) => {
        setListing(data.listing);
        setInstitutionName(data.institution?.name ?? null);
        track('listing_view', { slug: data.listing.slug, type: data.listing.type });
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Not found');
      });
  }, [slug]);

  useEffect(() => {
    if (!listing || user?.role !== 'student') return;
    void api.myBookmarks().then((data) => {
      setBookmarked(data.items.some((b) => b.listingId === listing.id));
    });
  }, [listing, user]);

  const jsonLd = useMemo(() => {
    if (!listing) return undefined;
    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: listing.title,
      description: listing.description,
      url: `${window.location.origin}/listings/${listing.slug}`,
      offers: {
        '@type': 'Offer',
        price: listing.fee.amount,
        priceCurrency: listing.fee.currency,
      },
    };
  }, [listing]);

  usePageSeo({
    title: listing ? `${listing.title} | SkillVentures` : 'SkillVentures',
    description: listing?.description.slice(0, 160) ?? 'Discover courses, bootcamps and hackathons',
    url: listing ? `${window.location.origin}/listings/${listing.slug}` : undefined,
    jsonLd,
  });

  async function enquire(event: FormEvent) {
    event.preventDefault();
    if (!listing) return;
    setStatus(null);
    setError(null);
    try {
      await api.createEnquiry({ listingId: listing.id, message });
      track('enquiry_submit', { listingId: listing.id });
      setStatus('Enquiry sent! The institution will contact you soon.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enquiry failed');
    }
  }

  async function toggleBookmark() {
    if (!listing) return;
    try {
      if (bookmarked) {
        await api.removeBookmark(listing.id);
        setBookmarked(false);
      } else {
        await api.addBookmark(listing.id);
        setBookmarked(true);
        track('bookmark_add', { listingId: listing.id });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bookmark failed');
    }
  }

  async function payAndEnroll() {
    if (!listing) return;
    setPaying(true);
    setStatus(null);
    setError(null);
    try {
      const order = await api.createEnrollmentOrder(listing.id);
      if (order.mock) {
        await api.confirmMockPayment(order.orderId);
        const net = (order.institutionPayoutPaise / 100).toLocaleString('en-IN');
        setStatus(
          `Payment successful. ₹${net} is marked for the institution (SkillVentures fee ${order.platformPercent}%).`,
        );
        track('enrollment_pay', { listingId: listing.id, mock: true });
      } else {
        setStatus(
          `Order ${order.orderId} created. Complete Razorpay Checkout with key ${order.keyId}.`,
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  }

  if (error && !listing) {
    return (
      <MarketplaceShell>
        <p className="text-spark">{error}</p>
        <Link to="/listings" className="mt-4 inline-block font-semibold text-teal">
          Back to explore
        </Link>
      </MarketplaceShell>
    );
  }

  if (!listing) {
    return (
      <MarketplaceShell>
        <div className="animate-shimmer h-64 rounded-2xl bg-gradient-to-r from-line via-paper to-line bg-[length:200%_100%]" />
      </MarketplaceShell>
    );
  }

  const feeLabel = listing.fee.isFree ? 'Free' : `₹${listing.fee.amount.toLocaleString('en-IN')}`;
  const cover = listing.images?.[0];

  return (
    <MarketplaceShell>
      {/* Hero cover */}
      <div className="relative -mx-4 mb-8 overflow-hidden md:-mx-6">
        <div className="sv-hero-curve relative aspect-[21/9] min-h-[220px] bg-gradient-to-br from-void via-ink to-teal md:min-h-[300px]">
          {cover ? (
            <img
              src={cover}
              alt=""
              className="absolute inset-0 h-full w-full animate-hero-settle object-cover"
              loading="eager"
              decoding="async"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/55 to-void/20" />
          <div className="absolute inset-0 flex animate-rise flex-col justify-end p-6 md:p-10">
            <div className="flex flex-wrap gap-2">
              <span className="sv-stamp border-white/80 text-white">{listing.type}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">
                {listing.category}
              </span>
              {listing.isFeatured ? (
                <span className="sv-stamp border-spark text-spark">Featured</span>
              ) : null}
            </div>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold leading-tight text-white md:text-5xl">
              {listing.title}
            </h1>
            {institutionName ? (
              <p className="mt-2 text-white/75">
                by{' '}
                <Link
                  className="font-semibold text-teal-bright hover:underline"
                  to={`/institutions/${listing.institutionId}`}
                >
                  {institutionName}
                </Link>
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
              <span>
                ★ {listing.rating.avg.toFixed(1)} · {listing.rating.count} reviews
              </span>
              <span>{listing.mode}</span>
              <span className="font-display text-lg font-bold text-white">{feeLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8 animate-rise">
          <section>
            <h2 className="font-display text-xl font-bold">About this program</h2>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink/85">{listing.description}</p>
            {listing.eligibility ? (
              <p className="mt-4 rounded-xl border border-line bg-paper p-4 text-sm">
                <span className="font-semibold">Eligibility: </span>
                {listing.eligibility}
              </p>
            ) : null}
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">What you get</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['Duration', `${listing.duration.value} ${listing.duration.unit}`],
                ['Mode', listing.mode],
                ['Location', listing.location?.city ?? 'Online / flexible'],
                ['Placement support', listing.placementSupport ? 'Yes' : 'No'],
                ['Certificate', listing.certificateProvided ? 'Yes' : 'No'],
                ['Fee', feeLabel],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-line bg-paper px-4 py-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-mute">{k}</dt>
                  <dd className="mt-1 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {listing.type === 'bootcamp' && listing.bootcamp ? (
            <section>
              <h2 className="font-display text-xl font-bold">Bootcamp schedule</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink/80">
                {listing.bootcamp.startDate ? (
                  <li>Starts {new Date(listing.bootcamp.startDate).toLocaleDateString()}</li>
                ) : null}
                {listing.bootcamp.endDate ? (
                  <li>Ends {new Date(listing.bootcamp.endDate).toLocaleDateString()}</li>
                ) : null}
                {listing.bootcamp.sessionMode ? <li>Sessions: {listing.bootcamp.sessionMode}</li> : null}
                {listing.bootcamp.seatsAvailable != null ? (
                  <li>Seats: {listing.bootcamp.seatsAvailable}</li>
                ) : null}
              </ul>
            </section>
          ) : null}

          {listing.type === 'hackathon' && listing.hackathon ? (
            <section>
              <h2 className="font-display text-xl font-bold">Hackathon details</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink/80">
                {listing.hackathon.startDate ? (
                  <li>Starts {new Date(listing.hackathon.startDate).toLocaleDateString()}</li>
                ) : null}
                {listing.hackathon.endDate ? (
                  <li>Ends {new Date(listing.hackathon.endDate).toLocaleDateString()}</li>
                ) : null}
                {listing.hackathon.prizePool != null ? (
                  <li>Prize pool: ₹{listing.hackathon.prizePool.toLocaleString('en-IN')}</li>
                ) : null}
                {listing.hackathon.teamSizeMax != null ? (
                  <li>Max team size: {listing.hackathon.teamSizeMax}</li>
                ) : null}
                {listing.hackathon.sponsors?.length ? (
                  <li>Sponsors: {listing.hackathon.sponsors.join(', ')}</li>
                ) : null}
              </ul>
            </section>
          ) : null}

          <ReviewsSection
            listingId={listing.id}
            rating={listing.rating}
            isStudent={user?.role === 'student'}
          />
        </div>

        {/* Sticky CTA sidebar — Coursera/Udemy pattern */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-lift">
            <div className="border-b border-line bg-chalk px-5 py-4">
              <p className="font-display text-3xl font-extrabold">{feeLabel}</p>
              <p className="mt-1 text-sm text-mute">
                {listing.duration.value} {listing.duration.unit} · {listing.mode}
              </p>
            </div>
            <div className="space-y-3 p-5">
              {user?.role === 'student' ? (
                <form onSubmit={enquire} className="space-y-3">
                  <label className="block text-sm font-semibold">
                    Message
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="sv-input mt-1"
                      required
                      minLength={10}
                    />
                  </label>
                  <button type="submit" className="sv-btn-ghost w-full text-base">
                    Enquire only
                  </button>
                  {!listing.fee.isFree && listing.fee.amount > 0 ? (
                    <button
                      type="button"
                      disabled={paying}
                      onClick={() => void payAndEnroll()}
                      className="sv-btn-accent w-full text-base disabled:opacity-60"
                    >
                      {paying ? 'Processing…' : `Pay ${feeLabel} & enroll`}
                    </button>
                  ) : null}
                  <p className="text-center text-xs text-mute">
                    {!listing.fee.isFree && listing.fee.amount > 0
                      ? 'Payment goes to the institution (minus a small SkillVentures fee). Mock checkout in local dev.'
                      : 'This program is free — enquire and the partner will follow up.'}
                  </p>
                </form>
              ) : (
                <div className="space-y-3">
                  <Link to="/login" className="sv-btn-accent block w-full text-center text-base">
                    Log in to enquire
                  </Link>
                  <p className="text-center text-xs text-mute">
                    Browse freely — sign in only when you&apos;re ready to apply.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {user?.role === 'student' ? (
                  <button type="button" onClick={() => void toggleBookmark()} className="sv-btn-ghost flex-1 text-xs">
                    {bookmarked ? 'Saved ✓' : 'Save'}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => toggleCompare(listing.id)}
                  className={`sv-btn-ghost flex-1 text-xs ${inCompare(listing.id) ? 'border-teal text-teal' : ''}`}
                >
                  {inCompare(listing.id) ? 'In compare' : 'Compare'}
                </button>
              </div>

              {status ? <p className="text-sm font-semibold text-teal">{status}</p> : null}
              {error ? <p className="text-sm text-spark">{error}</p> : null}
            </div>
          </div>
        </aside>
      </div>
    </MarketplaceShell>
  );
}

function ReviewsSection({
  listingId,
  rating,
  isStudent,
}: {
  listingId: string;
  rating: { avg: number; count: number };
  isStudent: boolean;
}) {
  const [items, setItems] = useState<
    {
      id: string;
      rating: number;
      comment?: string;
      isVerifiedApplicant: boolean;
      institutionReply?: { text: string; repliedAt: string };
      createdAt: string;
    }[]
  >([]);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void api.listReviews(listingId).then((data) => setItems(data.items));
  }, [listingId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await api.createReview({ listingId, rating: stars, comment });
      setMsg('Review submitted.');
      setComment('');
      const data = await api.listReviews(listingId);
      setItems(data.items);
    } catch (error) {
      setErr(error instanceof ApiError ? error.message : 'Could not submit review');
    }
  }

  return (
    <section className="border-t border-line pt-8">
      <h2 className="font-display text-2xl font-bold">
        Student reviews{' '}
        <span className="text-base font-normal text-mute">
          {rating.avg.toFixed(1)} · {rating.count} verified
        </span>
      </h2>

      {isStudent ? (
        <form onSubmit={submit} className="mt-4 max-w-lg space-y-3 rounded-2xl border border-line bg-paper p-4">
          <label className="block text-sm font-semibold">
            Rating
            <select value={stars} onChange={(e) => setStars(Number(e.target.value))} className="sv-input mt-1">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (verified applicants only)"
            rows={3}
            className="sv-input"
          />
          <button type="submit" className="sv-btn-primary">
            Submit review
          </button>
          {msg ? <p className="text-sm text-teal">{msg}</p> : null}
          {err ? <p className="text-sm text-spark">{err}</p> : null}
        </form>
      ) : null}

      <ul className="mt-6 space-y-4">
        {items.map((r) => (
          <li key={r.id} className="rounded-xl border border-line bg-paper p-4">
            <p className="text-sm font-semibold">
              {'★'.repeat(r.rating)}
              <span className="ml-2 text-mute">
                {r.isVerifiedApplicant ? 'Verified applicant' : ''}
              </span>
            </p>
            {r.comment ? <p className="mt-2 text-sm text-ink/80">{r.comment}</p> : null}
            {r.institutionReply ? (
              <p className="mt-3 rounded-lg bg-teal-soft/50 p-3 text-sm text-ink/75">
                <strong>Institution reply: </strong>
                {r.institutionReply.text}
              </p>
            ) : null}
          </li>
        ))}
        {items.length === 0 ? <li className="text-sm text-mute">No verified reviews yet.</li> : null}
      </ul>
    </section>
  );
}
