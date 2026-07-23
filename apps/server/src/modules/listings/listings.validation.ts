import { z } from 'zod';

const feeSchema = z
  .object({
    amount: z.number().min(0),
    currency: z.string().default('INR'),
    isFree: z.boolean().default(false),
  })
  .strict();

const durationSchema = z
  .object({
    value: z.number().positive(),
    unit: z.enum(['days', 'weeks', 'months', 'hours']),
  })
  .strict();

const curriculumItemSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
  })
  .strict();

const imagePathSchema = z
  .string()
  .min(1)
  .max(500)
  .refine((value) => value.startsWith('/uploads/') || /^https?:\/\//i.test(value), {
    message: 'Image must be an uploaded path or URL',
  });

const locationSchema = z
  .object({
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    address: z.string().max(300).optional(),
  })
  .strict()
  .optional();

export const createListingSchema = z
  .object({
    type: z.enum(['course', 'bootcamp', 'hackathon']),
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(20).max(10000),
    category: z.string().trim().min(2).max(100),
    subCategory: z.string().trim().max(100).optional(),
    fee: feeSchema,
    duration: durationSchema,
    mode: z.enum(['online', 'offline', 'hybrid']),
    location: locationSchema,
    eligibility: z.string().max(2000).optional(),
    curriculum: z.array(curriculumItemSchema).max(50).optional(),
    placementSupport: z.boolean().optional(),
    certificateProvided: z.boolean().optional(),
    images: z.array(imagePathSchema).max(5).optional(),
    bootcamp: z
      .object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        sessionMode: z.string().optional(),
        seatsAvailable: z.number().int().min(0).optional(),
      })
      .strict()
      .optional(),
    hackathon: z
      .object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        prizePool: z.number().min(0).optional(),
        teamSizeMax: z.number().int().min(1).optional(),
        sponsors: z.array(z.string()).optional(),
      })
      .strict()
      .optional(),
    submitForReview: z.boolean().optional(),
  })
  .strict();

export const updateListingSchema = createListingSchema.partial().strict();

export const listingListQuerySchema = z
  .object({
    type: z.enum(['course', 'bootcamp', 'hackathon']).optional(),
    category: z.string().optional(),
    city: z.string().optional(),
    mode: z.enum(['online', 'offline', 'hybrid']).optional(),
    minFee: z.coerce.number().min(0).optional(),
    maxFee: z.coerce.number().min(0).optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict();

export const suggestQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(200),
    limit: z.coerce.number().int().min(1).max(8).optional(),
  })
  .strict();

export const searchQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(200),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict();

export const compareQuerySchema = z
  .object({
    ids: z.string().min(1),
  })
  .strict();

export const listingIdParamsSchema = z.object({ id: z.string().min(1) }).strict();
export const listingSlugParamsSchema = z.object({ slug: z.string().min(1) }).strict();

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingListQuery = z.infer<typeof listingListQuerySchema>;
