import express from 'express';
import { requestContextMiddleware, errorMiddleware, rateLimitMiddleware } from './middlewares';
import { rootRouter } from './routes';
import { healthRouter } from './routes/health.route';
import cookieParser from 'cookie-parser';
export function createApp() {
  const app = express();

  app.use(cookieParser());
  app.use(healthRouter);
  app.use(requestContextMiddleware);
  app.use(rateLimitMiddleware);
  app.use(rootRouter);

  app.use(errorMiddleware);
  return app;
}
