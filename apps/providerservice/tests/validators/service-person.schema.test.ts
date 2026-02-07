import { jest } from '@jest/globals';
import {
  createServicePersonSchema,
  updateServicePersonSchema,
  updateServicePersonStatusSchema,
} from '../../src/validators/service-person.schema.js';
import { ServicePersonStatus } from '../../src/enums/index.js';

describe('service-person validators', () => {
  describe('createServicePersonSchema', () => {
    it('accepts valid payload', () => {
      const result = createServicePersonSchema.safeParse({
        name: 'John Doe',
        phone: '9876543210',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = createServicePersonSchema.safeParse({
        name: '',
        phone: '9876543210',
      });
      expect(result.success).toBe(false);
    });

    it('accepts optional providerServiceIds', () => {
      const result = createServicePersonSchema.safeParse({
        name: 'Jane',
        phone: '9876543210',
        providerServiceIds: ['11111111-1111-1111-1111-111111111111'],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateServicePersonSchema', () => {
    it('accepts partial update', () => {
      const result = updateServicePersonSchema.safeParse({ name: 'New Name' });
      expect(result.success).toBe(true);
    });

    it('rejects empty object', () => {
      const result = updateServicePersonSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('updateServicePersonStatusSchema', () => {
    it('accepts status', () => {
      const result = updateServicePersonStatusSchema.safeParse({
        status: ServicePersonStatus.ACTIVE,
      });
      expect(result.success).toBe(true);
    });
  });
});
