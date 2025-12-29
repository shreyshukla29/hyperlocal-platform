/*
  Warnings:

  - You are about to drop the column `accountTypes` on the `identities` table. All the data in the column will be lost.
  - Added the required column `accountType` to the `identities` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('USER', 'PROVIDER');

-- AlterTable
ALTER TABLE "identities" DROP COLUMN "accountTypes",
ADD COLUMN     "accountType" "AccountType" NOT NULL;
