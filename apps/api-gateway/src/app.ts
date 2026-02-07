import express from 'express';
import { requestContextMiddleware, errorMiddleware, rateLimitMiddleware } from './middlewares/index.js';
import { rootRouter } from './routes/index.js';
import { healthRouter } from './routes/health.route.js';
import { docsRouter } from './routes/docs.route.js';
import cookieParser from 'cookie-parser';

export function createApp() {
  const app = express();

  app.use(cookieParser());
  app.use(healthRouter);
  app.use('/api-docs', docsRouter);
  app.use(requestContextMiddleware);
  app.use(rateLimitMiddleware);
  app.use(rootRouter);

  app.use(errorMiddleware);
  return app;
}
