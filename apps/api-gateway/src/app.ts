import express from 'express';
import cookieParser from 'cookie-parser';
import { requestContextMiddleware, errorMiddleware, rateLimitMiddleware } from './middlewares';
import { rootRouter } from './routes';
import { healthRouter } from './routes/health.route';
export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(healthRouter)
  app.use(requestContextMiddleware);
  app.use(rateLimitMiddleware)
  app.use(rootRouter);

  app.use(errorMiddleware);
  return app;
}
