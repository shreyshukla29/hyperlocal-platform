import { jest } from '@jest/globals';
import type { ProviderRepository } from '../../src/repositories/index.js';
import { ProviderService } from '../../src/service/provider.service.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '@hyperlocal/shared/errors';

jest.mock('@hyperlocal/shared/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), child: jest.fn() },
}));

describe('ProviderService', () => {
  let service: ProviderService;
  let mockRepo: jest.Mocked<ProviderRepository>;

  beforeEach(() => {
    mockRepo = {
      createProvider: jest.fn(),
      findByAuthIdentityId: jest.fn(),
      findById: jest.fn(),
      updateProfile: jest.fn(),
      updateVerificationStatus: jest.fn(),
      findTopByLocation: jest.fn(),
    } as unknown as jest.Mocked<ProviderRepository>;
    service = new ProviderService(mockRepo);
    jest.clearAllMocks();
  });

  describe('getProviderByAuthIdentityId', () => {
    it('throws BadRequestError when authIdentityId is empty', async () => {
      await expect(service.getProviderByAuthIdentityId('')).rejects.toThrow(BadRequestError);
    });

    it('throws NotFoundError when provider not found', async () => {
      mockRepo.findByAuthIdentityId.mockResolvedValue(null);
      await expect(service.getProviderByAuthIdentityId('auth-123')).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when provider is inactive', async () => {
      mockRepo.findByAuthIdentityId.mockResolvedValue({ isActive: false, isDeleted: false } as never);
      await expect(service.getProviderByAuthIdentityId('auth-123')).rejects.toThrow(ForbiddenError);
    });

    it('returns provider when found and active', async () => {
      const provider = { id: 'p1', authIdentityId: 'auth-123', isActive: true, isDeleted: false };
      mockRepo.findByAuthIdentityId.mockResolvedValue(provider as never);
      const result = await service.getProviderByAuthIdentityId('auth-123');
      expect(result).toEqual(provider);
    });
  });

  describe('updateProviderProfile', () => {
    it('throws BadRequestError when providerId is empty', async () => {
      await expect(service.updateProviderProfile('', { firstName: 'J' }, 'auth-123')).rejects.toThrow(BadRequestError);
    });

    it('throws BadRequestError when payload is empty', async () => {
      await expect(service.updateProviderProfile('p1', {}, 'auth-123')).rejects.toThrow(BadRequestError);
    });

    it('throws NotFoundError when provider not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.updateProviderProfile('p1', { firstName: 'J' }, 'auth-123')).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when updating another provider', async () => {
      mockRepo.findById.mockResolvedValue({ authIdentityId: 'other-auth' } as never);
      await expect(service.updateProviderProfile('p1', { firstName: 'J' }, 'auth-123')).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getTopProvidersByLocation', () => {
    it('delegates to repository', async () => {
      mockRepo.findTopByLocation.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 });
      const result = await service.getTopProvidersByLocation({});
      expect(mockRepo.findTopByLocation).toHaveBeenCalledWith({});
      expect(result).toMatchObject({ items: [], total: 0 });
    });
  });
});
