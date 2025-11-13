-- AlterTable
ALTER TABLE "loyalty_accounts" ADD COLUMN "memberNumber" TEXT,
                                ADD COLUMN "lifetimeStays" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_accounts_memberNumber_key" ON "loyalty_accounts"("memberNumber");

-- CreateIndex  
CREATE INDEX "loyalty_accounts_memberNumber_idx" ON "loyalty_accounts"("memberNumber");

-- Backfill memberNumber for existing accounts
UPDATE "loyalty_accounts" 
SET "memberNumber" = LPAD((ROW_NUMBER() OVER (ORDER BY "createdAt"))::TEXT, 6, '0')
WHERE "memberNumber" IS NULL;

-- Make memberNumber NOT NULL after backfill
ALTER TABLE "loyalty_accounts" ALTER COLUMN "memberNumber" SET NOT NULL;
