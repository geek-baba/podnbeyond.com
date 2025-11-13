-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('SILVER', 'GOLD', 'PLATINUM');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "loyaltyAccountId" INTEGER;

-- CreateTable
CREATE TABLE "loyalty_accounts" (
    "id" SERIAL NOT NULL,
    "guestName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "tier" "LoyaltyTier" NOT NULL DEFAULT 'SILVER',
    "lastActivityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_accounts_email_key" ON "loyalty_accounts"("email");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_loyaltyAccountId_fkey" FOREIGN KEY ("loyaltyAccountId") REFERENCES "loyalty_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
