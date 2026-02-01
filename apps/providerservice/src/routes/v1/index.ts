import { Router } from 'express';
import { providerRouter } from './provider.route';

export const v1Router = Router();

v1Router.use('/provider', providerRouter);
