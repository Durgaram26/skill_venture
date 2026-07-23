import type { FilterQuery } from 'mongoose';
import type { ListingSummary } from '@skillventures/shared-types';
import { Listing, type ListingDocument } from '../../models/Listing.js';
import { Institution } from '../../models/Institution.js';
import { AppError } from '../../utils/AppError.js';
import { paginatedResult, parsePagination, uniqueSlug } from '../../utils/helpers.js';
import { buildListingSearchFilter, institutionNamePattern, mergeListingAndInstitutionFilter } from '../../utils/listingSearch.js';
import type {
  CreateListingInput,
  ListingListQuery,
  UpdateListingInput,
} from './listings.validation.js';

export function toListingSummary(doc: ListingDocument): ListingSummary {
  return {
    id: String(doc._id),
    institutionId: String(doc.institutionId),
    type: doc.type,
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    category: doc.category,
    subCategory: doc.subCategory ?? undefined,
    fee: {
      amount: doc.fee.amount,
      currency: doc.fee.currency ?? 'INR',
      isFree: Boolean(doc.fee.isFree),
    },
    duration: {
      value: doc.duration.value,
      unit: doc.duration.unit,
    },
    mode: doc.mode,
    location: doc.location
      ? {
          city: doc.location.city ?? undefined,
          state: doc.location.state ?? undefined,
          address: doc.location.address ?? undefined,
        }
      : undefined,
    eligibility: doc.eligibility ?? undefined,
    curriculum: (doc.curriculum ?? []).map((c) => ({
      title: c.title,
      description: c.description ?? undefined,
    })),
    placementSupport: Boolean(doc.placementSupport),
    certificateProvided: Boolean(doc.certificateProvided),
    status: doc.status,
    isFeatured: Boolean(doc.isFeatured),
    bootcamp: doc.bootcamp
      ? {
          startDate: doc.bootcamp.startDate
            ? new Date(doc.bootcamp.startDate).toISOString()
            : undefined,
          endDate: doc.bootcamp.endDate ? new Date(doc.bootcamp.endDate).toISOString() : undefined,
          sessionMode: doc.bootcamp.sessionMode ?? undefined,
          seatsAvailable: doc.bootcamp.seatsAvailable ?? undefined,
        }
      : undefined,
    hackathon: doc.hackathon
      ? {
          startDate: doc.hackathon.startDate
            ? new Date(doc.hackathon.startDate).toISOString()
            : undefined,
          endDate: doc.hackathon.endDate
            ? new Date(doc.hackathon.endDate).toISOString()
            : undefined,
          prizePool: doc.hackathon.prizePool ?? undefined,
          teamSizeMax: doc.hackathon.teamSizeMax ?? undefined,
          sponsors: doc.hackathon.sponsors ?? [],
        }
      : undefined,
    stats: {
      views: doc.stats?.views ?? 0,
      enquiries: doc.stats?.enquiries ?? 0,
    },
    rating: {
      avg: doc.rating?.avg ?? 0,
      count: doc.rating?.count ?? 0,
    },
    images: Array.isArray(doc.images) ? doc.images.filter(Boolean) : [],
    createdAt: (doc as ListingDocument & { createdAt: Date }).createdAt.toISOString(),
    updatedAt: (doc as ListingDocument & { updatedAt: Date }).updatedAt.toISOString(),
  };
}

async function getInstitutionForUser(userId: string) {
  const institution = await Institution.findOne({ userId });
  if (!institution) {
    throw new AppError('Institution profile not found', 404, 'INSTITUTION_NOT_FOUND');
  }
  return institution;
}

export async function createListing(userId: string, input: CreateListingInput) {
  const institution = await getInstitutionForUser(userId);
  const status = input.submitForReview ? 'pending_review' : 'draft';

  const listing = await Listing.create({
    institutionId: institution._id,
    type: input.type,
    title: input.title,
    slug: uniqueSlug(input.title),
    description: input.description,
    category: input.category,
    subCategory: input.subCategory,
    fee: input.fee,
    duration: input.duration,
    mode: input.mode,
    location: input.location,
    eligibility: input.eligibility,
    curriculum: input.curriculum ?? [],
    placementSupport: input.placementSupport ?? false,
    certificateProvided: input.certificateProvided ?? false,
    images: input.images ?? [],
    bootcamp: input.bootcamp,
    hackathon: input.hackathon,
    status,
  });

  return toListingSummary(listing);
}

