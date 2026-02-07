-- AlterTable
ALTER TABLE "identity_verifications" ADD COLUMN IF NOT EXISTS "otpHash" TEXT;
ALTER TABLE "identity_verifications" ADD COLUMN IF NOT EXISTS "otpExpiresAt" TIMESTAMP(3);
