import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG } from '../config';

export const rateLimitMiddleware = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
});
