import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyWebhookSignature } from '../utils/index.js';
import { ServerConfig } from '../config/index.js';
import { BookingService } from '../service/index.js';
import { PaymentWebhookEventRepository } from '../repositories/index.js';
import { logger } from '@hyperlocal/shared/logger';

const RAZORPAY_SIGNATURE_HEADER = 'x-razorpay-signature';

export function createWebhookController(
  bookingService: BookingService,
  webhookEventRepo: PaymentWebhookEventRepository,
) {
  return {
    async handleRazorpay(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<Response | void> {
      const rawBody = req.body;
      let bodyStr: string;
      if (Buffer.isBuffer(rawBody)) {
        bodyStr = rawBody.toString('utf8');
      } else if (typeof rawBody === 'string') {
        bodyStr = rawBody;
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send('Invalid body');
      }
      const signature = req.headers[RAZORPAY_SIGNATURE_HEADER];
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!sig) {
        return res.status(StatusCodes.BAD_REQUEST).send('Missing signature');
      }
      const valid = verifyWebhookSignature(
        bodyStr,
        sig,
        ServerConfig.RAZORPAY_WEBHOOK_SECRET,
      );
      if (!valid) {
        logger.warn('Razorpay webhook signature verification failed');
        return res.status(StatusCodes.BAD_REQUEST).send('Invalid signature');
      }

      let payload: {
        event: string;
        payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
      };
      try {
        payload = JSON.parse(bodyStr);
      } catch {
        return res.status(StatusCodes.BAD_REQUEST).send('Invalid JSON');
      }

      const eventType = payload.event;
      const eventId = (payload as { id?: string }).id ?? `${eventType}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const claimed = await webhookEventRepo.createStrict(eventId, eventType);
      if (!claimed) {
        return res.status(StatusCodes.OK).send('OK');
      }

      try {
        if (eventType === 'payment.captured') {
          const paymentEntity = payload.payload?.payment?.entity;
          const orderId = paymentEntity?.order_id;
          const paymentId = paymentEntity?.id;
          if (orderId && paymentId) {
            await bookingService.handlePaymentCaptured(orderId, paymentId);
          }
        } else if (eventType === 'payment.failed') {
          const paymentEntity = payload.payload?.payment?.entity;
          const orderId = paymentEntity?.order_id;
          if (orderId) {
            await bookingService.handlePaymentFailed(orderId);
          }
        }
      } catch (err) {
        logger.error('Razorpay webhook processing error', { err, eventType, eventId });
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Processing failed');
      }

      return res.status(StatusCodes.OK).send('OK');
    },
  };
}
