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
  RefreshRequest,
  RefreshResponse,
} from '../types/index.js';

import { hashPassword, verifyPassword, createToken, verifyToken } from '../utils/index.js';
import type { SignOptions } from 'jsonwebtoken';
import { generateOtp, hashOtp, getOtpExpiresAt, verifyOtp } from '../utils/otp.js';

import { AUTH_ERRORS } from '../constants/index.js';
import { AccountType, AuthMethod } from '../enums/index.js';

import { BadRequestError, ForbiddenError, ConflictError } from '@hyperlocal/shared/errors';
import { ServerConfig } from '../config/server_config.js';
import { publishUserSignedUpEvent } from '../events/index.js';
import { USER_SIGNED_UP_EVENT } from '@hyperlocal/shared/events';
import { publishAuthNotification } from '../events/notification.publisher.js';
export class AuthService {
  constructor(private readonly repo: AuthRepository = new AuthRepository()) {}

  async signup(payload: SignupRequest): Promise<SignupResponse> {
    const { email, phone, password, accountType, firstName, lastName } = payload;

    if (!email && !phone) {
      throw new BadRequestError(AUTH_ERRORS.INVALID_PAYLOAD);
    }

    if (email && (await this.repo.existsByEmail(email, accountType))) {
      throw new ConflictError(AUTH_ERRORS.EMAIL_EXISTS);
    }

    if (phone && (await this.repo.existsByPhone(phone, accountType))) {
      throw new ConflictError(AUTH_ERRORS.PHONE_EXISTS);
    }

    const passwordHash = await hashPassword(password);

    const identity = await this.repo.createIdentity({
      email,
      phone,
      password: passwordHash,
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
      options: { expiresIn: ServerConfig.JWT_EXPIRY as SignOptions['expiresIn'] },
    });

    const refreshToken = createToken<AuthTokenPayload>({
      payload: {
        authId: identity.id,
        email: identity.email ?? undefined,
        phone: identity.phone ?? undefined,
        accountType: identity.accountType,
      },
      secretKey: ServerConfig.JWT_REFRESH_SECRET,
      options: { expiresIn: ServerConfig.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'] },
    });

    return {
      data: {
        authId: identity.id,
        email: identity.email,
        phone: identity.phone,
        accountType: identity.accountType,
      },
      token,
      refreshToken,
    };
  }

  async loginWithEmail(payload: LoginWithEmailRequest): Promise<LoginResponse> {
    const { email, password, loginAs } = payload;

    const identity = await this.repo.findByEmail(email!, loginAs);
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

    const isVerified = await this.repo.isVerified(identity.id, AuthMethod.EMAIL);
    if (!isVerified) {
      throw new ForbiddenError(AUTH_ERRORS.EMAIL_NOT_VERIFIED);
    }

    const token = createToken<AuthTokenPayload>({
      payload: {
        authId: identity.id,
        email: identity.email ?? undefined,
        phone: identity.phone ?? undefined,
        accountType: identity.accountType,
      },
      secretKey: ServerConfig.JWT_SECRET,
      options: { expiresIn: ServerConfig.JWT_EXPIRY as SignOptions['expiresIn'] },
    });

    const refreshToken = createToken<AuthTokenPayload>({
      payload: {
        authId: identity.id,
        email: identity.email ?? undefined,
        phone: identity.phone ?? undefined,
        accountType: identity.accountType,
      },
      secretKey: ServerConfig.JWT_REFRESH_SECRET,
      options: { expiresIn: ServerConfig.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'] },
    });

    return {
      data: {
        authId: identity.id,
        email: identity.email,
        phone: identity.phone,
        accountType: identity.accountType,
      },
      token,
      refreshToken,
    };
  }

  async loginWithPhone(payload: LoginWithPhoneRequest): Promise<LoginResponse> {
    const { phone, password, loginAs } = payload;

    const identity = await this.repo.findByPhone(phone!, loginAs);
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

    const isVerified = await this.repo.isVerified(identity.id, AuthMethod.PHONE);
    if (!isVerified) {
      throw new ForbiddenError(AUTH_ERRORS.PHONE_NOT_VERIFIED);
    }

    const token = createToken<AuthTokenPayload>({
      payload: {
        authId: identity.id,
        email: identity.email ?? undefined,
        phone: identity.phone ?? undefined,
        accountType: identity.accountType,
      },
      secretKey: ServerConfig.JWT_SECRET,
      options: { expiresIn: ServerConfig.JWT_EXPIRY as SignOptions['expiresIn'] },
    });

    const refreshToken = createToken<AuthTokenPayload>({
      payload: {
        authId: identity.id,
        email: identity.email ?? undefined,
        phone: identity.phone ?? undefined,
        accountType: identity.accountType,
      },
      secretKey: ServerConfig.JWT_REFRESH_SECRET,
      options: { expiresIn: ServerConfig.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'] },
    });

    return {
      data: {
        authId: identity.id,
        email: identity.email,
        phone: identity.phone,
        accountType: identity.accountType,
      },
      token,
      refreshToken,
    };
  }

  async sendVerification(
    payload: SendVerificationRequest,
  ): Promise<{ success: true; alreadyVerified?: boolean }> {
    const { identityId, type, value } = payload;
    const verificationType =
      type === AuthMethod.EMAIL ? VerificationType.EMAIL : VerificationType.PHONE;

    const identity = await this.repo.findById(identityId);
    if (!identity) {
      throw new BadRequestError(AUTH_ERRORS.VERIFICATION_NOT_FOUND);
    }

    if (type === AuthMethod.EMAIL) {
      const normalized = value.trim().toLowerCase();
      if (identity.email !== normalized) {
        throw new ForbiddenError(AUTH_ERRORS.VALUE_MISMATCH);
      }
    } else {
      const normalized = value.replace(/\s+/g, '');
      if (identity.phone !== normalized) {
        throw new ForbiddenError(AUTH_ERRORS.VALUE_MISMATCH);
      }
    }

    const alreadyVerified = await this.repo.isVerified(identityId, verificationType);
    if (alreadyVerified) {
      return { success: true, alreadyVerified: true };
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiresAt = getOtpExpiresAt();

    const normalizedValue =
      type === AuthMethod.EMAIL ? value.trim().toLowerCase() : value.replace(/\s+/g, '');

    await this.repo.upsertVerificationOtp(
      identityId,
      verificationType,
      normalizedValue,
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

  async verify(payload: VerifyRequest): Promise<{ success: true }> {
    const { identityId, type, value, code } = payload;
    const verificationType =
      type === AuthMethod.EMAIL ? VerificationType.EMAIL : VerificationType.PHONE;

    const record = await this.repo.findPendingByIdentityTypeValue(
      identityId,
      verificationType,
      value,
    );
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

  async refresh(payload: RefreshRequest): Promise<RefreshResponse> {
    const { refreshToken } = payload;

    const decoded = verifyToken<AuthTokenPayload>({
      token: refreshToken,
      secretKey: ServerConfig.JWT_REFRESH_SECRET,
      options: { algorithms: ['HS256'] },
    });

    const newAccessToken = createToken<AuthTokenPayload>({
      payload: {
        authId: decoded.authId,
        email: decoded.email,
        phone: decoded.phone,
        accountType: decoded.accountType,
      },
      secretKey: ServerConfig.JWT_SECRET,
      options: { expiresIn: ServerConfig.JWT_EXPIRY as SignOptions['expiresIn'] },
    });

    const newRefreshToken = createToken<AuthTokenPayload>({
      payload: {
        authId: decoded.authId,
        email: decoded.email,
        phone: decoded.phone,
        accountType: decoded.accountType,
      },
      secretKey: ServerConfig.JWT_REFRESH_SECRET,
      options: { expiresIn: ServerConfig.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'] },
    });

    return {
      data: {
        authId: decoded.authId,
        email: decoded.email,
        phone: decoded.phone,
        accountType: decoded.accountType as AccountType,
      },
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
