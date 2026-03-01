import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG } from '../config/index.js';

export const rateLimitMiddleware = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.windowMs,
  max: RATE_LIMIT_CONFIG.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
});
