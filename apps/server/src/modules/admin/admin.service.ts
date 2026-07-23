import type { FilterQuery } from 'mongoose';
import { Types } from 'mongoose';
import { Institution, type InstitutionDocument } from '../../models/Institution.js';
import { Listing, type ListingDocument } from '../../models/Listing.js';
import { Enquiry } from '../../models/Enquiry.js';
import { User, type UserDocument } from '../../models/User.js';
import { Review, type ReviewDocument } from '../../models/Review.js';
import { Subscription } from '../../models/Subscription.js';
import { PaymentOrder } from '../../models/PaymentOrder.js';
import { AuditLog } from '../../models/AuditLog.js';
import { AppError } from '../../utils/AppError.js';
import { paginatedResult, parsePagination } from '../../utils/helpers.js';
import { toListingSummary } from '../listings/listings.service.js';
import type { ModerationStatus, UserRole, VerificationStatus } from '@skillventures/shared-types';

export async function listInstitutionsForAdmin(query: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { page, limit, skip } = parsePagination(query);
  const filter: FilterQuery<InstitutionDocument> = {};
  if (query.status) {
    filter.verificationStatus = query.status as VerificationStatus;
  }

  const [items, total] = await Promise.all([
    Institution.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Institution.countDocuments(filter),
  ]);

  return paginatedResult(
    items.map((i) => ({
      id: String(i._id),
      userId: String(i.userId),
      name: i.name,
      type: i.type,
      verificationStatus: i.verificationStatus,
      location: i.location,
      website: i.website ?? undefined,
      createdAt: (i as InstitutionDocument & { createdAt: Date }).createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  );
}

export async function verifyInstitution(
  adminId: string,
  institutionId: string,
  verificationStatus: 'verified' | 'rejected',
  reason?: string,
) {
  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'INSTITUTION_NOT_FOUND');
  }

  institution.verificationStatus = verificationStatus;
  await institution.save();

  await User.updateOne(
    { _id: institution.userId },
    { $set: { isVerified: verificationStatus === 'verified' } },
  );

  await AuditLog.create({
    actorId: adminId,
    action: `institution.${verificationStatus}`,
    entityType: 'Institution',
    entityId: institution._id,
    metadata: { reason },
  });

  return {
    id: String(institution._id),
    verificationStatus: institution.verificationStatus,
  };
}

export async function listListingsForAdmin(query: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { page, limit, skip } = parsePagination(query);
  const filter: FilterQuery<ListingDocument> = {};
  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  const [items, total] = await Promise.all([
    Listing.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Listing.countDocuments(filter),
  ]);

  return paginatedResult(items.map(toListingSummary), total, page, limit);
}

export async function moderateListing(
  adminId: string,
  listingId: string,
  status: 'published' | 'rejected' | 'paused',
  reason?: string,
) {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  }

  listing.status = status;
  await listing.save();

  await AuditLog.create({
    actorId: adminId,
    action: `listing.${status}`,
    entityType: 'Listing',
    entityId: listing._id,
    metadata: { reason },
  });

  return toListingSummary(listing);
}

export async function listReviewsForAdmin(query: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { page, limit, skip } = parsePagination(query);
  const filter: FilterQuery<ReviewDocument> = {};
  if (query.status && query.status !== 'all') {
    filter.moderationStatus = query.status as ModerationStatus;
  } else if (!query.status) {
    filter.moderationStatus = 'flagged';
  }

  const [items, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ]);

  return paginatedResult(
    items.map((r) => ({
      id: String(r._id),
      studentId: String(r.studentId),
      listingId: String(r.listingId),
      institutionId: String(r.institutionId),
      rating: r.rating,
      comment: r.comment ?? undefined,
      isVerifiedApplicant: r.isVerifiedApplicant,
      moderationStatus: r.moderationStatus,
      createdAt: (r as ReviewDocument & { createdAt: Date }).createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  );
}

export async function moderateReview(
  adminId: string,
  reviewId: string,
  moderationStatus: 'visible' | 'removed',
  reason?: string,
) {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  review.moderationStatus = moderationStatus;
  await review.save();

  await AuditLog.create({
    actorId: adminId,
    action: `review.${moderationStatus}`,
    entityType: 'Review',
    entityId: review._id,
    metadata: { reason },
  });

  return {
    id: String(review._id),
    moderationStatus: review.moderationStatus,
  };
}

export async function listUsersForAdmin(query: {
  role?: string;
  banned?: string;
  page?: number;
  limit?: number;
}) {
  const { page, limit, skip } = parsePagination(query);
  const filter: FilterQuery<UserDocument> = {};
  if (query.role) {
    filter.role = query.role as UserRole;
  }
  if (query.banned === 'true') {
    filter.isBanned = true;
  } else if (query.banned === 'false') {
    filter.isBanned = false;
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-passwordHash'),
    User.countDocuments(filter),
  ]);

  return paginatedResult(
    items.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      isVerified: u.isVerified,
      isBanned: u.isBanned,
      createdAt: (u as UserDocument & { createdAt: Date }).createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  );
}

export async function setUserBanned(adminId: string, userId: string, isBanned: boolean) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  if (user.role === 'admin' || user.role === 'super_admin') {
    throw new AppError('Cannot ban admin accounts', 400, 'CANNOT_BAN_ADMIN');
  }

  user.isBanned = isBanned;
  await user.save();

  await AuditLog.create({
    actorId: adminId,
    action: isBanned ? 'user.banned' : 'user.unbanned',
    entityType: 'User',
    entityId: user._id,
  });

  return {
    id: String(user._id),
    isBanned: user.isBanned,
  };
}

