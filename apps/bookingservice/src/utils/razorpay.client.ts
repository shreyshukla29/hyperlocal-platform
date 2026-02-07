import crypto from 'crypto';
import Razorpay from 'razorpay';
import { ServerConfig } from '../config/index.js';

let instance: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay {
  if (!instance) {
    instance = new Razorpay({
      key_id: ServerConfig.RAZORPAY_KEY_ID,
      key_secret: ServerConfig.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
}

export interface CreateOrderParams {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export async function createRazorpayOrder(
  params: CreateOrderParams,
): Promise<RazorpayOrderResponse> {
  const rzp = getRazorpayInstance();
  const order = await rzp.orders.create({
    amount: params.amountPaise,
    currency: params.currency ?? 'INR',
    receipt: params.receipt,
    notes: params.notes,
  });
  return order as unknown as RazorpayOrderResponse;
}

export interface CreateRefundParams {
  paymentId: string;
  amountPaise?: number;
  notes?: Record<string, string>;
}

export interface RazorpayRefundResponse {
  id: string;
  payment_id: string;
  amount: number;
  status: string;
}

export async function createRazorpayRefund(
  params: CreateRefundParams,
): Promise<RazorpayRefundResponse> {
  const rzp = getRazorpayInstance();
  const options: { amount?: number; notes?: Record<string, string> } = {};
  if (params.amountPaise !== undefined) {
    options.amount = params.amountPaise;
  }
  if (params.notes) {
    options.notes = params.notes;
  }
  const refund = await rzp.payments.refund(
    params.paymentId,
    Object.keys(options).length > 0 ? options : undefined,
  );
  return refund as unknown as RazorpayRefundResponse;
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expected === signature;
}
