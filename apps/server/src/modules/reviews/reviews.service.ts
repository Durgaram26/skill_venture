import { Types } from 'mongoose';
import { Review } from '../../models/Review.js';
import { Enquiry } from '../../models/Enquiry.js';
import { Listing } from '../../models/Listing.js';
import { Institution } from '../../models/Institution.js';
import { AppError } from '../../utils/AppError.js';
import type { CreateReviewInput } from './reviews.validation.js';

const PROFANITY = /\b(fuck|shit|asshole|bastard)\b/i;

function toReview(doc: {
  _id: { toString(): string };
  studentId: { toString(): string };
  listingId: { toString(): string };
  institutionId: { toString(): string };
  rating: number;
  comment?: string | null;
  isVerifiedApplicant: boolean;
  institutionReply?: { text: string; repliedAt: Date } | null;
  moderationStatus: string;
  createdAt: Date;
}) {
  return {
    id: String(doc._id),
    studentId: String(doc.studentId),
    listingId: String(doc.listingId),
    institutionId: String(doc.institutionId),
    rating: doc.rating,
    comment: doc.comment ?? undefined,
    isVerifiedApplicant: doc.isVerifiedApplicant,
    institutionReply: doc.institutionReply
      ? {
          text: doc.institutionReply.text,
          repliedAt: doc.institutionReply.repliedAt.toISOString(),
        }
      : undefined,
    moderationStatus: doc.moderationStatus,
    createdAt: doc.createdAt.toISOString(),
  };
}

async function recomputeListingRating(listingId: string) {
  const oid = new Types.ObjectId(listingId);
  const result = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { listingId: oid, moderationStatus: 'visible', isVerifiedApplicant: true } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = result[0]?.avg ?? 0;
  const count = result[0]?.count ?? 0;
  await Listing.updateOne(
    { _id: oid },
    { $set: { 'rating.avg': Math.round(avg * 10) / 10, 'rating.count': count } },
  );
}

async function recomputeInstitutionRating(institutionId: string) {
  const oid = new Types.ObjectId(institutionId);
  const result = await Review.aggregate<{ avg: number; count: number }>([
    {
      $match: { institutionId: oid, moderationStatus: 'visible', isVerifiedApplicant: true },
    },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = result[0]?.avg ?? 0;
  const count = result[0]?.count ?? 0;
  await Institution.updateOne(
    { _id: oid },
    { $set: { 'rating.avg': Math.round(avg * 10) / 10, 'rating.count': count } },
  );
}

export async function createReview(studentId: string, input: CreateReviewInput) {
  const listing = await Listing.findById(input.listingId);
  if (!listing || listing.status !== 'published') {
    throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  }

  // Integrity rule (§6 / §9.3): only converted enquiries are verified applicants
  const converted = await Enquiry.findOne({
    studentId,
    listingId: listing._id,
    status: 'converted',
  });
  if (!converted) {
    throw new AppError(
      'Only students with a converted enrolment can leave a verified review',
      403,
      'NOT_VERIFIED_APPLICANT',
    );
  }

  let moderationStatus: 'visible' | 'flagged' = 'visible';
  const comment = input.comment?.trim() ?? '';
  if ((input.rating === 1 || input.rating === 5) && comment.length < 10) {
    moderationStatus = 'flagged';
  }
  if (comment && PROFANITY.test(comment)) {
    moderationStatus = 'flagged';
  }

  try {
    const review = await Review.create({
      studentId,
      listingId: listing._id,
      institutionId: listing.institutionId,
      rating: input.rating,
      comment: comment || undefined,
      isVerifiedApplicant: true,
      moderationStatus,
    });

    if (moderationStatus === 'visible') {
      await recomputeListingRating(String(listing._id));
      await recomputeInstitutionRating(String(listing.institutionId));
    }

    return toReview(review as typeof review & { createdAt: Date });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError('You already reviewed this listing', 409, 'REVIEW_EXISTS');
    }
    throw error;
  }
}

export async function listListingReviews(listingId: string) {
  const reviews = await Review.find({
    listingId,
    moderationStatus: 'visible',
  }).sort({ createdAt: -1 });

  return reviews.map((r) => toReview(r as typeof r & { createdAt: Date }));
}

export async function replyToReview(userId: string, reviewId: string, text: string) {
  const institution = await Institution.findOne({ userId });
  if (!institution) {
    throw new AppError('Institution profile not found', 404, 'INSTITUTION_NOT_FOUND');
  }

  const review = await Review.findOne({
    _id: reviewId,
    institutionId: institution._id,
  });
  if (!review) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  review.institutionReply = { text, repliedAt: new Date() };
  await review.save();
  return toReview(review as typeof review & { createdAt: Date });
}
