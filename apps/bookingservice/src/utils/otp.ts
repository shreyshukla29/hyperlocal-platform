import crypto from 'crypto';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
const HASH_ALGORITHM = 'sha256';
const HASH_KEY = process.env.OTP_HASH_SECRET ?? 'default-otp-secret-change-in-production';

/**
 * Generate a numeric 6-digit OTP (e.g. for arrival/completion verification).
 * Stored hashed in DB; plain OTP is sent to user/service person once.
 */
export function generateOtp(): string {
  const digits = crypto.randomInt(0, 1_000_000);
  return digits.toString().padStart(OTP_LENGTH, '0');
}

/**
 * Hash OTP for storage. Never store plain OTP.
 */
export function hashOtp(otp: string): string {
  return crypto.createHmac(HASH_ALGORITHM, HASH_KEY).update(otp).digest('hex');
}

/**
 * Verify user-submitted OTP against stored hash. Returns true if match and not expired.
 */
export function verifyOtp(plainOtp: string, storedHash: string, expiresAt: Date): boolean {
  if (expiresAt < new Date()) return false;
  const computed = hashOtp(plainOtp);
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(storedHash, 'hex'));
}

export function getOtpExpiresAt(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

export const OTP_TTL_MS_EXPORT = OTP_TTL_MS;
