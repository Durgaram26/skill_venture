import { Institution } from '../../models/Institution.js';
import { AppError } from '../../utils/AppError.js';
import type { UpdatePayoutDetailsInput } from './institutions.validation.js';

async function getInstitutionForUser(userId: string) {
  const institution = await Institution.findOne({ userId });
  if (!institution) {
    throw new AppError('Institution profile not found', 404, 'INSTITUTION_NOT_FOUND');
  }
  return institution;
}

function maskAccount(value?: string | null) {
  if (!value) return '';
  if (value.length <= 4) return '••••';
  return `${'•'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export function toPayoutDetailsResponse(institution: {
  payoutDetails?: {
    method?: string | null;
    accountHolderName?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    ifsc?: string | null;
    upiId?: string | null;
    status?: string | null;
    updatedAt?: Date | null;
  } | null;
}) {
  const p = institution.payoutDetails;
  if (!p || p.status === 'none' || (!p.accountHolderName && !p.upiId && !p.accountNumber)) {
    return {
      configured: false,
      method: 'upi' as const,
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      accountNumberMasked: '',
      ifsc: '',
      upiId: '',
      status: 'none' as const,
      updatedAt: null as string | null,
      mockNote: 'Save payout details to receive student enrollment amounts (mock — no real transfer yet).',
    };
  }

  return {
    configured: true,
    method: (p.method === 'bank' ? 'bank' : 'upi') as 'bank' | 'upi',
    accountHolderName: p.accountHolderName ?? '',
    bankName: p.bankName ?? '',
    /** Full number returned only to the owning institution for editing. */
    accountNumber: p.accountNumber ?? '',
    accountNumberMasked: maskAccount(p.accountNumber),
    ifsc: p.ifsc ?? '',
    upiId: p.upiId ?? '',
    status: (p.status ?? 'mock') as 'none' | 'mock' | 'pending' | 'verified',
    updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null,
    mockNote:
      'Mock mode: details are saved on SkillVentures. Real bank/UPI settlement will use Razorpay Route later.',
  };
}

export async function getMyPayoutDetails(userId: string) {
  const institution = await getInstitutionForUser(userId);
  return toPayoutDetailsResponse(institution);
}

export async function updateMyPayoutDetails(userId: string, input: UpdatePayoutDetailsInput) {
  const institution = await getInstitutionForUser(userId);

  institution.payoutDetails = {
    method: input.method,
    accountHolderName: input.accountHolderName.trim(),
    bankName: input.method === 'bank' ? input.bankName?.trim() || undefined : undefined,
    accountNumber: input.method === 'bank' ? input.accountNumber?.trim() || undefined : undefined,
    ifsc: input.method === 'bank' ? input.ifsc?.trim().toUpperCase() || undefined : undefined,
    upiId: input.method === 'upi' ? input.upiId?.trim() || undefined : undefined,
    status: 'mock',
    updatedAt: new Date(),
  };

  await institution.save();
  return toPayoutDetailsResponse(institution);
}
