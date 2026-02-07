import { z } from 'zod';

/** Amount is always from backend (Provider quote). Client must not send amountPaise. */
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

export const assignServicePersonSchema = z
  .object({
    assignedServicePersonId: z.string().uuid('Invalid service person ID'),
  })
  .strict();

export const confirmArrivalSchema = z
  .object({
    otp: z.string().min(6).max(6).regex(/^\d+$/, 'OTP must be 6 digits'),
  })
  .strict();

export const verifyCompletionSchema = z
  .object({
    otp: z.string().min(6).max(6).regex(/^\d+$/, 'OTP must be 6 digits'),
  })
  .strict();

export const availableSlotsQuerySchema = z
  .object({
    providerId: z.string().uuid('Invalid provider ID'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    slotDurationMinutes: z.coerce.number().int().min(15).max(120).optional(),
  })
  .strict();

export const createReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional().nullable(),
  })
  .strict();

export const listReviewsQuerySchema = z
  .object({
    providerId: z.string().uuid('Invalid provider ID'),
    providerServiceId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export type CreateBookingPayload = z.infer<typeof createBookingSchema>;
export type ListBookingsQueryPayload = z.infer<typeof listBookingsQuerySchema>;
