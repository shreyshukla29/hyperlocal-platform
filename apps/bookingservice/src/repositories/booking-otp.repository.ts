import { prisma as defaultPrisma } from '../config/index.js';
import { BookingOtpType } from '../enums/index.js';

export interface CreateBookingOtpPayload {
  bookingId: string;
  type: BookingOtpType;
  otpHash: string;
  expiresAt: Date;
}

export class BookingOtpRepository {
  constructor(private prisma = defaultPrisma) {}

  async create(payload: CreateBookingOtpPayload) {
    return this.prisma.bookingOtp.create({
      data: {
        bookingId: payload.bookingId,
        type: payload.type,
        otpHash: payload.otpHash,
        expiresAt: payload.expiresAt,
      },
    });
  }

  async findActiveByBookingAndType(bookingId: string, type: BookingOtpType) {
    return this.prisma.bookingOtp.findFirst({
      where: {
        bookingId,
        type,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markUsed(id: string) {
    return this.prisma.bookingOtp.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
