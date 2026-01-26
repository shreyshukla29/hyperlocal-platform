import { Router } from 'express';
import { UserController } from '../../controllers';
import { UserService } from '../../service';
import { UserRepository } from '../../repositories';
import { validateBody } from '@hyperlocal/shared/middlewares';
import { updateUserProfileSchema } from '../../validators';
import { uploadAvatar } from '../../middlewares';

export const userRouter = Router();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

userRouter.get(
  '/profile',
  userController.getUserProfile.bind(userController),
);

userRouter.patch(
  '/profile/:id',
  validateBody(updateUserProfileSchema),
  userController.updateUserProfile.bind(userController),
);

userRouter.patch(
  '/avatar/:id',
  (req, res, next) => {
    uploadAvatar(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: err.message,
          data: null,
        });
      }
      next();
    });
  },
  userController.uploadUserAvatar.bind(userController),
);

userRouter.delete(
  '/avatar/:id',
  userController.deleteUserAvatar.bind(userController),
);
