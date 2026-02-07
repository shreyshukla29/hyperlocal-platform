import { jest } from '@jest/globals';
import { mockedPrisma } from '../__mocks__/prisma.mock.js';

jest.mock('../../src/config', () => ({ prisma: mockedPrisma }));
jest.mock('../../src/config/index', () => ({ prisma: mockedPrisma }));

import { BookingOtpRepository } from '../../src/repositories/booking-otp.repository.js';
import { BookingOtpType } from '../../src/enums/index.js';

describe('BookingOtpRepository', () => {
  let repository: BookingOtpRepository;

  beforeEach(() => {
    repository = new BookingOtpRepository(mockedPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('calls prisma.bookingOtp.create', async () => {
      const created = { id: 'o1', bookingId: 'b1', type: BookingOtpType.ARRIVAL, otpHash: 'h', expiresAt: new Date() };
      mockedPrisma.bookingOtp.create.mockResolvedValue(created as never);
      const result = await repository.create({
        bookingId: 'b1',
        type: BookingOtpType.ARRIVAL,
        otpHash: 'h',
        expiresAt: new Date(),
      });
      expect(mockedPrisma.bookingOtp.create).toHaveBeenCalled();
      expect(result).toEqual(created);
    });
  });

  describe('findActiveByBookingAndType', () => {
    it('calls prisma.bookingOtp.findFirst', async () => {
      mockedPrisma.bookingOtp.findFirst.mockResolvedValue(null);
      await repository.findActiveByBookingAndType('b1', BookingOtpType.ARRIVAL);
      expect(mockedPrisma.bookingOtp.findFirst).toHaveBeenCalled();
    });
  });

  describe('markUsed', () => {
    it('calls prisma.bookingOtp.update', async () => {
      mockedPrisma.bookingOtp.update.mockResolvedValue({} as never);
      await repository.markUsed('o1');
      expect(mockedPrisma.bookingOtp.update).toHaveBeenCalled();
    });
  });
});
