# Communication Hub Architecture

**Last Updated:** 2025-01-21  
**Status:** ✅ **All 4 Phases Complete**

---

## Overview

The Communication Hub is a unified conversation management system that handles all guest communications across Email, WhatsApp, SMS, and Voice channels. It provides workflow management, SLA tracking, auto-assignment, message templates, and real-time updates.

---

## Architecture

### Core Strategy: Extended Thread Model

Instead of creating a new `Conversation` model, the existing `Thread` model was extended to become the unified conversation hub.

**Benefits:**
- Reuses existing data
- Maintains backward compatibility
- Less migration complexity
- Thread already has `bookingId` and `propertyId`

### Database Schema

```prisma
model Thread {
  // Existing fields
  id            Int
  subject       String
  participants  String[]
  lastMessageAt DateTime
  isArchived    Boolean
  userId        String?
  bookingId     Int?
  propertyId    Int?
  
  // NEW: Workflow fields
  status          ConversationStatus @default(NEW)
  assignedTo      String? // User ID
  assignedUser    User?   @relation("AssignedThreads")
  priority        Priority @default(NORMAL)
  
  // NEW: SLA Tracking
  firstResponseAt DateTime?
  resolvedAt      DateTime?
  slaBreached     Boolean  @default(false)
  
  // NEW: Unread tracking
  unreadCount     Int      @default(0)
  
  // NEW: Tags
  tags            String[] @default([])
  
  // NEW: Unified message links
  emails          Email[]
  messageLogs     MessageLog[] // WhatsApp/SMS
  callLogs        CallLog[]    // Voice calls
  
  // NEW: Internal notes
  notes           ConversationNote[]
}

enum ConversationStatus {
  NEW
  IN_PROGRESS
  WAITING_FOR_GUEST
  RESOLVED
  ARCHIVED
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

---

## Message Linking

### Linking Strategy

- **Email**: Already linked via `Email.threadId`
- **WhatsApp/SMS**: Linked via `MessageLog.threadId`
- **Voice Calls**: Linked via `CallLog.threadId`

### Thread-Linking Service

**Location:** `backend/services/thread-linking.js`

**Key Functions:**
- `findOrCreateThread({ phone, email, propertyId, bookingId })` - Finds or creates thread by contact
- `linkMessageToThread(messageLogId, threadId)` - Links WhatsApp/SMS messages
- `linkCallToThread(callLogId, threadId)` - Links voice calls
- `autoAssignToProperty(propertyId)` - Auto-assigns to property staff (round-robin)

### Auto-Linking Logic

1. **When message/call arrives:**
   - Try to find existing thread by email (if email provided)
   - Try to find existing thread by phone via Contact (if phone provided)
   - If found: Link message/call to thread
   - If not found: Create new thread and link

2. **Booking Auto-Linking:**
   - Link to booking if email/phone matches
   - Link to property if booking exists
   - Update thread's `bookingId` and `propertyId`

3. **Auto-Assignment:**
   - If property is known, auto-assign to property staff
   - Round-robin assignment (least busy)
   - Update thread status to `IN_PROGRESS`

---

## API Endpoints

**Location:** `backend/routes/conversations.js`

### List Conversations
```http
GET /api/conversations?propertyId=1&status=NEW&channel=EMAIL
Authorization: Bearer <token>
```

**RBAC:** Property-scoped filtering based on user's assigned properties

### Get Conversation
```http
GET /api/conversations/:id
Authorization: Bearer <token>
```

**Returns:** Thread with all linked messages (Email, WhatsApp, SMS, Voice)

### Assign Conversation
```http
POST /api/conversations/:id/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "assignedTo": "user123"
}
```

**RBAC:** MANAGER, ADMIN, SUPERADMIN only

### Update Status
```http
POST /api/conversations/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "RESOLVED"
}
```

### Add Note
```http
POST /api/conversations/:id/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Internal note",
  "isInternal": true
}
```

### Get Messages
```http
GET /api/conversations/:id/messages
Authorization: Bearer <token>
```

**Returns:** Unified timeline of all messages (Email, WhatsApp, SMS, Voice)

---

## RBAC Integration

### Property-Based Filtering

Users only see conversations for properties they have access to:
- **Staff roles** (`STAFF_FRONTDESK`, `STAFF_OPS`, `MANAGER`): See only assigned properties
- **Admin roles** (`ADMIN`, `SUPERADMIN`): See all properties

### Assignment Permissions

- **Who can assign**: MANAGER, ADMIN, SUPERADMIN
- **Auto-assignment**: Based on property (round-robin)
- **Assignment logic**: 
  1. Try property manager first
  2. Fallback to round-robin from property staff (least busy)

---

## SLA Tracking

### SLA Targets

```typescript
const slaTargets = {
  WHATSAPP: 5,    // 5 minutes
  SMS: 5,          // 5 minutes
  EMAIL: 30,       // 30 minutes
  VOICE: 5,        // 5 minutes
};

