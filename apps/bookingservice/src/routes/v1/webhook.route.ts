import { Router } from 'express';
import { createWebhookController } from '../../controllers/index.js';
import { BookingService } from '../../service/index.js';
import { BookingRepository, PaymentWebhookEventRepository } from '../../repositories/index.js';
import { BookingOtpRepository } from '../../repositories/index.js';
import { BookingOtpService } from '../../service/booking-otp.service.js';

const bookingRepository = new BookingRepository();
const bookingOtpRepository = new BookingOtpRepository();
const bookingOtpService = new BookingOtpService(bookingOtpRepository);
const bookingService = new BookingService(bookingRepository, bookingOtpService);
const webhookEventRepo = new PaymentWebhookEventRepository();
const webhookController = createWebhookController(bookingService, webhookEventRepo);

export const webhookRouter = Router();

webhookRouter.post('/razorpay', webhookController.handleRazorpay.bind(webhookController));
