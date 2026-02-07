import express, { type Application, type Request, type Response } from 'express';
import {
  createGatewayAuthMiddleware,
  globalErrorHandler,
} from '@hyperlocal/shared/middlewares';
import { ServerConfig } from './config/index.js';
import { router, webhookRouter } from './routes/index.js';
import cookieParser from 'cookie-parser';

export function createApp(): Application {
  const app = express();

  app.get('/health', (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      data: {
        status: 'UP',
        service: 'booking-service',
        timestamp: new Date().toISOString(),
      },
      error: null,
    });
  });

  // Razorpay webhook: raw body required for signature verification; no gateway auth
  app.use(
    '/api/v1/webhooks',
    express.raw({ type: '*/*' }),
    webhookRouter,
  );

  app.use(express.json());
  app.use(cookieParser());

  app.use(
    createGatewayAuthMiddleware({
      validApiKey: ServerConfig.GATEWAY_API_KEY,
    }),
  );

  app.use(router);
  app.use(globalErrorHandler);

  return app;
}