// Urgent priority: 5 minutes (all channels)
const targetMinutes = thread.priority === 'URGENT' ? 5 : slaTargets[channel] || 30;
```

### SLA Calculation

- **First Response Time**: Time from conversation creation to first staff response
- **Resolution Time**: Time from conversation creation to resolution
- **SLA Breach**: When time exceeds target (based on channel and priority)
- **Visual Indicators**: Green/yellow/red in UI

---

## Message Templates

**Location:** `backend/routes/templates.js`

### Template Types

- `BOOKING_CONFIRMATION` - Booking confirmation emails
- `CHECK_IN` - Check-in reminders
- `CHECK_OUT` - Check-out reminders
- `CANCELLATION` - Cancellation confirmations
- `FAQ` - Frequently asked questions
- `CUSTOM` - Custom templates

### Template Variables

- `{{guestName}}` - Guest name
- `{{bookingId}}` - Booking ID
- `{{checkIn}}` - Check-in date
- `{{checkOut}}` - Check-out date
- `{{propertyName}}` - Property name
- `{{roomType}}` - Room type name

### Template Management

**API Endpoints:**
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

**UI:** `/admin/templates` - Template management page

---

## Real-Time Updates

### Server-Sent Events (SSE)

**Endpoint:** `GET /api/realtime/events`

**Events:**
- `conversation_updated` - Conversation status/assignment changed
- `new_conversation` - New conversation created
- `unread_count` - Unread count updated

**Frontend Integration:**
- Auto-reconnect on connection errors
- Desktop notifications for new messages
- Real-time conversation list updates

---

## Analytics

**Location:** `/admin/analytics`

### Metrics

- **Overview**: Total conversations, by status, by priority, channel breakdown
- **Performance**: Avg response time, avg resolution time, SLA breach rate
- **Trends**: Conversations over time (daily/weekly/monthly/yearly)
- **Staff Performance**: Top assignees, response times
- **Channel Performance**: Email, WhatsApp, SMS, Voice breakdown

### RBAC Filtering

- Property-scoped analytics (staff see only their properties)
- Date range filtering
- Time period selector (Last 7 Days, Last 30 Days, etc.)

---

## Frontend Components

### Main Page

**Location:** `frontend/pages/admin/communication-hub.tsx`

**Features:**
- Unified conversation list (sidebar)
- Conversation detail view (main panel)
- Guest context panel
- Real-time updates via SSE
- Desktop notifications
- Bulk actions (assign, status, archive)
- Filters and search

### Components

- Conversation list sidebar
- Conversation thread view
- Guest context panel
- Internal notes section
- Reply form with channel selection
- Template selector

---

## Integration Points

### Email Integration

- **Webhook:** `/api/email/inbound` - Receives inbound emails from Postmark
- **Linking:** Automatically links emails to threads via `Email.threadId`
- **See:** [Email Integration](../integrations/email-postmark.md)

### WhatsApp/SMS Integration

- **Webhook:** `/webhooks/gupshup` - Receives messages from Gupshup
- **Linking:** Automatically links messages to threads via `MessageLog.threadId`
- **See:** [WhatsApp Integration](../integrations/whatsapp-gupshup.md)

### Voice Integration

- **Webhook:** `/webhooks/exotel` - Receives call logs from Exotel
- **Linking:** Automatically links calls to threads via `CallLog.threadId`

---

## Current Status

### ✅ Implemented (All 4 Phases Complete)

- Extended Thread model with workflow fields
- Message linking (Email, WhatsApp, SMS, Voice)
- Auto-assignment logic
- RBAC integration
- SLA tracking
- Message templates
- Real-time updates (SSE)
- Analytics dashboard
- Unified conversation UI
- Guest context panel
- Bulk actions
- Mobile responsiveness

### 🔄 Recent Improvements

- Analytics UI improvements
- Real-time updates fixes
- Integration status indicators
- Chart visualization improvements
- Date range filtering improvements

---

## Related Documentation

- [Email Integration](../integrations/email-postmark.md) - Postmark email system
- [WhatsApp Integration](../integrations/whatsapp-gupshup.md) - Gupshup WhatsApp/SMS
- [RBAC Architecture](./rbac.md) - Permission system

---

**Code Locations:**
- Backend Routes: `backend/routes/conversations.js`
- Thread Linking: `backend/services/thread-linking.js`
- Frontend Page: `frontend/pages/admin/communication-hub.tsx`
- Database Schema: `backend/prisma/schema.prisma` (Thread, Email, MessageLog, CallLog models)
