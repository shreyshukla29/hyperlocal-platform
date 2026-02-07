import { Router } from 'express';
import { createWebhookController } from '../../controllers/index.js';
import { BookingService } from '../../service/index.js';
import { BookingRepository, PaymentWebhookEventRepository } from '../../repositories/index.js';

const bookingRepository = new BookingRepository();
const bookingService = new BookingService(bookingRepository);
const webhookEventRepo = new PaymentWebhookEventRepository();
const webhookController = createWebhookController(bookingService, webhookEventRepo);

export const webhookRouter = Router();

webhookRouter.post(
  '/razorpay',
  webhookController.handleRazorpay.bind(webhookController),
);
