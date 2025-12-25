import { Router } from 'express';
import { jwtAuthMiddleware } from '../../middlewares';
import { authRouter } from './auth.route';
import { userRouter } from './user.route';

export const v1Router = Router();

v1Router.use(jwtAuthMiddleware);

v1Router.use('/auth', authRouter);
v1Router.use('/user', userRouter);
