import { z } from 'zod';
import { ProviderServiceStatus } from '../enums';

const trimString = (val: string) => val.trim();

export const createProviderOfferingSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(200, 'Name must be at most 200 characters')
      .transform(trimString),
    description: z
      .string()
      .max(2000, 'Description must be at most 2000 characters')
      .transform(trimString)
      .nullable()
      .optional(),
    category: z
      .string()
      .max(100, 'Category must be at most 100 characters')
      .transform(trimString)
      .nullable()
      .optional(),
    price: z.number().positive('Price must be positive').finite(),
    durationMinutes: z.number().int().positive().nullable().optional(),
    status: z.nativeEnum(ProviderServiceStatus).optional(),
  })
  .strict();

export const updateProviderOfferingSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(200, 'Name must be at most 200 characters')
      .transform(trimString)
      .optional(),
    description: z
      .string()
      .max(2000, 'Description must be at most 2000 characters')
      .transform(trimString)
      .nullable()
      .optional(),
    category: z
      .string()
      .max(100, 'Category must be at most 100 characters')
      .transform(trimString)
      .nullable()
      .optional(),
    price: z.number().positive('Price must be positive').finite().optional(),
    durationMinutes: z.number().int().positive().nullable().optional(),
    status: z.nativeEnum(ProviderServiceStatus).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update',
  );

export const listProviderOfferingsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.nativeEnum(ProviderServiceStatus).optional(),
  })
  .strict();

export type CreateProviderOfferingPayload = z.infer<
  typeof createProviderOfferingSchema
>;
export type UpdateProviderOfferingPayload = z.infer<
  typeof updateProviderOfferingSchema
>;
export type ListProviderOfferingsQueryPayload = z.infer<
  typeof listProviderOfferingsQuerySchema
>;