export async function getAnalytics() {
  const [
    students,
    institutions,
    pendingInstitutions,
    publishedListings,
    pendingListings,
    enquiries,
    flaggedReviews,
    bannedUsers,
    activeSubscriptions,
    paidOrders,
    featuredListings,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Institution.countDocuments(),
    Institution.countDocuments({ verificationStatus: 'pending' }),
    Listing.countDocuments({ status: 'published' }),
    Listing.countDocuments({ status: 'pending_review' }),
    Enquiry.countDocuments(),
    Review.countDocuments({ moderationStatus: 'flagged' }),
    User.countDocuments({ isBanned: true }),
    Subscription.countDocuments({ status: 'active', plan: { $ne: 'free' } }),
    PaymentOrder.countDocuments({ status: 'paid' }),
    Listing.countDocuments({ isFeatured: true, status: 'published' }),
  ]);

  const revenueAgg = await PaymentOrder.aggregate<{ totalPaise: number }>([
    { $match: { status: 'paid' } },
    { $group: { _id: null, totalPaise: { $sum: '$amount' } } },
  ]);

  return {
    students,
    institutions,
    pendingInstitutions,
    publishedListings,
    pendingListings,
    enquiries,
    flaggedReviews,
    bannedUsers,
    activeSubscriptions,
    paidOrders,
    featuredListings,
    revenueInr: Math.round((revenueAgg[0]?.totalPaise ?? 0) / 100),
  };
}

function toSettingsResponse(doc: {
  heroHeadline: string;
  heroSubheadline: string;
  categories: string[];
  featureFlags?: {
    registrationsOpen?: boolean | null;
    featuredListingsEnabled?: boolean | null;
    institutionSignupsOpen?: boolean | null;
  } | null;
  updatedAt?: Date;
}) {
  const flags = doc.featureFlags ?? {};
  return {
    heroHeadline: doc.heroHeadline,
    heroSubheadline: doc.heroSubheadline,
    categories: doc.categories,
    featureFlags: {
      registrationsOpen: flags.registrationsOpen ?? true,
      featuredListingsEnabled: flags.featuredListingsEnabled ?? true,
      institutionSignupsOpen: flags.institutionSignupsOpen ?? true,
    },
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

export async function getPlatformSettings() {
  const { getOrCreatePlatformSettings } = await import('../../models/PlatformSettings.js');
  const doc = await getOrCreatePlatformSettings();
  return toSettingsResponse(doc as typeof doc & { updatedAt: Date });
}

export async function updatePlatformSettings(
  superAdminId: string,
  input: {
    heroHeadline?: string;
    heroSubheadline?: string;
    categories?: string[];
    featureFlags?: Partial<{
      registrationsOpen: boolean;
      featuredListingsEnabled: boolean;
      institutionSignupsOpen: boolean;
    }>;
  },
) {
  const { getOrCreatePlatformSettings } = await import('../../models/PlatformSettings.js');
  const doc = await getOrCreatePlatformSettings();
  if (input.heroHeadline !== undefined) doc.heroHeadline = input.heroHeadline;
  if (input.heroSubheadline !== undefined) doc.heroSubheadline = input.heroSubheadline;
  if (input.categories !== undefined) doc.categories = input.categories;
  if (input.featureFlags) {
    const current = doc.featureFlags ?? {
      registrationsOpen: true,
      featuredListingsEnabled: true,
      institutionSignupsOpen: true,
    };
    doc.featureFlags = { ...current, ...input.featureFlags };
  }
  await doc.save();

  await AuditLog.create({
    actorId: superAdminId,
    action: 'platform.settings_updated',
    entityType: 'PlatformSettings',
    entityId: doc._id,
    metadata: input,
  });

  return toSettingsResponse(doc as typeof doc & { updatedAt: Date });
}

export async function listAuditLogs(query: { page?: number; limit?: number }) {
  const { page, limit, skip } = parsePagination(query);
  const [items, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(),
  ]);

  const actorIds = [...new Set(items.map((i) => String(i.actorId)))];
  const actors = await User.find({ _id: { $in: actorIds } })
    .select('name email role')
    .lean();
  const actorMap = new Map(actors.map((a) => [String(a._id), a]));

  return paginatedResult(
    items.map((log) => {
      const actor = actorMap.get(String(log.actorId));
      return {
        id: String(log._id),
        action: log.action,
        entityType: log.entityType,
        entityId: String(log.entityId),
        metadata: log.metadata ?? undefined,
        createdAt: (log as { createdAt: Date }).createdAt.toISOString(),
        actor: actor
          ? { id: String(actor._id), name: actor.name, email: actor.email, role: actor.role }
          : undefined,
      };
    }),
    total,
    page,
    limit,
  );
}

export async function listAdminUsers() {
  const items = await User.find({ role: { $in: ['admin', 'super_admin'] } })
    .sort({ role: -1, createdAt: -1 })
    .select('-passwordHash');
  return items.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    isVerified: u.isVerified,
    createdAt: (u as UserDocument & { createdAt: Date }).createdAt.toISOString(),
  }));
}

