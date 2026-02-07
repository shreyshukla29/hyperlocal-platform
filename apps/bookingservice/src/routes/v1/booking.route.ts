import { Router } from 'express';
import { validateBody } from '@hyperlocal/shared/middlewares';
import { BookingController } from '../../controllers/index.js';
import { BookingService, BookingOtpService, BookingReviewService } from '../../service/index.js';
import { BookingRepository, BookingOtpRepository, BookingReviewRepository } from '../../repositories/index.js';
import {
  createBookingSchema,
  assignServicePersonSchema,
  confirmArrivalSchema,
  verifyCompletionSchema,
  createReviewSchema,
} from '../../validators/index.js';

const bookingRepository = new BookingRepository();
const bookingOtpRepository = new BookingOtpRepository();
const bookingReviewRepository = new BookingReviewRepository();
const bookingOtpService = new BookingOtpService(bookingOtpRepository);
const bookingService = new BookingService(bookingRepository, bookingOtpService);
const reviewService = new BookingReviewService(bookingRepository, bookingReviewRepository);
const bookingController = new BookingController(bookingService, reviewService);

export const bookingRouter = Router();

// User: create booking (idempotency key in header recommended for retries)
bookingRouter.post(
  '/',
  validateBody(createBookingSchema),
  bookingController.create.bind(bookingController),
);

// User: list my bookings
bookingRouter.get(
  '/',
  bookingController.listForUser.bind(bookingController),
);

// Available slots for a provider on a date (open intervals minus existing bookings)
bookingRouter.get(
  '/available-slots',
  bookingController.getAvailableSlots.bind(bookingController),
);

// List reviews by provider (for search/profile)
bookingRouter.get(
  '/reviews',
  bookingController.listReviewsByProvider.bind(bookingController),
);

// User: get my booking by id
bookingRouter.get(
  '/:id',
  bookingController.getByIdForUser.bind(bookingController),
);

// User: cancel my booking (refund per policy: 24h+ = 100%, 12–24h = 50%, <12h = 0%)
bookingRouter.post(
  '/:id/cancel',
  bookingController.cancelByUser.bind(bookingController),
);

// User: verify completion OTP to mark booking COMPLETED
bookingRouter.post(
  '/:id/verify-completion',
  validateBody(verifyCompletionSchema),
  bookingController.verifyCompletion.bind(bookingController),
);

// User: add review for completed booking (one per booking)
bookingRouter.post(
  '/:id/review',
  validateBody(createReviewSchema),
  bookingController.createReview.bind(bookingController),
);

// Provider routes mounted at /api/v1/bookings/provider (see v1/index)
export const providerBookingRouter = Router();
providerBookingRouter.get(
  '/',
  bookingController.listForProvider.bind(bookingController),
);
providerBookingRouter.get(
  '/:id',
  bookingController.getByIdForProvider.bind(bookingController),
);
providerBookingRouter.post(
  '/:id/cancel',
  bookingController.cancelByProvider.bind(bookingController),
);
providerBookingRouter.patch(
  '/:id/assign',
  validateBody(assignServicePersonSchema),
  bookingController.assignServicePerson.bind(bookingController),
);
providerBookingRouter.post(
  '/:id/confirm-arrival',
  validateBody(confirmArrivalSchema),
  bookingController.confirmArrival.bind(bookingController),
);
providerBookingRouter.post(
  '/:id/mark-complete',
  bookingController.markComplete.bind(bookingController),
);
