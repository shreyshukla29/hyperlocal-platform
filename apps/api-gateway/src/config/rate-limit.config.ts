import dotenv from 'dotenv';

dotenv.config();

export interface RateLimitConfig {
  readonly windowMs: number;
  readonly maxRequests: number;
}

function numberFromEnv(
  name: string,
  defaultValue: number,
): number {
  const raw = process.env[name];

  if (raw === undefined) {
    return defaultValue;
  }

  const parsed = Number(raw);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsed;
}

export const RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: numberFromEnv('RATE_LIMIT_WINDOW_MS', 60_000),
  maxRequests: numberFromEnv('RATE_LIMIT_MAX', 100),
};
