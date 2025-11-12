-- CreateTable
CREATE TABLE "third_party_integrations" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "description" TEXT,
    "documentationUrl" TEXT,
    "webhookUrl" TEXT,
    "testMode" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "third_party_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "third_party_integrations_provider_key" ON "third_party_integrations"("provider");

-- CreateIndex
CREATE INDEX "third_party_integrations_category_idx" ON "third_party_integrations"("category");

-- CreateIndex
CREATE INDEX "third_party_integrations_enabled_idx" ON "third_party_integrations"("enabled");

-- CreateIndex
CREATE INDEX "third_party_integrations_status_idx" ON "third_party_integrations"("status");

