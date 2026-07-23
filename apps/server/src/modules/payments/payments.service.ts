import { Institution } from '../../models/Institution.js';
import { Listing } from '../../models/Listing.js';
import { Subscription } from '../../models/Subscription.js';
import { PaymentOrder } from '../../models/PaymentOrder.js';
import { Enquiry } from '../../models/Enquiry.js';
import { User } from '../../models/User.js';
import { AppError } from '../../utils/AppError.js';
import {
  ENROLLMENT_COMMISSION,
  FEATURED_BOOST,
  SUBSCRIPTION_PLANS,
  splitEnrollmentAmount,
  type PaidPlan,
} from './plans.js';
import { createRazorpayOrder, isRazorpayConfigured } from './razorpay.js';
import { env } from '../../config/env.js';
import type { CreateEnrollmentOrderInput, CreateOrderInput } from './payments.validation.js';
import mongoose from 'mongoose';
async function getInstitutionForUser(userId: string) {
  const institution = await Institution.findOne({ userId });
  if (!institution) {
    throw new AppError('Institution profile not found', 404, 'INSTITUTION_NOT_FOUND');
  }
  return institution;
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  const institution = await getInstitutionForUser(userId);

  if (input.type === 'subscription') {
    const plan = SUBSCRIPTION_PLANS[input.plan];
    const razorpayOrder = await createRazorpayOrder({
      amountPaise: plan.amountPaise,
      receipt: `sub_${institution._id}_${Date.now()}`,
      notes: {
        type: 'subscription',
        plan: input.plan,
        institutionId: String(institution._id),
      },
    });

    await PaymentOrder.create({
      institutionId: institution._id,
      type: 'subscription',
      plan: input.plan,
      amount: plan.amountPaise,
      razorpayOrderId: razorpayOrder.id,
      status: 'created',
    });

    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: env.RAZORPAY_KEY_ID ?? null,
      mock: !isRazorpayConfigured(),
      purpose: 'subscription' as const,
      plan: input.plan,
    };
  }

  const listing = await Listing.findOne({
    _id: input.listingId,
    institutionId: institution._id,
  });
  if (!listing) {
    throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  }
  if (listing.status !== 'published') {
    throw new AppError('Only published listings can be featured', 400, 'LISTING_NOT_PUBLISHED');
  }

  const days = input.days ?? FEATURED_BOOST.defaultDays;
  const razorpayOrder = await createRazorpayOrder({
    amountPaise: FEATURED_BOOST.amountPaise,
    receipt: `feat_${listing._id}_${Date.now()}`,
    notes: {
      type: 'featured',
      listingId: String(listing._id),
      institutionId: String(institution._id),
      days: String(days),
    },
  });

  await PaymentOrder.create({
    institutionId: institution._id,
    type: 'featured',
    listingId: listing._id,
    featuredDays: days,
    amount: FEATURED_BOOST.amountPaise,
    razorpayOrderId: razorpayOrder.id,
    status: 'created',
  });

  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: env.RAZORPAY_KEY_ID ?? null,
    mock: !isRazorpayConfigured(),
    purpose: 'featured' as const,
    listingId: String(listing._id),
    days,
  };
}

export async function fulfillPaidOrder(params: {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
}) {
  const order = await PaymentOrder.findOne({ razorpayOrderId: params.razorpayOrderId });
  if (!order) {
    throw new AppError('Payment order not found', 404, 'ORDER_NOT_FOUND');
  }
  if (order.status === 'paid') {
    return { alreadyProcessed: true, orderId: String(order._id) };
  }

  order.status = 'paid';
  order.razorpayPaymentId = params.razorpayPaymentId;
  await order.save();

  if (order.type === 'subscription' && order.plan) {
    const planKey = order.plan as PaidPlan;
    const plan = SUBSCRIPTION_PLANS[planKey];
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + plan.periodDays);

    await Subscription.findOneAndUpdate(
      { institutionId: order.institutionId, status: 'active' },
      { $set: { status: 'cancelled' } },
    );

    await Subscription.create({
      institutionId: order.institutionId,
      plan: planKey,
      amount: order.amount / 100,
      razorpaySubscriptionId: params.razorpayPaymentId ?? params.razorpayOrderId,
      status: 'active',
      currentPeriodEnd: periodEnd,
      invoices: [
        {
          id: params.razorpayPaymentId ?? params.razorpayOrderId,
          amount: order.amount / 100,
          paidAt: new Date(),
        },
      ],
    });

    await Institution.updateOne(
      { _id: order.institutionId },
      {
        $set: {
          subscriptionPlan: planKey,
          subscriptionExpiresAt: periodEnd,
        },
      },
    );
  }

  if (order.type === 'featured' && order.listingId) {
    const days = order.featuredDays ?? FEATURED_BOOST.defaultDays;
    const until = new Date();
    until.setDate(until.getDate() + days);
    await Listing.updateOne(
      { _id: order.listingId },
      { $set: { isFeatured: true, featuredUntil: until } },
    );
  }

  if (order.type === 'enrollment' && order.listingId && order.studentId) {
    await fulfillEnrollmentSideEffects(order);
  }

  return { alreadyProcessed: false, orderId: String(order._id), type: order.type };
}

