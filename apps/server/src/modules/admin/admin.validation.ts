import { z } from 'zod';

export const adminListQuerySchema = z
  .object({
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict();

export const adminUsersQuerySchema = z
  .object({
    role: z.enum(['student', 'institution', 'admin', 'super_admin']).optional(),
    banned: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict();

export const verifyInstitutionSchema = z
  .object({
    verificationStatus: z.enum(['verified', 'rejected']),
    reason: z.string().max(1000).optional(),
  })
  .strict();

export const moderateListingSchema = z
  .object({
    status: z.enum(['published', 'rejected', 'paused']),
    reason: z.string().max(1000).optional(),
  })
  .strict();

export const moderateReviewSchema = z
  .object({
    moderationStatus: z.enum(['visible', 'removed']),
    reason: z.string().max(1000).optional(),
  })
  .strict();

export const banUserSchema = z
  .object({
    isBanned: z.boolean(),
  })
  .strict();

export const idParamsSchema = z.object({ id: z.string().min(1) }).strict();

export const updateSettingsSchema = z
  .object({
    heroHeadline: z.string().min(1).max(200).optional(),
    heroSubheadline: z.string().min(1).max(500).optional(),
    categories: z.array(z.string().min(1).max(80)).min(1).max(20).optional(),
    featureFlags: z
      .object({
        registrationsOpen: z.boolean().optional(),
        featuredListingsEnabled: z.boolean().optional(),
        institutionSignupsOpen: z.boolean().optional(),
      })
      .optional(),
  })
  .strict();

export const setUserRoleSchema = z
  .object({
    role: z.enum(['student', 'admin', 'super_admin']),
  })
  .strict();

export const updateSupportTicketSchema = z
  .object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    adminNotes: z.string().max(2000).optional(),
  })
  .strict();

export const createSupportTicketSchema = z
  .object({
    reporterEmail: z.string().email(),
    reporterName: z.string().max(120).optional(),
    subject: z.string().min(3).max(200),
    body: z.string().min(10).max(5000),
    category: z.enum(['billing', 'listing', 'account', 'dispute', 'other']).optional(),
  })
  .strict();
