import { jest } from '@jest/globals';
import {
  updateProviderProfileSchema,
  topProvidersByLocationQuerySchema,
  updateVerificationStatusSchema,
} from '../../src/validators/provider.schema.js';
import { AvailabilityStatus, VerificationStatus } from '../../src/enums/index.js';

describe('provider validators', () => {
  describe('updateProviderProfileSchema', () => {
    it('accepts single field update', () => {
      const result = updateProviderProfileSchema.safeParse({ firstName: 'John' });
      expect(result.success).toBe(true);
    });

    it('trims firstName', () => {
      const result = updateProviderProfileSchema.safeParse({ firstName: '  Jane  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.firstName).toBe('Jane');
    });

    it('rejects empty object', () => {
      const result = updateProviderProfileSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts availabilityStatus', () => {
      const result = updateProviderProfileSchema.safeParse({
        availabilityStatus: AvailabilityStatus.AVAILABLE,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('topProvidersByLocationQuerySchema', () => {
    it('accepts empty object', () => {
      const result = topProvidersByLocationQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts city, page, limit', () => {
      const result = topProvidersByLocationQuerySchema.safeParse({
        city: 'NYC',
        page: 1,
        limit: 10,
      });
      expect(result.success).toBe(true);
    });

    it('accepts latitude and longitude', () => {
      const result = topProvidersByLocationQuerySchema.safeParse({
        latitude: 40.71,
        longitude: -74.01,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateVerificationStatusSchema', () => {
    it('accepts verificationStatus', () => {
      const result = updateVerificationStatusSchema.safeParse({
        verificationStatus: VerificationStatus.VERIFIED,
      });
      expect(result.success).toBe(true);
    });
  });
});
