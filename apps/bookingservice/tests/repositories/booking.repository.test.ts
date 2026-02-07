import { jest } from '@jest/globals';
import { mockedPrisma } from '../__mocks__/prisma.mock.js';

jest.mock('../../src/config', () => ({ prisma: mockedPrisma }));
jest.mock('../../src/config/index', () => ({ prisma: mockedPrisma }));

import { BookingRepository } from '../../src/repositories/booking.repository.js';
import { BookingStatus } from '../../src/enums/index.js';

function mockBookingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b1',
    userAuthId: 'u1',
    providerId: 'p1',
    providerServiceId: 'ps1',
    providerAuthId: 'pa1',
    assignedServicePersonId: null,
    status: BookingStatus.PENDING_PAYMENT,
    slotStart: new Date(),
    slotEnd: new Date(),
    addressLine1: null,
    city: null,
    latitude: null,
    longitude: null,
    notes: null,
    confirmedAt: null,
    cancelledAt: null,
    cancelledBy: null,
    amountPaise: 10000,
    currency: 'INR',
    razorpayOrderId: 'order_1',
    razorpayPaymentId: null,
    refundAmountPaise: null,
    razorpayRefundId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    idempotencyKey: null,
    ...overrides,
  };
}

describe('BookingRepository', () => {
  let repository: BookingRepository;

  beforeEach(() => {
    repository = new BookingRepository(mockedPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('calls prisma.booking.create and returns mapped response', async () => {
      const payload = {
        userAuthId: 'u1',
        providerId: 'p1',
        providerServiceId: 'ps1',
        slotStart: new Date(),
        slotEnd: new Date(),
        amountPaise: 10000,
      };
      const row = mockBookingRow({ ...payload, razorpayOrderId: 'order_1' });
      mockedPrisma.booking.create.mockResolvedValue(row as never);
      const result = await repository.create(payload as never, 'order_1');
      expect(mockedPrisma.booking.create).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'b1', status: BookingStatus.PENDING_PAYMENT });
    });
  });

  describe('findById', () => {
    it('calls prisma.booking.findUnique', async () => {
      mockedPrisma.booking.findUnique.mockResolvedValue(mockBookingRow() as never);
      await repository.findById('b1');
      expect(mockedPrisma.booking.findUnique).toHaveBeenCalledWith({ where: { id: 'b1' } });
    });
  });

  describe('findByIdempotencyKey', () => {
    it('calls prisma.booking.findUnique with idempotencyKey', async () => {
      mockedPrisma.booking.findUnique.mockResolvedValue(mockBookingRow() as never);
      await repository.findByIdempotencyKey('key1');
      expect(mockedPrisma.booking.findUnique).toHaveBeenCalledWith({
        where: { idempotencyKey: 'key1' },
      });
    });
  });
});
