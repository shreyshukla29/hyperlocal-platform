import { z } from 'zod';
import { ServicePersonStatus } from '../enums';

const trimString = (val: string) => val.trim();

/** Only provider can create; body must not include providerId (resolved from JWT). */
export const createServicePersonSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(200)
      .transform(trimString)
      .refine((val) => val.length > 0, 'Name cannot be empty'),
    phone: z
      .string()
      .min(1, 'Phone is required')
      .max(20)
      .transform(trimString),
    email: z.string().email().max(255).nullable().optional(),
    role: z.string().max(100).transform(trimString).nullable().optional(),
    providerServiceIds: z.array(z.string().uuid()).optional(),
  })
  .strict();

export const updateServicePersonSchema = z
  .object({
    name: z.string().min(1).max(200).transform(trimString).optional(),
    phone: z.string().min(1).max(20).transform(trimString).optional(),
    email: z.string().email().max(255).nullable().optional(),
    role: z.string().max(100).transform(trimString).nullable().optional(),
    isActive: z.boolean().optional(),
    providerServiceIds: z.array(z.string().uuid()).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update',
  );

export const updateServicePersonStatusSchema = z
  .object({
    status: z.nativeEnum(ServicePersonStatus),
  })
  .strict();

export const listServicePeopleQuerySchema = z.object({
  status: z.nativeEnum(ServicePersonStatus).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  providerServiceId: z.string().uuid().optional(),
});

export type CreateServicePersonPayload = z.infer<
  typeof createServicePersonSchema
>;
export type UpdateServicePersonPayload = z.infer<
  typeof updateServicePersonSchema
>;
export type UpdateServicePersonStatusPayload = z.infer<
  typeof updateServicePersonStatusSchema
>;
export type ListServicePeopleQueryPayload = z.infer<
  typeof listServicePeopleQuerySchema
>;
