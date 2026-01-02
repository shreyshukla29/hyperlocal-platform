import { AuthRepository } from '../repositories/auth.repository';

import {
  SignupRequest,
  LoginWithEmailRequest,
  LoginWithPhoneRequest,
  SignupResponse,
  LoginResponse,
  AuthTokenPayload
} from '../types/auth.types';

import { signupSchema, loginWithEmailSchema, loginWithPhoneSchema } from '../validators';

import { hashPassword, verifyPassword,createToken } from '../utils';

import { AUTH_ERRORS } from '../constants';
import { AuthMethod } from '../enums';

import {  ValidationError,BadRequestError,ForbiddenError, NotFoundError } from '@hyperlocal/shared/errors';
import { ServerConfig } from './../config/server_config';
import {publishUserSignedUpEvent} from '../events'
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

    if (email && (await this.repo.existsByEmail(email))) {
      throw new BadRequestError(AUTH_ERRORS.EMAIL_EXISTS, 409);
    }

    if (phone && (await this.repo.existsByPhone(phone))) {
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
      userId: identity.id,
      email: identity.email ?? undefined,
      phone: identity.phone ?? undefined,
      accountType: identity.accountType,
    },
     secretKey: ServerConfig.JWT_SECRET!,
    options: {
      expiresIn: '24h',
      issuer: 'auth-service',
    },
  });

    return {
      data : {
        userId: identity.id,
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
    const identity = await this.repo.findByEmail(email);
    if (!identity) {
      throw new NotFoundError(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    if (!identity.isActive) {
      throw new ForbiddenError(AUTH_ERRORS.ACCOUNT_INACTIVE);
    }

    if (identity.accountType !== loginAs) {
      throw new BadRequestError(AUTH_ERRORS.ACCOUNT_TYPE_NOT_ALLOWED);
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
      userId: identity.id,
      email: identity.email ?? undefined,
      phone: identity.phone ?? undefined,
      accountType: identity.accountType,
    },
    secretKey: ServerConfig.JWT_SECRET!,
    options: {
      expiresIn: '24h',
      issuer: 'auth-service',
    },
  });

    return {
     data : {
       userId: identity.id,
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

    const identity = await this.repo.findByPhone(phone);
    if (!identity) {
      throw new BadRequestError(AUTH_ERRORS.PHONE_NOT_FOUND);
    }

    if (!identity.isActive) {
      throw new BadRequestError(AUTH_ERRORS.ACCOUNT_INACTIVE);
    }

    if (identity.accountType !== loginAs) {
      throw new BadRequestError(AUTH_ERRORS.ACCOUNT_TYPE_NOT_ALLOWED);
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
      userId: identity.id,
      email: identity.email ?? undefined,
      phone: identity.phone ?? undefined,
      accountType: identity.accountType,
    },
    secretKey: ServerConfig.JWT_SECRET!,
    options: {
      expiresIn: '24h',
      issuer: 'auth-service',
    },
  });

    return {
     data : {
       userId: identity.id,
      accountType: identity.accountType,
     },
      token
    };
  }
}
