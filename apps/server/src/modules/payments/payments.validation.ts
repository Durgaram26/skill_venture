import { z } from 'zod';

export const createOrderSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('subscription'),
      plan: z.enum(['standard', 'premium']),
    })
    .strict(),
  z
    .object({
      type: z.literal('featured'),
      listingId: z.string().min(1),
      days: z.number().int().min(1).max(90).optional(),
    })
    .strict(),
]);

export const createEnrollmentOrderSchema = z
  .object({
    listingId: z.string().min(1),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateEnrollmentOrderInput = z.infer<typeof createEnrollmentOrderSchema>;
