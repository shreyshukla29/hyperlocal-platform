import { z } from 'zod';

export const listNotificationsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    unreadOnly: z
      .string()
      .optional()
      .transform((v) => v === 'true' || v === '1'),
  })
  .strict();

export type ListNotificationsQueryPayload = z.infer<
  typeof listNotificationsQuerySchema
>;
