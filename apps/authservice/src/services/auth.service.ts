import { AuthRepository } from '../repositories/auth.repository.js';
import { VerificationType } from '../generated/prisma/client.js';

import {
  SignupRequest,
  LoginWithEmailRequest,
  LoginWithPhoneRequest,
  SignupResponse,
  LoginResponse,
  AuthTokenPayload,
  SendVerificationRequest,
  VerifyRequest,
} from '../types/auth.types.js';

import {
  signupSchema,
  loginWithEmailSchema,
  loginWithPhoneSchema,
  sendVerificationSchema,
  verifySchema,
} from '../validators/index.js';

import { hashPassword, verifyPassword, createToken } from '../utils/index.js';
import { generateOtp, hashOtp, getOtpExpiresAt, verifyOtp } from '../utils/otp.js';

import { AUTH_ERRORS } from '../constants/index.js';
import { AuthMethod } from '../enums/index.js';

import {
  ValidationError,
  BadRequestError,
  ForbiddenError,
} from '@hyperlocal/shared/errors';
import { ServerConfig } from '../config/server_config.js';
import { publishUserSignedUpEvent } from '../events/index.js';
import { USER_SIGNED_UP_EVENT } from '@hyperlocal/shared/events';
import { publishAuthNotification } from '../events/notification.publisher.js';
export class AuthService {
  constructor(private readonly repo: AuthRepository = new AuthRepository()) {}

  async signup(payload: SignupRequest): Promise<SignupResponse> {
    const parsed = signupSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ValidationError(AUTH_ERRORS.INVALID_PAYLOAD, 400);
    }

    const { email, phone, password, accountType, firstName,
  lastName } = parsed.data;

    if (!email && !phone) {
      throw new BadRequestError(AUTH_ERRORS.INVALID_PAYLOAD, 400);
    }

    if (email && (await this.repo.existsByEmail(email, accountType))) {
  throw new BadRequestError(AUTH_ERRORS.EMAIL_EXISTS, 409);
}

if (phone && (await this.repo.existsByPhone(phone, accountType))) {
  throw new BadRequestError(AUTH_ERRORS.PHONE_EXISTS, 409);
}

    const passwordHash = await hashPassword(password);

    const identity = await this.repo.createIdentity({
      email,
      phone,
      password:passwordHash,
      accountType,
    });

    if (email) {
      await this.repo.createVerification(identity.id, AuthMethod.EMAIL, email);
    }

    if (phone) {
      await this.repo.createVerification(identity.id, AuthMethod.PHONE, phone);
    }

    await publishUserSignedUpEvent({
  event: USER_SIGNED_UP_EVENT,
  authIdentityId: identity.id,
  firstName,
  lastName,
  email,
  phone,
  accountType,
  occurredAt: new Date().toISOString(),
});

    const token = createToken<AuthTokenPayload>({
    payload: {
      authId: identity.id,
      email: identity.email ?? undefined,
      phone: identity.phone ?? undefined,
      accountType: identity.accountType,
    },
     secretKey: ServerConfig.JWT_SECRET,
    options: {
      expiresIn: '24h',
  
    },
  });

    return {
      data : {
      authId: identity.id,
      email: identity.email,
      phone: identity.phone,
      accountType: identity.accountType,
       },
      token 
    };
  }

  async loginWithEmail(payload: LoginWithEmailRequest): Promise<LoginResponse> {
    const parsed = loginWithEmailSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ValidationError(AUTH_ERRORS.INVALID_PAYLOAD, 400);
    }

const { email, password, loginAs } = parsed.data;

const identity = await this.repo.findByEmail(email, loginAs);
if (!identity) {
  throw new BadRequestError(AUTH_ERRORS.INVALID_CREDENTIALS);
}

if (!identity.isActive) {
  throw new ForbiddenError(AUTH_ERRORS.ACCOUNT_INACTIVE);
}

const validPassword = await verifyPassword(password, identity.password);
if (!validPassword) {
  throw new BadRequestError(AUTH_ERRORS.INVALID_CREDENTIALS);
}

    // const isVerified = await this.repo.isVerified(identity.id, AuthMethod.EMAIL);
    // if (!isVerified) {
    //   throw new AppError(AUTH_ERRORS.EMAIL_NOT_VERIFIED, 403);
    // }

    const token = createToken<AuthTokenPayload>({
    payload: {
       authId: identity.id,
      email: identity.email ?? undefined,
      phone: identity.phone ?? undefined,
      accountType: identity.accountType,
    },
    secretKey: ServerConfig.JWT_SECRET,
    options: {
      expiresIn: '48h',
    },
  });

    return {
     data : {
      authId: identity.id,
      accountType: identity.accountType,
     },
      token
    };
  }

  async loginWithPhone(payload: LoginWithPhoneRequest): Promise<LoginResponse> {
    const parsed = loginWithPhoneSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ValidationError(AUTH_ERRORS.INVALID_PAYLOAD);
    }

    const { phone, password, loginAs } = parsed.data;

