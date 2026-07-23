import type { ListingSummary } from '@skillventures/shared-types';

export type ListingDraft = {
  title: string;
  type: 'course' | 'bootcamp' | 'hackathon';
  description: string;
  category: string;
  amount: number;
  mode: 'online' | 'offline' | 'hybrid';
  durationValue: number;
  durationUnit: 'days' | 'weeks' | 'months' | 'hours';
  city: string;
  state: string;
  eligibility?: string;
  placementSupport: boolean;
  certificateProvided: boolean;
  coverUrl: string | null;
  institutionName: string;
  bootcampStart?: string;
  bootcampEnd?: string;
  bootcampSessionMode?: string;
  bootcampSeats?: string;
  hackathonStart?: string;
  hackathonEnd?: string;
  hackathonPrizePool?: string;
  hackathonTeamSize?: string;
  hackathonSponsors?: string;
};

export const EMPTY_LISTING_DRAFT: ListingDraft = {
  title: '',
  type: 'course',
  description: '',
  category: '',
  amount: 0,
  mode: 'online',
  durationValue: 4,
  durationUnit: 'weeks',
  city: '',
  state: '',
  placementSupport: false,
  certificateProvided: false,
  coverUrl: null,
  institutionName: 'Your institution',
};

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : '';
}

export function listingToDraft(listing: ListingSummary, institutionName: string): ListingDraft {
  return {
    title: listing.title,
    type: listing.type,
    description: listing.description,
    category: listing.category,
    amount: listing.fee.amount,
    mode: listing.mode,
    durationValue: listing.duration.value,
    durationUnit: listing.duration.unit,
    city: listing.location?.city ?? '',
    state: listing.location?.state ?? '',
    eligibility: listing.eligibility ?? '',
    placementSupport: listing.placementSupport,
    certificateProvided: listing.certificateProvided,
    coverUrl: listing.images?.[0] ?? null,
    institutionName,
    bootcampStart: toDateInput(listing.bootcamp?.startDate),
    bootcampEnd: toDateInput(listing.bootcamp?.endDate),
    bootcampSessionMode: listing.bootcamp?.sessionMode ?? '',
    bootcampSeats:
      listing.bootcamp?.seatsAvailable != null ? String(listing.bootcamp.seatsAvailable) : '',
    hackathonStart: toDateInput(listing.hackathon?.startDate),
    hackathonEnd: toDateInput(listing.hackathon?.endDate),
    hackathonPrizePool:
      listing.hackathon?.prizePool != null ? String(listing.hackathon.prizePool) : '',
    hackathonTeamSize:
      listing.hackathon?.teamSizeMax != null ? String(listing.hackathon.teamSizeMax) : '',
    hackathonSponsors: listing.hackathon?.sponsors?.join(', ') ?? '',
  };
}

export function buildListingPayload(
  draft: ListingDraft,
  imageUrls: string[],
  options: { submitForReview: boolean },
) {
  const payload: Record<string, unknown> = {
    type: draft.type,
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category.trim(),
    fee: { amount: draft.amount, currency: 'INR', isFree: draft.amount === 0 },
    duration: {
      value: draft.durationValue,
      unit: draft.durationUnit,
    },
    mode: draft.mode,
    location: {
      city: draft.city.trim() || undefined,
      state: draft.state.trim() || undefined,
    },
    eligibility: draft.eligibility?.trim() || undefined,
    placementSupport: draft.placementSupport,
    certificateProvided: draft.certificateProvided,
    submitForReview: options.submitForReview,
    images: imageUrls.length ? imageUrls : [],
  };

  if (draft.type === 'bootcamp') {
    payload.bootcamp = {
      startDate: draft.bootcampStart || undefined,
      endDate: draft.bootcampEnd || undefined,
      sessionMode: draft.bootcampSessionMode?.trim() || undefined,
      seatsAvailable: draft.bootcampSeats ? Number(draft.bootcampSeats) : undefined,
    };
  }

  if (draft.type === 'hackathon') {
    const sponsors = (draft.hackathonSponsors ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    payload.hackathon = {
      startDate: draft.hackathonStart || undefined,
      endDate: draft.hackathonEnd || undefined,
      prizePool: draft.hackathonPrizePool ? Number(draft.hackathonPrizePool) : undefined,
      teamSizeMax: draft.hackathonTeamSize ? Number(draft.hackathonTeamSize) : undefined,
      sponsors,
    };
  }

  return payload;
}
