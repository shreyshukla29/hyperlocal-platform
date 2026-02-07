import { Router } from 'express';
import { createServiceProxy } from '../../proxy/index.js';
import { ServiceName } from '../../enums/index.js';

export const userRouter = Router();

userRouter.use(
  '/',
  createServiceProxy(ServiceName.USER,'v1'),
);
