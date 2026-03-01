import type { Request, Response, NextFunction } from 'express';

export interface RateLimitOptions {
  /** Window size in milliseconds (e.g. 60_000 for 1 minute) */
  windowMs: number;
  /** Max number of requests per window per key */
  max: number;
  /** Key generator: default uses IP + path. Return same key for same "user" to limit. */
  keyGenerator?: (req: Request) => string;
  /** Optional custom message when rate limit exceeded */
  message?: string;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

const defaultKeyGenerator = (req: Request): string => {
  const ip = (req.ip ?? req.socket?.remoteAddress ?? 'unknown').toString();
  const path = req.path ?? '';
  return `${ip}:${path}`;
};

/**
 * In-memory, customizable rate limiter middleware.
 * Use for routes that must be protected from abuse (e.g. send OTP).
 * For multi-instance deployments, replace the store with Redis or similar.
 */
export function createRateLimitMiddleware(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    keyGenerator = defaultKeyGenerator,
    message = 'Too many requests, please try again later',
  } = options;

  const store = new Map<string, WindowEntry>();

  const prune = (now: number) => {
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) store.delete(key);
    }
  };

  return function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const now = Date.now();
    prune(now);

    const key = keyGenerator(req);
    let entry = store.get(key);

    if (!entry) {
      entry = { count: 1, resetAt: now + windowMs };
      store.set(key, entry);
      return next();
    }

    if (entry.resetAt <= now) {
      entry = { count: 1, resetAt: now + windowMs };
      store.set(key, entry);
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      res.status(429).json({
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message,
        data: null,
      });
      return;
    }

    next();
  };
}
