import { Router } from 'express';
import { providerRouter } from './provider.route.js';
import { searchRouter } from './search.route.js';

export const v1Router = Router();

v1Router.use('/provider', providerRouter);
v1Router.use('/search', searchRouter);
