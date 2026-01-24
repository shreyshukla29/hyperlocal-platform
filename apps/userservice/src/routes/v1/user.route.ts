import { Router } from 'express';

export const userRouter = Router();


userRouter.get('/profile/:id')
userRouter.patch('/update/profile')
userRouter.post('/upload/avatar')
userRouter.delete('/delete/avatar')