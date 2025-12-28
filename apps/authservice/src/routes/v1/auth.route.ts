import { Router } from 'express';

export const authRouter = Router();

authRouter.post('/login')
authRouter.post('/singup')
authRouter.get('/refresh')
