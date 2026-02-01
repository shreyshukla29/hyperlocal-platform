import { Router } from 'express';
import { userRouter } from './user.route';
import { addressRouter } from './address.route';

export const v1Router = Router();

v1Router.use('/user', userRouter);
v1Router.use('/', addressRouter);