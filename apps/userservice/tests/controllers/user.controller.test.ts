import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserController } from '../../src/controllers/user.controller';
import { UserService } from '../../src/service/user.service';
import { createMockUser } from '../helpers/test-helpers';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@hyperlocal/shared/errors';

jest.mock('../../src/service/user.service');
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

describe('UserController', () => {
  let controller: UserController;
  let mockService: jest.Mocked<UserService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockService = {
      getUserByAuthIdentityId: jest.fn(),
      getUserById: jest.fn(),
      updateUserProfile: jest.fn(),
      updateUserAvatar: jest.fn(),
      deleteUserAvatar: jest.fn(),
    } as any;

    controller = new UserController(mockService);

    mockRequest = {
      headers: {},
      params: {},
      body: {},
      file: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      const mockUser = createMockUser();
      mockRequest.headers = { 'x-user-id': 'auth-123' };

      mockService.getUserByAuthIdentityId.mockResolvedValue(mockUser);

      await controller.getUserProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.getUserByAuthIdentityId).toHaveBeenCalledWith('auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
        error: null,
      });
    });

    it('should return 401 when authIdentityId is missing', async () => {
      mockRequest.headers = {};

      await controller.getUserProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User ID is required',
        data: null,
      });
    });

    it('should call next with error when service throws', async () => {
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      const error = new NotFoundError('User not found');

      mockService.getUserByAuthIdentityId.mockRejectedValue(error);

      await controller.getUserProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = createMockUser({ firstName: 'Jane' });
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.params = { id: 'user-123' };
      mockRequest.body = { firstName: 'Jane' };

      mockService.updateUserProfile.mockResolvedValue(mockUser);

      await controller.updateUserProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.updateUserProfile).toHaveBeenCalledWith(
        'user-123',
        { firstName: 'Jane' },
        'auth-123',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should return 401 when authIdentityId is missing', async () => {
      mockRequest.headers = {};
      mockRequest.params = { id: 'user-123' };

      await controller.updateUserProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    });
  });

  describe('uploadUserAvatar', () => {
    it('should upload avatar successfully', async () => {
      const { uploadImage, validateImageFile, optimizeImage, extractPublicIdFromUrl, deleteImage } = require('../../src/utils');
      const mockUser = createMockUser();
      const mockFile = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
      };

      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.params = { id: 'user-123' };
      mockRequest.file = mockFile as Express.Multer.File;

      validateImageFile.mockResolvedValue({ isValid: true });
      optimizeImage.mockResolvedValue(Buffer.from('optimized'));
      mockService.getUserById.mockResolvedValue(mockUser);
      uploadImage.mockResolvedValue({
        secureUrl: 'https://cloudinary.com/avatar.jpg',
      });
      mockService.updateUserAvatar.mockResolvedValue(
        createMockUser({ avatarUrl: 'https://cloudinary.com/avatar.jpg' }),
      );

      await controller.uploadUserAvatar(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(validateImageFile).toHaveBeenCalledWith(mockFile.buffer);
      expect(uploadImage).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should return 400 when file is missing', async () => {
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.params = { id: 'user-123' };
      mockRequest.file = undefined;

      await controller.uploadUserAvatar(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Avatar image file is required',
        data: null,
      });
    });

    it('should return 400 when image validation fails', async () => {
      const { validateImageFile } = require('../../src/utils');
      const mockFile = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
      };

      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.params = { id: 'user-123' };
      mockRequest.file = mockFile as Express.Multer.File;

      validateImageFile.mockResolvedValue({
        isValid: false,
        error: 'Invalid file type',
      });

      await controller.uploadUserAvatar(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });
  });

  describe('deleteUserAvatar', () => {
    it('should delete avatar successfully', async () => {
      const { extractPublicIdFromUrl, deleteImage } = require('../../src/utils');
      const mockUser = createMockUser({
        avatarUrl: 'https://cloudinary.com/avatar.jpg',
      });

      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.params = { id: 'user-123' };

      mockService.getUserById.mockResolvedValue(mockUser);
      extractPublicIdFromUrl.mockReturnValue('public-id-123');
      deleteImage.mockResolvedValue(undefined);
      mockService.deleteUserAvatar.mockResolvedValue(
        createMockUser({ avatarUrl: null }),
      );

      await controller.deleteUserAvatar(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(deleteImage).toHaveBeenCalledWith('public-id-123');
      expect(mockService.deleteUserAvatar).toHaveBeenCalledWith('user-123', 'auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should return 401 when authIdentityId is missing', async () => {
      mockRequest.headers = {};
      mockRequest.params = { id: 'user-123' };

      await controller.deleteUserAvatar(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    });
  });
});

