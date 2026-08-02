import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerStudentSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().toLowerCase(),
    phone: z.string().trim().min(10).max(15).optional(),
    password: passwordSchema,
    city: z.string().trim().min(2).max(100).optional(),
    currentEducationLevel: z.string().trim().max(100).optional(),
  })
  .strict();

export const registerInstitutionSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().toLowerCase(),
    phone: z.string().trim().min(10).max(15).optional(),
    password: passwordSchema,
    institutionName: z.string().trim().min(2).max(200),
    institutionType: z.enum([
      'college',
      'university',
      'training-institute',
      'edtech',
      'bootcamp-provider',
    ]),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    address: z.string().trim().max(300).optional(),
    website: z.string().url().optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1).max(128),
  })
  .strict();

export const googleAuthSchema = z
  .object({
    idToken: z.string().min(1),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().email().toLowerCase().optional(),
    phone: z
      .union([
        z.string().trim().regex(/^[0-9+\-\s()]{10,15}$/, 'Enter a valid mobile number'),
        z.literal(''),
      ])
      .optional(),
    about: z.string().trim().max(500, 'About must be 500 characters or less').optional(),
  })
  .strict()
  .refine((data) => data.name !== undefined || data.email !== undefined || data.phone !== undefined || data.about !== undefined, {
    message: 'At least one field is required',
  });

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
export type RegisterInstitutionInput = z.infer<typeof registerInstitutionSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
