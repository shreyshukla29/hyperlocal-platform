import { Router } from 'express';
import { createServiceProxy } from '../../proxy/index.js';
import { ServiceName } from '../../enums/index.js';

export const bookingRouter = Router();

bookingRouter.use(
  '/',
  createServiceProxy(ServiceName.BOOKING, 'v1'),
);
