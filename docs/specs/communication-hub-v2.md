# Communication Hub Redesign Proposal
## Centralized Command Center for Hotel Operations

## Vision
Transform the Communication Hub into a mission-critical operations center that handles all guest communications across all properties, with proper tracking, analytics, and workflow management.

---

## Core Requirements

### 1. **Unified Inbox**
- Single view of all communications (Email, WhatsApp, SMS, Voice)
- Property-filtered views
- Priority/urgency indicators
- Unread/assigned/archived states
- Real-time updates

### 2. **Guest Context**
- Link communications to bookings automatically
- Guest history and preferences
- Previous conversation threads
- Booking timeline integration

### 3. **Workflow Management**
- Assignment to staff members
- Status tracking (New → In Progress → Resolved)
- SLA tracking (response time, resolution time)
- Escalation workflows
- Notes and internal comments

### 4. **Analytics & Reporting**
- Response time metrics
- Channel performance (Email vs WhatsApp vs Voice)
- Property-level analytics
- Staff performance metrics
- Guest satisfaction tracking

---

## Proposed UI/UX Redesign

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Property Filter | Search | Notifications | User   │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Sidebar     │  Main Content Area                          │
│  (Filters)   │                                              │
│              │  ┌──────────────────────────────────────┐  │
│  Channels    │  │  Conversation Thread                  │  │
│  - All       │  │  (Email/WhatsApp/Voice)              │  │
│  - Email     │  │                                      │  │
│  - WhatsApp  │  │  [Messages]                          │  │
│  - SMS       │  │                                      │  │
│  - Voice     │  │  [Reply Box]                         │  │
│              │  └──────────────────────────────────────┘  │
│  Properties  │                                              │
│  - All       │  ┌──────────────────────────────────────┐  │
│  - Property1 │  │  Guest Context Panel                 │  │
│  - Property2 │  │  - Booking Info                      │  │
│              │  │  - Guest History                    │  │
│  Status      │  │  - Preferences                      │  │
│  - Unread    │  └──────────────────────────────────────┘  │
│  - Assigned  │                                              │
│  - Resolved  │                                              │
│              │                                              │
│  Assignees   │                                              │
│  - Unassigned│                                              │
│  - Staff 1   │                                              │
│  - Staff 2   │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

---

## Key Features to Add

### 1. **Smart Conversation View**
- **Unified Thread**: Show all communications from a guest in one thread
  - Email replies
  - WhatsApp messages
  - SMS messages
  - Voice call logs
  - Internal notes
- **Timeline View**: Chronological view of all interactions
- **Channel Indicators**: Visual badges showing which channel each message came from

### 2. **Property & Booking Integration**
- **Property Filter**: Quick filter by property
- **Booking Context Panel**: 
  - Show active bookings for the guest
  - Booking details (check-in/out, room type, status)
  - Quick actions (send confirmation, modify booking, etc.)
- **Auto-linking**: Automatically link messages to bookings based on:
  - Email address
  - Phone number
  - Booking reference

### 3. **Assignment & Workflow**
- **Assign to Staff**: Dropdown to assign conversations
- **Status Management**:
  - 🟢 New
  - 🟡 In Progress
  - 🔵 Waiting for Guest
  - ✅ Resolved
  - 🔒 Escalated
- **SLA Tracking**:
  - First response time
  - Resolution time
  - Visual indicators (green/yellow/red)
- **Internal Notes**: Staff-only notes visible to team

### 4. **Quick Actions**
- **Templates**: Pre-written responses for common scenarios
  - Booking confirmation
  - Check-in instructions
  - Cancellation policy
  - FAQ responses
- **Bulk Actions**: 
  - Mark as read/unread
  - Assign multiple
  - Archive
- **Quick Reply**: One-click responses

### 5. **Voice Call Integration** (Exotel)
- **Call Logs Panel**:
  - Inbound/outbound calls
  - Call duration
  - Recording playback
  - Call notes