export async function updateListing(userId: string, listingId: string, input: UpdateListingInput) {
  const institution = await getInstitutionForUser(userId);
  const listing = await Listing.findOne({ _id: listingId, institutionId: institution._id });
  if (!listing) {
    throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  }

  if (listing.status === 'published' || listing.status === 'pending_review') {
    // Edits to live/queued listings send them back to review when content changes
    if (input.submitForReview !== false && Object.keys(input).length > 0) {
      listing.status = input.submitForReview ? 'pending_review' : listing.status;
    }
  }

  const { submitForReview, ...fields } = input;
  Object.assign(listing, fields);

  if (submitForReview === true) {
    listing.status = 'pending_review';
  }
  if (fields.title && fields.title !== listing.title) {
    listing.slug = uniqueSlug(fields.title);
  }

  await listing.save();
  return toListingSummary(listing);
}

export async function getMyListing(userId: string, listingId: string) {
  const institution = await getInstitutionForUser(userId);
  const listing = await Listing.findOne({ _id: listingId, institutionId: institution._id });
  if (!listing) {
    throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  }
  return toListingSummary(listing);
}

export async function deleteListing(userId: string, listingId: string) {
  const institution = await getInstitutionForUser(userId);
  const listing = await Listing.findOneAndDelete({
    _id: listingId,
    institutionId: institution._id,
  });
  if (!listing) {
    throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  }
  return { deleted: true };
}

export async function listMyListings(userId: string, query: ListingListQuery) {
  const institution = await getInstitutionForUser(userId);
  const { page, limit, skip } = parsePagination(query);
  const filter: FilterQuery<ListingDocument> = { institutionId: institution._id };
  if (query.type) filter.type = query.type;

  const [items, total] = await Promise.all([
    Listing.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Listing.countDocuments(filter),
  ]);

  return paginatedResult(items.map(toListingSummary), total, page, limit);
}

export async function listPublicListings(query: ListingListQuery) {
  const { page, limit, skip } = parsePagination(query);
  const filter: FilterQuery<ListingDocument> = { status: 'published' };

  if (query.type) filter.type = query.type;
  if (query.category) filter.category = new RegExp(`^${escapeRegex(query.category)}$`, 'i');
  if (query.mode) filter.mode = query.mode;
  if (query.city) filter['location.city'] = new RegExp(escapeRegex(query.city), 'i');
  if (query.rating !== undefined) filter['rating.avg'] = { $gte: query.rating };
  if (query.minFee !== undefined || query.maxFee !== undefined) {
    filter['fee.amount'] = {};
    if (query.minFee !== undefined) {
      (filter['fee.amount'] as Record<string, number>).$gte = query.minFee;
    }
    if (query.maxFee !== undefined) {
      (filter['fee.amount'] as Record<string, number>).$lte = query.maxFee;
    }
  }

  const searchQuery = query.q?.trim();
  if (searchQuery) {
    const textFilter = buildListingSearchFilter(searchQuery);
    const namePattern = institutionNamePattern(searchQuery);
    const matchingInstitutions = namePattern
      ? await Institution.find({ name: namePattern }).select('_id').limit(40).lean()
      : [];
    const searchFilter = mergeListingAndInstitutionFilter(
      textFilter,
      matchingInstitutions.map((doc) => doc._id),
    );
    if (searchFilter) Object.assign(filter, searchFilter);
  }

  const findQuery = Listing.find(filter)
    .lean()
    .skip(skip)
    .limit(limit)
    .sort({ isFeatured: -1, createdAt: -1 });

  const [items, total] = await Promise.all([findQuery.exec(), Listing.countDocuments(filter)]);
  return paginatedResult(
    items.map((doc) => toListingSummary(doc as unknown as ListingDocument)),
    total,
    page,
    limit,
  );
}

