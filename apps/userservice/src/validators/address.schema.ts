import { z } from 'zod';

const trimString = (val: string) => val.trim();

const optionalString = z
  .union([z.string().max(500).transform(trimString), z.null()])
  .optional();
const latSchema = z.number().min(-90).max(90);
const longSchema = z.number().min(-180).max(180);

export const createAddressSchema = z
  .object({
    label: z.string().max(100).transform(trimString).optional().nullable(),
    addressLine1: optionalString,
    addressLine2: optionalString,
    city: optionalString,
    state: optionalString,
    postalCode: optionalString,
    country: optionalString,
    latitude: latSchema.optional().nullable(),
    longitude: longSchema.optional().nullable(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export const updateAddressSchema = z
  .object({
    label: z.string().max(100).transform(trimString).optional().nullable(),
    addressLine1: optionalString,
    addressLine2: optionalString,
    city: optionalString,
    state: optionalString,
    postalCode: optionalString,
    country: optionalString,
    latitude: latSchema.optional().nullable(),
    longitude: longSchema.optional().nullable(),
    isDefault: z.boolean().optional(),
  })
  .strict()
  .refine((data: Record<string, unknown>) => Object.keys(data).length > 0, 'At least one field must be provided');

export const saveCurrentLocationSchema = z
  .object({
    latitude: latSchema,
    longitude: longSchema,
    label: z.string().max(100).transform(trimString).optional().nullable(),
    addressLine1: optionalString,
    addressLine2: optionalString,
    city: optionalString,
    state: optionalString,
    postalCode: optionalString,
    country: optionalString,
    setAsDefault: z.boolean().optional().default(true),
  })
  .strict();

export type CreateAddressPayload = z.infer<typeof createAddressSchema>;
export type UpdateAddressPayload = z.infer<typeof updateAddressSchema>;
export type SaveCurrentLocationPayload = z.infer<typeof saveCurrentLocationSchema>;
