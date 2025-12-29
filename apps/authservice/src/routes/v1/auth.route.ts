import { Router } from 'express';

export const authRouter = Router();

authRouter.post('/singup')
authRouter.post('/login/email')
authRouter.post('/login/phone')
authRouter.get('/refresh')
