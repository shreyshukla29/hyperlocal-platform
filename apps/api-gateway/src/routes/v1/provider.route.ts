import { Router } from 'express';
import { createServiceProxy } from '../../proxy/index.js';
import { ServiceName } from '../../enums/index.js';

export const providerRouter = Router();

providerRouter.use(
  '/',
  createServiceProxy(ServiceName.PROVIDER, 'v1'),
);
