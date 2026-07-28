/** Plan & featured pricing (amounts in paise for Razorpay). */
export const SUBSCRIPTION_PLANS = {
  free: {
    plan: 'free' as const,
    amountPaise: 0,
    listingLimit: 5,
    analytics: false,
    label: 'Free',
  },
  standard: {
    plan: 'standard' as const,
    amountPaise: 299_900, // ₹2,999
    listingLimit: 25,
    analytics: true,
    label: 'Standard',
    periodDays: 30,
  },
  premium: {
    plan: 'premium' as const,
    amountPaise: 799_900, // ₹7,999
    listingLimit: 100,
    analytics: true,
    label: 'Premium',
    periodDays: 30,
  },
} as const;

export const FEATURED_BOOST = {
  amountPaise: 99_900, // ₹999
  defaultDays: 7,
  label: 'Featured listing boost',
} as const;

/**
 * Student enrollment checkout → institution payout.
 * Platform keeps this % of the listing fee; remainder is marked as institution payout.
 * (Mock ledger for now — real Razorpay Route / Linked Accounts can wire later.)
 */
export const ENROLLMENT_COMMISSION = {
  /** SkillVentures platform fee percent of gross fee. */
  platformPercent: 10,
  label: 'Enrollment payment',
} as const;

export type PaidPlan = 'standard' | 'premium';

export function splitEnrollmentAmount(grossPaise: number) {
  const platformFeePaise = Math.round((grossPaise * ENROLLMENT_COMMISSION.platformPercent) / 100);
  const institutionPayoutPaise = Math.max(0, grossPaise - platformFeePaise);
  return { platformFeePaise, institutionPayoutPaise };
}
