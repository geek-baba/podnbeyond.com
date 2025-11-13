# Communication Hub - Phased Implementation Plan V2
## Updated Based on Current Codebase

## Current State Analysis

### ✅ Already Implemented

1. **Database Models:**
   - ✅ `Thread` model (email conversations) with `bookingId`, `propertyId` links
   - ✅ `Email` model (individual emails in threads)
   - ✅ `Contact` model (unified contact info)
   - ✅ `MessageLog` model (WhatsApp/SMS via Gupshup)
   - ✅ `CallLog` model (Voice calls via Exotel)
   - ✅ `ThirdPartyIntegration` model (integration configuration)

2. **Backend APIs:**
   - ✅ `/api/email/threads` - List email threads
   - ✅ `/api/email/threads/:id` - Get thread details
   - ✅ `/api/email/send` - Send email
   - ✅ `/api/notify/booking` - Send WhatsApp/SMS
   - ✅ `/api/voice/call-reception` - Initiate calls
   - ✅ `/api/integrations` - Integration status
   - ✅ `/webhooks/gupshup` - Gupshup webhooks
   - ✅ `/webhooks/exotel` - Exotel webhooks

3. **Frontend:**
   - ✅ Communication Hub page (`/admin/communication-hub`)
   - ✅ Email inbox with thread list and reply
   - ✅ Gupshup WhatsApp integration UI
   - ✅ Exotel Voice integration UI
   - ✅ Integration status checking

### ❌ Missing (To Be Built)

1. **Unified Conversations:**
   - Thread model only handles emails
   - No unified view of Email + WhatsApp + Voice
   - MessageLog and CallLog are separate from Thread

2. **Workflow Management:**
   - No assignment to staff
   - No status tracking (NEW, IN_PROGRESS, RESOLVED)
   - No priority levels
   - No internal notes

3. **RBAC Integration:**
   - No property-based filtering
   - No scope-based access control

4. **Guest Context:**
   - No guest context panel
   - No booking quick actions
   - No guest history view

5. **Advanced Features:**
   - No message templates
   - No SLA tracking
   - No analytics
   - No search/filtering

---

## Revised Strategy: Extend Thread → Unified Conversation

Instead of creating a new `Conversation` model, we'll **extend the existing `Thread` model** to become the unified conversation hub. This approach:
- ✅ Reuses existing data
- ✅ Maintains backward compatibility
- ✅ Less migration complexity
- ✅ Thread already has `bookingId` and `propertyId`

---

## Phase 1: Foundation & Unified Conversations (Week 1-2)

### Database Changes

```prisma
// Extend existing Thread model
model Thread {
  // ... existing fields ...
  
  // NEW: Workflow fields
  status          ConversationStatus @default(NEW)
  assignedTo      String?   // User ID
  assignedUser    User?     @relation("AssignedThreads", fields: [assignedTo], references: [id])
  priority        Priority  @default(NORMAL)
  
  // NEW: SLA Tracking
  firstResponseAt DateTime?
  resolvedAt      DateTime?
  slaBreached     Boolean   @default(false)
  
  // NEW: Unified message links
  messageLogs     MessageLog[] // Link WhatsApp/SMS
  callLogs        CallLog[]    // Link voice calls
  
  // NEW: Internal notes
  notes           ConversationNote[]
  
  // NEW: Tags for categorization
  tags            String[]  @default([])
  
  // ... existing relations ...
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

// Link MessageLog to Thread
model MessageLog {
  // ... existing fields ...
  
  // NEW: Link to Thread
  threadId        Int?
  thread          Thread?   @relation(fields: [threadId], references: [id], onDelete: SetNull)
  
  // ... existing fields ...
}

// Link CallLog to Thread
model CallLog {
  // ... existing fields ...
  
  // NEW: Link to Thread
  threadId        Int?
  thread          Thread?   @relation(fields: [threadId], references: [id], onDelete: SetNull)
  
  // ... existing fields ...
}

// Internal notes (staff-only)
model ConversationNote {
  id          Int      @id @default(autoincrement())
  threadId    Int
  thread      Thread   @relation(fields: [threadId], references: [id], onDelete: Cascade)
  
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  
  content     String   @db.Text
  isInternal  Boolean  @default(true) // Not visible to guest
  
  createdAt   DateTime @default(now())
  
  @@index([threadId])
  @@index([authorId])
}

// Extend User model
model User {
  // ... existing fields ...
  
  // NEW: Assigned threads
  assignedThreads Thread[] @relation("AssignedThreads")
  conversationNotes ConversationNote[]
}
```

