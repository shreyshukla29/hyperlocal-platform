import { jest } from '@jest/globals';
import { mockedPrisma } from '../__mocks__/prisma.mock.js';

jest.mock('../../src/config', () => ({ prisma: mockedPrisma }));
jest.mock('../../src/config/index', () => ({ prisma: mockedPrisma }));

import { NotificationRepository } from '../../src/repositories/notification.repository.js';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;

  beforeEach(() => {
    repository = new NotificationRepository(mockedPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('calls prisma.notification.create and returns mapped response', async () => {
      const payload = { userAuthId: 'u1', type: 'INFO', title: 'Hi', body: 'Hello' };
      const row = {
        id: 'n1',
        ...payload,
        body: 'Hello',
        readAt: null,
        metadata: null,
        createdAt: new Date(),
      };
      mockedPrisma.notification.create.mockResolvedValue(row as never);
      const result = await repository.create(payload);
      expect(mockedPrisma.notification.create).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'n1', title: 'Hi' });
    });
  });

  describe('findById', () => {
    it('calls prisma.notification.findUnique', async () => {
      mockedPrisma.notification.findUnique.mockResolvedValue(null);
      await repository.findById('n1');
      expect(mockedPrisma.notification.findUnique).toHaveBeenCalledWith({ where: { id: 'n1' } });
    });
  });

  describe('findByUser', () => {
    it('calls findMany and count with pagination', async () => {
      mockedPrisma.notification.findMany.mockResolvedValue([]);
      mockedPrisma.notification.count.mockResolvedValue(0);
      const result = await repository.findByUser('u1', { page: 1, limit: 10 });
      expect(mockedPrisma.notification.findMany).toHaveBeenCalled();
      expect(mockedPrisma.notification.count).toHaveBeenCalled();
      expect(result).toMatchObject({ items: [], total: 0, page: 1, limit: 10 });
    });
  });

  describe('markAsRead', () => {
    it('calls prisma.notification.updateMany and findUniqueOrThrow when count > 0', async () => {
      mockedPrisma.notification.updateMany.mockResolvedValue({ count: 1 } as never);
      const updated = { id: 'n1', userAuthId: 'u1', type: 'INFO', title: 'T', body: 'B', readAt: new Date(), metadata: null, createdAt: new Date() };
      mockedPrisma.notification.findUniqueOrThrow.mockResolvedValue(updated as never);
      const result = await repository.markAsRead('n1', 'u1');
      expect(mockedPrisma.notification.updateMany).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'n1' });
    });
  });

  describe('markAllAsRead', () => {
    it('calls prisma.notification.updateMany and returns count', async () => {
      mockedPrisma.notification.updateMany.mockResolvedValue({ count: 3 } as never);
      const count = await repository.markAllAsRead('u1');
      expect(mockedPrisma.notification.updateMany).toHaveBeenCalled();
      expect(count).toBe(3);
    });
  });
});
