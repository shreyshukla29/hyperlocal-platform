import { jest } from '@jest/globals';
import type { AuthRepository } from '../../src/repositories/auth.repository.js';
import { AuthService } from '../../src/services/auth.service.js';
import { AccountType } from '../../src/enums/index.js';
import { ValidationError, BadRequestError } from '@hyperlocal/shared/errors';

jest.mock('../../src/config', () => ({
  prisma: {},
}));
jest.mock('../../src/config/index', () => ({
  prisma: {},
}));
jest.mock('@hyperlocal/shared/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), child: jest.fn() },
}));
jest.mock('../../src/events/index.js', () => ({ publishUserSignedUpEvent: jest.fn(), publishAuthNotification: jest.fn() }));
jest.mock('../../src/utils/index.js', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed'),
  verifyPassword: jest.fn().mockResolvedValue(true),
  createToken: jest.fn().mockReturnValue('token'),
}));
jest.mock('../../src/utils/otp.js', () => ({
  generateOtp: jest.fn().mockReturnValue('123456'),
  hashOtp: jest.fn().mockResolvedValue('hashedOtp'),
  getOtpExpiresAt: jest.fn().mockReturnValue(new Date()),
  verifyOtp: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockRepo: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    mockRepo = {
      existsByEmail: jest.fn(),
      existsByPhone: jest.fn(),
      createIdentity: jest.fn(),
      createVerification: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findById: jest.fn(),
      findPendingByTypeAndValue: jest.fn(),
      upsertVerificationOtp: jest.fn(),
      markVerified: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;
    service = new AuthService(mockRepo);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('throws ValidationError for invalid payload', async () => {
      await expect(service.signup({} as never)).rejects.toThrow(ValidationError);
    });

    it('throws BadRequestError when email already exists', async () => {
      mockRepo.existsByEmail.mockResolvedValue(true);
      await expect(
        service.signup({
          email: 'a@b.com',
          password: 'password123',
          accountType: AccountType.USER,
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(BadRequestError);
      expect(mockRepo.existsByEmail).toHaveBeenCalledWith('a@b.com', AccountType.USER);
    });

    it('throws BadRequestError when phone already exists', async () => {
      mockRepo.existsByPhone.mockResolvedValue(true);
      await expect(
        service.signup({
          phone: '9876543210',
          password: 'password123',
          accountType: AccountType.USER,
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('loginWithEmail', () => {
    it('throws BadRequestError when identity not found', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      await expect(
        service.loginWithEmail({
          method: 'EMAIL',
          email: 'a@b.com',
          password: 'pwd',
          loginAs: AccountType.USER,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it('throws ForbiddenError when account inactive', async () => {
      mockRepo.findByEmail.mockResolvedValue({ id: 'i1', isActive: false } as never);
      await expect(
        service.loginWithEmail({
          method: 'EMAIL',
          email: 'a@b.com',
          password: 'pwd',
          loginAs: AccountType.USER,
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('loginWithPhone', () => {
    it('throws BadRequestError when identity not found', async () => {
      mockRepo.findByPhone.mockResolvedValue(null);
      await expect(
        service.loginWithPhone({
          method: 'PHONE',
          phone: '9876543210',
          password: 'pwd',
          loginAs: AccountType.USER,
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('sendVerification', () => {
    it('throws BadRequestError when identity not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(
        service.sendVerification('id1', { type: 'EMAIL', value: 'a@b.com' }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('verify', () => {
    it('throws BadRequestError when verification record not found', async () => {
      mockRepo.findPendingByTypeAndValue.mockResolvedValue(null);
      await expect(
        service.verify({ type: 'EMAIL', value: 'a@b.com', code: '123456' }),
      ).rejects.toThrow(BadRequestError);
    });
  });
});
