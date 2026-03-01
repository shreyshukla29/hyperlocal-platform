import crypto from 'crypto';
import { ServerConfig } from '../config/index.js';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const HASH_ALGORITHM = 'sha256';

export function generateOtp(): string {
  const digits = crypto.randomInt(0, 1_000_000);
  return digits.toString().padStart(OTP_LENGTH, '0');
}

export function hashOtp(otp: string): string {
  return crypto.createHmac(HASH_ALGORITHM, ServerConfig.OTP_HASH_SECRET).update(otp).digest('hex');
}

export function verifyOtp(plainOtp: string, storedHash: string, expiresAt: Date | null): boolean {
  if (!storedHash || !expiresAt || expiresAt < new Date()) return false;
  const computed = hashOtp(plainOtp);
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(storedHash, 'hex'));
}

export function getOtpExpiresAt(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}
