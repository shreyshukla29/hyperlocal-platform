/*
  Warnings:

  - A unique constraint covering the columns `[email,accountType]` on the table `identities` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone,accountType]` on the table `identities` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE 'ADMIN';

-- DropIndex
DROP INDEX "identities_email_key";

-- DropIndex
DROP INDEX "identities_phone_key";

-- CreateIndex
CREATE UNIQUE INDEX "identities_email_accountType_key" ON "identities"("email", "accountType");

-- CreateIndex
CREATE UNIQUE INDEX "identities_phone_accountType_key" ON "identities"("phone", "accountType");

-- CreateIndex
CREATE INDEX "identity_verifications_type_value_idx" ON "identity_verifications"("type", "value");
