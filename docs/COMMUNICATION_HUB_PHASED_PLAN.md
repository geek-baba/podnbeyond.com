# Communication Hub - Phased Implementation Plan

## Context Understanding

### RBAC Model
- **Scope-based access**: ORG, BRAND, PROPERTY
- **Property-scoped roles**: STAFF_FRONTDESK, STAFF_OPS, MANAGER (see only their property)
- **Org-wide roles**: ADMIN, SUPERADMIN (see all properties)
- **UserRole** links users to roles with `scopeType` and `scopeId`

### Assignment Clarification
**Assignment** = Assigning conversations to specific staff members (like a helpdesk ticket system)
- Example: A guest inquiry comes in → Manager assigns it to "John (Front Desk)" → John sees it in "Assigned to Me"
- **Who can assign**: MANAGER, ADMIN, SUPERADMIN
- **Auto-assignment**: Optional - can assign based on property, workload, or round-robin

---

## Phase 1: Foundation & Unified Conversations (Week 1-2)

### Database Changes
```prisma
// Extend existing models
model Conversation {
  id              Int       @id @default(autoincrement())
  contactId       Int?
  contact         Contact?  @relation(fields: [contactId], references: [id])
  
  // Property & Booking (RBAC integration)
  propertyId      Int?
  property        Property? @relation(fields: [propertyId], references: [id])
  bookingId       Int?
  booking         Booking?  @relation(fields: [bookingId], references: [id])
  
  // Workflow
  status          ConversationStatus @default(NEW)
  assignedTo      String?   // User ID (from UserRole)
  assignedUser    User?     @relation(fields: [assignedTo], references: [id])
  priority        Priority  @default(NORMAL)
  
  // SLA Tracking
  firstResponseAt DateTime?
  resolvedAt      DateTime?
  
  // Relations
  messages        ConversationMessage[] // Unified messages
  notes           ConversationNote[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([propertyId])
  @@index([assignedTo])
  @@index([status])
  @@index([bookingId])
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

// Unified message model (links Email, MessageLog, CallLog)
model ConversationMessage {
  id              Int       @id @default(autoincrement())
  conversationId  Int
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  
  // Link to source
  emailId         Int?
  email           Email?    @relation(fields: [emailId], references: [id])
  messageLogId    Int?
  messageLog      MessageLog? @relation(fields: [messageLogId], references: [id])
  callLogId       Int?
  callLog         CallLog?  @relation(fields: [callLogId], references: [id])
  
  // Unified fields
  channel         String    // EMAIL, WHATSAPP, SMS, VOICE
  direction       String    // INBOUND, OUTBOUND
  content         String?   @db.Text
  timestamp       DateTime  @default(now())
  
  createdAt       DateTime  @default(now())
  
  @@index([conversationId])
  @@index([timestamp])
}

// Internal notes (staff-only)
model ConversationNote {
  id              Int       @id @default(autoincrement())
  conversationId  Int
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  
  authorId        String
  author          User      @relation(fields: [authorId], references: [id])
  
  content         String    @db.Text
  createdAt       DateTime  @default(now())
  
  @@index([conversationId])
}
```

### Backend API Endpoints
- `GET /api/conversations` - List conversations (RBAC-filtered)
- `GET /api/conversations/:id` - Get conversation details
- `POST /api/conversations/:id/assign` - Assign conversation (MANAGER+)
- `POST /api/conversations/:id/status` - Update status
- `POST /api/conversations/:id/notes` - Add internal note
- `GET /api/conversations/:id/messages` - Get unified messages

### Frontend Features
- [ ] Conversation list sidebar (filtered by RBAC scope)
- [ ] Property filter dropdown (shows only accessible properties)
- [ ] Unified conversation thread view
- [ ] Basic assignment dropdown (MANAGER+ only)
- [ ] Status badges (NEW, IN_PROGRESS, RESOLVED)
- [ ] Link conversations to bookings automatically

### RBAC Integration
- Filter conversations by `propertyId` based on user's `scopeId`
- ADMIN/SUPERADMIN see all properties
- Property-scoped staff see only their property
- Assignment permission: Only MANAGER, ADMIN, SUPERADMIN

---

## Phase 2: Enhanced UI & Guest Context (Week 3-4)

### Database Enhancements
- Add `tags` field to Conversation (String[])
- Add `slaBreached` boolean
- Add `lastActivityAt` DateTime

### Backend Features
- Auto-link conversations to bookings (by email/phone)
- Guest history aggregation
- Booking context API

### Frontend Features
- [ ] Redesigned layout (sidebar + main + context panel)
- [ ] Guest context panel (right sidebar):
  - Active bookings
  - Guest history summary
  - Quick actions (send confirmation, view booking)
- [ ] Channel indicators (Email/WhatsApp/Voice badges)
- [ ] Timeline view of all messages
- [ ] Search functionality
- [ ] Filter by status, channel, property, assignee
- [ ] Unread indicators

### UI Layout
```
┌─────────────────────────────────────────────────────────┐
│ [Property Filter ▼] [Search...] [Notifications] [User]│
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │  Main Conversation View                      │
│          │  ┌────────────────────────────────────────┐ │
│ Channels │  │ Guest Name | Booking #1234            │ │
│ Properties│ │ Status: NEW [Assign ▼] [Resolve]      │ │
│ Status   │  ├────────────────────────────────────────┤ │
│ Assignees│  │ 📧 Email - 2h ago                     │ │
│          │  │ 💬 WhatsApp - 1h ago                  │ │
│          │  │ 📞 Call - 30m ago                     │ │
│          │  ├────────────────────────────────────────┤ │
│          │  │ [Reply Box]                           │ │
│          │  └────────────────────────────────────────┘ │
│          │                                              │
│          │  Guest Context Panel                        │
│          │  [Booking Info | History | Actions]         │
└──────────┴──────────────────────────────────────────────┘
```

