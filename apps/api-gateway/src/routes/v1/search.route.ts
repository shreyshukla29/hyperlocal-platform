import { Router } from 'express';
import { createServiceProxy } from '../../proxy/index.js';
import { ServiceName } from '../../enums/index.js';

export const searchRouter = Router();

// Search endpoints are served by Provider service (search merged into provider)
searchRouter.use(
  '/',
  createServiceProxy(ServiceName.PROVIDER, 'v1'),
);
