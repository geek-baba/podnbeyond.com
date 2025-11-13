-- Migration: Communication Hub Enhancements
-- Description: Add workflow fields, status tracking, and unified message linking to Thread model
-- Date: 2025-11-13

-- Step 1: Create new enums (only if they don't exist)
-- PostgreSQL doesn't support CREATE TYPE IF NOT EXISTS, so we use DO block
DO $$ 
BEGIN
  -- Create ConversationStatus enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConversationStatus') THEN
    CREATE TYPE "ConversationStatus" AS ENUM (
      'NEW',
      'IN_PROGRESS',
      'WAITING_FOR_GUEST',
      'RESOLVED',
      'ARCHIVED'
    );
  END IF;
  
  -- Create Priority enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Priority') THEN
    CREATE TYPE "Priority" AS ENUM (
      'LOW',
      'NORMAL',
      'HIGH',
      'URGENT'
    );
  END IF;
END $$;

-- Step 2: Add new columns to email_threads table (with defaults)
-- Only add columns if they don't exist
DO $$ 
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'status') THEN
    ALTER TABLE "email_threads" ADD COLUMN "status" "ConversationStatus";
  END IF;
  
  -- Add assignedTo column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'assignedTo') THEN
    ALTER TABLE "email_threads" ADD COLUMN "assignedTo" TEXT;
  END IF;
  
  -- Add priority column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'priority') THEN
    ALTER TABLE "email_threads" ADD COLUMN "priority" "Priority";
  END IF;
  
  -- Add firstResponseAt column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'firstResponseAt') THEN
    ALTER TABLE "email_threads" ADD COLUMN "firstResponseAt" TIMESTAMP(3);
  END IF;
  
  -- Add resolvedAt column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'resolvedAt') THEN
    ALTER TABLE "email_threads" ADD COLUMN "resolvedAt" TIMESTAMP(3);
  END IF;
  
  -- Add slaBreached column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'slaBreached') THEN
    ALTER TABLE "email_threads" ADD COLUMN "slaBreached" BOOLEAN;
  END IF;
  
  -- Add unreadCount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'unreadCount') THEN
    ALTER TABLE "email_threads" ADD COLUMN "unreadCount" INTEGER;
  END IF;
  
  -- Add tags column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'tags') THEN
    ALTER TABLE "email_threads" ADD COLUMN "tags" TEXT[];
  END IF;
END $$;

-- Step 2a: Set default values for existing rows (only if columns exist)
DO $$ 
BEGIN
  -- Update status if column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'status') THEN
    UPDATE "email_threads" 
    SET 
      "status" = CASE 
        WHEN "isArchived" = true THEN 'ARCHIVED'::"ConversationStatus"
        ELSE 'NEW'::"ConversationStatus"
      END,
      "priority" = COALESCE("priority", 'NORMAL'::"Priority"),
      "slaBreached" = COALESCE("slaBreached", false),
      "unreadCount" = COALESCE("unreadCount", 0),
      "tags" = COALESCE("tags", ARRAY[]::TEXT[])
    WHERE "status" IS NULL;
  END IF;
END $$;

-- Step 2b: Make columns NOT NULL where required (only if columns exist and are nullable)
DO $$ 
BEGIN
  -- Set status NOT NULL and default
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'status' AND is_nullable = 'YES') THEN
    ALTER TABLE "email_threads" 
      ALTER COLUMN "status" SET NOT NULL,
      ALTER COLUMN "status" SET DEFAULT 'NEW';
  END IF;
  
  -- Set priority NOT NULL and default
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'priority' AND is_nullable = 'YES') THEN
    ALTER TABLE "email_threads" 
      ALTER COLUMN "priority" SET NOT NULL,
      ALTER COLUMN "priority" SET DEFAULT 'NORMAL';
  END IF;
  
  -- Set slaBreached NOT NULL and default
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'slaBreached' AND is_nullable = 'YES') THEN
    ALTER TABLE "email_threads" 
      ALTER COLUMN "slaBreached" SET NOT NULL,
      ALTER COLUMN "slaBreached" SET DEFAULT false;
  END IF;
  
  -- Set unreadCount NOT NULL and default
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'unreadCount' AND is_nullable = 'YES') THEN
    ALTER TABLE "email_threads" 
      ALTER COLUMN "unreadCount" SET NOT NULL,
      ALTER COLUMN "unreadCount" SET DEFAULT 0;
  END IF;
  
  -- Set tags default
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_threads' AND column_name = 'tags') THEN
    ALTER TABLE "email_threads" 
      ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;

