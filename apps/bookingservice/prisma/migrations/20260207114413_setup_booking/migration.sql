-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'PAYMENT_FAILED', 'CONFIRMED', 'IN_PROGRESS', 'ARRIVAL_CONFIRMED', 'PENDING_COMPLETION_VERIFICATION', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CancelledBy" AS ENUM ('USER', 'PROVIDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BookingOtpType" AS ENUM ('ARRIVAL', 'COMPLETION');

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "userAuthId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerServiceId" TEXT NOT NULL,
    "providerAuthId" TEXT,
    "assignedServicePersonId" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "slotStart" TIMESTAMP(3) NOT NULL,
    "slotEnd" TIMESTAMP(3) NOT NULL,
    "addressLine1" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "arrivalConfirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" "CancelledBy",
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "refundAmountPaise" INTEGER,
    "razorpayRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_reviews" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userAuthId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerServiceId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_otps" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "BookingOtpType" NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_idempotencyKey_key" ON "bookings"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_razorpayOrderId_key" ON "bookings"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "bookings_userAuthId_idx" ON "bookings"("userAuthId");

-- CreateIndex
CREATE INDEX "bookings_providerId_idx" ON "bookings"("providerId");

-- CreateIndex
CREATE INDEX "bookings_assignedServicePersonId_idx" ON "bookings"("assignedServicePersonId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_slotStart_idx" ON "bookings"("slotStart");

-- CreateIndex
CREATE INDEX "bookings_razorpayOrderId_idx" ON "bookings"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "bookings_razorpayPaymentId_idx" ON "bookings"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "bookings_idempotencyKey_idx" ON "bookings"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_eventId_key" ON "payment_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "payment_webhook_events_eventId_idx" ON "payment_webhook_events"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_reviews_bookingId_key" ON "booking_reviews"("bookingId");

-- CreateIndex
CREATE INDEX "booking_reviews_providerId_idx" ON "booking_reviews"("providerId");

-- CreateIndex
CREATE INDEX "booking_reviews_providerServiceId_idx" ON "booking_reviews"("providerServiceId");

-- CreateIndex
CREATE INDEX "booking_reviews_userAuthId_idx" ON "booking_reviews"("userAuthId");

-- CreateIndex
CREATE INDEX "booking_otps_bookingId_idx" ON "booking_otps"("bookingId");

-- CreateIndex
CREATE INDEX "booking_otps_bookingId_type_idx" ON "booking_otps"("bookingId", "type");

-- AddForeignKey
ALTER TABLE "booking_otps" ADD CONSTRAINT "booking_otps_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
