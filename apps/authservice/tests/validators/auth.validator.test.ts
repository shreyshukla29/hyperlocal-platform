import { jest } from '@jest/globals';
import {
  signupSchema,
  loginWithEmailSchema,
  loginWithPhoneSchema,
  sendVerificationSchema,
  verifySchema,
} from '../../src/validators/auth.validator.js';
import { AccountType, AuthMethod } from '../../src/enums/index.js';

describe('auth validators', () => {
  describe('signupSchema', () => {
    it('accepts valid payload with email', () => {
      const result = signupSchema.safeParse({
        email: 'a@b.com',
        password: 'password123',
        accountType: AccountType.USER,
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid payload with phone', () => {
      const result = signupSchema.safeParse({
        phone: '9876543210',
        password: 'password123',
        accountType: AccountType.USER,
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
    });

    it('rejects when neither email nor phone', () => {
      const result = signupSchema.safeParse({
        password: 'password123',
        accountType: AccountType.USER,
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = signupSchema.safeParse({
        email: 'a@b.com',
        password: 'short',
        accountType: AccountType.USER,
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginWithEmailSchema', () => {
    it('accepts valid payload', () => {
      const result = loginWithEmailSchema.safeParse({
        method: AuthMethod.EMAIL,
        email: 'a@b.com',
        password: 'pwd',
        loginAs: AccountType.USER,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid method', () => {
      const result = loginWithEmailSchema.safeParse({
        method: AuthMethod.PHONE,
        email: 'a@b.com',
        password: 'pwd',
        loginAs: AccountType.USER,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginWithPhoneSchema', () => {
    it('accepts valid payload', () => {
      const result = loginWithPhoneSchema.safeParse({
        method: AuthMethod.PHONE,
        phone: '9876543210',
        password: 'pwd',
        loginAs: AccountType.USER,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendVerificationSchema', () => {
    it('accepts valid email type', () => {
      const result = sendVerificationSchema.safeParse({
        type: AuthMethod.EMAIL,
        value: 'a@b.com',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid phone type', () => {
      const result = sendVerificationSchema.safeParse({
        type: AuthMethod.PHONE,
        value: '9876543210',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = sendVerificationSchema.safeParse({
        type: AuthMethod.EMAIL,
        value: 'not-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('verifySchema', () => {
    it('accepts valid payload', () => {
      const result = verifySchema.safeParse({
        type: AuthMethod.EMAIL,
        value: 'a@b.com',
        code: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('rejects code not 6 digits', () => {
      const result = verifySchema.safeParse({
        type: AuthMethod.EMAIL,
        value: 'a@b.com',
        code: '12345',
      });
      expect(result.success).toBe(false);
    });
  });
});
