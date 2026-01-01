import express, { type Application, type Request, type Response } from 'express';

import {
  createGatewayAuthMiddleware,
  globalErrorHandler,
} from '@hyperlocal/shared/middlewares';
import { ServerConfig } from './config';
import { router } from './routes';
import cookieParser  from 'cookie-parser';

export function createApp(): Application {
  const app = express();
  
  app.use(express.json());
  app.use(cookieParser());

  /* --------------------------------- health -------------------------------- */
  app.get('/health', (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      data: {
        status: 'UP',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
      },
      error: null,
    });
  });

  /* ------------------------- gateway authentication ------------------------- */
  app.use(
    createGatewayAuthMiddleware({
      validApiKey: ServerConfig.GATEWAY_API_KEY,
    }),
  );

  /* ---------------------------------- routes -------------------------------- */

  app.use(router);

  /* -------------------------- global error handler --------------------------- */
  app.use(globalErrorHandler);

  return app;
}
