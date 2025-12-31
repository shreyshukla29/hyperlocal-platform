import { Router } from 'express';
import { createServiceProxy } from '../../proxy';
import { ServiceName } from '../../enums';

export const userRouter = Router();

userRouter.use(
  '/',
  createServiceProxy(ServiceName.USER,'v1'),
);
