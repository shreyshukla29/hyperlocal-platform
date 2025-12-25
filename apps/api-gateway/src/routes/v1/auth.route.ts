import { Router } from 'express';
import { createServiceProxy } from '../../proxy';
import { ServiceName } from '../../enums';

export const authRouter = Router();

authRouter.use(
  '/',
  createServiceProxy(ServiceName.AUTH),
);
