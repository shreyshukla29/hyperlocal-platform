import { jest } from '@jest/globals';
import { mockedPrisma } from '../__mocks__/prisma.mock.js';

jest.mock('../../src/config', () => ({ prisma: mockedPrisma }));
jest.mock('../../src/config/index', () => ({ prisma: mockedPrisma }));

import { ProviderRepository } from '../../src/repositories/provider.repository.js';

describe('ProviderRepository', () => {
  let repository: ProviderRepository;

  beforeEach(() => {
    repository = new ProviderRepository(mockedPrisma);
    jest.clearAllMocks();
  });

  describe('createProvider', () => {
    it('calls prisma.provider.upsert', async () => {
      const payload = { authIdentityId: 'auth1', firstName: 'John', lastName: 'Doe' };
      const created = { id: 'p1', ...payload, email: null, phone: null, isActive: true, isDeleted: false };
      mockedPrisma.provider.create.mockResolvedValue(created as never);
      mockedPrisma.provider.upsert.mockResolvedValue(created as never);
      const result = await repository.createProvider(payload as never);
      expect(mockedPrisma.provider.upsert).toHaveBeenCalled();
      expect(result).toEqual(created);
    });
  });

  describe('findByAuthIdentityId', () => {
    it('calls prisma.provider.findUnique', async () => {
      mockedPrisma.provider.findUnique.mockResolvedValue(null);
      await repository.findByAuthIdentityId('auth1');
      expect(mockedPrisma.provider.findUnique).toHaveBeenCalledWith({
        where: { authIdentityId: 'auth1' },
      });
    });
  });

  describe('findById', () => {
    it('calls prisma.provider.findUnique', async () => {
      mockedPrisma.provider.findUnique.mockResolvedValue(null);
      await repository.findById('p1');
      expect(mockedPrisma.provider.findUnique).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
    });
  });

  describe('updateProfile', () => {
    it('calls prisma.provider.update', async () => {
      const updated = { id: 'p1', firstName: 'Jane' };
      mockedPrisma.provider.update.mockResolvedValue(updated as never);
      await repository.updateProfile('p1', { firstName: 'Jane' } as never);
      expect(mockedPrisma.provider.update).toHaveBeenCalled();
    });
  });
});
