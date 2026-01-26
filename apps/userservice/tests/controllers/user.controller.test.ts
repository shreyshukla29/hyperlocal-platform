import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserController } from '../../src/controllers/user.controller';
import { UserService } from '../../src/service/user.service';
import { createMockUser } from '../helpers/test-helpers';
import { jest } from '@jest/globals';

import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@hyperlocal/shared/errors';

jest.mock('../../src/service/user.service');

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
      uploadUserAvatar: jest.fn(),
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

    it('should call next with error when service throws', async () => {
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.params = { id: 'user-123' };
      const error = new ForbiddenError('Access denied');

      mockService.updateUserProfile.mockRejectedValue(error);

      await controller.updateUserProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('uploadUserAvatar', () => {
    it('should upload avatar successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
      };
      const mockUser = createMockUser({
        avatarUrl: 'https://cloudinary.com/avatar.jpg',
      });

      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.params = { id: 'user-123' };
      mockRequest.file = mockFile as Express.Multer.File;

      mockService.uploadUserAvatar.mockResolvedValue(mockUser);

      await controller.uploadUserAvatar(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.uploadUserAvatar).toHaveBeenCalledWith({
        userId: 'user-123',
        fileBuffer: mockFile.buffer,
        requestingAuthId: 'auth-123',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should call next with error when service throws', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
      };

      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.params = { id: 'user-123' };
      mockRequest.file = mockFile as Express.Multer.File;

      const error = new BadRequestError('Invalid image file');

      mockService.uploadUserAvatar.mockRejectedValue(error);

      await controller.uploadUserAvatar(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteUserAvatar', () => {
    it('should delete avatar successfully', async () => {
      const mockUser = createMockUser({ avatarUrl: null });

      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.params = { id: 'user-123' };

      mockService.deleteUserAvatar.mockResolvedValue(mockUser);

      await controller.deleteUserAvatar(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockService.deleteUserAvatar).toHaveBeenCalledWith('user-123', 'auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should call next with error when service throws', async () => {
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.params = { id: 'user-123' };

      const error = new ForbiddenError('Access denied');

      mockService.deleteUserAvatar.mockRejectedValue(error);

      await controller.deleteUserAvatar(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
