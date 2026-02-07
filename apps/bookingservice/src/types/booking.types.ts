import type { BookingStatus } from '../enums/booking-status.enum.js';
import type { CancelledBy } from '../enums/booking-status.enum.js';

export interface BookingResponse {
  id: string;
  userAuthId: string;
  providerId: string;
  providerServiceId: string;
  assignedServicePersonId: string | null;
  status: BookingStatus;
  slotStart: Date;
  slotEnd: Date;
  addressLine1: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  cancelledBy: CancelledBy | null;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  refundAmountPaise: number | null;
  razorpayRefundId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingPayload {
  userAuthId: string;
  providerId: string;
  providerServiceId: string;
  providerAuthId?: string | null;
  slotStart: Date;
  slotEnd: Date;
  addressLine1?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  amountPaise: number;
  currency?: string;
  idempotencyKey?: string | null;
}

export interface CreateBookingResult {
  booking: BookingResponse;
  razorpayOrder: {
    id: string;
    amount: number;
    currency: string;
    keyId: string;
  };
}

export interface ListBookingsQuery {
  page?: number;
  limit?: number;
  status?: BookingStatus;
}

export interface PaginatedBookingsResult {
  items: BookingResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RefundPolicyResult {
  refundPercentage: number;
  refundAmountPaise: number;
}

export interface AvailableSlot {
  start: string;
  end: string;
}
