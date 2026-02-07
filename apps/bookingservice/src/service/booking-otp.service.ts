import { BookingOtpRepository } from '../repositories/booking-otp.repository.js';
import { BookingOtpType } from '../enums/index.js';
import { generateOtp, hashOtp, verifyOtp, getOtpExpiresAt } from '../utils/otp.js';
import { BadRequestError } from '@hyperlocal/shared/errors';

export interface GenerateOtpResult {
  otp: string;
  expiresAt: Date;
}

export class BookingOtpService {
  constructor(private readonly otpRepo: BookingOtpRepository) {}

  /**
   * Generate and store an arrival OTP for a booking. Returns plain OTP once (caller must send via notification).
   */
  async generateArrivalOtp(bookingId: string): Promise<GenerateOtpResult> {
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = getOtpExpiresAt();
    await this.otpRepo.create({
      bookingId,
      type: BookingOtpType.ARRIVAL,
      otpHash,
      expiresAt,
    });
    return { otp, expiresAt };
  }

  /**
   * Verify arrival OTP and mark it used. Returns true if valid.
   */
  async verifyArrivalOtp(bookingId: string, plainOtp: string): Promise<boolean> {
    const record = await this.otpRepo.findActiveByBookingAndType(
      bookingId,
      BookingOtpType.ARRIVAL,
    );
    if (!record) {
      throw new BadRequestError('No valid arrival OTP found for this booking');
    }
    const valid = verifyOtp(plainOtp, record.otpHash, record.expiresAt);
    if (!valid) {
      throw new BadRequestError('Invalid or expired arrival OTP');
    }
    await this.otpRepo.markUsed(record.id);
    return true;
  }

  /**
   * Generate and store a completion OTP for a booking. Returns plain OTP once (caller must send via notification).
   */
  async generateCompletionOtp(bookingId: string): Promise<GenerateOtpResult> {
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = getOtpExpiresAt();
    await this.otpRepo.create({
      bookingId,
      type: BookingOtpType.COMPLETION,
      otpHash,
      expiresAt,
    });
    return { otp, expiresAt };
  }

  /**
   * Verify completion OTP and mark it used. Returns true if valid.
   */
  async verifyCompletionOtp(bookingId: string, plainOtp: string): Promise<boolean> {
    const record = await this.otpRepo.findActiveByBookingAndType(
      bookingId,
      BookingOtpType.COMPLETION,
    );
    if (!record) {
      throw new BadRequestError('No valid completion OTP found for this booking');
    }
    const valid = verifyOtp(plainOtp, record.otpHash, record.expiresAt);
    if (!valid) {
      throw new BadRequestError('Invalid or expired completion OTP');
    }
    await this.otpRepo.markUsed(record.id);
    return true;
  }
}
