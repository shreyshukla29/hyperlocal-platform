import express from 'express';

import { createGatewayAuthMiddleware } from '@hyperlocal/shared/middlewares';
import { globalErrorHandler } from '@hyperlocal/shared/middlewares';

import { ServerConfig } from './config';
import { router } from './routes';

const app: typeApplication = express();

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
    validApiKey: ServerConfig.GATEWAY_API_KEY,
  }),
);

app.use(router);

app.use(globalErrorHandler);

export { app };
