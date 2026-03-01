import type { Booking } from '../generated/prisma/client.js';
import { BookingStatus as PrismaBookingStatus } from '../generated/prisma/enums.js';
import { prisma as defaultPrisma } from '../config/index.js';
import type {
  CreateBookingPayload,
  BookingResponse,
  ListBookingsQuery,
  PaginatedBookingsResult,
} from '../types/index.js';
import { BookingStatus } from '../enums/index.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function toResponse(row: Booking): BookingResponse {
  return {
    id: row.id,
    userAuthId: row.userAuthId,
    providerId: row.providerId,
    providerServiceId: row.providerServiceId,
    assignedServicePersonId: row.assignedServicePersonId,
    status: row.status as BookingStatus,
    slotStart: row.slotStart,
    slotEnd: row.slotEnd,
    addressLine1: row.addressLine1,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    notes: row.notes,
    confirmedAt: row.confirmedAt,
    cancelledAt: row.cancelledAt,
    cancelledBy: row.cancelledBy as BookingResponse['cancelledBy'],
    amountPaise: row.amountPaise,
    currency: row.currency,
    razorpayOrderId: row.razorpayOrderId,
    razorpayPaymentId: row.razorpayPaymentId,
    refundAmountPaise: row.refundAmountPaise,
    razorpayRefundId: row.razorpayRefundId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class BookingRepository {
  constructor(private prisma = defaultPrisma) {}

  async create(payload: CreateBookingPayload, razorpayOrderId: string) {
    const row = await this.prisma.booking.create({
      data: {
        userAuthId: payload.userAuthId,
        providerId: payload.providerId,
        providerServiceId: payload.providerServiceId,
        providerAuthId: payload.providerAuthId ?? null,
        slotStart: payload.slotStart,
        slotEnd: payload.slotEnd,
        addressLine1: payload.addressLine1 ?? null,
        city: payload.city ?? null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        notes: payload.notes ?? null,
        amountPaise: payload.amountPaise,
        currency: payload.currency ?? 'INR',
        idempotencyKey: payload.idempotencyKey ?? null,
        razorpayOrderId,
        status: PrismaBookingStatus.PENDING_PAYMENT,
      },
    });
    return toResponse(row);
  }

  async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
    });
  }

  async findByIdempotencyKey(key: string) {
    return this.prisma.booking.findUnique({
      where: { idempotencyKey: key },
    });
  }

  async findByRazorpayOrderId(razorpayOrderId: string) {
    return this.prisma.booking.findUnique({
      where: { razorpayOrderId },
    });
  }

  async findByRazorpayPaymentId(razorpayPaymentId: string) {
    return this.prisma.booking.findFirst({
      where: { razorpayPaymentId },
    });
  }

  async findByUser(
    userAuthId: string,
    query?: ListBookingsQuery,
  ): Promise<PaginatedBookingsResult> {
    const page = Math.max(1, query?.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query?.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where: { userAuthId: string; status?: PrismaBookingStatus } = {
      userAuthId,
    };
    if (query?.status !== undefined) {
      where.status = query.status as PrismaBookingStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: { slotStart: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items: items.map((row: Booking) => toResponse(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findByProvider(
    providerId: string,
    query?: ListBookingsQuery,
  ): Promise<PaginatedBookingsResult> {
    const page = Math.max(1, query?.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query?.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where: { providerId: string; status?: PrismaBookingStatus } = {
      providerId,
    };
    if (query?.status !== undefined) {
      where.status = query.status as PrismaBookingStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: { slotStart: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items: items.map((row: Booking) => toResponse(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Only transitions PENDING_PAYMENT -> CONFIRMED. Returns null if already confirmed
   * (prevents double payment / race when webhook retries).
   */
  async updatePaymentCaptured(
    id: string,
    razorpayPaymentId: string,
  ): Promise<BookingResponse | null> {
    try {
      const row = await this.prisma.booking.updateMany({
        where: { id, status: PrismaBookingStatus.PENDING_PAYMENT },
        data: {
          status: PrismaBookingStatus.CONFIRMED,
          razorpayPaymentId,
          confirmedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      if (row.count === 0) return null;
      const updated = await this.prisma.booking.findUniqueOrThrow({
        where: { id },
      });
      return toResponse(updated);
    } catch {
      return null;
    }
  }

  /**
   * Only transitions PENDING_PAYMENT -> PAYMENT_FAILED. No-op if already processed.
   */
  async updatePaymentFailed(id: string): Promise<BookingResponse | null> {
    try {
      const row = await this.prisma.booking.updateMany({
        where: { id, status: PrismaBookingStatus.PENDING_PAYMENT },
        data: {
          status: PrismaBookingStatus.PAYMENT_FAILED,
          updatedAt: new Date(),
        },
      });
      if (row.count === 0) return null;
      const updated = await this.prisma.booking.findUniqueOrThrow({
        where: { id },
      });
      return toResponse(updated);
    } catch {
      return null;
    }
  }

  /**
   * Only transitions CONFIRMED or PENDING_PAYMENT -> CANCELLED. Returns null if
   * already cancelled (prevents double cancel / double refund).
   */
  async updateCancelled(
    id: string,
    cancelledBy: 'USER' | 'PROVIDER' | 'SYSTEM',
    refundAmountPaise: number | null,
    razorpayRefundId: string | null,
  ): Promise<BookingResponse | null> {
    try {
      const row = await this.prisma.booking.updateMany({
        where: {
          id,
          status: { in: [PrismaBookingStatus.CONFIRMED, PrismaBookingStatus.PENDING_PAYMENT] },
        },
        data: {
          status: PrismaBookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy,
          refundAmountPaise,
          razorpayRefundId,
          updatedAt: new Date(),
        },
      });
      if (row.count === 0) return null;
      const updated = await this.prisma.booking.findUniqueOrThrow({
        where: { id },
      });
      return toResponse(updated);
    } catch {
      return null;
    }
  }

  /**
   * Assign service person to a CONFIRMED booking.
   */
  async updateAssignedServicePerson(
    id: string,
    assignedServicePersonId: string,
  ): Promise<BookingResponse | null> {
    try {
      const row = await this.prisma.booking.updateMany({
        where: { id, status: PrismaBookingStatus.CONFIRMED },
        data: {
          assignedServicePersonId,
          updatedAt: new Date(),
        },
      });
      if (row.count === 0) return null;
      const updated = await this.prisma.booking.findUniqueOrThrow({
        where: { id },
      });
      return toResponse(updated);
    } catch {
      return null;
    }
  }

  /**
   * Transition CONFIRMED -> ARRIVAL_CONFIRMED when service person verifies arrival OTP.
   */
  async updateArrivalConfirmed(id: string): Promise<BookingResponse | null> {
    try {
      const row = await this.prisma.booking.updateMany({
        where: { id, status: PrismaBookingStatus.CONFIRMED },
        data: {
          status: PrismaBookingStatus.ARRIVAL_CONFIRMED,
          arrivalConfirmedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      if (row.count === 0) return null;
      const updated = await this.prisma.booking.findUniqueOrThrow({
        where: { id },
      });
      return toResponse(updated);
    } catch {
      return null;
    }
  }

  /**
   * Transition ARRIVAL_CONFIRMED -> PENDING_COMPLETION_VERIFICATION when service person marks job complete.
   */
  async updatePendingCompletionVerification(id: string): Promise<BookingResponse | null> {
    try {
      const row = await this.prisma.booking.updateMany({
        where: { id, status: PrismaBookingStatus.ARRIVAL_CONFIRMED },
        data: {
          status: PrismaBookingStatus.PENDING_COMPLETION_VERIFICATION,
          updatedAt: new Date(),
        },
      });
      if (row.count === 0) return null;
      const updated = await this.prisma.booking.findUniqueOrThrow({
        where: { id },
      });
      return toResponse(updated);
    } catch {
      return null;
    }
  }

  /**
   * Transition PENDING_COMPLETION_VERIFICATION -> COMPLETED when user verifies completion OTP.
   */
  async updateCompleted(id: string): Promise<BookingResponse | null> {
    try {
      const row = await this.prisma.booking.updateMany({
        where: { id, status: PrismaBookingStatus.PENDING_COMPLETION_VERIFICATION },
        data: {
          status: PrismaBookingStatus.COMPLETED,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      if (row.count === 0) return null;
      const updated = await this.prisma.booking.findUniqueOrThrow({
        where: { id },
      });
      return toResponse(updated);
    } catch {
      return null;
    }
  }

  /**
   * Bookings for a provider that overlap the given date (any status except CANCELLED).
   * Used to compute available slots.
   */
  async findBookingsByProviderAndDate(
    providerId: string,
    dateStr: string,
  ): Promise<{ slotStart: Date; slotEnd: Date }[]> {
    const [y, m, d] = dateStr.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    const rows = await this.prisma.booking.findMany({
      where: {
        providerId,
        status: { not: PrismaBookingStatus.CANCELLED },
        slotStart: { lt: endOfDay },
        slotEnd: { gt: startOfDay },
      },
      select: { slotStart: true, slotEnd: true },
    });
    return rows;
  }
}
