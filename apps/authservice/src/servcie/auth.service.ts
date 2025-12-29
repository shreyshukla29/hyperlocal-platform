import { Request, Response } from 'express';

import { AuthRepository } from '../repositories/auth.repository';
import { signupSchema, loginSchema } from '../validators/auth.validator';

import { hashPassword, verifyPassword } from '../utils/password';
import { success, created, error } from '../utils/response';

import { AUTH_ERRORS } from '../constants/error.constants';
import { AUTH_SUCCESS } from '../constants/success.constants';
import { AUTH_METHOD } from '../constants/auth.constants';

export class AuthService {
  private readonly repo: AuthRepository;

  constructor(repo?: AuthRepository) {
    this.repo = repo ?? new AuthRepository();
  }

  signup = async (req: Request, res: Response) => {
    const parsed = signupSchema.safeParse(req.body);

    if (!parsed.success) {
      return error(res, 400, AUTH_ERRORS.INVALID_PAYLOAD);
    }

    const { email, phone, password, accountType } = parsed.data;

    if (email && await this.repo.existsByEmail(email)) {
      return error(res, 409, AUTH_ERRORS.EMAIL_EXISTS);
    }

    if (phone && await this.repo.existsByPhone(phone)) {
      return error(res, 409, AUTH_ERRORS.PHONE_EXISTS);
    }

    const passwordHash = await hashPassword(password);

    const identity = await this.repo.createIdentity({
      email,
      phone,
      passwordHash,
      accountTypes: [accountType],
    });

    if (email) {
      await this.repo.createVerification(identity.id, 'EMAIL', email);
    }

    if (phone) {
      await this.repo.createVerification(identity.id, 'PHONE', phone);
    }

    return created(res, {
      id: identity.id,
      email: identity.email,
      phone: identity.phone,
    }, AUTH_SUCCESS.SIGNUP_SUCCESS);
  };


  login = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return error(res, 400, AUTH_ERRORS.INVALID_PAYLOAD);
    }

    const { method, email, phone, password, loginAs } = parsed.data;

    const identity =
      method === AUTH_METHOD.EMAIL
        ? await this.repo.findByEmail(email!)
        : await this.repo.findByPhone(phone!);

    if (!identity) {
      return error(res, 401, AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    if (!identity.isActive) {
      return error(res, 403, AUTH_ERRORS.ACCOUNT_INACTIVE);
    }

    if (!identity.accountTypes.includes(loginAs)) {
      return error(res, 403, AUTH_ERRORS.ACCOUNT_TYPE_NOT_ALLOWED);
    }

    const validPassword = await verifyPassword(password, identity.passwordHash);

    if (!validPassword) {
      return error(res, 401, AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    if (method === AUTH_METHOD.EMAIL) {
      const verified = await this.repo.isVerified(identity.id, 'EMAIL');
      if (!verified) {
        return error(res, 403, AUTH_ERRORS.EMAIL_NOT_VERIFIED);
      }
    }

    return success(res, {
      identityId: identity.id,
      loginAs,
    }, AUTH_SUCCESS.LOGIN_SUCCESS);
  };
}
