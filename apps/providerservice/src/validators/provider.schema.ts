import { z } from 'zod';
import { AvailabilityStatus, VerificationStatus } from '../enums/index.js';

const trimString = (val: string) => val.trim();

const firstNameSchema = z
  .string()
  .min(1, 'First name is required')
  .max(100, 'First name must be at most 100 characters')
  .transform(trimString)
  .refine((val) => val.length > 0, 'First name cannot be empty after trimming');

const lastNameSchema = z
  .string()
  .min(1, 'Last name is required')
  .max(100, 'Last name must be at most 100 characters')
  .transform(trimString)
  .refine((val) => val.length > 0, 'Last name cannot be empty after trimming');

const optionalNullableString = (maxLen: number) =>
  z
    .union([
      z.string().max(maxLen).transform(trimString),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .transform((v) => (v === '' ? null : v));

export const updateProviderProfileSchema = z
  .object({
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    email: z.string().email().max(255).nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
    businessName: optionalNullableString(200),
    businessAddress: optionalNullableString(500),
    latitude: z.number().finite().nullable().optional(),
    longitude: z.number().finite().nullable().optional(),
    city: optionalNullableString(100),
    availabilityStatus: z.nativeEnum(AvailabilityStatus).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update',
  );

export type UpdateProviderProfilePayload = z.infer<
  typeof updateProviderProfileSchema
>;

export const topProvidersByLocationQuerySchema = z
  .object({
    city: z.string().max(100).optional(),
    latitude: z.coerce.number().finite().optional(),
    longitude: z.coerce.number().finite().optional(),
    radiusKm: z.coerce.number().positive().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export const updateVerificationStatusSchema = z
  .object({
    verificationStatus: z.nativeEnum(VerificationStatus),
  })
  .strict();

export type UpdateVerificationStatusPayload = z.infer<
  typeof updateVerificationStatusSchema
>;
