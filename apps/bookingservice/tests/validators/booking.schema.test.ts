import { jest } from '@jest/globals';
import {
  createBookingSchema,
  listBookingsQuerySchema,
  confirmArrivalSchema,
  createReviewSchema,
  listReviewsQuerySchema,
} from '../../src/validators/booking.schema.js';

describe('booking validators', () => {
  describe('createBookingSchema', () => {
    it('accepts valid payload', () => {
      const slotStart = new Date(Date.now() + 86400000);
      const slotEnd = new Date(slotStart.getTime() + 3600000);
      const result = createBookingSchema.safeParse({
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        providerServiceId: '550e8400-e29b-41d4-a716-446655440001',
        slotStart: slotStart.toISOString(),
        slotEnd: slotEnd.toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it('rejects slotEnd before slotStart', () => {
      const slotStart = new Date(Date.now() + 86400000);
      const slotEnd = new Date(slotStart.getTime() - 3600000);
      const result = createBookingSchema.safeParse({
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        providerServiceId: '550e8400-e29b-41d4-a716-446655440001',
        slotStart: slotStart.toISOString(),
        slotEnd: slotEnd.toISOString(),
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid uuid for providerId', () => {
      const result = createBookingSchema.safeParse({
        providerId: 'not-uuid',
        providerServiceId: '550e8400-e29b-41d4-a716-446655440001',
        slotStart: new Date(Date.now() + 86400000).toISOString(),
        slotEnd: new Date(Date.now() + 86400000 + 3600000).toISOString(),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('listBookingsQuerySchema', () => {
    it('accepts empty object', () => {
      const result = listBookingsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts page and limit', () => {
      const result = listBookingsQuerySchema.safeParse({ page: 1, limit: 10 });
      expect(result.success).toBe(true);
    });

    it('accepts valid status', () => {
      const result = listBookingsQuerySchema.safeParse({ status: 'CONFIRMED' });
      expect(result.success).toBe(true);
    });
  });

  describe('confirmArrivalSchema', () => {
    it('accepts 6-digit otp', () => {
      const result = confirmArrivalSchema.safeParse({ otp: '123456' });
      expect(result.success).toBe(true);
    });

    it('rejects non-6-digit otp', () => {
      const result = confirmArrivalSchema.safeParse({ otp: '12345' });
      expect(result.success).toBe(false);
    });
  });

  describe('createReviewSchema', () => {
    it('accepts valid payload', () => {
      const result = createReviewSchema.safeParse({ rating: 5, comment: 'Great!' });
      expect(result.success).toBe(true);
    });

    it('rejects rating out of range', () => {
      const result = createReviewSchema.safeParse({ rating: 6 });
      expect(result.success).toBe(false);
    });
  });

  describe('listReviewsQuerySchema', () => {
    it('accepts providerId only', () => {
      const result = listReviewsQuerySchema.safeParse({
        providerId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });
  });
});
