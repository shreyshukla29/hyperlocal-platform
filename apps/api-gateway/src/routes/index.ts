import { Router } from 'express';
import { v1Router } from './v1';

export const rootRouter = Router();

rootRouter.use('/api/v1', v1Router);
