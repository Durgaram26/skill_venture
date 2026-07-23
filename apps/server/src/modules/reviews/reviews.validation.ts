import { z } from 'zod';

export const createReviewSchema = z
  .object({
    listingId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
  })
  .strict();

export const replyReviewSchema = z
  .object({
    text: z.string().trim().min(2).max(2000),
  })
  .strict();

export const reviewIdParamsSchema = z.object({ id: z.string().min(1) }).strict();
export const listingIdParamsSchema = z.object({ id: z.string().min(1) }).strict();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
