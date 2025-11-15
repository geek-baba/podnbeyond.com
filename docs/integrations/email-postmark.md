# Email Integration - Postmark

**Last Updated:** 2025-01-21  
**Status:** ✅ **Fully Functional & Tested**

---

## Overview

The Postmark email system provides transactional email delivery, inbound email handling, event tracking (delivery, opens, clicks, bounces), and a BullMQ queue for reliable email processing.

---

## Architecture

```
┌─────────────┐
│   Frontend  │  Admin Email Center UI
│  /admin/email│  - View threads
└──────┬──────┘  - Reply to emails
       │
       ↓ API Call
┌──────────────┐
│   Express    │  POST /api/email/send
│   Backend    │  - Validate email
└──────┬───────┘  - Create Email record
       │          - Queue or send immediately
       ↓
┌──────────────┐
│    BullMQ    │  Email Queue (Redis)
│   Worker     │  - Retry on failure (3 attempts)
└──────┬───────┘  - Exponential backoff
       │          - 5 concurrent workers
       ↓
┌──────────────┐
│   Postmark   │  Transactional Email Service
│     API      │  - Sends email
└──────┬───────┘  - Returns MessageID
       │          - Tracks opens/clicks
       ↓
┌──────────────┐
│   Webhooks   │  Event Notifications
│   (Inbound)  │  - /api/email/inbound
│   (Events)   │  - /api/email/events
└──────┬───────┘  - HMAC verified
       │          - Stores in DB
       ↓
┌──────────────┐
│  PostgreSQL  │  Persistent Storage
│   Database   │  - Threads, Emails, Events
└──────────────┘  - Attachments, Suppressions
```

---

## Database Schema

### Core Models

```prisma
model Thread {
  id            Int      @id @default(autoincrement())
  subject       String
  participants  String[]
  lastMessageAt DateTime
  isArchived    Boolean  @default(false)
  
  // Relations
  emails        Email[]
  // ...
}

model Email {
  id            Int      @id @default(autoincrement())
  threadId      Int
  thread        Thread   @relation(...)
  
  // Email metadata
  messageId     String   @unique // Postmark MessageID or custom ID (REQUIRED)
  postmarkId    String?  @unique // Postmark MessageID for sent emails (OPTIONAL)
  direction     EmailDirection
  status        EmailStatus @default(QUEUED)
  
  // Sender/Recipients
  fromEmail     String
  fromName      String?
  toEmails      String[] @default([])
  ccEmails      String[] @default([])
  bccEmails     String[] @default([])
  replyTo       String?
  
  // Content
  subject       String
  htmlBody      String?  @db.Text
  textBody      String?  @db.Text
  
  // Postmark specific
  tag           String?  // Postmark tag for categorization
  metadata      Json?    // Additional metadata
  
  // Relations
  attachments   Attachment[]
  events        EmailEvent[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Attachment {
  id            Int      @id @default(autoincrement())
  emailId       Int
  email         Email    @relation(...)
  
  filename      String
  contentType   String
  size          Int      // bytes
  
  // Storage
  storageUrl    String?  // S3/local path
  postmarkUrl   String?  // Postmark URL for inbound attachments
  
  createdAt     DateTime @default(now())
}

model EmailEvent {
  id            Int      @id @default(autoincrement())
  emailId       Int
  email         Email    @relation(...)
  
  eventType     EmailEventType // DELIVERED, BOUNCED, OPENED, CLICKED, SPAM_COMPLAINT
  postmarkId    String?  // Postmark MessageID
  metadata      Json?    // Event-specific data
  
  createdAt     DateTime @default(now())
}

model Suppression {
  id            Int      @id @default(autoincrement())
  email         String   @unique
  reason        String   // HARD_BOUNCE, SPAM_COMPLAINT
  suppressedAt  DateTime @default(now())
}
```

**Field Clarification:**
- `messageId`: REQUIRED and unique (general identifier, can be custom or Postmark MessageID)
- `postmarkId`: OPTIONAL and unique (Postmark-specific MessageID for sent emails)
- Both fields can coexist (messageId for custom, postmarkId for Postmark)

---

## API Endpoints

### Email Sending

**POST /api/email/send**
```json
{
  "to": "customer@example.com",
  "subject": "Booking Confirmation",
  "htmlBody": "<p>Your booking is confirmed!</p>",
  "textBody": "Your booking is confirmed!",
  "tag": "booking-confirmation",
  "bookingId": 123
}
```

**Response:**
```json
{
  "success": true,
  "email": {
    "id": 1,
    "messageId": "msg-xxx",
    "status": "QUEUED",
    // ...
  }
}
```

**RBAC:** Rate limited (100 req/15min)

### List Threads

**GET /api/email/threads**
```json
{
  "success": true,
  "threads": [
    {
      "id": 1,
      "subject": "Booking Inquiry",
      "participants": ["guest@example.com"],
      "messageCount": 3,
      "lastMessageAt": "2024-01-21T10:00:00Z"
    }
  ]
}
```

### Get Thread