- **Click-to-Call**: Initiate calls directly from conversation
- **Call History**: Show all calls for a guest
- **Post-Call Actions**:
  - Add notes
  - Create follow-up task
  - Send WhatsApp confirmation

### 6. **Analytics Dashboard**
- **Overview Cards**:
  - Total conversations today
  - Unresolved conversations
  - Average response time
  - Channel distribution
- **Charts**:
  - Conversations by property
  - Channel performance (Email vs WhatsApp vs Voice)
  - Response time trends
  - Staff workload
- **Property Comparison**: Compare performance across properties

### 7. **Search & Filtering**
- **Advanced Search**:
  - By guest name/email/phone
  - By booking reference
  - By property
  - By date range
  - By channel
  - By status
- **Saved Filters**: Save common filter combinations
- **Quick Filters**: Pre-defined filters (Unread, Assigned to Me, Today, etc.)

### 8. **Notifications & Alerts**
- **Real-time Updates**: WebSocket for live updates
- **Desktop Notifications**: For new messages
- **Priority Alerts**: For urgent messages (VIP guests, complaints)
- **Email Digests**: Daily/weekly summaries

---

## Database Enhancements Needed

### New Models/Fields

```prisma
// Conversation Thread (unified)
model Conversation {
  id              Int       @id @default(autoincrement())
  guestId         Int?      // Link to Contact
  contact         Contact?  @relation(fields: [guestId], references: [id])
  
  // Property & Booking
  propertyId      Int?
  property        Property? @relation(fields: [propertyId], references: [id])
  bookingId       Int?
  booking         Booking?  @relation(fields: [bookingId], references: [id])
  
  // Workflow
  status          ConversationStatus @default(NEW)
  assignedTo     String?   // User ID
  assignedUser   User?     @relation(fields: [assignedTo], references: [id])
  priority        Priority  @default(NORMAL)
  
  // SLA Tracking
  firstResponseAt DateTime?
  resolvedAt      DateTime?
  slaBreached     Boolean   @default(false)
  
  // Metadata
  tags            String[]  @default([])
  internalNotes   Note[]
  
  // Relations
  messages        Message[] // Unified messages (Email, WhatsApp, SMS)
  calls           CallLog[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum ConversationStatus {
  NEW
  IN_PROGRESS
  WAITING_FOR_GUEST
  RESOLVED
  ESCALATED
  ARCHIVED
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

// Internal Notes
model Note {
  id              Int       @id @default(autoincrement())
  conversationId  Int
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  
  authorId        String
  author          User      @relation(fields: [authorId], references: [id])
  
  content         String    @db.Text
  isInternal      Boolean   @default(true) // Not visible to guest
  
  createdAt       DateTime  @default(now())
}

// Message Templates
model MessageTemplate {
  id              Int       @id @default(autoincrement())
  name            String
  category        String    // booking_confirmation, check_in, etc.
  channel         MessageChannel
  content         String    @db.Text
  variables       String[]  // Available template variables
  
  propertyId      Int?
  property        Property? @relation(fields: [propertyId], references: [id])
  
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Unified Conversation model
- [ ] Property filtering
- [ ] Basic assignment workflow
- [ ] Status management
- [ ] Link messages to bookings

### Phase 2: Enhanced UI (Week 3-4)
- [ ] Redesigned layout (sidebar + main view)
- [ ] Conversation thread view
- [ ] Guest context panel
- [ ] Quick actions
- [ ] Search & filtering

### Phase 3: Workflow & Analytics (Week 5-6)
- [ ] SLA tracking
- [ ] Internal notes
- [ ] Message templates
- [ ] Analytics dashboard
- [ ] Staff performance metrics

### Phase 4: Advanced Features (Week 7-8)
- [ ] Real-time updates (WebSocket)
- [ ] Desktop notifications
- [ ] Bulk actions
- [ ] Advanced search
- [ ] Export/reporting

---

## UI Component Suggestions

### 1. **Conversation List** (Sidebar)
```
┌─────────────────────────────┐
│ 🔍 Search...                │
├─────────────────────────────┤
│ 📧 Email (5)                │
│ 💬 WhatsApp (12)           │
│ 📞 Voice (3)                │
├─────────────────────────────┤
│ 🏨 Property: All ▼          │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🟢 John Doe            │ │
│ │   Booking #1234        │ │
│ │   📧 2m ago            │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🟡 Jane Smith           │ │
│ │   Check-in inquiry      │ │
│ │   💬 5m ago            │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 2. **Conversation Thread** (Main View)
```
┌─────────────────────────────────────────────┐
│ John Doe | Booking #1234 | Property: Mumbai │
│ ─────────────────────────────────────────── │
│ Status: 🟢 New  Assign: [Staff ▼] [Resolve]│
├─────────────────────────────────────────────┤
│                                             │
│ 📧 Email - 2 hours ago                     │
│ "I need to change my check-in time"        │
│                                             │
│ 💬 WhatsApp - 1 hour ago                   │
│ "Can you confirm?"                         │
│                                             │
│ 📝 Internal Note - 30m ago (You)          │
│ "Called guest, will update booking"        │
│                                             │
├─────────────────────────────────────────────┤
│ [Quick Reply ▼] [Template ▼] [Attach]     │
│ ┌─────────────────────────────────────────┐ │
│ │ Type your reply...                      │ │
│ └─────────────────────────────────────────┘ │
│ [Send Email] [Send WhatsApp] [📞 Call]    │
└─────────────────────────────────────────────┘
```

