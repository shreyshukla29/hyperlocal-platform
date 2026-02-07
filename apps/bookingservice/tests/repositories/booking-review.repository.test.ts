import { jest } from '@jest/globals';
import { mockedPrisma } from '../__mocks__/prisma.mock.js';

jest.mock('../../src/config', () => ({ prisma: mockedPrisma }));
jest.mock('../../src/config/index', () => ({ prisma: mockedPrisma }));

import { BookingReviewRepository } from '../../src/repositories/booking-review.repository.js';

describe('BookingReviewRepository', () => {
  let repository: BookingReviewRepository;

  beforeEach(() => {
    repository = new BookingReviewRepository(mockedPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('calls prisma.bookingReview.create', async () => {
      const created = { id: 'r1', bookingId: 'b1', rating: 5, comment: 'Great' };
      mockedPrisma.bookingReview.create.mockResolvedValue(created as never);
      const result = await repository.create({
        bookingId: 'b1',
        userAuthId: 'u1',
        providerId: 'p1',
        providerServiceId: 'ps1',
        rating: 5,
        comment: 'Great',
      });
      expect(mockedPrisma.bookingReview.create).toHaveBeenCalled();
      expect(result).toEqual(created);
    });
  });
});
