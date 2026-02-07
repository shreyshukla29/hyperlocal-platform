import { Router } from 'express';
import { createServiceProxy } from '../../proxy/index.js';
import { ServiceName } from '../../enums/index.js';

export const authRouter = Router();

authRouter.use('/',
  createServiceProxy(ServiceName.AUTH,'v1'),
);