async function fulfillEnrollmentSideEffects(order: {
  studentId?: mongoose.Types.ObjectId | null;
  listingId?: mongoose.Types.ObjectId | null;
  institutionId: mongoose.Types.ObjectId;
  razorpayOrderId: string;
}) {
  if (!order.studentId || !order.listingId) return;

  const student = await User.findById(order.studentId);
  if (!student) return;

  const existing = await Enquiry.findOne({
    studentId: order.studentId,
    listingId: order.listingId,
  }).sort({ createdAt: -1 });

  if (existing) {
    existing.status = 'converted';
    existing.message = `${existing.message}\n\n[Paid enrollment via SkillVentures — order ${order.razorpayOrderId}]`;
    await existing.save();
  } else {
    await Enquiry.create({
      studentId: order.studentId,
      listingId: order.listingId,
      institutionId: order.institutionId,
      message: `Paid enrollment via SkillVentures (order ${order.razorpayOrderId}). Please share next onboarding steps.`,
      contactInfo: {
        name: student.name,
        email: student.email,
        phone: student.phone || 'Not provided',
      },
      status: 'converted',
    });
    await Listing.updateOne({ _id: order.listingId }, { $inc: { 'stats.enquiries': 1 } });
  }
}

/** Student pays listing fee → institution receives net payout (minus platform fee). */
export async function createEnrollmentOrder(userId: string, input: CreateEnrollmentOrderInput) {
  const student = await User.findById(userId);
  if (!student || student.role !== 'student') {
    throw new AppError('Student account required', 403, 'FORBIDDEN');
  }

  const listing = await Listing.findById(input.listingId);
  if (!listing || listing.status !== 'published') {
    throw new AppError('Listing not available for enrollment', 404, 'LISTING_NOT_FOUND');
  }

  if (listing.fee?.isFree || listing.fee?.amount === 0) {
    throw new AppError(
      'This program is free — use Enquire instead of Pay',
      400,
      'LISTING_IS_FREE',
    );
  }

  const alreadyPaid = await PaymentOrder.findOne({
    type: 'enrollment',
    studentId: student._id,
    listingId: listing._id,
    status: 'paid',
  });
  if (alreadyPaid) {
    throw new AppError('You already paid for this program', 409, 'ALREADY_ENROLLED');
  }

  const grossPaise = Math.round(Number(listing.fee.amount) * 100);
  if (grossPaise < 100) {
    throw new AppError('Invalid listing fee', 400, 'INVALID_FEE');
  }

  const { platformFeePaise, institutionPayoutPaise } = splitEnrollmentAmount(grossPaise);

  const razorpayOrder = await createRazorpayOrder({
    amountPaise: grossPaise,
    receipt: `enroll_${listing._id}_${Date.now()}`.slice(0, 40),
    notes: {
      type: 'enrollment',
      listingId: String(listing._id),
      institutionId: String(listing.institutionId),
      studentId: String(student._id),
      platformFeePaise: String(platformFeePaise),
      institutionPayoutPaise: String(institutionPayoutPaise),
    },
  });

  await PaymentOrder.create({
    institutionId: listing.institutionId,
    studentId: student._id,
    type: 'enrollment',
    listingId: listing._id,
    amount: grossPaise,
    platformFeePaise,
    institutionPayoutPaise,
    razorpayOrderId: razorpayOrder.id,
    status: 'created',
  });

  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: env.RAZORPAY_KEY_ID ?? null,
    mock: !isRazorpayConfigured(),
    purpose: 'enrollment' as const,
    listingId: String(listing._id),
    listingTitle: listing.title,
    platformFeePaise,
    institutionPayoutPaise,
    platformPercent: ENROLLMENT_COMMISSION.platformPercent,
  };
}

