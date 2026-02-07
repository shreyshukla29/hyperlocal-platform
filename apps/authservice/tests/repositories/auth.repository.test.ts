import { jest } from '@jest/globals';
import { mockedPrisma } from '../__mocks__/prisma.mock.js';

jest.mock('../../src/config', () => ({ prisma: mockedPrisma }));
jest.mock('../../src/config/index', () => ({ prisma: mockedPrisma }));

import { AuthRepository } from '../../src/repositories/auth.repository.js';
import { AccountType } from '../../src/enums/index.js';

describe('AuthRepository', () => {
  let repository: AuthRepository;

  beforeEach(() => {
    repository = new AuthRepository();
    jest.clearAllMocks();
  });

  describe('createIdentity', () => {
    it('calls prisma.identity.create with normalized data', async () => {
      const input = {
        email: '  A@B.COM  ',
        phone: null,
        password: 'hashed',
        accountType: AccountType.USER,
      };
      const created = { id: 'id1', ...input, email: 'a@b.com', isActive: true };
      mockedPrisma.identity.create.mockResolvedValue(created as never);
      const result = await repository.createIdentity(input);
      expect(mockedPrisma.identity.create).toHaveBeenCalled();
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('calls prisma.identity.findUnique', async () => {
      mockedPrisma.identity.findUnique.mockResolvedValue({ id: 'id1' } as never);
      await repository.findById('id1');
      expect(mockedPrisma.identity.findUnique).toHaveBeenCalledWith({
        where: { id: 'id1' },
      });
    });
  });

  describe('findByEmail', () => {
    it('calls prisma.identity.findUnique with email_accountType', async () => {
      mockedPrisma.identity.findUnique.mockResolvedValue(null);
      await repository.findByEmail('a@b.com', AccountType.USER);
      expect(mockedPrisma.identity.findUnique).toHaveBeenCalled();
    });
  });

  describe('existsByEmail', () => {
    it('returns true when record exists', async () => {
      mockedPrisma.identity.findUnique.mockResolvedValue({ id: 'id1' } as never);
      const result = await repository.existsByEmail('a@b.com', AccountType.USER);
      expect(result).toBe(true);
    });
    it('returns false when record does not exist', async () => {
      mockedPrisma.identity.findUnique.mockResolvedValue(null);
      const result = await repository.existsByEmail('a@b.com', AccountType.USER);
      expect(result).toBe(false);
    });
  });

  describe('existsByPhone', () => {
    it('returns true when record exists', async () => {
      mockedPrisma.identity.findUnique.mockResolvedValue({ id: 'id1' } as never);
      const result = await repository.existsByPhone('9876543210', AccountType.USER);
      expect(result).toBe(true);
    });
  });

  describe('createVerification', () => {
    it('calls prisma.identityVerification.create', async () => {
      const created = { id: 'v1', identityId: 'id1', type: 'EMAIL', value: 'a@b.com' };
      mockedPrisma.identityVerification.create.mockResolvedValue(created as never);
      const result = await repository.createVerification('id1', 'EMAIL' as never, 'a@b.com');
      expect(mockedPrisma.identityVerification.create).toHaveBeenCalled();
      expect(result).toEqual(created);
    });
  });

  describe('markVerified', () => {
    it('calls prisma.identityVerification.updateMany', async () => {
      mockedPrisma.identityVerification.updateMany.mockResolvedValue({ count: 1 } as never);
      await repository.markVerified('id1', 'EMAIL' as never);
      expect(mockedPrisma.identityVerification.updateMany).toHaveBeenCalled();
    });
  });
});
