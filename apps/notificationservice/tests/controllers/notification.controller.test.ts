import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { jest } from '@jest/globals';
import { NotificationController } from '../../src/controllers/notification.controller.js';
import type { NotificationService } from '../../src/service/index.js';

describe('NotificationController', () => {
  let controller: NotificationController;
  let mockService: jest.Mocked<NotificationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockService = {
      listByUser: jest.fn(),
      getById: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;
    controller = new NotificationController(mockService);
    mockRequest = { params: {}, query: {}, headers: {} };
    mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns 400 when auth identity missing', async () => {
      mockRequest.headers = {};
      await controller.list(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockService.listByUser).not.toHaveBeenCalled();
    });

    it('returns 200 and data when service succeeds', async () => {
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.query = {};
      mockService.listByUser.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
      await controller.list(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockService.listByUser).toHaveBeenCalledWith('auth-123', undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('getById', () => {
    it('returns 400 when id or auth missing', async () => {
      mockRequest.params = {};
      mockRequest.headers = {};
      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });

    it('returns 200 and data when service succeeds', async () => {
      mockRequest.params = { id: 'n1' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockService.getById.mockResolvedValue({
        id: 'n1',
        userAuthId: 'auth-123',
        type: 'INFO',
        title: 'T',
        body: 'B',
        readAt: null,
        metadata: null,
        createdAt: new Date(),
      });
      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockService.getById).toHaveBeenCalledWith('n1', 'auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('markAsRead', () => {
    it('returns 400 when auth missing', async () => {
      mockRequest.params = { id: 'n1' };
      mockRequest.headers = {};
      await controller.markAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });
    it('returns 200 when service succeeds', async () => {
      mockRequest.params = { id: 'n1' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockService.markAsRead.mockResolvedValue({
        id: 'n1',
        userAuthId: 'auth-123',
        type: 'INFO',
        title: 'T',
        body: 'B',
        readAt: new Date(),
        metadata: null,
        createdAt: new Date(),
      });
      await controller.markAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockService.markAsRead).toHaveBeenCalledWith('n1', 'auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('markAllAsRead', () => {
    it('returns 200 with count when service succeeds', async () => {
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockService.markAllAsRead.mockResolvedValue({ count: 5 });
      await controller.markAllAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockService.markAllAsRead).toHaveBeenCalledWith('auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });
});
