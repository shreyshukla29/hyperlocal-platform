import { z } from 'zod';

export const updateUserProfileSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().max(100).nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
    dateOfBirth: z.coerce.date().nullable().optional(),
    gender: z.enum(['male', 'female', 'other']).nullable().optional(),
    language: z.string().max(10).optional(),
    timezone: z.string().max(50).optional(),
  })
  .strict();