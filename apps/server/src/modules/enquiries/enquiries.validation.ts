import { z } from 'zod';

export const createEnquirySchema = z
  .object({
    listingId: z.string().min(1),
    message: z.string().trim().min(10).max(2000),
    contactInfo: z
      .object({
        name: z.string().trim().min(2).max(100),
        phone: z.string().trim().min(10).max(15),
        email: z.string().trim().email(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const enquiryStatusSchema = z
  .object({
    status: z.enum(['new', 'contacted', 'converted', 'lost']),
  })
  .strict();

export const enquiryListQuerySchema = z
  .object({
    status: z.enum(['new', 'contacted', 'converted', 'lost']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict();

export const enquiryIdParamsSchema = z.object({ id: z.string().min(1) }).strict();

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type EnquiryListQuery = z.infer<typeof enquiryListQuerySchema>;
