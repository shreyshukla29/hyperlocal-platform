import { Router } from 'express';

import { AuthController } from '../../controllers';
import { AuthService } from '../../services';
import { AuthRepository } from '../../repositories/auth.repository';

const authRouter = Router();

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

authRouter.post('/signup', authController.signup.bind(authController));

authRouter.post('/login/email', authController.loginWithEmail.bind(authController));

authRouter.post('/login/phone', authController.loginWithPhone.bind(authController));

authRouter.post('/refresh', (_req, res) =>
  res.status(501).json({
    success: false,
    error: 'NOT_IMPLEMENTED',
    data: null,
  }),
);

export default authRouter;