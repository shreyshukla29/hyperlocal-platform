import { BookingRepository } from '../repositories/booking.repository.js';
import { BookingReviewRepository } from '../repositories/booking-review.repository.js';
import type { CreateReviewPayload, ListReviewsQuery, ReviewResponse } from '../repositories/booking-review.repository.js';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '@hyperlocal/shared/errors';
import { BookingStatus } from '../enums/index.js';

const MIN_RATING = 1;
const MAX_RATING = 5;

export class BookingReviewService {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly reviewRepo: BookingReviewRepository,
  ) {}

  async create(
    bookingId: string,
    userAuthId: string,
    payload: { rating: number; comment?: string | null },
  ): Promise<ReviewResponse> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    if (booking.userAuthId !== userAuthId) {
      throw new ForbiddenError('Access denied: not your booking');
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestError('Only completed bookings can be reviewed');
    }
    if (payload.rating < MIN_RATING || payload.rating > MAX_RATING) {
      throw new BadRequestError(`Rating must be between ${MIN_RATING} and ${MAX_RATING}`);
    }
    const existing = await this.reviewRepo.findByBookingId(bookingId);
    if (existing) {
      throw new ConflictError('This booking has already been reviewed');
    }
    return this.reviewRepo.create({
      bookingId,
      userAuthId,
      providerId: booking.providerId,
      providerServiceId: booking.providerServiceId,
      rating: payload.rating,
      comment: payload.comment ?? null,
    });
  }

  async listByProvider(
    providerId: string,
    query?: ListReviewsQuery,
  ): Promise<{ items: ReviewResponse[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.reviewRepo.findByProvider(providerId, query);
  }
}
