/*
  Warnings:

  - You are about to drop the column `email` on the `loyalty_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `guestName` on the `loyalty_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `loyalty_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `lastActivityDate` on the `loyalty_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `loyalty_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `pointsBalance` on the `loyalty_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `totalBookings` on the `loyalty_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `totalSpent` on the `loyalty_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `rooms` table. All the data in the column will be lost.
  - Made the column `lastUpdated` on table `loyalty_accounts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `points` on table `loyalty_accounts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `loyalty_accounts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `rooms` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pricePerNight` on table `rooms` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "loyalty_accounts_email_key";

-- AlterTable
ALTER TABLE "loyalty_accounts" DROP COLUMN "email",
DROP COLUMN "guestName",
DROP COLUMN "isActive",
DROP COLUMN "lastActivityDate",
DROP COLUMN "phone",
DROP COLUMN "pointsBalance",
DROP COLUMN "totalBookings",
DROP COLUMN "totalSpent",
ALTER COLUMN "lastUpdated" SET NOT NULL,
ALTER COLUMN "lastUpdated" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "points" SET NOT NULL,
ALTER COLUMN "points" SET DEFAULT 0,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "price",
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "pricePerNight" SET NOT NULL;
