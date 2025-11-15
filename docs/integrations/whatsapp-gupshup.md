# WhatsApp/SMS Integration - Gupshup

**Last Updated:** 2025-01-21  
**Status:** ✅ **Configured & Integrated**

---

## Overview

The Gupshup integration provides WhatsApp and SMS messaging capabilities, with automatic thread linking to the Communication Hub for unified conversation management.

---

## Architecture

```
┌─────────────┐
│   Frontend  │  Communication Hub UI
│             │  - Send WhatsApp/SMS
└──────┬──────┘  - View messages
       │
       ↓ API Call
┌──────────────┐
│   Express    │  POST /api/messages/send
│   Backend    │  - Create MessageLog record
└──────┬───────┘  - Link to Thread
       │          - Send via Gupshup API
       ↓
┌──────────────┐
│   Gupshup    │  WhatsApp/SMS API
│     API      │  - Sends message
└──────┬───────┘  - Returns MessageID
       │
       ↓ Webhook
┌──────────────┐
│   Webhook    │  POST /webhooks/gupshup
│   Handler    │  - Receives delivery status
└──────┬───────┘  - Updates MessageLog
       │          - Links to Thread
       ↓
┌──────────────┐
│  PostgreSQL  │  MessageLog, Thread
│   Database   │  - Message history
└──────────────┘  - Thread linking
```

---

## Database Schema

### MessageLog Model

```prisma
model MessageLog {
  id                Int      @id @default(autoincrement())
  contactId         Int?
  contact           Contact? @relation(...)
  
  // Message details
  channel           MessageChannel  // WHATSAPP, SMS
  direction         MessageDirection // INBOUND, OUTBOUND
  status            MessageStatus    @default(PENDING)
  phone             String           // Phone number (normalized)
  message           String?          @db.Text
  templateId        String?          // Gupshup template ID
  templateParams    Json?            // Template parameters
  
  // Provider info
  provider          String  @default("GUPSHUP")
  providerMessageId String? @unique // External message ID from Gupshup
  providerStatus    String?         // Provider-specific status
  
  // Metadata
  metadata          Json?            // Additional provider metadata
  errorMessage      String?         @db.Text
  
  // Relations
  bookingId         Int?            // Link to booking if message is booking-related
  threadId          Int?            // Link to thread for unified conversations
  thread            Thread?         @relation(...)
  
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  sentAt            DateTime?
  deliveredAt       DateTime?
  readAt            DateTime?
}
```

---

## Configuration

### Environment Variables

**Backend (.env):**
```env
GUPSHUP_ENABLED=true
GUPSHUP_API_KEY="your-api-key"
GUPSHUP_APP_ID="2a22997e-c702-4180-afad-abab89a5aa4b"
GUPSHUP_APP_NAME="podnbeyond"
GUPSHUP_SOURCE="919876543210"  # WhatsApp Business number (country code + number, no +)
GUPSHUP_WEBHOOK_SECRET="your-webhook-secret"  # Optional but recommended
GUPSHUP_WEBHOOK_URL="https://capsulepodhotel.com/webhooks/gupshup"
```

### Gupshup Dashboard Setup

1. **Access Dashboard**: https://apps.gupshup.io/
2. **Get App ID**: From Settings tab (`2a22997e-c702-4180-afad-abab89a5aa4b`)
3. **Create API Key**: Settings → API Keys → Create API Key
4. **Get WhatsApp Business Number**: WhatsApp → Phone Numbers
5. **Configure Webhook**: Webhooks tab → Add Webhook
   - URL: `https://capsulepodhotel.com/webhooks/gupshup`
   - Events: Message delivery status, read receipts, inbound messages
   - Secret: Set custom secret (optional but recommended)

---

## API Endpoints

### Send Message

**POST /api/messages/send**
```json
{
  "phone": "919876543210",
  "message": "Hello, your booking is confirmed!",
  "channel": "WHATSAPP",
  "bookingId": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": 1,
    "providerMessageId": "msg-xxx",
    "status": "SENT",
    // ...
  }
}
```

### Get Messages

**GET /api/messages**
```json
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "phone": "919876543210",
      "message": "Hello",
      "channel": "WHATSAPP",
      "direction": "OUTBOUND",
      "status": "DELIVERED",
      "threadId": 1
    }
  ]
}
```

---

## Webhook Handler

### Inbound Messages

**POST /webhooks/gupshup**

**Handles:**
- Inbound WhatsApp/SMS messages
- Delivery status updates
- Read receipts
- Message failures

**Process:**
1. Verify webhook signature (if secret configured)
2. Extract message data
3. Find or create Contact by phone
4. Find or create Thread
5. Create MessageLog record
6. Link message to thread
7. Auto-assign thread to property staff (if booking-linked)

---

## Thread Linking

### Automatic Linking

**When message arrives:**
1. Extract phone number from message
2. Find Contact by phone
3. Find existing Thread by:
   - Contact's recent messages/calls
   - Booking linked to contact
4. If no thread found, create new thread
5. Link message to thread via `MessageLog.threadId`
6. Auto-assign thread to property staff (round-robin)

**Code Location:** `backend/services/thread-linking.js`

---

## Communication Hub Integration

### Unified Conversations

Messages appear in the Communication Hub alongside emails and voice calls:
- **Channel Badge**: Shows "WhatsApp" or "SMS"
- **Direction Badge**: Shows "INBOUND" or "OUTBOUND"
- **Status Badge**: Shows "PENDING", "SENT", "DELIVERED", "READ", "FAILED"
- **Thread View**: All messages in chronological order

### Sending Messages

From Communication Hub:
1. Select conversation thread
2. Click "Reply" button
3. Select channel (WhatsApp/SMS)
4. Type message
5. Send → Creates MessageLog and sends via Gupshup API

---

## Testing

### Send Test Message

```bash
curl -X POST http://localhost:4000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "919876543210",
    "message": "Test message",
    "channel": "WHATSAPP"
  }'
```

### Test Webhook

```bash
curl -X POST http://localhost:4000/webhooks/gupshup \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message",
    "payload": {
      "phone": "919876543210",
      "message": "Test inbound message"
    }
  }'
```

---

## Sandbox vs Production

### Sandbox Mode (Current)

- Limited to 5 test phone numbers
- Testing only
- No Meta/Facebook approval needed

### Production Mode

- Requires Meta/Facebook app approval
- Full WhatsApp Business API access
- Unlimited phone numbers
- Production webhook URL required

---

## Troubleshooting

### Message Not Sending

1. Verify API key is correct (no extra spaces)
2. Check phone number format (country code + number, no + sign)
3. Check Gupshup dashboard logs for API errors
4. Verify webhook URL is accessible (should return 200 OK)

### Webhook Not Receiving Events

1. Verify webhook URL is configured in Gupshup dashboard
2. Check webhook events are enabled
3. Verify webhook secret matches (if configured)
4. Check backend logs for webhook errors

### Thread Not Linking

1. Verify Contact exists for phone number
2. Check thread-linking service logs
3. Verify MessageLog.threadId is set after webhook processing

---

## Related Documentation

- [Communication Hub Architecture](../architecture/communication-hub.md) - Unified conversation management
- [Deployment Guide](../operations/deployment.md) - Environment setup

---

**Code Locations:**
- Webhook Handler: `backend/routes/webhooks.js`
- Thread Linking: `backend/services/thread-linking.js`
- Communication Hub UI: `frontend/pages/admin/communication-hub.tsx`
- Database Schema: `backend/prisma/schema.prisma` (MessageLog, Contact, Thread models)

