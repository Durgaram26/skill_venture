import { z } from 'zod';

export const listingImageUploadSchema = z
  .object({
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    data: z.string().min(1),
    fileName: z.string().max(200).optional(),
  })
  .strict();

export type ListingImageUploadInput = z.infer<typeof listingImageUploadSchema>;