export async function searchSuggest(query: string, programLimit = 4) {
  const q = query.trim();
  if (!q) {
    return { suggestions: [], programs: [], institutions: [] };
  }

  const { getKeywordSuggestions } = await import('../../utils/searchSuggestions.js');
  const keywords = getKeywordSuggestions(q, 8);

  const namePattern = institutionNamePattern(q);
  const matchingInstitutions = namePattern
    ? await Institution.find({ name: namePattern })
        .select('_id name location verificationStatus')
        .limit(5)
        .lean()
    : [];

  const filter: FilterQuery<ListingDocument> = { status: 'published' };
  const searchFilter = mergeListingAndInstitutionFilter(
    buildListingSearchFilter(q),
    matchingInstitutions.map((doc) => doc._id),
  );
  if (searchFilter) Object.assign(filter, searchFilter);

  const items = await Listing.find(filter)
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(programLimit)
    .lean();

  const programs = items.map((doc) => toListingSummary(doc as unknown as ListingDocument));
  const titleSuggestions = programs
    .map((p) => p.title)
    .filter((title) => !keywords.some((k) => k.toLowerCase() === title.toLowerCase()));

  const institutionNames = matchingInstitutions.map((doc) => doc.name);
  const suggestions = [...new Set([...keywords, ...institutionNames, ...titleSuggestions])].slice(
    0,
    8,
  );

  const institutions = matchingInstitutions.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    city: doc.location?.city ?? '',
    state: doc.location?.state ?? '',
    verificationStatus: doc.verificationStatus,
  }));

  return { suggestions, programs, institutions };
}

export async function searchListings(q: string, pageNum?: number, limitNum?: number) {
  return listPublicListings({ q, page: pageNum, limit: limitNum });
}

export async function getListingBySlug(slug: string) {
  const listing = await Listing.findOneAndUpdate(
    { slug, status: 'published' },
    { $inc: { 'stats.views': 1 } },
    { new: true },
  );
  if (!listing) {
    throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  }

  const institution = await Institution.findById(listing.institutionId).lean();
  return {
    listing: toListingSummary(listing),
    institution: institution
      ? {
          id: String(institution._id),
          name: institution.name,
          type: institution.type,
          verificationStatus: institution.verificationStatus,
          location: institution.location,
          rating: institution.rating,
        }
      : null,
  };
}

export async function getInstitutionPublic(id: string) {
  const institution = await Institution.findById(id).lean();
  if (!institution) {
    throw new AppError('Institution not found', 404, 'INSTITUTION_NOT_FOUND');
  }
  return {
    id: String(institution._id),
    name: institution.name,
    type: institution.type,
    description: institution.description ?? undefined,
    logo: institution.logo ?? undefined,
    website: institution.website ?? undefined,
    verificationStatus: institution.verificationStatus,
    location: institution.location,
    rating: institution.rating ?? { avg: 0, count: 0 },
    subscriptionPlan: institution.subscriptionPlan,
  };
}

export async function listInstitutionPublicListings(id: string, query: ListingListQuery) {
  const institution = await Institution.findById(id).lean();
  if (!institution) {
    throw new AppError('Institution not found', 404, 'INSTITUTION_NOT_FOUND');
  }
  const { page, limit, skip } = parsePagination(query);
  const filter: FilterQuery<ListingDocument> = {
    institutionId: institution._id,
    status: 'published',
  };
  const [items, total] = await Promise.all([
    Listing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Listing.countDocuments(filter),
  ]);
  return paginatedResult(items.map(toListingSummary), total, page, limit);
}

export async function compareListings(ids: string[]) {
  const uniqueIds = [...new Set(ids)].slice(0, 3);
  if (uniqueIds.length < 2) {
    throw new AppError('Provide 2–3 listing ids to compare', 400, 'COMPARE_MIN');
  }

  const listings = await Listing.find({
    _id: { $in: uniqueIds },
    status: 'published',
  });

  if (listings.length < 2) {
    throw new AppError('At least two published listings required', 404, 'COMPARE_NOT_FOUND');
  }

  // Preserve requested order
  const map = new Map(listings.map((l) => [String(l._id), l]));
  const ordered = uniqueIds.map((id) => map.get(id)).filter(Boolean);

  return { items: ordered.map((l) => toListingSummary(l!)) };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
