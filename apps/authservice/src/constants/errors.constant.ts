export const AUTH_ERRORS = {
  INVALID_PAYLOAD: 'Invalid request payload',
  EMAIL_EXISTS: 'Email already registered',
  PHONE_EXISTS: 'Phone already registered',
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_INACTIVE: 'Account is inactive',
  ACCOUNT_TYPE_NOT_ALLOWED: 'Account type not allowed',
  EMAIL_NOT_VERIFIED: 'Email not verified',
  PHONE_NOT_VERIFIED: 'Phone not verified',
  VERIFICATION_NOT_FOUND: 'No pending verification found for this email or phone',
  OTP_EXPIRED: 'Verification code has expired',
  OTP_INVALID: 'Invalid verification code',
  VALUE_MISMATCH: 'Email or phone does not belong to your account',
} as const;
