import { Router } from 'express';
import { jwtAuthMiddleware } from '../../middlewares/index.js';
import { authRouter } from './auth.route.js';
import { userRouter } from './user.route.js';
import { providerRouter } from './provider.route.js';
import { bookingRouter } from './booking.route.js';
import { searchRouter } from './search.route.js';
import { notificationRouter } from './notification.route.js';

export const v1Router = Router();

v1Router.use('/auth', authRouter);

v1Router.use(jwtAuthMiddleware);
v1Router.use('/user', userRouter);
v1Router.use('/provider', providerRouter);
v1Router.use('/booking', bookingRouter);
v1Router.use('/search', searchRouter);
v1Router.use('/notification', notificationRouter);