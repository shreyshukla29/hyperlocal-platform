import { BookingRepository } from '../repositories/index.js';
import type {
  CreateBookingPayload,
  CreateBookingResult,
  ListBookingsQuery,
  PaginatedBookingsResult,
  BookingResponse,
  RefundPolicyResult,
  AvailableSlot,
} from '../types/index.js';
import { createRazorpayOrder, createRazorpayRefund, getBookingQuote, getProviderOpenIntervals } from '../utils/index.js';
import { ServerConfig } from '../config/index.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '@hyperlocal/shared/errors';
import { BookingStatus, CancelledBy } from '../enums/index.js';
import { BookingOtpService } from './booking-otp.service.js';
import { publishNotification } from '../events/index.js';

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
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly otpService: BookingOtpService,
  ) {}

  async create(
    userAuthId: string,
    payload: Omit<CreateBookingPayload, 'userAuthId' | 'amountPaise' | 'providerAuthId'>,
    idempotencyKey?: string | null,
  ): Promise<CreateBookingResult> {
    if (!ServerConfig.PROVIDER_SERVICE_URL) {
      throw new BadRequestError('Booking quote service is not configured');
    }
    const quote = await getBookingQuote(payload.providerId, payload.providerServiceId);
    if (quote.pricePaise < MIN_AMOUNT_PAISE) {
      throw new BadRequestError('Service price must be at least 100 paise (INR 1)');
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
      amountPaise: quote.pricePaise,
      currency: payload.currency ?? 'INR',
      receipt: `booking_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      notes: { bookingIntent: 'hyperlocal_booking' },
    });

    const fullPayload: CreateBookingPayload = {
      ...payload,
      userAuthId,
      amountPaise: quote.pricePaise,
      providerAuthId: quote.providerAuthId,
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
    publishNotification({
      userAuthId: booking.userAuthId,
      type: 'booking_cancellation',
      title: 'Booking cancelled',
      body: `Your booking ${bookingId} has been cancelled.`,
      channel: 'both',
    }).catch(() => {});
    if (refundAmountPaise > 0) {
      publishNotification({
        userAuthId: booking.userAuthId,
        type: 'booking_refund',
        title: 'Refund processed',
        body: `A refund of ₹${(refundAmountPaise / 100).toFixed(2)} for booking ${bookingId} has been processed.`,
        channel: 'both',
      }).catch(() => {});
    }
    if (booking.providerAuthId) {
      publishNotification({
        userAuthId: booking.providerAuthId,
        type: 'booking_cancellation',
        title: 'Booking cancelled by customer',
        body: `Booking ${bookingId} was cancelled by the customer.`,
        metadata: { bookingId },
        channel: 'both',
      }).catch(() => {});
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
    publishNotification({
      userAuthId: booking.userAuthId,
      type: 'booking_cancellation',
      title: 'Booking cancelled',
      body: `Your booking ${bookingId} has been cancelled by the provider.`,
      channel: 'both',
    }).catch(() => {});
    publishNotification({
      userAuthId: booking.userAuthId,
      type: 'booking_refund',
      title: 'Refund processed',
      body: `A full refund of ₹${(booking.amountPaise / 100).toFixed(2)} for booking ${bookingId} has been processed.`,
      channel: 'both',
    }).catch(() => {});
    if (booking.providerAuthId) {
      publishNotification({
        userAuthId: booking.providerAuthId,
        type: 'booking_cancellation',
        title: 'Booking cancelled',
        body: `Booking ${bookingId} was cancelled (by provider).`,
        metadata: { bookingId },
        channel: 'both',
      }).catch(() => {});
    }
    return updated;
  }

  async handlePaymentCaptured(razorpayOrderId: string, razorpayPaymentId: string) {
    const booking = await this.bookingRepo.findByRazorpayOrderId(razorpayOrderId);
    if (!booking) return;
    const updated = await this.bookingRepo.updatePaymentCaptured(
      booking.id,
      razorpayPaymentId,
    );
    if (updated) {
      publishNotification({
        userAuthId: booking.userAuthId,
        type: 'booking_confirmation',
        title: 'Booking confirmed',
        body: `Your booking is confirmed. Booking ID: ${booking.id}. Slot: ${booking.slotStart.toISOString()}.`,
        channel: 'both',
      }).catch(() => {});
      if (booking.providerAuthId) {
        publishNotification({
          userAuthId: booking.providerAuthId,
          type: 'booking_confirmation',
          title: 'New booking confirmed',
          body: `A new booking ${booking.id} has been confirmed. Slot: ${booking.slotStart.toISOString()}.`,
          metadata: { bookingId: booking.id, providerId: booking.providerId },
          channel: 'both',
        }).catch(() => {});
      }
    }
  }

  async handlePaymentFailed(razorpayOrderId: string) {
    const booking = await this.bookingRepo.findByRazorpayOrderId(razorpayOrderId);
    if (!booking) return;
    await this.bookingRepo.updatePaymentFailed(booking.id);
  }

  /** Provider: assign service person to a CONFIRMED booking. Generates arrival OTP and publishes service_person_coming + otp_arrival. */
  async assignServicePerson(
    bookingId: string,
    providerId: string,
    assignedServicePersonId: string,
  ): Promise<BookingResponse> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    if (booking.providerId !== providerId) {
      throw new ForbiddenError('Access denied: not your provider booking');
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestError('Only CONFIRMED bookings can have a service person assigned');
    }
    const updated = await this.bookingRepo.updateAssignedServicePerson(
      bookingId,
      assignedServicePersonId,
    );
    if (!updated) {
      throw new ConflictError('Booking could not be updated');
    }
    const { otp, expiresAt } = await this.otpService.generateArrivalOtp(bookingId);
    publishNotification({
      userAuthId: booking.userAuthId,
      type: 'service_person_coming',
      title: 'Service person assigned',
      body: `A service person is assigned to your booking ${bookingId}. They will use the arrival OTP when they reach.`,
      metadata: { bookingId, assignedServicePersonId },
      channel: 'both',
    }).catch(() => {});
    publishNotification({
      userAuthId: booking.userAuthId,
      type: 'otp_verification',
      title: 'Arrival OTP',
      body: `Your arrival OTP for booking ${bookingId} is ${otp}. Valid until ${expiresAt.toISOString()}. Share this with the service person to confirm arrival.`,
      metadata: { bookingId, otpType: 'arrival', expiresAt: expiresAt.toISOString() },
      channel: 'both',
    }).catch(() => {});
    return updated;
  }

  /** Provider / service person: confirm arrival using OTP. Transitions CONFIRMED -> ARRIVAL_CONFIRMED. */
  async confirmArrival(
    bookingId: string,
    providerId: string,
    otp: string,
  ): Promise<BookingResponse> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    if (booking.providerId !== providerId) {
      throw new ForbiddenError('Access denied: not your provider booking');
    }
    await this.otpService.verifyArrivalOtp(bookingId, otp);
    const updated = await this.bookingRepo.updateArrivalConfirmed(bookingId);
    if (!updated) {
      throw new BadRequestError('Booking is not in CONFIRMED status');
    }
    return updated;
  }

  /** Provider / service person: mark job complete. Generates completion OTP and publishes otp_verification (completion). */
  async markComplete(bookingId: string, providerId: string): Promise<BookingResponse> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    if (booking.providerId !== providerId) {
      throw new ForbiddenError('Access denied: not your provider booking');
    }
    if (booking.status !== BookingStatus.ARRIVAL_CONFIRMED) {
      throw new BadRequestError('Only ARRIVAL_CONFIRMED bookings can be marked complete');
    }
    const updated = await this.bookingRepo.updatePendingCompletionVerification(bookingId);
    if (!updated) {
      throw new ConflictError('Booking could not be updated');
    }
    const { otp, expiresAt } = await this.otpService.generateCompletionOtp(bookingId);
    publishNotification({
      userAuthId: booking.userAuthId,
      type: 'otp_verification',
      title: 'Completion OTP',
      body: `Your completion OTP for booking ${bookingId} is ${otp}. Valid until ${expiresAt.toISOString()}. Enter this in the app to confirm service completion.`,
      metadata: { bookingId, otpType: 'completion', expiresAt: expiresAt.toISOString() },
      channel: 'both',
    }).catch(() => {});
    return updated;
  }

  /** User: verify completion OTP. Transitions PENDING_COMPLETION_VERIFICATION -> COMPLETED. */
  async verifyCompletion(
    bookingId: string,
    userAuthId: string,
    otp: string,
  ): Promise<BookingResponse> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    if (booking.userAuthId !== userAuthId) {
      throw new ForbiddenError('Access denied: not your booking');
    }
    await this.otpService.verifyCompletionOtp(bookingId, otp);
    const updated = await this.bookingRepo.updateCompleted(bookingId);
    if (!updated) {
      throw new BadRequestError('Booking is not in PENDING_COMPLETION_VERIFICATION status');
    }
    return updated;
  }

  /**
   * Available slots for a provider on a date (open intervals from Provider minus existing bookings).
   * Requires PROVIDER_SERVICE_URL. slotDurationMinutes defaults to 30.
   */
  async getAvailableSlots(
    providerId: string,
    dateStr: string,
    slotDurationMinutes = 30,
  ): Promise<AvailableSlot[]> {
    if (!ServerConfig.PROVIDER_SERVICE_URL) {
      throw new BadRequestError('Available slots service is not configured');
    }
    const openResult = await getProviderOpenIntervals(providerId, dateStr);
    const [y, m, d] = dateStr.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    const slots: AvailableSlot[] = [];
    for (const interval of openResult.openIntervals) {
      const start = new Date(startOfDay.getTime() + interval.startMinutes * 60 * 1000);
      const end = new Date(startOfDay.getTime() + interval.endMinutes * 60 * 1000);
      const booked = await this.bookingRepo.findBookingsByProviderAndDate(providerId, dateStr);
      const freeIntervals = subtractBookedFromRange(start, end, booked);
      for (const free of freeIntervals) {
        let slotStart = free.start.getTime();
        const endMs = free.end.getTime();
        const durationMs = slotDurationMinutes * 60 * 1000;
        while (slotStart + durationMs <= endMs) {
          const slotEnd = new Date(slotStart + durationMs);
          slots.push({
            start: new Date(slotStart).toISOString(),
            end: slotEnd.toISOString(),
          });
          slotStart += durationMs;
        }
      }
    }
    return slots;
  }
}

function subtractBookedFromRange(
  rangeStart: Date,
  rangeEnd: Date,
  booked: { slotStart: Date; slotEnd: Date }[],
): { start: Date; end: Date }[] {
  let intervals: { start: Date; end: Date }[] = [{ start: rangeStart, end: rangeEnd }];
  for (const b of booked) {
    const next: { start: Date; end: Date }[] = [];
    for (const iv of intervals) {
      const ovStart = b.slotStart > iv.start ? b.slotStart : iv.start;
      const ovEnd = b.slotEnd < iv.end ? b.slotEnd : iv.end;
      if (ovStart >= ovEnd) {
        next.push(iv);
        continue;
      }
      if (iv.start < ovStart) {
        next.push({ start: iv.start, end: ovStart });
      }
      if (ovEnd < iv.end) {
        next.push({ start: ovEnd, end: iv.end });
      }
    }
    intervals = next;
  }
  return intervals;
}
