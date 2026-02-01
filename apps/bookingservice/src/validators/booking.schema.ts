import { z } from 'zod';

export const createBookingSchema = z
  .object({
    providerId: z.string().uuid('Invalid provider ID'),
    providerServiceId: z.string().uuid('Invalid provider service ID'),
    slotStart: z.coerce.date(),
    slotEnd: z.coerce.date(),
    addressLine1: z.string().max(500).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    latitude: z.number().finite().optional().nullable(),
    longitude: z.number().finite().optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    amountPaise: z.number().int().min(100, 'Minimum amount is 100 paise (INR 1)'),
    currency: z.string().length(3).optional().default('INR'),
    idempotencyKey: z.string().max(128).optional().nullable(),
  })
  .strict()
  .refine((data) => data.slotEnd > data.slotStart, {
    message: 'slotEnd must be after slotStart',
  })
  .refine((data) => data.slotStart > new Date(), {
    message: 'slotStart must be in the future',
  });

export const listBookingsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum([
      'PENDING_PAYMENT',
      'PAYMENT_FAILED',
      'CONFIRMED',
      'IN_PROGRESS',
      'ARRIVAL_CONFIRMED',
      'PENDING_COMPLETION_VERIFICATION',
      'COMPLETED',
      'CANCELLED',
    ]).optional(),
  })
  .strict();

export type CreateBookingPayload = z.infer<typeof createBookingSchema>;
export type ListBookingsQueryPayload = z.infer<typeof listBookingsQuerySchema>;
