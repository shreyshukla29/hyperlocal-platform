import express, { type Application, type Request, type Response } from 'express';

import {
  createGatewayAuthMiddleware,
  globalErrorHandler,
} from '@hyperlocal/shared/middlewares';
import { ServerConfig } from './config/index.js';
import { router } from './routes/index.js';
import cookieParser from 'cookie-parser';

export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      data: {
        status: 'UP',
        service: 'provider-service',
        timestamp: new Date().toISOString(),
      },
      error: null,
    });
  });


  app.use(
    createGatewayAuthMiddleware({
      validApiKey: ServerConfig.GATEWAY_API_KEY,
    }),
  );


  app.use(router);

  app.use(globalErrorHandler);

  return app;
}
