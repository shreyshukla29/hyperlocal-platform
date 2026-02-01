import { BookingRepository } from '../repositories';
import type {
  CreateBookingPayload,
  CreateBookingResult,
  ListBookingsQuery,
  PaginatedBookingsResult,
  BookingResponse,
  RefundPolicyResult,
} from '../types';
import { createRazorpayOrder, createRazorpayRefund } from '../utils';
import { ServerConfig } from '../config';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '@hyperlocal/shared/errors';
import { BookingStatus, CancelledBy } from '../enums';

const MIN_AMOUNT_PAISE = 100;

export function computeUserCancelRefund(
  amountPaise: number,
  slotStart: Date,
): RefundPolicyResult {
  const now = new Date();
  const hoursUntilSlot = (slotStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  let refundPercentage: number;
  if (hoursUntilSlot >= 24) {
    refundPercentage = 100;
  } else if (hoursUntilSlot >= 12) {
    refundPercentage = 50;
  } else {
    refundPercentage = 0;
  }
  const refundAmountPaise = Math.floor((amountPaise * refundPercentage) / 100);
  return { refundPercentage, refundAmountPaise };
}

export class BookingService {
  constructor(private readonly bookingRepo: BookingRepository) {}

  async create(
    userAuthId: string,
    payload: Omit<CreateBookingPayload, 'userAuthId'>,
    idempotencyKey?: string | null,
  ): Promise<CreateBookingResult> {
    if (payload.amountPaise < MIN_AMOUNT_PAISE) {
      throw new BadRequestError('Amount must be at least 100 paise (INR 1)');
    }

    if (idempotencyKey) {
      const existing = await this.bookingRepo.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        const booking = {
          id: existing.id,
          userAuthId: existing.userAuthId,
          providerId: existing.providerId,
          providerServiceId: existing.providerServiceId,
          assignedServicePersonId: existing.assignedServicePersonId,
          status: existing.status,
          slotStart: existing.slotStart,
          slotEnd: existing.slotEnd,
          addressLine1: existing.addressLine1,
          city: existing.city,
          latitude: existing.latitude,
          longitude: existing.longitude,
          notes: existing.notes,
          confirmedAt: existing.confirmedAt,
          cancelledAt: existing.cancelledAt,
          cancelledBy: existing.cancelledBy,
          amountPaise: existing.amountPaise,
          currency: existing.currency,
          razorpayOrderId: existing.razorpayOrderId,
          razorpayPaymentId: existing.razorpayPaymentId,
          refundAmountPaise: existing.refundAmountPaise,
          razorpayRefundId: existing.razorpayRefundId,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        };
        if (existing.status === BookingStatus.PENDING_PAYMENT && existing.razorpayOrderId) {
          return {
            booking,
            razorpayOrder: {
              id: existing.razorpayOrderId,
              amount: existing.amountPaise,
              currency: existing.currency,
              keyId: ServerConfig.RAZORPAY_KEY_ID,
            },
          };
        }
        if (existing.status === BookingStatus.CONFIRMED || existing.status === BookingStatus.CANCELLED) {
          return {
            booking,
            razorpayOrder: {
              id: existing.razorpayOrderId ?? '',
              amount: existing.amountPaise,
              currency: existing.currency,
              keyId: ServerConfig.RAZORPAY_KEY_ID,
            },
          };
        }
      }
    }

    const order = await createRazorpayOrder({
      amountPaise: payload.amountPaise,
      currency: payload.currency ?? 'INR',
      receipt: `booking_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      notes: { bookingIntent: 'hyperlocal_booking' },
    });

    const fullPayload: CreateBookingPayload = {
      ...payload,
      userAuthId,
      idempotencyKey: idempotencyKey ?? null,
    };

    try {
      const booking = await this.bookingRepo.create(fullPayload, order.id);
      return {
        booking,
        razorpayOrder: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: ServerConfig.RAZORPAY_KEY_ID,
        },
      };
    } catch (err: unknown) {
      const prismaErr = err as { code?: string; meta?: { target?: string[] } };
      if (
        prismaErr?.code === 'P2002' &&
        idempotencyKey &&
        Array.isArray(prismaErr.meta?.target) &&
        prismaErr.meta.target.includes('idempotencyKey')
      ) {
        const existing = await this.bookingRepo.findByIdempotencyKey(idempotencyKey);
        if (existing) {
          const booking = {
            id: existing.id,
            userAuthId: existing.userAuthId,
            providerId: existing.providerId,
            providerServiceId: existing.providerServiceId,
            assignedServicePersonId: existing.assignedServicePersonId,
            status: existing.status,
            slotStart: existing.slotStart,
            slotEnd: existing.slotEnd,
            addressLine1: existing.addressLine1,
            city: existing.city,
            latitude: existing.latitude,
            longitude: existing.longitude,
            notes: existing.notes,
            confirmedAt: existing.confirmedAt,
            cancelledAt: existing.cancelledAt,
            cancelledBy: existing.cancelledBy,
            amountPaise: existing.amountPaise,
            currency: existing.currency,
            razorpayOrderId: existing.razorpayOrderId,
            razorpayPaymentId: existing.razorpayPaymentId,
            refundAmountPaise: existing.refundAmountPaise,
            razorpayRefundId: existing.razorpayRefundId,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
          };
          return {
            booking,
            razorpayOrder: {
              id: existing.razorpayOrderId ?? order.id,
              amount: existing.amountPaise,
              currency: existing.currency,
              keyId: ServerConfig.RAZORPAY_KEY_ID,
            },
          };
        }
      }
      throw err;
    }
  }

  async listByUser(
    userAuthId: string,
    query?: ListBookingsQuery,
  ): Promise<PaginatedBookingsResult> {
    return this.bookingRepo.findByUser(userAuthId, query);
  }

  async listByProvider(
    providerId: string,
    query?: ListBookingsQuery,
  ): Promise<PaginatedBookingsResult> {
    return this.bookingRepo.findByProvider(providerId, query);
  }

  async getByIdForUser(bookingId: string, userAuthId: string): Promise<BookingResponse> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    if (booking.userAuthId !== userAuthId) {
      throw new ForbiddenError('Access denied: not your booking');
    }
    return {
      id: booking.id,
      userAuthId: booking.userAuthId,
      providerId: booking.providerId,
      providerServiceId: booking.providerServiceId,
      assignedServicePersonId: booking.assignedServicePersonId,
      status: booking.status as BookingStatus,
      slotStart: booking.slotStart,
      slotEnd: booking.slotEnd,
      addressLine1: booking.addressLine1,
      city: booking.city,
      latitude: booking.latitude,
      longitude: booking.longitude,
      notes: booking.notes,
      confirmedAt: booking.confirmedAt,
      cancelledAt: booking.cancelledAt,
      cancelledBy: booking.cancelledBy as BookingResponse['cancelledBy'],
      amountPaise: booking.amountPaise,
      currency: booking.currency,
      razorpayOrderId: booking.razorpayOrderId,
      razorpayPaymentId: booking.razorpayPaymentId,
      refundAmountPaise: booking.refundAmountPaise,
      razorpayRefundId: booking.razorpayRefundId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  async getByIdForProvider(bookingId: string, providerId: string): Promise<BookingResponse> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    if (booking.providerId !== providerId) {
      throw new ForbiddenError('Access denied: not your provider booking');
    }
    return {
      id: booking.id,
      userAuthId: booking.userAuthId,
      providerId: booking.providerId,
      providerServiceId: booking.providerServiceId,
      assignedServicePersonId: booking.assignedServicePersonId,
      status: booking.status as BookingStatus,
      slotStart: booking.slotStart,
      slotEnd: booking.slotEnd,
      addressLine1: booking.addressLine1,
      city: booking.city,
      latitude: booking.latitude,
      longitude: booking.longitude,
      notes: booking.notes,
      confirmedAt: booking.confirmedAt,
      cancelledAt: booking.cancelledAt,
      cancelledBy: booking.cancelledBy as BookingResponse['cancelledBy'],
      amountPaise: booking.amountPaise,
      currency: booking.currency,
      razorpayOrderId: booking.razorpayOrderId,
      razorpayPaymentId: booking.razorpayPaymentId,
      refundAmountPaise: booking.refundAmountPaise,
      razorpayRefundId: booking.razorpayRefundId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  async cancelByUser(bookingId: string, userAuthId: string): Promise<BookingResponse> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    if (booking.userAuthId !== userAuthId) {
      throw new ForbiddenError('Access denied: not your booking');
    }
    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING_PAYMENT) {
      if (booking.status === BookingStatus.CANCELLED) {
        throw new ConflictError('Booking is already cancelled');
      }
      throw new BadRequestError('Booking cannot be cancelled in current status');
    }

    const { refundAmountPaise } = computeUserCancelRefund(
      booking.amountPaise,
      booking.slotStart,
    );

    let razorpayRefundId: string | null = null;
    if (refundAmountPaise > 0 && booking.razorpayPaymentId) {
      try {
        const refund = await createRazorpayRefund({
          paymentId: booking.razorpayPaymentId,
          amountPaise: refundAmountPaise,
          notes: { bookingId, cancelledBy: 'USER' },
        });
        razorpayRefundId = refund.id;
      } catch (err) {
        throw new BadRequestError(
          'Refund could not be processed. Please contact support.',
        );
      }
    }

    const updated = await this.bookingRepo.updateCancelled(
      bookingId,
      CancelledBy.USER,
      refundAmountPaise > 0 ? refundAmountPaise : null,
      razorpayRefundId,
    );
    if (!updated) {
      throw new ConflictError('Booking is already cancelled');
    }
    return updated;
  }

  async cancelByProvider(bookingId: string, providerId: string): Promise<BookingResponse> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    if (booking.providerId !== providerId) {
      throw new ForbiddenError('Access denied: not your provider booking');
    }
    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING_PAYMENT) {
      if (booking.status === BookingStatus.CANCELLED) {
        throw new ConflictError('Booking is already cancelled');
      }
      throw new BadRequestError('Booking cannot be cancelled in current status');
    }

    let razorpayRefundId: string | null = null;
    if (booking.razorpayPaymentId) {
      try {
        const refund = await createRazorpayRefund({
          paymentId: booking.razorpayPaymentId,
          amountPaise: booking.amountPaise,
          notes: { bookingId, cancelledBy: 'PROVIDER' },
        });
        razorpayRefundId = refund.id;
      } catch (err) {
        throw new BadRequestError(
          'Full refund could not be processed. Please contact support.',
        );
      }
    }

    const updated = await this.bookingRepo.updateCancelled(
      bookingId,
      CancelledBy.PROVIDER,
      booking.amountPaise,
      razorpayRefundId,
    );
    if (!updated) {
      throw new ConflictError('Booking is already cancelled');
    }
    return updated;
  }

  async handlePaymentCaptured(razorpayOrderId: string, razorpayPaymentId: string) {
    const booking = await this.bookingRepo.findByRazorpayOrderId(razorpayOrderId);
    if (!booking) return;
    await this.bookingRepo.updatePaymentCaptured(booking.id, razorpayPaymentId);
  }

  async handlePaymentFailed(razorpayOrderId: string) {
    const booking = await this.bookingRepo.findByRazorpayOrderId(razorpayOrderId);
    if (!booking) return;
    await this.bookingRepo.updatePaymentFailed(booking.id);
  }
}
