import authRouter from './auth.route.js';
import { Router } from 'express';

export const v1Router = Router();

v1Router.use('/auth', authRouter);
