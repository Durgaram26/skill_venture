import { describe, expect, it } from '@jest/globals';
import { splitEnrollmentAmount, ENROLLMENT_COMMISSION } from '../src/modules/payments/plans.js';

describe('enrollment payout split', () => {
  it('keeps configured platform percent and pays rest to institution', () => {
    // ₹24,999 → 2,499,900 paise
    const gross = 2_499_900;
    const { platformFeePaise, institutionPayoutPaise } = splitEnrollmentAmount(gross);
    expect(ENROLLMENT_COMMISSION.platformPercent).toBe(10);
    expect(platformFeePaise).toBe(249_990);
    expect(institutionPayoutPaise).toBe(2_249_910);
    expect(platformFeePaise + institutionPayoutPaise).toBe(gross);
  });
});
