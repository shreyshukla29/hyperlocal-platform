import { Router } from 'express';
import { userRouter } from './user.route';

export const v1Router = Router();

v1Router.use('/user',userRouter)