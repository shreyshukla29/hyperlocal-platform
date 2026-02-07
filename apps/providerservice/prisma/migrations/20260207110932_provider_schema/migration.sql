-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('ONLINE', 'OFFLINE', 'DAY_OFF', 'BUSY');

-- CreateEnum
CREATE TYPE "ProviderServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "ServicePersonStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFF_DUTY');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "authIdentityId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "businessName" TEXT,
    "businessAddress" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "city" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "idDocumentUrl" TEXT,
    "businessLicenseUrl" TEXT,
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'OFFLINE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_services" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "durationMinutes" INTEGER,
    "status" "ProviderServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_schedules" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTimeMinutes" INTEGER NOT NULL,
    "endTimeMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_day_offs" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_day_offs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_people" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "authIdentityId" TEXT,
    "status" "ServicePersonStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_person_provider_services" (
    "id" TEXT NOT NULL,
    "servicePersonId" TEXT NOT NULL,
    "providerServiceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_person_provider_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_person_locations" (
    "id" TEXT NOT NULL,
    "servicePersonId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_person_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_authIdentityId_key" ON "providers"("authIdentityId");

-- CreateIndex
CREATE INDEX "providers_authIdentityId_idx" ON "providers"("authIdentityId");

-- CreateIndex
CREATE INDEX "providers_email_idx" ON "providers"("email");

-- CreateIndex
CREATE INDEX "providers_phone_idx" ON "providers"("phone");

-- CreateIndex
CREATE INDEX "providers_verificationStatus_idx" ON "providers"("verificationStatus");

-- CreateIndex
CREATE INDEX "providers_availabilityStatus_idx" ON "providers"("availabilityStatus");

-- CreateIndex
CREATE INDEX "providers_isActive_isDeleted_idx" ON "providers"("isActive", "isDeleted");

-- CreateIndex
CREATE INDEX "providers_city_idx" ON "providers"("city");

-- CreateIndex
CREATE INDEX "providers_verificationStatus_isActive_isDeleted_idx" ON "providers"("verificationStatus", "isActive", "isDeleted");

-- CreateIndex
CREATE INDEX "provider_services_providerId_idx" ON "provider_services"("providerId");

-- CreateIndex
CREATE INDEX "provider_services_providerId_status_idx" ON "provider_services"("providerId", "status");

-- CreateIndex
CREATE INDEX "provider_services_category_idx" ON "provider_services"("category");

-- CreateIndex
CREATE INDEX "provider_schedules_providerId_idx" ON "provider_schedules"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_schedules_providerId_dayOfWeek_key" ON "provider_schedules"("providerId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "provider_day_offs_providerId_idx" ON "provider_day_offs"("providerId");

-- CreateIndex
CREATE INDEX "provider_day_offs_date_idx" ON "provider_day_offs"("date");

-- CreateIndex
CREATE UNIQUE INDEX "provider_day_offs_providerId_date_key" ON "provider_day_offs"("providerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "service_people_authIdentityId_key" ON "service_people"("authIdentityId");

-- CreateIndex
CREATE INDEX "service_people_providerId_idx" ON "service_people"("providerId");

-- CreateIndex
CREATE INDEX "service_people_providerId_status_idx" ON "service_people"("providerId", "status");

-- CreateIndex
CREATE INDEX "service_people_providerId_isActive_idx" ON "service_people"("providerId", "isActive");

-- CreateIndex
CREATE INDEX "service_people_authIdentityId_idx" ON "service_people"("authIdentityId");

-- CreateIndex
CREATE INDEX "service_person_provider_services_servicePersonId_idx" ON "service_person_provider_services"("servicePersonId");

-- CreateIndex
CREATE INDEX "service_person_provider_services_providerServiceId_idx" ON "service_person_provider_services"("providerServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "service_person_provider_services_servicePersonId_providerSe_key" ON "service_person_provider_services"("servicePersonId", "providerServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "service_person_locations_servicePersonId_key" ON "service_person_locations"("servicePersonId");

-- CreateIndex
CREATE INDEX "service_person_locations_servicePersonId_idx" ON "service_person_locations"("servicePersonId");

-- AddForeignKey
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_schedules" ADD CONSTRAINT "provider_schedules_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_day_offs" ADD CONSTRAINT "provider_day_offs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_people" ADD CONSTRAINT "service_people_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_person_provider_services" ADD CONSTRAINT "service_person_provider_services_servicePersonId_fkey" FOREIGN KEY ("servicePersonId") REFERENCES "service_people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_person_provider_services" ADD CONSTRAINT "service_person_provider_services_providerServiceId_fkey" FOREIGN KEY ("providerServiceId") REFERENCES "provider_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_person_locations" ADD CONSTRAINT "service_person_locations_servicePersonId_fkey" FOREIGN KEY ("servicePersonId") REFERENCES "service_people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
