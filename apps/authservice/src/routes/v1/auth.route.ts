import { Router } from 'express';
import { validateBody } from '@hyperlocal/shared/middlewares';

import { AuthController } from '../../controllers/index.js';
import { AuthService } from '../../services/index.js';
import { AuthRepository } from '../../repositories/auth.repository.js';
import { sendVerificationSchema, verifySchema } from '../../validators/index.js';

const authRouter = Router();

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

authRouter.post('/signup', authController.signup.bind(authController));

authRouter.post('/login/email', authController.loginWithEmail.bind(authController));

authRouter.post('/login/phone', authController.loginWithPhone.bind(authController));

authRouter.post(
  '/send-verification',
  validateBody(sendVerificationSchema),
  authController.sendVerification.bind(authController),
);

authRouter.post(
  '/verify',
  validateBody(verifySchema),
  authController.verify.bind(authController),
);

authRouter.post('/refresh', (_req, res) =>
  res.status(501).json({
    success: false,
    error: 'NOT_IMPLEMENTED',
    data: null,
  }),
);

export default authRouter;