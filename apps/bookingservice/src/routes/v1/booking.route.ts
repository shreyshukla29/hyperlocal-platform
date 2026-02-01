import { Router } from 'express';
import { validateBody } from '@hyperlocal/shared/middlewares';
import { BookingController } from '../../controllers';
import { BookingService } from '../../service';
import { BookingRepository } from '../../repositories';
import { createBookingSchema } from '../../validators';

const bookingRepository = new BookingRepository();
const bookingService = new BookingService(bookingRepository);
const bookingController = new BookingController(bookingService);

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
