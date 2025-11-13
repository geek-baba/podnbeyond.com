/*
  Warnings:

  - You are about to drop the column `currency` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `payments` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('HERO_SECTION', 'ABOUT_SECTION', 'ROOMS_SECTION', 'AMENITIES_SECTION', 'TESTIMONIALS_SECTION', 'CONTACT_SECTION', 'FOOTER_SECTION');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('HERO_BACKGROUND', 'ROOM_IMAGE', 'AMENITY_ICON', 'TESTIMONIAL_AVATAR', 'GALLERY_IMAGE', 'LOGO', 'FAVICON');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- DropIndex
DROP INDEX "payments_razorpayOrderId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "currency",
DROP COLUMN "paymentMethod",
ALTER COLUMN "razorpayOrderId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "contents" (
    "id" SERIAL NOT NULL,
    "type" "ContentType" NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "description" TEXT,
    "content" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "type" "ImageType" NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "title" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_images" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "imageId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" SERIAL NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "avatarImageId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "iconImageId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- AddForeignKey
ALTER TABLE "room_images" ADD CONSTRAINT "room_images_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_images" ADD CONSTRAINT "room_images_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_avatarImageId_fkey" FOREIGN KEY ("avatarImageId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_iconImageId_fkey" FOREIGN KEY ("iconImageId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