**GET /api/email/threads/:id**
Returns thread with all emails, attachments, and events

### Queue Statistics

**GET /api/email/queue/stats**
```json
{
  "queueEnabled": true,
  "waiting": 5,
  "active": 2,
  "completed": 100,
  "failed": 0
}
```

---

## Webhook Handlers

### Inbound Email

**POST /api/email/inbound**
- Receives inbound emails from Postmark
- Creates Thread and Email records
- Links to bookings/users if email/phone matches
- Parses attachments
- HMAC signature verified

### Email Events

**POST /api/email/events**
- Handles delivery, bounce, open, click, spam events
- Updates Email status
- Creates EmailEvent records
- Auto-suppresses on hard bounce/spam complaint
- HMAC signature verified

---

## BullMQ Queue

### Configuration

**Location:** `backend/lib/queue.js`

**Features:**
- Redis-based queue (or synchronous fallback)
- 5 concurrent workers
- 3 retry attempts with exponential backoff
- Graceful degradation (works without Redis)

### Queue Status

**Check if queue is enabled:**
```bash
curl http://localhost:4000/api/email/queue/stats
```

**Expected output:**
```json
{
  "queueEnabled": true,
  "waiting": 0,
  "active": 0,
  "completed": 10,
  "failed": 0
}
```

---

## Admin Email Center UI

**Location:** `/admin/email`

**Features:**
- 📧 **Thread List (Left Panel)**
  - All conversations sorted by latest activity
  - Shows subject, participants, message count, timestamp
  - Click to view full conversation
  - Active thread highlighted

- 💬 **Message View (Right Panel)**
  - Full conversation history
  - Sender info (name + email)
  - Direction badges (INBOUND/OUTBOUND)
  - Message content (HTML + text)
  - Attachment list with file sizes
  - Event tracking (delivery, open, click, bounce)

- ↩️ **Reply Form**
  - Subject auto-populated with "Re:"
  - HTML + text message support
  - Send to all participants
  - Links to existing thread
  - Success/error notifications

**Access Control:**
- ✅ Only ADMIN, MANAGER, SUPERADMIN roles
- ✅ Session-based authentication
- ✅ Redirects unauthorized users

---

## Configuration

### Environment Variables

**Backend (.env):**
```env
POSTMARK_SERVER_TOKEN="your-postmark-server-token"
POSTMARK_WEBHOOK_SECRET="your-webhook-secret"
EMAIL_FROM="support@capsulepodhotel.com"
MAIL_FROM="support@capsulepodhotel.com"

# Redis/BullMQ (Optional but recommended)
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

### Postmark Dashboard Setup

1. **Sign up**: https://postmarkapp.com/sign_up
2. **Verify domain**: capsulepodhotel.com
3. **Get Server API Token**: Dashboard → Servers → API Tokens
4. **Get Webhook Secret**: Dashboard → Servers → Webhooks
5. **Configure Webhooks:**
   - **Inbound Hook:** `https://capsulepodhotel.com/api/email/inbound`
   - **Delivery Hook:** `https://capsulepodhotel.com/api/email/events`
   - **Bounce Hook:** `https://capsulepodhotel.com/api/email/events`
   - **Spam Hook:** `https://capsulepodhotel.com/api/email/events`
   - **Open/Click Hook:** `https://capsulepodhotel.com/api/email/events`

---

## Security Features

- ✅ **HMAC Signature Verification** - Webhooks verified as genuine Postmark
- ✅ **Suppression List** - Auto-block hard bounces & spam complaints
- ✅ **Rate Limiting** - 100 req/15min on send endpoint
- ✅ **Role-Based Access** - Only Admin/Manager can access Email Center
- ✅ **Database Audit Trail** - All emails and events logged

---

## Testing

### Test Email Sending

```bash
curl -X POST http://localhost:4000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "textBody": "This is a test email"
  }'
```

### Test Queue

```bash
# Check queue stats
curl http://localhost:4000/api/email/queue/stats

# Check Redis connection
redis-cli ping  # Should return: PONG
```

---

## Production Deployment

### Checklist

- [ ] Sign up for Postmark account
- [ ] Verify domain (capsulepodhotel.com)
- [ ] Get production Server API Token
- [ ] Get Webhook Secret
- [ ] Configure inbound email domain
- [ ] Set up webhooks (5 endpoints)
- [ ] Update production `.env` with tokens
- [ ] Install Redis on production server
- [ ] Set `REDIS_ENABLED="true"` in production `.env`
- [ ] Test end-to-end in production

---

## Related Documentation

- [Communication Hub Architecture](../architecture/communication-hub.md) - Thread linking and unified conversations
- [Deployment Guide](../operations/deployment.md) - Environment setup

---

**Code Locations:**
- Email Routes: `backend/routes/email.js`
- Postmark Client: `backend/lib/postmarkClient.js`
- Queue Handler: `backend/lib/queue.js`
- Admin UI: `frontend/pages/admin/email.tsx`
- Database Schema: `backend/prisma/schema.prisma` (Thread, Email, Attachment, EmailEvent, Suppression models)

