import { Router } from 'express';
import { createWebhookController } from '../../controllers';
import { BookingService } from '../../service';
import { BookingRepository, PaymentWebhookEventRepository } from '../../repositories';

const bookingRepository = new BookingRepository();
const bookingService = new BookingService(bookingRepository);
const webhookEventRepo = new PaymentWebhookEventRepository();
const webhookController = createWebhookController(bookingService, webhookEventRepo);

export const webhookRouter = Router();

webhookRouter.post(
  '/razorpay',
  webhookController.handleRazorpay.bind(webhookController),
);