const identity = await this.repo.findByPhone(phone, loginAs);
if (!identity) {
  throw new BadRequestError(AUTH_ERRORS.INVALID_CREDENTIALS);
}

if (!identity.isActive) {
  throw new ForbiddenError(AUTH_ERRORS.ACCOUNT_INACTIVE);
}

const validPassword = await verifyPassword(password, identity.password);
if (!validPassword) {
  throw new BadRequestError(AUTH_ERRORS.INVALID_CREDENTIALS);
}


    // const isVerified = await this.repo.isVerified(identity.id, AuthMethod.PHONE);
    // if (!isVerified) {
    //   throw new BadRequestError(AUTH_ERRORS.PHONE_NOT_VERIFIED, 403);
    // }

     const token = createToken<AuthTokenPayload>({
    payload: {
       authId: identity.id,
      email: identity.email ?? undefined,
      phone: identity.phone ?? undefined,
      accountType: identity.accountType,
    },
    secretKey: ServerConfig.JWT_SECRET,
    options: {
      expiresIn: '24h',
     
    },
  });

    return {
      data: {
        authId: identity.id,
        accountType: identity.accountType,
      },
      token,
    };
  }

  /** Send verification OTP to email or phone. Requires authenticated user (identityId from JWT). */
  async sendVerification(
    identityId: string,
    payload: SendVerificationRequest,
  ): Promise<{ success: true }> {
    const parsed = sendVerificationSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ValidationError(AUTH_ERRORS.INVALID_PAYLOAD, 400);
    }

    const { type, value } = parsed.data;
    const verificationType =
      type === AuthMethod.EMAIL ? VerificationType.EMAIL : VerificationType.PHONE;

    const identity = await this.repo.findById(identityId);
    if (!identity) {
      throw new BadRequestError(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    if (type === AuthMethod.EMAIL) {
      const normalized = value.trim().toLowerCase();
      if (identity.email !== normalized) {
        throw new BadRequestError(AUTH_ERRORS.VALUE_MISMATCH);
      }
    } else {
      const normalized = value.replace(/\s+/g, '');
      if (identity.phone !== normalized) {
        throw new BadRequestError(AUTH_ERRORS.VALUE_MISMATCH);
      }
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiresAt = getOtpExpiresAt();

    await this.repo.upsertVerificationOtp(
      identityId,
      verificationType,
      value,
      otpHash,
      otpExpiresAt,
    );

    const title = 'Verification code';
    const body = `Your verification code is: ${otp}. It expires in 10 minutes.`;

    await publishAuthNotification({
      userAuthId: identityId,
      type: 'otp_verification',
      title,
      body,
      channel: type === AuthMethod.EMAIL ? 'email' : 'in_app',
      emailTo: type === AuthMethod.EMAIL ? value : null,
    });

    return { success: true };
  }

  /** Verify OTP and mark email/phone as verified. No auth required (user submits code). */
  async verify(payload: VerifyRequest): Promise<{ success: true }> {
    const parsed = verifySchema.safeParse(payload);
    if (!parsed.success) {
      throw new ValidationError(AUTH_ERRORS.INVALID_PAYLOAD, 400);
    }

    const { type, value, code } = parsed.data;
    const verificationType =
      type === AuthMethod.EMAIL ? VerificationType.EMAIL : VerificationType.PHONE;

    const record = await this.repo.findPendingByTypeAndValue(verificationType, value);
    if (!record) {
      throw new BadRequestError(AUTH_ERRORS.VERIFICATION_NOT_FOUND);
    }

    if (!record.otpHash || !record.otpExpiresAt) {
      throw new BadRequestError(AUTH_ERRORS.OTP_EXPIRED);
    }

    if (!verifyOtp(code, record.otpHash, record.otpExpiresAt)) {
      throw new BadRequestError(AUTH_ERRORS.OTP_INVALID);
    }

    await this.repo.markVerified(record.identityId, verificationType);
    return { success: true };
  }
}
