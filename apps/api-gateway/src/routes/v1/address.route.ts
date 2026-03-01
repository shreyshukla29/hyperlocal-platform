import { Router } from 'express';
import { createServiceProxy } from '../../proxy/index.js';
import { ServiceName } from '../../enums/index.js';

export const addressRouter = Router();

addressRouter.use('/', createServiceProxy(ServiceName.ADDRESS, 'v1'));
