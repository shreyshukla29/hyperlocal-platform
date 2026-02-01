import { Router } from 'express';
import { bookingRouter, providerBookingRouter } from './booking.route';
import { webhookRouter } from './webhook.route';

export const v1Router = Router();

// User bookings: create, list my, get my, cancel my
v1Router.use('/bookings', bookingRouter);
// Provider bookings: list, get, cancel (full refund)
v1Router.use('/bookings/provider', providerBookingRouter);

export { webhookRouter };