-- Step 3: Add foreign key constraint for assignedTo (if it doesn't exist)
-- Note: assignedTo references users.id, which is TEXT
-- We'll add the foreign key constraint after ensuring data integrity

-- Step 4: Add threadId to message_logs table
ALTER TABLE "message_logs" 
  ADD COLUMN "threadId" INTEGER;

-- Step 5: Add threadId to call_logs table
ALTER TABLE "call_logs" 
  ADD COLUMN "threadId" INTEGER;

-- Step 6: Create conversation_notes table
CREATE TABLE "conversation_notes" (
  "id" SERIAL NOT NULL,
  "threadId" INTEGER NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isInternal" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "conversation_notes_pkey" PRIMARY KEY ("id")
);

-- Step 7: Add foreign key constraints (if they don't exist)
DO $$ 
BEGIN
  -- Add foreign key for assignedTo (with SET NULL on delete for safety)
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'email_threads_assignedTo_fkey') THEN
    ALTER TABLE "email_threads" 
      ADD CONSTRAINT "email_threads_assignedTo_fkey" 
      FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- Add foreign key for message_logs.threadId
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'message_logs_threadId_fkey') THEN
    ALTER TABLE "message_logs" 
      ADD CONSTRAINT "message_logs_threadId_fkey" 
      FOREIGN KEY ("threadId") REFERENCES "email_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- Add foreign key for call_logs.threadId
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'call_logs_threadId_fkey') THEN
    ALTER TABLE "call_logs" 
      ADD CONSTRAINT "call_logs_threadId_fkey" 
      FOREIGN KEY ("threadId") REFERENCES "email_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  
  -- Add foreign key for conversation_notes.threadId
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'conversation_notes_threadId_fkey') THEN
    ALTER TABLE "conversation_notes" 
      ADD CONSTRAINT "conversation_notes_threadId_fkey" 
      FOREIGN KEY ("threadId") REFERENCES "email_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  -- Add foreign key for conversation_notes.authorId
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'conversation_notes_authorId_fkey') THEN
    ALTER TABLE "conversation_notes" 
      ADD CONSTRAINT "conversation_notes_authorId_fkey" 
      FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Step 8: Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS "email_threads_assignedTo_idx" ON "email_threads"("assignedTo");
CREATE INDEX IF NOT EXISTS "email_threads_status_idx" ON "email_threads"("status");
CREATE INDEX IF NOT EXISTS "email_threads_isArchived_idx" ON "email_threads"("isArchived");
CREATE INDEX IF NOT EXISTS "message_logs_threadId_idx" ON "message_logs"("threadId");
CREATE INDEX IF NOT EXISTS "call_logs_threadId_idx" ON "call_logs"("threadId");
CREATE INDEX IF NOT EXISTS "conversation_notes_threadId_idx" ON "conversation_notes"("threadId");
CREATE INDEX IF NOT EXISTS "conversation_notes_authorId_idx" ON "conversation_notes"("authorId");
CREATE INDEX IF NOT EXISTS "conversation_notes_createdAt_idx" ON "conversation_notes"("createdAt");

-- Step 9: (Moved to Step 2a - already handled above)
-- Existing threads have been updated with default values

-- Step 10: Link existing message_logs to threads based on bookingId
-- Only link if both thread and message_log have the same bookingId
UPDATE "message_logs" ml
SET "threadId" = t.id
FROM "email_threads" t
WHERE ml."bookingId" IS NOT NULL
  AND t."bookingId" = ml."bookingId"
  AND ml."threadId" IS NULL
  AND t."bookingId" IS NOT NULL;

-- Step 11: Link existing call_logs to threads based on bookingId
-- Only link if both thread and call_log have the same bookingId
UPDATE "call_logs" cl
SET "threadId" = t.id
FROM "email_threads" t
WHERE cl."bookingId" IS NOT NULL
  AND t."bookingId" = cl."bookingId"
  AND cl."threadId" IS NULL
  AND t."bookingId" IS NOT NULL;

-- Step 12: Update lastMessageAt for threads that have linked messages/calls
-- Set lastMessageAt to the latest activity from emails, messages, or calls
-- Use a subquery to find the maximum timestamp from all sources
UPDATE "email_threads" t
SET "lastMessageAt" = (
  SELECT MAX(ts) FROM (
    SELECT t."lastMessageAt" as ts
    UNION ALL
    SELECT e."createdAt" as ts FROM "emails" e WHERE e."threadId" = t.id
    UNION ALL
    SELECT ml."createdAt" as ts FROM "message_logs" ml WHERE ml."threadId" = t.id
    UNION ALL
    SELECT cl."createdAt" as ts FROM "call_logs" cl WHERE cl."threadId" = t.id
  ) AS all_timestamps
  WHERE ts IS NOT NULL
)
WHERE EXISTS (
  SELECT 1 FROM "emails" e WHERE e."threadId" = t.id
) OR EXISTS (
  SELECT 1 FROM "message_logs" ml WHERE ml."threadId" = t.id
) OR EXISTS (
  SELECT 1 FROM "call_logs" cl WHERE cl."threadId" = t.id
);

-- Migration complete
-- Note: Existing threads have been updated with default values
-- Message logs and call logs have been linked to threads based on bookingId
-- You may need to manually link additional messages/calls that don't have bookingIds