### 3. **Guest Context Panel** (Right Sidebar)
```
┌─────────────────────────────┐
│ 👤 Guest Information        │
│ ─────────────────────────── │
│ Name: John Doe              │
│ Email: john@example.com     │
│ Phone: +91 98765 43210      │
│                             │
│ 🏨 Active Bookings          │
│ ┌─────────────────────────┐ │
│ │ Booking #1234           │ │
│ │ Check-in: Nov 15        │ │
│ │ Property: Mumbai       │ │
│ │ Status: Confirmed       │ │
│ │ [View Details]          │ │
│ └─────────────────────────┘ │
│                             │
│ 📊 History                  │
│ • 3 previous stays           │
│ • 2 conversations this month│
│ • Avg response: 5 min       │
│                             │
│ ⚙️ Quick Actions            │
│ [Send Confirmation]         │
│ [Modify Booking]            │
│ [Create Task]               │
└─────────────────────────────┘
```

---

## Technical Considerations

### 1. **Real-time Updates**
- Use WebSocket (Socket.io) for live updates
- Push notifications for new messages
- Update conversation list in real-time

### 2. **Performance**
- Pagination for conversation list
- Lazy loading for message history
- Indexed database queries
- Caching for frequently accessed data

### 3. **Scalability**
- Support multiple properties
- Role-based access (property-level permissions)
- Queue system for high-volume messaging

### 4. **Integration Points**
- Booking system (auto-link conversations)
- Payment system (payment confirmations)
- Loyalty system (member communications)
- CRM (guest profiles)

---

## Next Steps

1. **Review & Prioritize**: Which features are most critical?
2. **Design Mockups**: Create detailed UI mockups
3. **Database Migration**: Add new models/tables
4. **API Development**: Build backend endpoints
5. **Frontend Implementation**: Build new UI components
6. **Testing**: Test with real scenarios
7. **Rollout**: Phased deployment

---

## Questions to Consider

1. **Multi-property**: How should staff see conversations across properties?
2. **Permissions**: Who can see/edit/assign conversations?
3. **Escalation**: What triggers escalation? Who gets notified?
4. **Templates**: Who can create/edit templates?
5. **Analytics**: What metrics are most important for operations?
6. **Mobile**: Do we need a mobile app or responsive web is enough?

---

This redesign transforms the Communication Hub from a simple email inbox into a comprehensive operations center that scales with your business needs.