### Backend API Endpoints

**New Endpoints:**
- `GET /api/conversations` - List unified conversations (RBAC-filtered)
  - Combines Thread, MessageLog, CallLog
  - Filters by property based on RBAC
- `GET /api/conversations/:id` - Get unified conversation
  - Returns emails, WhatsApp messages, SMS, voice calls
- `POST /api/conversations/:id/assign` - Assign to staff (MANAGER+)
- `POST /api/conversations/:id/status` - Update status
- `POST /api/conversations/:id/notes` - Add internal note
- `GET /api/conversations/:id/messages` - Get all messages (unified)

**Update Existing:**
- Update webhook handlers to link MessageLog/CallLog to Thread
- Auto-create Thread when first WhatsApp/Voice message arrives
- Auto-link to booking based on email/phone

### Frontend Features

- [ ] Unified conversation list (combines Email, WhatsApp, Voice)
- [ ] Property filter dropdown (RBAC-based)
- [ ] Status badges and filters
- [ ] Assignment dropdown (MANAGER+ only)
- [ ] Unified message timeline view
- [ ] Channel indicators (Email/WhatsApp/Voice badges)
- [ ] Internal notes section

### RBAC Integration

```typescript
// Filter conversations by user's scope
async function getConversations(userId: string) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  });
  
  // Check org-wide access
  const hasOrgAccess = userRoles.some(r => 
    ['ADMIN', 'SUPERADMIN'].includes(r.roleKey) && 
    r.scopeType === 'ORG'
  );
  
  if (hasOrgAccess) {
    return prisma.thread.findMany({
      include: { emails: true, messageLogs: true, callLogs: true }
    });
  }
  
  // Get accessible property IDs
  const propertyIds = userRoles
    .filter(r => r.scopeType === 'PROPERTY' && r.scopeId)
    .map(r => r.scopeId);
  
  return prisma.thread.findMany({
    where: { propertyId: { in: propertyIds } },
    include: { emails: true, messageLogs: true, callLogs: true }
  });
}
```

---

## Phase 2: Enhanced UI & Guest Context (Week 3-4)

### Database Enhancements
- Add `lastActivityAt` to Thread
- Add `unreadCount` for assigned user

### Backend Features
- Auto-link logic (email/phone → booking)
- Guest history aggregation API
- Booking context API

### Frontend Features
- [ ] Redesigned layout:
  - Left sidebar: Conversation list with filters
  - Center: Unified message thread
  - Right sidebar: Guest context panel
- [ ] Guest context panel:
  - Contact info
  - Active bookings
  - Booking timeline
  - Quick actions (send confirmation, view booking)
- [ ] Search functionality
- [ ] Advanced filters (status, channel, property, assignee, date range)
- [ ] Unread indicators
- [ ] Mobile-responsive layout

### UI Layout
```
┌─────────────────────────────────────────────────────────┐
│ [Property ▼] [Search...] [Filters ▼] [Notifications]   │
├──────────┬──────────────────────────────┬───────────────┤
│          │                              │               │
│ Sidebar  │  Main Conversation View      │ Guest Context│
│          │  ┌──────────────────────────┐│               │
│ Channels │  │ Guest | Booking #1234   ││ Contact Info │
│ Properties│ │ Status: NEW [Assign ▼]  ││ Active Bookings│
│ Status   │  ├──────────────────────────┤│ Quick Actions│
│ Assignees│  │ 📧 Email - 2h ago       ││               │
│          │  │ 💬 WhatsApp - 1h ago    ││               │
│          │  │ 📞 Call - 30m ago       ││               │
│          │  │ 📝 Note (internal)      ││               │
│          │  ├──────────────────────────┤│               │
│          │  │ [Reply Box]             ││               │
│          │  └──────────────────────────┘│               │
└──────────┴──────────────────────────────┴───────────────┘
```

