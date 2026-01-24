import { Router } from 'express';
import { UserController } from './../../controllers';
import { UserService } from '../../service';
import { UserRepository } from './../../repositories';

export const userRouter = Router();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

userRouter.get('/profile', userController.getUserProfile.bind(userController))
userRouter.patch('/update/profile')
userRouter.post('/upload/avatar')
userRouter.delete('/delete/avatar')