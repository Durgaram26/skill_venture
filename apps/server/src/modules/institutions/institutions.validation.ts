import { z } from 'zod';

export const updatePayoutDetailsSchema = z
  .object({
    method: z.enum(['bank', 'upi']),
    accountHolderName: z.string().trim().min(2).max(120),
    bankName: z.string().trim().max(120).optional(),
    accountNumber: z.string().trim().max(32).optional(),
    ifsc: z.string().trim().toUpperCase().max(11).optional(),
    upiId: z.string().trim().max(100).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.method === 'bank') {
      if (!data.bankName?.trim()) {
        ctx.addIssue({ code: 'custom', message: 'Bank name is required', path: ['bankName'] });
      }
      if (!data.accountNumber?.trim() || data.accountNumber.trim().length < 8) {
        ctx.addIssue({
          code: 'custom',
          message: 'Account number is required (min 8 digits)',
          path: ['accountNumber'],
        });
      }
      if (!data.ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifsc)) {
        ctx.addIssue({ code: 'custom', message: 'Valid IFSC is required', path: ['ifsc'] });
      }
    }
    if (data.method === 'upi') {
      if (!data.upiId?.trim() || !/^[\w.\-]{2,}@[\w.\-]{2,}$/i.test(data.upiId)) {
        ctx.addIssue({ code: 'custom', message: 'Valid UPI ID is required', path: ['upiId'] });
      }
    }
  });

export type UpdatePayoutDetailsInput = z.infer<typeof updatePayoutDetailsSchema>;
