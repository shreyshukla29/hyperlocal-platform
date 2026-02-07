# Booking Service

Booking creation, Razorpay payment, cancellation with refunds, and **OTP-based arrival/completion verification**.

## OTP ownership (where the OTP table lives)

**The OTP table lives only in this service.** The `booking_otps` table (Prisma model `BookingOtp`) is in the **booking service database**. User service, provider service, and notification service do **not** store or verify booking OTPs:

- **Booking Service**: Generates OTPs (hashed), stores them, verifies submissions, marks them used. Only place that knows OTP validity and expiry.
- **Notification Service**: Only delivers the OTP text (in-app/email); no OTP storage.
- **User / Provider Service**: No OTP tables; they call this service’s APIs to verify OTPs.

OTPs expire after **15 minutes** (`OTP_TTL_MS` in `src/utils/otp.ts`). Validity: stored as hash only; “active” = unused and not expired. See [docs/OTP_AND_EMAIL.md](../../docs/OTP_AND_EMAIL.md) for validity, expiry, and edge cases.

## Environment

- `DATABASE_URL` – PostgreSQL connection string
- `GATEWAY_API_KEY` – API key for gateway-to-service auth
- `RAZORPAY_KEY_ID` – Razorpay API key id
- `RAZORPAY_KEY_SECRET` – Razorpay API key secret
- `RAZORPAY_WEBHOOK_SECRET` – Webhook secret from Razorpay Dashboard (Settings → Webhooks)

## Fault tolerance

- **Create booking**: Send `Idempotency-Key` header (e.g. UUID) on `POST /api/v1/bookings`. Duplicate requests with the same key return the same booking and Razorpay order so the frontend can retry payment safely. On race (two requests with same key), the second hits unique constraint on `idempotencyKey` and we return the existing booking (no double booking, no duplicate order leak).
- **Payment confirmation**: Razorpay sends `payment.captured` / `payment.failed` webhooks. Booking status is updated from webhooks (source of truth). If the frontend fails after payment, the webhook still confirms the booking.
- **Webhooks**: We **claim first** (insert `PaymentWebhookEvent` by `eventId`); only then process. Duplicate webhooks get unique violation and return 200 without reprocessing (no double confirm). Payment updates use **conditional updates** (only `PENDING_PAYMENT` → `CONFIRMED` / `PAYMENT_FAILED`), so retries never overwrite an already-confirmed booking.
- **No double payment**: One Razorpay order is stored on one booking (`razorpayOrderId` unique). `updatePaymentCaptured` updates only rows with `status = PENDING_PAYMENT`; already-confirmed rows are untouched.
- **No double cancel / double refund**: Cancel uses conditional update (only `CONFIRMED` or `PENDING_PAYMENT` → `CANCELLED`). If user and provider both cancel, only the first update wins; the second gets 409 Conflict.

## Razorpay webhook

1. In Razorpay Dashboard → Settings → Webhooks, add URL:  
   `https://<your-booking-service-host>/api/v1/webhooks/razorpay`  
   (This must hit the booking service directly, not via the gateway, so Razorpay can verify the signature on the raw body.)
2. Subscribe to: `payment.captured`, `payment.failed`.
3. Copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET`.

## Refund policy

- **Provider cancels**: Full refund.
- **User cancels**:  
  - 24+ hours before slot: 100%  
  - 12–24 hours before slot: 50%  
  - Less than 12 hours: 0%

## API (via gateway)

- **User**: `POST /api/v1/booking/bookings` (create), `GET /api/v1/booking/bookings`, `GET /api/v1/booking/bookings/:id`, `POST /api/v1/booking/bookings/:id/cancel`, `POST /api/v1/booking/bookings/:id/verify-completion` (body: `{ "otp": "123456" }`)
- **Provider**: `GET /api/v1/booking/bookings/provider`, `GET /api/v1/booking/bookings/provider/:id`, `POST /api/v1/booking/bookings/provider/:id/cancel`, `PATCH /api/v1/booking/bookings/provider/:id/assign` (body: `{ "assignedServicePersonId": "uuid" }`), `POST .../confirm-arrival` (body: `{ "otp": "123456" }`), `POST .../mark-complete`

Gateway pathRewrite forwards `/api/v1/booking/*` to booking service as `/api/v1/bookings*`.
