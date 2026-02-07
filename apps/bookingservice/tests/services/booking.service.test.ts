import { jest } from '@jest/globals';
import type { BookingRepository } from '../../src/repositories/index.js';
import type { BookingOtpService } from '../../src/service/booking-otp.service.js';
import { BookingService, computeUserCancelRefund } from '../../src/service/booking.service.js';

jest.mock('../../src/config', () => ({ prisma: {} }));
jest.mock('../../src/config/index', () => ({ prisma: {}, ServerConfig: { PROVIDER_SERVICE_URL: 'http://test' } }));
jest.mock('../../src/utils/index.js', () => ({
  getBookingQuote: jest.fn().mockResolvedValue({ pricePaise: 10000 }),
  getProviderOpenIntervals: jest.fn().mockResolvedValue([]),
  createRazorpayOrder: jest.fn().mockResolvedValue({ orderId: 'order_1', amountPaise: 10000 }),
  createRazorpayRefund: jest.fn().mockResolvedValue({ refundId: 'rf_1' }),
}));
jest.mock('../../src/events/index.js', () => ({ publishNotification: jest.fn() }));

describe('BookingService', () => {
  let service: BookingService;
  let mockRepo: jest.Mocked<BookingRepository>;
  let mockOtpService: jest.Mocked<BookingOtpService>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      findManyForUser: jest.fn(),
      update: jest.fn(),
      findManyForProvider: jest.fn(),
      countForUser: jest.fn(),
      countForProvider: jest.fn(),
    } as unknown as jest.Mocked<BookingRepository>;
    mockOtpService = {
      createOtp: jest.fn().mockResolvedValue({ id: 'otp1', expiresAt: new Date() }),
      verifyOtp: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<BookingOtpService>;
    service = new BookingService(mockRepo, mockOtpService);
    jest.clearAllMocks();
  });

  describe('computeUserCancelRefund', () => {
    it('returns 100% refund when more than 24h until slot', () => {
      const slotStart = new Date(Date.now() + 25 * 60 * 60 * 1000);
      const result = computeUserCancelRefund(1000, slotStart);
      expect(result.refundPercentage).toBe(100);
      expect(result.refundAmountPaise).toBe(1000);
    });

    it('returns 50% refund when 12–24h until slot', () => {
      const slotStart = new Date(Date.now() + 18 * 60 * 60 * 1000);
      const result = computeUserCancelRefund(1000, slotStart);
      expect(result.refundPercentage).toBe(50);
      expect(result.refundAmountPaise).toBe(500);
    });

    it('returns 0% refund when less than 12h until slot', () => {
      const slotStart = new Date(Date.now() + 6 * 60 * 60 * 1000);
      const result = computeUserCancelRefund(1000, slotStart);
      expect(result.refundPercentage).toBe(0);
      expect(result.refundAmountPaise).toBe(0);
    });
  });
});
