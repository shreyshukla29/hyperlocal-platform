import express from 'express';

import { createGatewayAuthMiddleware } from '@hyperlocal/middlewares';
import { globalErrorHandler } from '@hyperlocal/middlewares';

import { ServiceConfig } from './config';
import { router } from './routes';

const app = express();

app.use(express.json());
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
app.use(
  createGatewayAuthMiddleware({
    validApiKey: ServiceConfig.GATEWAY_API_KEY,
  }),
);

app.use(router);

app.use(globalErrorHandler);

export { app };