---

## Phase 3: Workflow & Templates (Week 5-6)

### Database Changes
```prisma
model MessageTemplate {
  id          Int       @id @default(autoincrement())
  name        String
  category    String    // booking_confirmation, check_in, cancellation, etc.
  channel     MessageChannel // EMAIL, WHATSAPP, SMS
  subject     String?   // For email
  content     String    @db.Text
  variables   String[]  // {{guestName}}, {{bookingId}}, etc.
  
  // RBAC scope
  propertyId  Int?
  property    Property? @relation(fields: [propertyId], references: [id])
  createdById String
  createdBy   User      @relation(fields: [createdById], references: [id])
  
  isActive    Boolean   @default(true)
  usageCount  Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([propertyId])
  @@index([category])
}
```

### Backend Features
- Template CRUD API (MANAGER+)
- Variable replacement engine
- SLA calculation
- Response time tracking

### Frontend Features
- [ ] Template selector in reply box
- [ ] Template management page
- [ ] Variable insertion UI
- [ ] SLA indicators
- [ ] Quick reply buttons
- [ ] Bulk actions

---

## Phase 4: Analytics & Advanced (Week 7-8)

### Features
- Analytics dashboard
- Real-time updates (WebSocket)
- Export functionality
- Performance metrics
- Desktop notifications

---

## Implementation Priority

### Phase 1 (Critical - Week 1-2)
1. Extend Thread model with workflow fields
2. Link MessageLog and CallLog to Thread
3. Create ConversationNote model
4. Build unified conversations API with RBAC
5. Update webhooks to auto-link messages to threads
6. Update frontend to show unified view

### Phase 2 (Important - Week 3-4)
1. Redesign UI layout
2. Guest context panel
3. Search & filters
4. Mobile responsiveness

### Phase 3 (Enhancement - Week 5-6)
1. Message templates
2. SLA tracking
3. Advanced workflow

### Phase 4 (Future - Week 7-8)
1. Analytics
2. Real-time updates
3. Advanced features

---

## Key Decisions

### 1. Thread vs Conversation Model
**Decision: Extend Thread model**
- Thread already has `bookingId`, `propertyId`
- Less migration work
- Backward compatible
- Can rename later if needed

### 2. Auto-linking Strategy
- When MessageLog/CallLog created → try to find existing Thread by email/phone
- If found → link to Thread
- If not found → create new Thread
- Link to booking if email/phone matches

### 3. RBAC Filtering
- Property-scoped staff: Filter by `propertyId` matching their `scopeId`
- ADMIN/SUPERADMIN: Show all properties
- Assignment: Only MANAGER, ADMIN, SUPERADMIN can assign

---

## Decisions Made ✅

1. **Assignment**: ✅ Include auto-assignment in Phase 1
   - Auto-assign based on property (property manager)
   - Round-robin for unassigned conversations
   - Manual override available (MANAGER+)

2. **SLA Targets**: ✅
   - WhatsApp/SMS: 5 minutes
   - Email: 30 minutes
   - Urgent priority: 5 minutes (all channels)

3. **Templates Priority**: ✅
   1. Booking confirmation
   2. Check-in instructions
   3. Cancellation policy
   4. FAQ responses

4. **Notifications**: ✅ In-app only for now
   - Desktop notifications (browser)
   - Real-time updates via WebSocket (Phase 4)

5. **Archive Policy**: ✅ Auto-archive after 90 days
   - Resolved conversations auto-archived after 90 days
   - Archived conversations still searchable

---

## Next Steps

1. **Review this updated plan** - Does it align with current codebase?
2. **Answer clarification questions**
3. **Start Phase 1** - Extend Thread model and build unified API

Ready to proceed?

