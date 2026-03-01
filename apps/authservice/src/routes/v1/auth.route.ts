import { Router } from 'express';
import { validateBody, createRateLimitMiddleware } from '@hyperlocal/shared/middlewares';

import { AuthController } from '../../controllers/index.js';
import { AuthService } from '../../services/index.js';
import { AuthRepository } from '../../repositories/auth.repository.js';
import {
  signupSchema,
  loginWithEmailSchema,
  loginWithPhoneSchema,
  sendVerificationSchema,
  verifySchema,
  refreshSchema,
} from '../../validators/index.js';

const authRouter = Router();

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

const sendVerificationRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many verification requests. Please try again later.',
});

authRouter.post('/signup', validateBody(signupSchema), authController.signup.bind(authController));

authRouter.post(
  '/login/email',
  validateBody(loginWithEmailSchema),
  authController.loginWithEmail.bind(authController),
);

authRouter.post(
  '/login/phone',
  validateBody(loginWithPhoneSchema),
  authController.loginWithPhone.bind(authController),
);

authRouter.post(
  '/send-verification',
  sendVerificationRateLimit,
  validateBody(sendVerificationSchema),
  authController.sendVerification.bind(authController),
);

authRouter.post(
  '/verify',
  validateBody(verifySchema),
  authController.verify.bind(authController),
);

authRouter.post(
  '/refresh',
  validateBody(refreshSchema),
  authController.refresh.bind(authController),
);

export default authRouter;