-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('INITIATED', 'RINGING', 'ANSWERED', 'COMPLETED', 'BUSY', 'FAILED', 'NO_ANSWER', 'CANCELLED');

-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_logs" (
    "id" SERIAL NOT NULL,
    "contactId" INTEGER,
    "channel" "MessageChannel" NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "templateId" TEXT,
    "templateParams" JSONB,
    "provider" TEXT NOT NULL DEFAULT 'GUPSHUP',
    "providerMessageId" TEXT,
    "providerStatus" TEXT,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "bookingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_logs" (
    "id" SERIAL NOT NULL,
    "contactId" INTEGER,
    "direction" "CallDirection" NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'INITIATED',
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "duration" INTEGER,
    "provider" TEXT NOT NULL DEFAULT 'EXOTEL',
    "providerCallId" TEXT,
    "providerStatus" TEXT,
    "flowId" TEXT,
    "ivrData" JSONB,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "recordingUrl" TEXT,
    "bookingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "initiatedAt" TIMESTAMP(3),
    "answeredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contacts_phone_key" ON "contacts"("phone");

-- CreateIndex
CREATE INDEX "contacts_phone_idx" ON "contacts"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "message_logs_providerMessageId_key" ON "message_logs"("providerMessageId");

-- CreateIndex
CREATE INDEX "message_logs_contactId_idx" ON "message_logs"("contactId");

-- CreateIndex
CREATE INDEX "message_logs_phone_idx" ON "message_logs"("phone");

-- CreateIndex
CREATE INDEX "message_logs_providerMessageId_idx" ON "message_logs"("providerMessageId");

-- CreateIndex
CREATE INDEX "message_logs_status_idx" ON "message_logs"("status");

-- CreateIndex
CREATE INDEX "message_logs_direction_idx" ON "message_logs"("direction");

-- CreateIndex
CREATE INDEX "message_logs_createdAt_idx" ON "message_logs"("createdAt");

-- CreateIndex
CREATE INDEX "message_logs_bookingId_idx" ON "message_logs"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "call_logs_providerCallId_key" ON "call_logs"("providerCallId");

-- CreateIndex
CREATE INDEX "call_logs_contactId_idx" ON "call_logs"("contactId");

-- CreateIndex
CREATE INDEX "call_logs_fromNumber_idx" ON "call_logs"("fromNumber");

-- CreateIndex
CREATE INDEX "call_logs_toNumber_idx" ON "call_logs"("toNumber");

-- CreateIndex
CREATE INDEX "call_logs_providerCallId_idx" ON "call_logs"("providerCallId");

-- CreateIndex
CREATE INDEX "call_logs_status_idx" ON "call_logs"("status");

-- CreateIndex
CREATE INDEX "call_logs_direction_idx" ON "call_logs"("direction");

-- CreateIndex
CREATE INDEX "call_logs_createdAt_idx" ON "call_logs"("createdAt");

-- CreateIndex
CREATE INDEX "call_logs_bookingId_idx" ON "call_logs"("bookingId");

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

