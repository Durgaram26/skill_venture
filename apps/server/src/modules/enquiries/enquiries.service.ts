import type { FilterQuery } from 'mongoose';
import type { EnquiryStatus, EnquirySummary } from '@skillventures/shared-types';
import { Enquiry, type EnquiryDocument } from '../../models/Enquiry.js';
import { Listing } from '../../models/Listing.js';
import { Institution } from '../../models/Institution.js';
import { User } from '../../models/User.js';
import { AppError } from '../../utils/AppError.js';
import { paginatedResult, parsePagination } from '../../utils/helpers.js';
import { notifyNewEnquiry } from '../../jobs/notifications.js';
import type { CreateEnquiryInput, EnquiryListQuery } from './enquiries.validation.js';

function toEnquirySummary(
  doc: EnquiryDocument,
  listing?: { id: string; title: string; slug: string; type: string } | null,
): EnquirySummary {
  return {
    id: String(doc._id),
    studentId: doc.studentId ? String(doc.studentId) : null,
    listingId: String(doc.listingId),
    institutionId: String(doc.institutionId),
    message: doc.message,
    contactInfo: {
      name: doc.contactInfo.name,
      phone: doc.contactInfo.phone,
      email: doc.contactInfo.email,
    },
    status: doc.status as EnquiryStatus,
    createdAt: (doc as EnquiryDocument & { createdAt: Date }).createdAt.toISOString(),
    updatedAt: (doc as EnquiryDocument & { updatedAt: Date }).updatedAt.toISOString(),
    listing: listing
      ? {
          id: listing.id,
          title: listing.title,
          slug: listing.slug,
          type: listing.type as EnquirySummary['listing'] extends undefined
            ? never
            : NonNullable<EnquirySummary['listing']>['type'],
        }
      : undefined,
  };
}

export async function createEnquiry(studentId: string | null, input: CreateEnquiryInput) {
  const listing = await Listing.findById(input.listingId);
  if (!listing || listing.status !== 'published') {
    throw new AppError('Listing not available for enquiry', 404, 'LISTING_NOT_FOUND');
  }

  let contactInfo: { name: string; phone: string; email: string };

  if (studentId) {
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      throw new AppError('Only students can create enquiries', 403, 'FORBIDDEN');
    }
    contactInfo = input.contactInfo ?? {
      name: student.name,
      phone: student.phone ?? '',
      email: student.email,
    };

    // One open enquiry per student per listing.
    const existing = await Enquiry.findOne({
      studentId,
      listingId: listing._id,
      status: { $in: ['new', 'contacted'] },
    });
    if (existing) {
      throw new AppError(
        'You already have an open enquiry for this listing',
        409,
        'ENQUIRY_EXISTS',
      );
    }
  } else {
    // Guest enquiry — contact info is mandatory.
    if (!input.contactInfo) {
      throw new AppError(
        'Name, email, and phone are required to enquire',
        400,
        'CONTACT_INFO_REQUIRED',
      );
    }
    contactInfo = input.contactInfo;

    // One open guest enquiry per email per listing (basic dedupe).
    const existing = await Enquiry.findOne({
      studentId: null,
      listingId: listing._id,
      'contactInfo.email': contactInfo.email,
      status: { $in: ['new', 'contacted'] },
    });
    if (existing) {
      throw new AppError(
        'An enquiry from this email is already open for this listing',
        409,
        'ENQUIRY_EXISTS',
      );
    }
  }

  if (!contactInfo.phone) {
    throw new AppError(
      'Phone number required — add it to your profile or enquiry form',
      400,
      'PHONE_REQUIRED',
    );
  }

  const enquiry = await Enquiry.create({
    studentId: studentId ?? null,
    listingId: listing._id,
    institutionId: listing.institutionId,
    message: input.message,
    contactInfo,
    status: 'new',
  });

  await Listing.updateOne({ _id: listing._id }, { $inc: { 'stats.enquiries': 1 } });

  const institution = await Institution.findById(listing.institutionId);
  if (institution) {
    await notifyNewEnquiry({
      institutionUserId: institution.userId,
      studentName: contactInfo.name,
      listingTitle: listing.title,
      enquiryId: enquiry._id,
    });
  }

  return toEnquirySummary(enquiry, {
    id: String(listing._id),
    title: listing.title,
    slug: listing.slug,
    type: listing.type,
  });
}

export async function listStudentEnquiries(studentId: string, query: EnquiryListQuery) {
  const { page, limit, skip } = parsePagination(query);
  const filter: FilterQuery<EnquiryDocument> = { studentId };
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Enquiry.countDocuments(filter),
  ]);

  const listingIds = items.map((e) => e.listingId);
  const listings = await Listing.find({ _id: { $in: listingIds } }).lean();
  const listingMap = new Map(listings.map((l) => [String(l._id), l]));

  return paginatedResult(
    items.map((e) => {
      const l = listingMap.get(String(e.listingId));
      return toEnquirySummary(
        e,
        l ? { id: String(l._id), title: l.title, slug: l.slug, type: l.type } : null,
      );
    }),
    total,
    page,
    limit,
  );
}

export async function listInstitutionEnquiries(userId: string, query: EnquiryListQuery) {
  const institution = await Institution.findOne({ userId });
  if (!institution) {
    throw new AppError('Institution profile not found', 404, 'INSTITUTION_NOT_FOUND');
  }

  const { page, limit, skip } = parsePagination(query);
  const filter: FilterQuery<EnquiryDocument> = { institutionId: institution._id };
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Enquiry.countDocuments(filter),
  ]);

  const listingIds = items.map((e) => e.listingId);
  const listings = await Listing.find({ _id: { $in: listingIds } }).lean();
  const listingMap = new Map(listings.map((l) => [String(l._id), l]));

  return paginatedResult(
    items.map((e) => {
      const l = listingMap.get(String(e.listingId));
      return toEnquirySummary(
        e,
        l ? { id: String(l._id), title: l.title, slug: l.slug, type: l.type } : null,
      );
    }),
    total,
    page,
    limit,
  );
}

export async function updateEnquiryStatus(
  userId: string,
  enquiryId: string,
  status: EnquiryStatus,
) {
  const institution = await Institution.findOne({ userId });
  if (!institution) {
    throw new AppError('Institution profile not found', 404, 'INSTITUTION_NOT_FOUND');
  }

  const enquiry = await Enquiry.findOne({
    _id: enquiryId,
    institutionId: institution._id,
  });
  if (!enquiry) {
    throw new AppError('Enquiry not found', 404, 'ENQUIRY_NOT_FOUND');
  }

  enquiry.status = status;
  await enquiry.save();

  const listing = await Listing.findById(enquiry.listingId).lean();
  return toEnquirySummary(
    enquiry,
    listing
      ? {
          id: String(listing._id),
          title: listing.title,
          slug: listing.slug,
          type: listing.type,
        }
      : null,
  );
}
