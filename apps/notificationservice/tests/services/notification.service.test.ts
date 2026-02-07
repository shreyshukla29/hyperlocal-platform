import { jest } from '@jest/globals';
import type { NotificationRepository } from '../../src/repositories/index.js';
import { NotificationService } from '../../src/service/notification.service.js';
import { NotFoundError, ForbiddenError } from '@hyperlocal/shared/errors';

jest.mock('../../src/config', () => ({ prisma: {} }));
jest.mock('../../src/config/index', () => ({ prisma: {} }));

describe('NotificationService', () => {
  let service: NotificationService;
  let mockRepo: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findByUser: jest.fn(),
      findById: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    } as unknown as jest.Mocked<NotificationRepository>;
    service = new NotificationService(mockRepo);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('delegates to repository and returns result', async () => {
      const payload = { userAuthId: 'u1', type: 'INFO', title: 'Hi', body: 'Hello' };
      const created = { id: 'n1', ...payload, readAt: null, metadata: null, createdAt: new Date() };
      mockRepo.create.mockResolvedValue(created);
      const result = await service.create(payload);
      expect(mockRepo.create).toHaveBeenCalledWith(payload);
      expect(result).toEqual(created);
    });
  });

  describe('listByUser', () => {
    it('delegates to repository', async () => {
      const items = [];
      mockRepo.findByUser.mockResolvedValue({ items, total: 0, page: 1, limit: 20, totalPages: 0 });
      await service.listByUser('auth-123', { page: 1, limit: 10 });
      expect(mockRepo.findByUser).toHaveBeenCalledWith('auth-123', { page: 1, limit: 10 });
    });
  });

  describe('getById', () => {
    it('throws NotFoundError when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.getById('n1', 'auth-123')).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when user does not own notification', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'n1',
        userAuthId: 'other-user',
        type: 'INFO',
        title: 'T',
        body: 'B',
        readAt: null,
        metadata: null,
        createdAt: new Date(),
      });
      await expect(service.getById('n1', 'auth-123')).rejects.toThrow(ForbiddenError);
    });

    it('returns notification when found and owned', async () => {
      const notif = {
        id: 'n1',
        userAuthId: 'auth-123',
        type: 'INFO',
        title: 'T',
        body: 'B',
        readAt: null,
        metadata: null,
        createdAt: new Date(),
      };
      mockRepo.findById.mockResolvedValue(notif);
      const result = await service.getById('n1', 'auth-123');
      expect(result).toMatchObject({ id: 'n1', title: 'T', body: 'B' });
    });
  });

  describe('markAllAsRead', () => {
    it('returns count from repository', async () => {
      mockRepo.markAllAsRead.mockResolvedValue(5);
      const result = await service.markAllAsRead('auth-123');
      expect(result).toEqual({ count: 5 });
    });
  });
});
