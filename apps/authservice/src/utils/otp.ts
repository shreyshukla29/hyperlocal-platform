import crypto from 'crypto';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const HASH_ALGORITHM = 'sha256';
const HASH_KEY =
  process.env.OTP_HASH_SECRET ?? 'default-auth-otp-secret-change-in-production';

export function generateOtp(): string {
  const digits = crypto.randomInt(0, 1_000_000);
  return digits.toString().padStart(OTP_LENGTH, '0');
}

export function hashOtp(otp: string): string {
  return crypto.createHmac(HASH_ALGORITHM, HASH_KEY).update(otp).digest('hex');
}

export function verifyOtp(
  plainOtp: string,
  storedHash: string,
  expiresAt: Date | null,
): boolean {
  if (!storedHash || !expiresAt || expiresAt < new Date()) return false;
  const computed = hashOtp(plainOtp);
  return crypto.timingSafeEqual(
    Buffer.from(computed, 'hex'),
    Buffer.from(storedHash, 'hex'),
  );
}

export function getOtpExpiresAt(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}
