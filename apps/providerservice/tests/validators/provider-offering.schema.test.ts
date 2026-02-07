import { jest } from '@jest/globals';
import {
  createProviderOfferingSchema,
  updateProviderOfferingSchema,
} from '../../src/validators/provider-offering.schema.js';
import { ProviderServiceStatus } from '../../src/enums/index.js';

describe('provider-offering validators', () => {
  describe('createProviderOfferingSchema', () => {
    it('accepts valid payload', () => {
      const result = createProviderOfferingSchema.safeParse({
        name: 'Haircut',
        price: 500,
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
      const result = createProviderOfferingSchema.safeParse({ price: 500 });
      expect(result.success).toBe(false);
    });

    it('accepts optional status', () => {
      const result = createProviderOfferingSchema.safeParse({
        name: 'Service',
        price: 100,
        status: ProviderServiceStatus.ACTIVE,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateProviderOfferingSchema', () => {
    it('accepts partial update', () => {
      const result = updateProviderOfferingSchema.safeParse({ name: 'Updated Name' });
      expect(result.success).toBe(true);
    });
  });
});
