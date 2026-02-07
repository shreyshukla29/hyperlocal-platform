import { Router } from 'express';
import { createServiceProxy } from '../../proxy/index.js';
import { ServiceName } from '../../enums/index.js';

export const notificationRouter = Router();

notificationRouter.use(
  '/',
  createServiceProxy(ServiceName.NOTIFICATION, 'v1'),
);
