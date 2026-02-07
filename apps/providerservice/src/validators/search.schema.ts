import { z } from 'zod';

export const searchQuerySchema = z
  .object({
    q: z.string().max(200).optional(),
    category: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    verifiedOnly: z
      .union([z.boolean(), z.literal('true'), z.literal('false')])
      .optional()
      .transform((v) =>
        v === true || v === 'true'
          ? true
          : v === false || v === 'false'
            ? false
            : undefined,
      ),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export const topServicesQuerySchema = z
  .object({
    city: z.string().max(100).optional(),
    latitude: z.coerce.number().finite().optional(),
    longitude: z.coerce.number().finite().optional(),
    verifiedOnly: z
      .union([z.boolean(), z.literal('true'), z.literal('false')])
      .optional()
      .transform((v) =>
        v === true || v === 'true'
          ? true
          : v === false || v === 'false'
            ? false
            : undefined,
      ),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export type SearchQueryPayload = z.infer<typeof searchQuerySchema>;
export type TopServicesQueryPayload = z.infer<typeof topServicesQuerySchema>;