export async function confirmMockPaymentForUser(userId: string, orderId: string) {
  if (env.NODE_ENV === 'production') {
    throw new AppError('Not available', 404, 'NOT_FOUND');
  }
  if (!orderId.startsWith('order_test_')) {
    throw new AppError('Only mock orders can be confirmed this way', 400, 'INVALID_ORDER');
  }

  const order = await PaymentOrder.findOne({ razorpayOrderId: orderId });
  if (!order) {
    throw new AppError('Payment order not found', 404, 'ORDER_NOT_FOUND');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (order.type === 'enrollment') {
    if (String(order.studentId) !== String(user._id)) {
      throw new AppError('Order does not belong to this student', 403, 'FORBIDDEN');
    }
  } else {
    const institution = await Institution.findOne({ userId: user._id });
    if (!institution || String(institution._id) !== String(order.institutionId)) {
      throw new AppError('Order does not belong to this institution', 403, 'FORBIDDEN');
    }
  }

  return fulfillPaidOrder({
    razorpayOrderId: orderId,
    razorpayPaymentId: `pay_test_${Date.now()}`,
  });
}

function toPaymentSummary(order: {
  _id: mongoose.Types.ObjectId;
  type: string;
  status: string;
  amount: number;
  platformFeePaise?: number | null;
  institutionPayoutPaise?: number | null;
  currency?: string | null;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  listingId?: mongoose.Types.ObjectId | null;
  studentId?: mongoose.Types.ObjectId | null;
  institutionId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: String(order._id),
    type: order.type,
    status: order.status,
    amountPaise: order.amount,
    platformFeePaise: order.platformFeePaise ?? 0,
    institutionPayoutPaise: order.institutionPayoutPaise ?? 0,
    currency: order.currency ?? 'INR',
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId ?? null,
    listingId: order.listingId ? String(order.listingId) : null,
    studentId: order.studentId ? String(order.studentId) : null,
    institutionId: String(order.institutionId),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function listStudentPayments(userId: string) {
  const orders = await PaymentOrder.find({
    studentId: userId,
    type: 'enrollment',
  })
    .sort({ createdAt: -1 })
    .limit(50);

  const listingIds = orders.map((o) => o.listingId).filter(Boolean);
  const listings = await Listing.find({ _id: { $in: listingIds } }).select('title slug');
  const listingMap = new Map(listings.map((l) => [String(l._id), l]));

  return {
    commissionPercent: ENROLLMENT_COMMISSION.platformPercent,
    items: orders.map((order) => {
      const listing = order.listingId ? listingMap.get(String(order.listingId)) : null;
      return {
        ...toPaymentSummary(order as typeof order & { createdAt: Date; updatedAt: Date }),
        listingTitle: listing?.title ?? 'Program',
        listingSlug: listing?.slug ?? null,
      };
    }),
  };
}

export async function listInstitutionEarnings(userId: string) {
  const institution = await getInstitutionForUser(userId);
  const orders = await PaymentOrder.find({
    institutionId: institution._id,
    type: 'enrollment',
    status: 'paid',
  })
    .sort({ createdAt: -1 })
    .limit(100);

  const listingIds = orders.map((o) => o.listingId).filter(Boolean);
  const studentIds = orders.map((o) => o.studentId).filter(Boolean);
  const [listings, students] = await Promise.all([
    Listing.find({ _id: { $in: listingIds } }).select('title slug'),
    User.find({ _id: { $in: studentIds } }).select('name email'),
  ]);
  const listingMap = new Map(listings.map((l) => [String(l._id), l]));
  const studentMap = new Map(students.map((s) => [String(s._id), s]));

  const grossPaise = orders.reduce((sum, o) => sum + o.amount, 0);
  const platformFeePaise = orders.reduce((sum, o) => sum + (o.platformFeePaise ?? 0), 0);
  const netPaise = orders.reduce((sum, o) => sum + (o.institutionPayoutPaise ?? 0), 0);

  return {
    commissionPercent: ENROLLMENT_COMMISSION.platformPercent,
    summary: {
      paidCount: orders.length,
      grossPaise,
      platformFeePaise,
      netPaise,
    },
    items: orders.map((order) => {
      const listing = order.listingId ? listingMap.get(String(order.listingId)) : null;
      const student = order.studentId ? studentMap.get(String(order.studentId)) : null;
      return {
        ...toPaymentSummary(order as typeof order & { createdAt: Date; updatedAt: Date }),
        listingTitle: listing?.title ?? 'Program',
        listingSlug: listing?.slug ?? null,
        studentName: student?.name ?? 'Student',
        studentEmail: student?.email ?? '',
      };
    }),
  };
}

export async function getMySubscription(userId: string) {
  const institution = await getInstitutionForUser(userId);
  const subscription = await Subscription.findOne({
    institutionId: institution._id,
    status: 'active',
  }).sort({ createdAt: -1 });

  return {
    plan: institution.subscriptionPlan,
    expiresAt: institution.subscriptionExpiresAt?.toISOString() ?? null,
    subscription: subscription
      ? {
          id: String(subscription._id),
          plan: subscription.plan,
          status: subscription.status,
          amount: subscription.amount,
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
          invoices: subscription.invoices,
        }
      : null,
    plans: {
      free: SUBSCRIPTION_PLANS.free,
      standard: SUBSCRIPTION_PLANS.standard,
      premium: SUBSCRIPTION_PLANS.premium,
    },
    featuredBoost: FEATURED_BOOST,
  };
}

export async function getInstitutionAnalytics(userId: string) {
  const institution = await getInstitutionForUser(userId);
  const plan = SUBSCRIPTION_PLANS[institution.subscriptionPlan] ?? SUBSCRIPTION_PLANS.free;

  if (!plan.analytics && institution.subscriptionPlan === 'free') {
    throw new AppError(
      'Analytics require Standard or Premium plan',
      403,
      'PLAN_UPGRADE_REQUIRED',
    );
  }

  const listings = await Listing.find({ institutionId: institution._id });
  const listingIds = listings.map((l) => l._id);

  const [enquiryTotal, converted, contacted] = await Promise.all([
    Enquiry.countDocuments({ institutionId: institution._id }),
    Enquiry.countDocuments({ institutionId: institution._id, status: 'converted' }),
    Enquiry.countDocuments({ institutionId: institution._id, status: 'contacted' }),
  ]);

  const totalViews = listings.reduce((sum, l) => sum + (l.stats?.views ?? 0), 0);
  const totalListingEnquiries = listings.reduce(
    (sum, l) => sum + (l.stats?.enquiries ?? 0),
    0,
  );

  const topListings = [...listings]
    .sort((a, b) => (b.stats?.enquiries ?? 0) - (a.stats?.enquiries ?? 0))
    .slice(0, 5)
    .map((l) => ({
      id: String(l._id),
      title: l.title,
      slug: l.slug,
      views: l.stats?.views ?? 0,
      enquiries: l.stats?.enquiries ?? 0,
      status: l.status,
      isFeatured: l.isFeatured,
    }));

  const conversionRate =
    enquiryTotal > 0 ? Math.round((converted / enquiryTotal) * 1000) / 10 : 0;

  return {
    summary: {
      listings: listings.length,
      publishedListings: listings.filter((l) => l.status === 'published').length,
      totalViews,
      totalEnquiries: enquiryTotal,
      listingEnquiryClicks: totalListingEnquiries,
      contacted,
      converted,
      conversionRate,
    },
    topListings,
    listingIds: listingIds.map(String),
  };
}

/** Expire featured flags past featuredUntil — call from cron or on read. */
export async function expireFeaturedListings(): Promise<number> {
  const result = await Listing.updateMany(
    { isFeatured: true, featuredUntil: { $lte: new Date() } },
    { $set: { isFeatured: false } },
  );
  return result.modifiedCount;
}
