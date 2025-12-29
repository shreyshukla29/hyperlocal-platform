import { AuthRepository } from '../repositories/auth.repository';

import {
  SignupRequest,
  LoginWithEmailRequest,
  LoginWithPhoneRequest,
  SignupResponse,
  LoginResponse,
} from '../types/auth.types';

import { signupSchema, loginWithEmailSchema, loginWithPhoneSchema } from '../validators';

import { hashPassword, verifyPassword } from '../utils/password';

import { AUTH_ERRORS } from '../constants';
import { AuthMethod } from '../enums';

import { AppError as ValidationError } from '@hyperlocal/shared';

export class AuthService {
  constructor(private readonly repo: AuthRepository = new AuthRepository()) {}

  async signup(payload: SignupRequest): Promise<SignupResponse> {
    const parsed = signupSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppError(AUTH_ERRORS.INVALID_PAYLOAD, 400);
    }

    const { email, phone, password, accountType } = parsed.data;

    if (!email && !phone) {
      throw new AppError(AUTH_ERRORS.INVALID_PAYLOAD, 400);
    }

    if (email && (await this.repo.existsByEmail(email))) {
      throw new AppError(AUTH_ERRORS.EMAIL_EXISTS, 409);
    }

    if (phone && (await this.repo.existsByPhone(phone))) {
      throw new AppError(AUTH_ERRORS.PHONE_EXISTS, 409);
    }

    const passwordHash = await hashPassword(password);

    const identity = await this.repo.createIdentity({
      email,
      phone,
      passwordHash,
      accountType,
    });

    if (email) {
      await this.repo.createVerification(identity.id, AuthMethod.EMAIL, email);
    }

    if (phone) {
      await this.repo.createVerification(identity.id, AuthMethod.PHONE, phone);
    }

    return {
      userId: identity.id,
      email: identity.email,
      phone: identity.phone,
      accountType: identity.accountType,
    };
  }

  async loginWithEmail(payload: LoginWithEmailRequest): Promise<LoginResponse> {
    const parsed = loginWithEmailSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppError(AUTH_ERRORS.INVALID_PAYLOAD, 400);
    }

    const { email, password, loginAs } = parsed.data;

    const identity = await this.repo.findByEmail(email);
    if (!identity) {
      throw new AppError(AUTH_ERRORS.EMAIL_NOT_FOUND, 404);
    }

    if (!identity.isActive) {
      throw new AppError(AUTH_ERRORS.ACCOUNT_INACTIVE, 403);
    }

    if (identity.accountType !== loginAs) {
      throw new AppError(AUTH_ERRORS.ACCOUNT_TYPE_NOT_ALLOWED, 403);
    }

    const validPassword = await verifyPassword(password, identity.passwordHash);
    if (!validPassword) {
      throw new AppError(AUTH_ERRORS.INVALID_CREDENTIALS, 401);
    }

    const isVerified = await this.repo.isVerified(identity.id, AuthMethod.EMAIL);
    if (!isVerified) {
      throw new AppError(AUTH_ERRORS.EMAIL_NOT_VERIFIED, 403);
    }

    return {
      userId: identity.id,
      accountType: identity.accountType,
    };
  }

  async loginWithPhone(payload: LoginWithPhoneRequest): Promise<LoginResponse> {
    const parsed = loginWithPhoneSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppError(AUTH_ERRORS.INVALID_PAYLOAD, 400);
    }

    const { phone, password, loginAs } = parsed.data;

    const identity = await this.repo.findByPhone(phone);
    if (!identity) {
      throw new AppError(AUTH_ERRORS.PHONE_NOT_FOUND, 404);
    }

    if (!identity.isActive) {
      throw new AppError(AUTH_ERRORS.ACCOUNT_INACTIVE, 403);
    }

    if (identity.accountType !== loginAs) {
      throw new AppError(AUTH_ERRORS.ACCOUNT_TYPE_NOT_ALLOWED, 403);
    }

    const validPassword = await verifyPassword(password, identity.passwordHash);
    if (!validPassword) {
      throw new AppError(AUTH_ERRORS.INVALID_CREDENTIALS, 401);
    }

    const isVerified = await this.repo.isVerified(identity.id, AuthMethod.PHONE);
    if (!isVerified) {
      throw new AppError(AUTH_ERRORS.PHONE_NOT_VERIFIED, 403);
    }

    return {
      userId: identity.id,
      accountType: identity.accountType,
    };
  }
}
