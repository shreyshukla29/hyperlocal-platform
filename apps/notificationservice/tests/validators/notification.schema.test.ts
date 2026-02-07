import { jest } from '@jest/globals';
import { listNotificationsQuerySchema } from '../../src/validators/notification.schema.js';

describe('notification validators', () => {
  describe('listNotificationsQuerySchema', () => {
    it('accepts empty object', () => {
      const result = listNotificationsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts page and limit', () => {
      const result = listNotificationsQuerySchema.safeParse({ page: 1, limit: 20 });
      expect(result.success).toBe(true);
    });

    it('transforms unreadOnly string "true" to true', () => {
      const result = listNotificationsQuerySchema.safeParse({ unreadOnly: 'true' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.unreadOnly).toBe(true);
    });

    it('transforms unreadOnly string "1" to true', () => {
      const result = listNotificationsQuerySchema.safeParse({ unreadOnly: '1' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.unreadOnly).toBe(true);
    });

    it('rejects limit > 100', () => {
      const result = listNotificationsQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });
});