export async function setUserRole(superAdminId: string, userId: string, role: UserRole) {
  if (role === 'institution') {
    throw new AppError('Use institution registration for institution role', 400, 'INVALID_ROLE');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (user.role === 'super_admin' && role !== 'super_admin') {
    const superCount = await User.countDocuments({ role: 'super_admin' });
    if (superCount <= 1) {
      throw new AppError('Cannot demote the last super admin', 400, 'LAST_SUPER_ADMIN');
    }
  }

  const previousRole = user.role;
  user.role = role;
  await user.save();

  await AuditLog.create({
    actorId: superAdminId,
    action: 'user.role_changed',
    entityType: 'User',
    entityId: user._id,
    metadata: { from: previousRole, to: role },
  });

  return {
    id: String(user._id),
    role: user.role,
  };
}

export async function getFinancialReport() {
  const [totals, byType, byPlan, monthly] = await Promise.all([
    PaymentOrder.aggregate<{ totalPaise: number; count: number }>([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalPaise: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    PaymentOrder.aggregate<{ _id: string; totalPaise: number; count: number }>([
      { $match: { status: 'paid' } },
      { $group: { _id: '$type', totalPaise: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Subscription.aggregate<{ _id: string; count: number }>([
      { $match: { status: 'active' } },
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]),
    PaymentOrder.aggregate<{ _id: { y: number; m: number }; totalPaise: number }>([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } },
          totalPaise: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.y': -1, '_id.m': -1 } },
      { $limit: 6 },
    ]),
  ]);

  return {
    totalRevenueInr: Math.round((totals[0]?.totalPaise ?? 0) / 100),
    paidOrderCount: totals[0]?.count ?? 0,
    revenueByType: byType.map((r) => ({
      type: r._id,
      revenueInr: Math.round(r.totalPaise / 100),
      count: r.count,
    })),
    activePlans: byPlan.map((r) => ({ plan: r._id, count: r.count })),
    monthlyRevenue: monthly
      .map((r) => ({
        month: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`,
        revenueInr: Math.round(r.totalPaise / 100),
      }))
      .reverse(),
  };
}

export async function listSupportTickets(query: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { SupportTicket } = await import('../../models/SupportTicket.js');
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, string> = {};
  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  const [items, total] = await Promise.all([
    SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SupportTicket.countDocuments(filter),
  ]);

  return paginatedResult(
    items.map((t) => ({
      id: String(t._id),
      reporterEmail: t.reporterEmail,
      reporterName: t.reporterName ?? undefined,
      subject: t.subject,
      body: t.body,
      category: t.category,
      status: t.status,
      adminNotes: t.adminNotes ?? undefined,
      createdAt: (t as { createdAt: Date }).createdAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString(),
    })),
    total,
    page,
    limit,
  );
}

export async function updateSupportTicket(
  adminId: string,
  ticketId: string,
  input: { status?: string; adminNotes?: string },
) {
  const { SupportTicket } = await import('../../models/SupportTicket.js');
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }

  if (input.status) {
    ticket.status = input.status as typeof ticket.status;
    if (input.status === 'resolved' || input.status === 'closed') {
      ticket.resolvedAt = new Date();
    }
  }
  if (input.adminNotes !== undefined) ticket.adminNotes = input.adminNotes;
  ticket.assignedToId = ticket.assignedToId ?? new Types.ObjectId(adminId);
  await ticket.save();

  await AuditLog.create({
    actorId: adminId,
    action: 'support.updated',
    entityType: 'SupportTicket',
    entityId: ticket._id,
    metadata: input,
  });

  return {
    id: String(ticket._id),
    status: ticket.status,
    adminNotes: ticket.adminNotes ?? undefined,
  };
}

export async function createSupportTicket(input: {
  reporterId?: string;
  reporterEmail: string;
  reporterName?: string;
  subject: string;
  body: string;
  category?: string;
}) {
  const { SupportTicket } = await import('../../models/SupportTicket.js');
  const ticket = await SupportTicket.create({
    reporterId: input.reporterId,
    reporterEmail: input.reporterEmail,
    reporterName: input.reporterName,
    subject: input.subject,
    body: input.body,
    category: input.category ?? 'other',
    status: 'open',
  });

  return {
    id: String(ticket._id),
    status: ticket.status,
  };
}