---

## Phase 3: Workflow & Templates (Week 5-6)

### Database Changes
```prisma
model MessageTemplate {
  id              Int       @id @default(autoincrement())
  name            String
  category        String    // booking_confirmation, check_in, cancellation, etc.
  channel         MessageChannel // EMAIL, WHATSAPP, SMS
  subject         String?   // For email
  content         String    @db.Text
  variables       String[]  // Available template variables: {{guestName}}, {{bookingId}}, etc.
  
  // RBAC scope
  propertyId      Int?
  property        Property? @relation(fields: [propertyId], references: [id])
  createdById     String
  createdBy       User      @relation(fields: [createdById], references: [id])
  
  isActive        Boolean   @default(true)
  usageCount      Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([propertyId])
  @@index([category])
}
```

### Backend Features
- Template CRUD API (MANAGER+ can create/edit)
- Template variable replacement
- SLA calculation and tracking
- Response time metrics

### Frontend Features
- [ ] Template selector in reply box
- [ ] Template management page (MANAGER+)
- [ ] Variable insertion ({{guestName}}, {{bookingId}}, etc.)
- [ ] SLA indicators (green/yellow/red)
- [ ] Response time display
- [ ] Quick reply buttons
- [ ] Bulk actions (mark as read, assign multiple)

---

## Phase 4: Analytics & Advanced Features (Week 7-8)

### Database Changes
- Analytics aggregation tables
- Performance metrics

### Backend Features
- Analytics API endpoints
- Real-time updates (WebSocket)
- Export functionality
- Staff performance metrics

### Frontend Features
- [ ] Analytics dashboard:
  - Response time metrics
  - Channel performance (Email vs WhatsApp vs Voice)
  - Property comparison
  - Staff workload
- [ ] Real-time updates (new messages appear automatically)
- [ ] Desktop notifications
- [ ] Export conversations (CSV/PDF)
- [ ] Advanced search (by date range, guest, booking, etc.)
- [ ] Saved filters

---

## Implementation Details

### RBAC Filtering Logic

```typescript
// Backend: Filter conversations by user's scope
async function getConversations(userId: string) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  });
  
  // Check if user has org-wide access
  const hasOrgAccess = userRoles.some(r => 
    ['ADMIN', 'SUPERADMIN'].includes(r.roleKey) && 
    r.scopeType === 'ORG'
  );
  
  if (hasOrgAccess) {
    // Show all conversations
    return prisma.conversation.findMany({...});
  }
  
  // Get property IDs user has access to
  const propertyIds = userRoles
    .filter(r => r.scopeType === 'PROPERTY' && r.scopeId)
    .map(r => r.scopeId);
  
  // Filter by property
  return prisma.conversation.findMany({
    where: {
      propertyId: { in: propertyIds }
    }
  });
}
```

### Auto-linking Logic

```typescript
// When message comes in, try to link to booking
async function linkToBooking(message: MessageLog | Email) {
  // Try by email
  if (message.fromEmail) {
    const booking = await prisma.booking.findFirst({
      where: { 
        email: message.fromEmail,
        checkIn: { gte: new Date() } // Active booking
      }
    });
    if (booking) return booking;
  }
  
  // Try by phone
  if (message.phone) {
    const booking = await prisma.booking.findFirst({
      where: { 
        phone: message.phone,
        checkIn: { gte: new Date() }
      }
    });
    if (booking) return booking;
  }
  
  return null;
}
```

### Assignment Rules

```typescript
// Who can assign
const canAssign = ['MANAGER', 'ADMIN', 'SUPERADMIN'];

// Auto-assignment (optional future feature)
async function autoAssign(conversation: Conversation) {
  // Option 1: Round-robin
  // Option 2: By workload (least busy)
  // Option 3: By property (property manager)
  // Option 4: By channel (WhatsApp specialist, etc.)
}
```

---

## Mobile Responsiveness

### Phase 1-2: Basic Responsive
- Stack sidebar on mobile
- Collapsible panels
- Touch-friendly buttons
- Mobile-optimized conversation view

### Phase 3-4: Mobile-First Enhancements
- Swipe gestures (mark as read, assign)
- Mobile notifications
- Quick actions on mobile
- Optimized for small screens

---

## Success Metrics

### Phase 1
- ✅ Conversations unified across channels
- ✅ Property filtering works
- ✅ Booking auto-linking works
- ✅ RBAC filtering works

### Phase 2
- ✅ Guest context visible
- ✅ Search works
- ✅ Filters work
- ✅ UI is intuitive

### Phase 3
- ✅ Templates reduce response time
- ✅ SLA tracking accurate
- ✅ Assignment workflow smooth

### Phase 4
- ✅ Analytics provide insights
- ✅ Real-time updates work
- ✅ Staff productivity improved

---

## Questions for Clarification

1. **Assignment**: Should we implement auto-assignment in Phase 1 or manual only?
2. **SLA Targets**: What are the target response times? (e.g., 5 min for urgent, 1 hour for normal)
3. **Templates**: Which templates are most critical? (booking confirmation, check-in, cancellation?)
4. **Notifications**: Email notifications for new conversations, or in-app only?
5. **Archive**: How long to keep resolved conversations? Auto-archive after X days?

---

## Next Steps

1. **Review & Approve**: Confirm this plan matches your vision
2. **Clarify Questions**: Answer the questions above
3. **Start Phase 1**: Begin with database migration and unified conversation model
4. **Iterate**: Get feedback after each phase

Ready to proceed with Phase 1?

