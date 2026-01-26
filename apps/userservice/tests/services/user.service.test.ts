import { UserService } from '../../src/service/user.service';
import { UserRepository } from '../../src/repositories/user.repository';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '@hyperlocal/shared/errors';
import { createMockUser, createMockUserPayload, createMockPrismaError } from '../helpers/test-helpers';
import { Prisma } from '../../src/generated/prisma/client';

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/utils', () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  extractPublicIdFromUrl: jest.fn(),
  validateImageFile: jest.fn(),
  optimizeImage: jest.fn(),
}));
jest.mock('@hyperlocal/shared/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = {
      createUser: jest.fn(),
      findById: jest.fn(),
      findByAuthIdentityId: jest.fn(),
      findByUsername: jest.fn(),
      usernameExists: jest.fn(),
      updateProfile: jest.fn(),
      updateAvatar: jest.fn(),
      deleteAvatar: jest.fn(),
    } as any;

    service = new UserService(mockRepository);
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const payload = createMockUserPayload();
      const mockUser = createMockUser();

      mockRepository.createUser.mockResolvedValue(mockUser);

      const result = await service.createUser(payload);

      expect(mockRepository.createUser).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictError for duplicate username', async () => {
      const payload = createMockUserPayload({ username: 'existing' });
      const error = createMockPrismaError('P2002', ['username']);

      mockRepository.createUser.mockRejectedValue(error);

      await expect(service.createUser(payload)).rejects.toThrow(ConflictError);
      await expect(service.createUser(payload)).rejects.toThrow('Username already taken');
    });

    it('should throw ConflictError for duplicate email', async () => {
      const payload = createMockUserPayload();
      const error = createMockPrismaError('P2002', ['email']);

      mockRepository.createUser.mockRejectedValue(error);

      await expect(service.createUser(payload)).rejects.toThrow(ConflictError);
      await expect(service.createUser(payload)).rejects.toThrow('Email already in use');
    });

    it('should throw ConflictError for duplicate phone', async () => {
      const payload = createMockUserPayload();
      const error = createMockPrismaError('P2002', ['phone']);

      mockRepository.createUser.mockRejectedValue(error);

      await expect(service.createUser(payload)).rejects.toThrow(ConflictError);
      await expect(service.createUser(payload)).rejects.toThrow('Phone number already in use');
    });
  });

  describe('getUserByAuthIdentityId', () => {
    it('should return user when found and active', async () => {
      const authIdentityId = 'auth-123';
      const mockUser = createMockUser();

      mockRepository.findByAuthIdentityId.mockResolvedValue(mockUser);

      const result = await service.getUserByAuthIdentityId(authIdentityId);

      expect(mockRepository.findByAuthIdentityId).toHaveBeenCalledWith(authIdentityId);
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestError when authIdentityId is empty', async () => {
      await expect(service.getUserByAuthIdentityId('')).rejects.toThrow(BadRequestError);
      await expect(service.getUserByAuthIdentityId('')).rejects.toThrow('Auth identity ID is required');
    });

    it('should throw NotFoundError when user not found', async () => {
      mockRepository.findByAuthIdentityId.mockResolvedValue(null);

      await expect(service.getUserByAuthIdentityId('auth-123')).rejects.toThrow(NotFoundError);
      await expect(service.getUserByAuthIdentityId('auth-123')).rejects.toThrow('User not found');
    });

    it('should throw ForbiddenError when user is inactive', async () => {
      const mockUser = createMockUser({ isActive: false });

      mockRepository.findByAuthIdentityId.mockResolvedValue(mockUser);

      await expect(service.getUserByAuthIdentityId('auth-123')).rejects.toThrow(ForbiddenError);
      await expect(service.getUserByAuthIdentityId('auth-123')).rejects.toThrow('User account is inactive or deleted');
    });

    it('should throw ForbiddenError when user is deleted', async () => {
      const mockUser = createMockUser({ isDeleted: true });

      mockRepository.findByAuthIdentityId.mockResolvedValue(mockUser);

      await expect(service.getUserByAuthIdentityId('auth-123')).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getUserById', () => {
    it('should return user when authorized', async () => {
      const userId = 'user-123';
      const requestingAuthId = 'auth-123';
      const mockUser = createMockUser();

      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById(userId, requestingAuthId);

      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestError when userId is empty', async () => {
      await expect(service.getUserById('', 'auth-123')).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when requestingAuthId is empty', async () => {
      await expect(service.getUserById('user-123', '')).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getUserById('user-123', 'auth-123')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user tries to access another user', async () => {
      const mockUser = createMockUser({ authIdentityId: 'different-auth' });

      mockRepository.findById.mockResolvedValue(mockUser);

      await expect(service.getUserById('user-123', 'auth-123')).rejects.toThrow(ForbiddenError);
      await expect(service.getUserById('user-123', 'auth-123')).rejects.toThrow('Access denied');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'user-123';
      const requestingAuthId = 'auth-123';
      const payload = { firstName: 'Jane', username: 'janesmith' };
      const mockUser = createMockUser();
      const updatedUser = createMockUser(payload);

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.updateProfile.mockResolvedValue(updatedUser);

      const result = await service.updateUserProfile(userId, payload, requestingAuthId);

      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRepository.updateProfile).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should throw BadRequestError when userId is empty', async () => {
      await expect(service.updateUserProfile('', {}, 'auth-123')).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when requestingAuthId is empty', async () => {
      await expect(service.updateUserProfile('user-123', {}, '')).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when payload is empty', async () => {
      await expect(service.updateUserProfile('user-123', {}, 'auth-123')).rejects.toThrow(BadRequestError);
      await expect(service.updateUserProfile('user-123', {}, 'auth-123')).rejects.toThrow('No fields provided to update');
    });

    it('should throw NotFoundError when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateUserProfile('user-123', { firstName: 'Jane' }, 'auth-123')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when unauthorized', async () => {
      const mockUser = createMockUser({ authIdentityId: 'different-auth' });

      mockRepository.findById.mockResolvedValue(mockUser);

      await expect(service.updateUserProfile('user-123', { firstName: 'Jane' }, 'auth-123')).rejects.toThrow(ForbiddenError);
    });

    it('should throw ConflictError for duplicate username', async () => {
      const mockUser = createMockUser();
      const error = createMockPrismaError('P2002', ['username']);

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.updateProfile.mockRejectedValue(error);

      await expect(service.updateUserProfile('user-123', { username: 'existing' }, 'auth-123')).rejects.toThrow(ConflictError);
    });
  });

  describe('uploadUserAvatar', () => {
    const { uploadImage, validateImageFile, optimizeImage, extractPublicIdFromUrl, deleteImage } = require('../../src/utils');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should upload avatar successfully', async () => {
      const userId = 'user-123';
      const requestingAuthId = 'auth-123';
      const fileBuffer = Buffer.from('fake-image');
      const mockUser = createMockUser();
      const updatedUser = createMockUser({ avatarUrl: 'https://cloudinary.com/avatar.jpg' });

      validateImageFile.mockResolvedValue({ isValid: true });
      optimizeImage.mockResolvedValue(Buffer.from('optimized'));
      mockRepository.findById.mockResolvedValue(mockUser);
      extractPublicIdFromUrl.mockReturnValue(null);
      uploadImage.mockResolvedValue({
        secureUrl: 'https://cloudinary.com/avatar.jpg',
      });
      mockRepository.updateAvatar.mockResolvedValue(updatedUser);

      const result = await service.uploadUserAvatar({
        userId,
        fileBuffer,
        requestingAuthId,
      });

      expect(validateImageFile).toHaveBeenCalledWith(fileBuffer);
      expect(optimizeImage).toHaveBeenCalledWith(fileBuffer);
      expect(uploadImage).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should throw BadRequestError when userId is empty', async () => {
      await expect(service.uploadUserAvatar({
        userId: '',
        fileBuffer: Buffer.from('test'),
        requestingAuthId: 'auth-123',
      })).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when requestingAuthId is empty', async () => {
      await expect(service.uploadUserAvatar({
        userId: 'user-123',
        fileBuffer: Buffer.from('test'),
        requestingAuthId: '',
      })).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when fileBuffer is empty', async () => {
      await expect(service.uploadUserAvatar({
        userId: 'user-123',
        fileBuffer: Buffer.alloc(0),
        requestingAuthId: 'auth-123',
      })).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when image validation fails', async () => {
      const fileBuffer = Buffer.from('invalid');

      validateImageFile.mockResolvedValue({
        isValid: false,
        error: 'Invalid file type',
      });

      await expect(service.uploadUserAvatar({
        userId: 'user-123',
        fileBuffer,
        requestingAuthId: 'auth-123',
      })).rejects.toThrow(BadRequestError);
    });

    it('should delete old avatar before uploading new one', async () => {
      const userId = 'user-123';
      const requestingAuthId = 'auth-123';
      const fileBuffer = Buffer.from('fake-image');
      const mockUser = createMockUser({
        avatarUrl: 'https://cloudinary.com/old-avatar.jpg',
      });
      const updatedUser = createMockUser({ avatarUrl: 'https://cloudinary.com/new-avatar.jpg' });

      validateImageFile.mockResolvedValue({ isValid: true });
      optimizeImage.mockResolvedValue(Buffer.from('optimized'));
      mockRepository.findById.mockResolvedValue(mockUser);
      extractPublicIdFromUrl.mockReturnValue('old-public-id');
      deleteImage.mockResolvedValue(undefined);
      uploadImage.mockResolvedValue({
        secureUrl: 'https://cloudinary.com/new-avatar.jpg',
      });
      mockRepository.updateAvatar.mockResolvedValue(updatedUser);

      await service.uploadUserAvatar({
        userId,
        fileBuffer,
        requestingAuthId,
      });

      expect(deleteImage).toHaveBeenCalledWith('old-public-id');
    });

    it('should throw ForbiddenError when unauthorized', async () => {
      const fileBuffer = Buffer.from('fake-image');
      const mockUser = createMockUser({ authIdentityId: 'different-auth' });

      validateImageFile.mockResolvedValue({ isValid: true });
      mockRepository.findById.mockResolvedValue(mockUser);

      await expect(service.uploadUserAvatar({
        userId: 'user-123',
        fileBuffer,
        requestingAuthId: 'auth-123',
      })).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteUserAvatar', () => {
    const { extractPublicIdFromUrl, deleteImage } = require('../../src/utils');

    it('should delete avatar successfully', async () => {
      const userId = 'user-123';
      const requestingAuthId = 'auth-123';
      const mockUser = createMockUser({
        avatarUrl: 'https://cloudinary.com/avatar.jpg',
      });
      const updatedUser = createMockUser({ avatarUrl: null });

      mockRepository.findById.mockResolvedValue(mockUser);
      extractPublicIdFromUrl.mockReturnValue('public-id-123');
      deleteImage.mockResolvedValue(undefined);
      mockRepository.deleteAvatar.mockResolvedValue(updatedUser);

      const result = await service.deleteUserAvatar(userId, requestingAuthId);

      expect(extractPublicIdFromUrl).toHaveBeenCalledWith(mockUser.avatarUrl);
      expect(deleteImage).toHaveBeenCalledWith('public-id-123');
      expect(mockRepository.deleteAvatar).toHaveBeenCalledWith(userId);
      expect(result).toEqual(updatedUser);
    });

    it('should throw BadRequestError when userId is empty', async () => {
      await expect(service.deleteUserAvatar('', 'auth-123')).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when requestingAuthId is empty', async () => {
      await expect(service.deleteUserAvatar('user-123', '')).rejects.toThrow(BadRequestError);
    });

    it('should throw ForbiddenError when unauthorized', async () => {
      const mockUser = createMockUser({ authIdentityId: 'different-auth' });

      mockRepository.findById.mockResolvedValue(mockUser);

      await expect(service.deleteUserAvatar('user-123', 'auth-123')).rejects.toThrow(ForbiddenError);
    });
  });
});
