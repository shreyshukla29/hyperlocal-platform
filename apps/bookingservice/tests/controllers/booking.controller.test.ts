import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { jest } from '@jest/globals';
import { BookingController } from '../../src/controllers/booking.controller.js';
import type { BookingService, BookingReviewService } from '../../src/service/index.js';

describe('BookingController', () => {
  let controller: BookingController;
  let mockBookingService: jest.Mocked<BookingService>;
  let mockReviewService: jest.Mocked<BookingReviewService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockBookingService = {
      create: jest.fn(),
      listByUser: jest.fn(),
      listByProvider: jest.fn(),
      getByIdForUser: jest.fn(),
      getByIdForProvider: jest.fn(),
      cancelByUser: jest.fn(),
      cancelByProvider: jest.fn(),
      assignServicePerson: jest.fn(),
      confirmArrival: jest.fn(),
      verifyCompletion: jest.fn(),
      getAvailableSlots: jest.fn(),
    } as unknown as jest.Mocked<BookingService>;
    mockReviewService = {
      create: jest.fn(),
      listByProvider: jest.fn(),
    } as unknown as jest.Mocked<BookingReviewService>;
    controller = new BookingController(mockBookingService, mockReviewService);
    mockRequest = { body: {}, params: {}, query: {}, headers: {} };
    mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('returns 400 when auth identity missing', async () => {
      mockRequest.headers = {};
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockBookingService.create).not.toHaveBeenCalled();
    });

    it('returns 201 when service succeeds', async () => {
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.body = {
        providerId: '11111111-1111-1111-1111-111111111111',
        providerServiceId: '22222222-2222-2222-2222-222222222222',
        slotStart: new Date(Date.now() + 86400000),
        slotEnd: new Date(Date.now() + 86400000 + 3600000),
      };
      mockBookingService.create.mockResolvedValue({ id: 'b1', status: 'PENDING_PAYMENT' } as never);
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockBookingService.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    });
  });

  describe('listForUser', () => {
    it('returns 400 when auth identity missing', async () => {
      mockRequest.headers = {};
      await controller.listForUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });
    it('returns 200 and data when service succeeds', async () => {
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockRequest.query = {};
      mockBookingService.listByUser.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 } as never);
      await controller.listForUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockBookingService.listByUser).toHaveBeenCalledWith('auth-123', undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('getByIdForUser', () => {
    it('returns 400 when id or auth missing', async () => {
      mockRequest.params = {};
      mockRequest.headers = {};
      await controller.getByIdForUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });
    it('returns 200 when service succeeds', async () => {
      mockRequest.params = { id: 'b1' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockBookingService.getByIdForUser.mockResolvedValue({ id: 'b1' } as never);
      await controller.getByIdForUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockBookingService.getByIdForUser).toHaveBeenCalledWith('b1', 'auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('cancelByUser', () => {
    it('returns 200 when service succeeds', async () => {
      mockRequest.params = { id: 'b1' };
      mockRequest.headers = { 'x-user-id': 'auth-123' };
      mockBookingService.cancelByUser.mockResolvedValue({ id: 'b1', status: 'CANCELLED' } as never);
      await controller.cancelByUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockBookingService.cancelByUser).toHaveBeenCalledWith('b1', 'auth-123');
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });
});
