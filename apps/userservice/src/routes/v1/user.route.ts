import { Router } from 'express';
import { UserController } from './../../controllers';
import { UserService } from '../../service';
import { UserRepository } from './../../repositories';
import { validateBody } from '@hyperlocal/shared/middlewares';
import { updateUserProfileSchema, uploadAvatarSchema } from './../../validators';

export const userRouter = Router();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

userRouter.get('/profile', userController.getUserProfile.bind(userController))
userRouter.patch('/update/profile/:id',validateBody(updateUserProfileSchema),userController.updateUserProfile.bind(userController))
userRouter.post('/upload/avatar',validateBody(uploadAvatarSchema),userController.uploadUserAvatar.bind(userController))
userRouter.delete('/delete/avatar',userController.deleteUserAvatar.bind(userController))