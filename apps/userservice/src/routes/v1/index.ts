import { Router } from 'express';
import { userRouter } from './user.route.js';
import { addressRouter } from './address.route.js';

export const v1Router = Router();

v1Router.use('/user', userRouter);
v1Router.use('/', addressRouter);