import { jest } from '@jest/globals';
import { mockedPrisma } from '../__mocks__/prisma.mock';

jest.mock('../../src/config', () => ({
  prisma: mockedPrisma,
}));

import { UserRepository } from '../../src/repositories';
import { createMockUser, createMockUserPayload } from '../helpers/test-helpers';


describe('UserRepository', () => {
  let repository: UserRepository;

  beforeEach(() => {
    repository = new UserRepository(mockedPrisma);
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const payload = createMockUserPayload();
      const mockUser = createMockUser();

      mockedPrisma.user.upsert.mockResolvedValue(mockUser as unknown);

      const result = await repository.createUser(payload);

      expect(mockedPrisma.user.upsert).toHaveBeenCalledWith({
        where: { authIdentityId: payload.authIdentityId },
        update: {},
        create: {
          authIdentityId: payload.authIdentityId,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
          username: payload.username,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it('should handle null optional fields', async () => {
      const payload = {
        authIdentityId: 'auth-123',
        firstName: 'John',
      };
      const mockUser = createMockUser();

      mockedPrisma.user.upsert.mockResolvedValue(mockUser as unknown);

      await repository.createUser(payload);

      expect(mockedPrisma.user.upsert).toHaveBeenCalledWith({
        where: { authIdentityId: payload.authIdentityId },
        update: {},
        create: {
          authIdentityId: payload.authIdentityId,
          firstName: payload.firstName,
          lastName: null,
          email: null,
          phone: null,
          username: null,
        },
      });
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userId = 'user-123';
      const mockUser = createMockUser();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser as unknown);

      const result = await repository.findById(userId);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const userId = 'non-existent';

      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById(userId);

      expect(result).toBeNull();
    });
  });

  describe('findByAuthIdentityId', () => {
    it('should find user by auth identity id', async () => {
      const authIdentityId = 'auth-123';
      const mockUser = createMockUser();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser as unknown);

      const result = await repository.findByAuthIdentityId(authIdentityId);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { authIdentityId },
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const username = 'johndoe';
      const mockUser = createMockUser();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser as unknown);

      const result = await repository.findByUsername(username);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username },
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('usernameExists', () => {
    it('should return true if username exists', async () => {
      const username = 'johndoe';

      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' } as unknown);

      const result = await repository.usernameExists(username);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username },
        select: { id: true },
      });

      expect(result).toBe(true);
    });

    it('should return false if username does not exist', async () => {
      const username = 'nonexistent';

      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.usernameExists(username);

      expect(result).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user-123';
      const payload = {
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
      };
      const mockUser = createMockUser(payload);

      mockedPrisma.user.update.mockResolvedValue(mockUser as unknown);

      const result = await repository.updateProfile(userId, payload);

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          ...payload,
          updatedAt: expect.any(Date),
        },
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateAvatar', () => {
    it('should update user avatar', async () => {
      const userId = 'user-123';
      const avatarUrl = 'https://example.com/avatar.jpg';
      const mockUser = createMockUser({ avatarUrl });

      mockedPrisma.user.update.mockResolvedValue(mockUser as unknown);

      const result = await repository.updateAvatar(userId, avatarUrl);

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          avatarUrl,
          updatedAt: expect.any(Date),
        },
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('deleteAvatar', () => {
    it('should delete user avatar', async () => {
      const userId = 'user-123';
      const mockUser = createMockUser({ avatarUrl: null });

      mockedPrisma.user.update.mockResolvedValue(mockUser as unknown);

      const result = await repository.deleteAvatar(userId);

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          avatarUrl: null,
          updatedAt: expect.any(Date),
        },
      });

      expect(result).toEqual(mockUser);
    });
  });
});
