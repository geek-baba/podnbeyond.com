# Communication Hub Redesign - Agent Context Document

## Project Overview

**Goal**: Transform the Communication Hub into a mission-critical operations center that handles all guest communications across all properties, with proper tracking, analytics, and workflow management.

**Status**: ✅ **ALL 4 PHASES COMPLETE** - Final polish and bug fixes in progress

**Last Updated**: Based on current codebase analysis and recent commits (Nov 11-12, 2025)

**Recent Work**: Analytics UI improvements, real-time updates fixes, integration status in header, seed data improvements, bug fixes

---

## Architecture & Design Decisions

### Core Strategy: Extend Thread Model (Not Create New Conversation Model)

**Decision**: Instead of creating a new `Conversation` model, we **extended the existing `Thread` model** to become the unified conversation hub.

**Rationale**:
- ✅ Reuses existing data
- ✅ Maintains backward compatibility
- ✅ Less migration complexity
- ✅ Thread already has `bookingId` and `propertyId`

### Database Schema

The `Thread` model has been extended with:

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

// Internal notes (staff-only)
model ConversationNote {
  id          Int
  threadId    Int
  thread      Thread
  authorId    String
  author      User
  content     String
  isInternal  Boolean @default(true)
  createdAt   DateTime
}
```

### Message Linking

- **Email**: Already linked via `Email.threadId`
- **WhatsApp/SMS**: Linked via `MessageLog.threadId`
- **Voice Calls**: Linked via `CallLog.threadId`

**Thread-Linking Service**: `backend/services/thread-linking.js`
- `findOrCreateThread()` - Finds or creates thread by phone/email
- `linkMessageToThread()` - Links WhatsApp/SMS messages
- `linkCallToThread()` - Links voice calls
- `autoAssignToProperty()` - Auto-assigns to property staff (round-robin)

---

## Current Implementation Status

### ✅ Phase 1: Foundation & Unified Conversations (COMPLETE)

#### Database
- ✅ Thread model extended with workflow fields
- ✅ MessageLog and CallLog linked to Thread
- ✅ ConversationNote model created
- ✅ User model extended with assignedThreads relation
- ✅ All necessary indexes added

#### Backend APIs
- ✅ `GET /api/conversations` - List unified conversations (RBAC-filtered)
- ✅ `GET /api/conversations/:id` - Get conversation details
- ✅ `POST /api/conversations/:id/assign` - Assign conversation (MANAGER+)
- ✅ `POST /api/conversations/:id/status` - Update status
- ✅ `POST /api/conversations/:id/notes` - Add internal note
- ✅ `GET /api/conversations/:id/messages` - Get unified messages
- ✅ Webhook handlers updated to link messages/calls to threads
- ✅ Auto-assignment logic implemented

#### Frontend
- ✅ Unified conversation list (combines Email, WhatsApp, Voice)
- ✅ Property filter dropdown (RBAC-based)
- ✅ Status badges and filters
- ✅ Assignment dropdown (MANAGER+ only)
- ✅ Unified message timeline view
- ✅ Channel indicators (Email/WhatsApp/Voice badges)
- ✅ Internal notes section
- ✅ Real-time updates via EventSource
- ✅ Desktop notifications

#### RBAC Integration
- ✅ Property-based filtering
- ✅ Scope-based access control
- ✅ Assignment permissions (MANAGER, ADMIN, SUPERADMIN)
- ✅ Auto-assignment based on property

### ✅ Phase 2: Enhanced UI & Guest Context (COMPLETE)

#### Completed
- ✅ Redesigned layout (sidebar + main view)
- ✅ Guest context panel (full implementation)
- ✅ Search functionality
- ✅ Advanced filters (status, channel, property, assignee)
- ✅ Unread indicators
- ✅ Bulk actions (assign, status, archive)
- ✅ Mobile responsiveness (3-column layout improvements)
- ✅ Integration status in header (Email, WhatsApp, Voice)

### ✅ Phase 3: Workflow & Templates (COMPLETE)

#### Completed
- ✅ Message templates CRUD API (`/api/templates`)
- ✅ Template management page (`/admin/templates`)
- ✅ Template selector in reply box
- ✅ Variable insertion UI
- ✅ Template variable replacement engine
- ✅ Quick reply buttons
- ✅ Bulk actions (assign, status, archive)
- ✅ SLA tracking (firstResponseAt, resolvedAt, slaBreached)
- ✅ Response time tracking
- ✅ Templates integrated into booking confirmation flow

#### Templates System
- ✅ Template CRUD operations
- ✅ Template preview with variable replacement
- ✅ Template variables: {{guestName}}, {{bookingId}}, {{checkIn}}, {{checkOut}}, {{propertyName}}, {{roomType}}
- ✅ Property-specific and global templates
- ✅ Template types: BOOKING_CONFIRMATION, CHECK_IN, CHECK_OUT, CANCELLATION, FAQ, CUSTOM
- ✅ Channel support: EMAIL, WHATSAPP, SMS

### ✅ Phase 4: Analytics & Advanced (COMPLETE)

#### Completed
- ✅ Analytics dashboard (`/admin/analytics`)
- ✅ Real-time updates via Server-Sent Events (SSE)
- ✅ Desktop notifications
- ✅ Performance metrics (response time, resolution time, SLA breach rate)
- ✅ Staff performance metrics (top assignees)
- ✅ Channel performance analytics (Email, WhatsApp, SMS, Voice breakdown)
- ✅ Conversation trends over time (daily/weekly/monthly/yearly)
- ✅ Time period selector (Last 7 Days, Last 30 Days, Last 3 Months, Last Year, Custom)
- ✅ Property filtering in analytics
- ✅ Status and priority breakdowns
- ✅ Integration status indicators in Communication Hub header

#### Analytics Features
- ✅ Overview metrics (total conversations, by status, by priority, channel breakdown)
- ✅ Performance metrics (avg response time, avg resolution time, SLA breach rate)
- ✅ Trends chart (conversations over time with time period grouping)
- ✅ Top assignees list
- ✅ RBAC-based filtering (property-scoped analytics)
- ✅ Date range filtering
- ✅ Empty state handling
- ✅ Chart visualization improvements (bar visibility, date formatting)

#### Real-Time Updates
- ✅ Server-Sent Events (SSE) endpoint (`/api/realtime/events`)
- ✅ Event broadcasting (conversation_updated, new_conversation, unread_count)
- ✅ Auto-reconnect on connection errors
- ✅ Desktop notifications for new messages
- ✅ Unread count updates in real-time
- ✅ Conversation list updates in real-time

### 🔄 Recent Improvements & Bug Fixes (Last 24 Hours)

#### Analytics Improvements
- ✅ Time period selector UI improvements (preset options)
- ✅ Chart bar visibility fixes
- ✅ Date range filtering improvements
- ✅ Empty state handling
- ✅ Fill missing time periods with zeros
- ✅ Seed data improvements for analytics (firstResponseAt, resolvedAt)

#### Real-Time Updates
- ✅ Real-time updates useEffect dependencies fixes
- ✅ Event broadcasting for new conversations
- ✅ Desktop notifications improvements

#### Integration Status
- ✅ Integration status indicators in Communication Hub header
- ✅ Email, WhatsApp, Voice status with green/amber dots
- ✅ Links to integrations page and provider dashboards
- ✅ Integration status fetched from API

#### UI/UX Improvements
- ✅ Communication Hub header navigation (Hub, Templates, Analytics)
- ✅ Mobile responsiveness improvements
- ✅ Error handling improvements
- ✅ Loading state improvements

#### Bug Fixes
- ✅ Analytics API error handling
- ✅ User ID lookup improvements
- ✅ Date filtering fixes
- ✅ Chart rendering fixes
- ✅ Real-time updates cleanup
- ✅ Integration status consistency fixes

---

## Key Files & Components

### Backend

#### Routes
- `backend/routes/conversations.js` - Main conversation API endpoints
  - RBAC filtering
  - Assignment logic
  - SLA calculation
  - Unified message aggregation

#### Services
- `backend/services/thread-linking.js` - Thread linking and auto-assignment
  - `findOrCreateThread()` - Find or create thread by contact
  - `linkMessageToThread()` - Link WhatsApp/SMS to thread
  - `linkCallToThread()` - Link voice calls to thread
  - `autoAssignToProperty()` - Round-robin assignment

#### Webhooks
- `backend/routes/webhooks.js` - Gupshup/Exotel webhooks
- `backend/routes/emailInbound.js` - Postmark email webhooks
- All webhooks now link messages/calls to threads automatically

### Frontend

#### Pages
- `frontend/pages/admin/communication-hub.tsx` - Main Communication Hub page
  - Unified conversation list
  - Conversation detail view
  - Guest context panel
  - Real-time updates
  - Bulk actions
  - Filters and search

#### Components
- Conversation list sidebar
- Conversation thread view
- Guest context panel
- Internal notes section
- Reply form with channel selection

---

## RBAC Integration

### Property-Based Filtering

```typescript
// Get accessible property IDs based on RBAC
async function getAccessiblePropertyIds(userId) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  // Check if user has org-wide access
  const hasOrgAccess = userRoles.some(
    (r) =>
      ['ADMIN', 'SUPERADMIN'].includes(r.roleKey) &&
      r.scopeType === 'ORG'
  );

  if (hasOrgAccess) {
    return null; // null means all properties
  }

  // Get property IDs user has access to
  const propertyIds = userRoles
    .filter((r) => r.scopeType === 'PROPERTY' && r.scopeId)
    .map((r) => r.scopeId);

  return propertyIds.length > 0 ? propertyIds : [];
}
```

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
- **Visual Indicators**: Green/yellow/red (to be implemented in Phase 3)

---

## Thread Linking Logic

### Auto-Linking Strategy

1. **When message/call arrives**:
   - Try to find existing thread by email (if email provided)
   - Try to find existing thread by phone via Contact (if phone provided)
   - If found: Link message/call to thread
   - If not found: Create new thread and link

2. **Booking Auto-Linking**:
   - Link to booking if email/phone matches
   - Link to property if booking exists
   - Update thread's `bookingId` and `propertyId`

3. **Auto-Assignment**:
   - If property is known, auto-assign to property staff
   - Round-robin assignment (least busy)
   - Update thread status to `IN_PROGRESS`

### Thread Creation

```javascript
// When creating new thread
thread = await prisma.thread.create({
  data: {
    subject: subject || `Conversation with ${phone || email || 'Guest'}`,
    participants: email ? [email] : [],
    propertyId: propertyId || null,
    bookingId: bookingId || null,
    status: 'NEW',
    priority: 'NORMAL',
  },
});

// Auto-assign if property is known
if (propertyId) {
  const assignedTo = await autoAssignToProperty(propertyId);
  if (assignedTo) {
    await prisma.thread.update({
      where: { id: thread.id },
      data: {
        assignedTo,
        status: 'IN_PROGRESS',
      },
    });
  }
}
```

---

## Real-Time Updates

### Current Implementation: EventSource (Server-Sent Events)

- **Endpoint**: `/api/realtime/events?userId={userId}`
- **Events**:
  - `conversation_updated` - Conversation updated
  - `new_conversation` - New conversation created
  - `unread_count` - Unread count changed

### Future: WebSocket (Phase 4)

- Upgrade from EventSource to WebSocket for bi-directional communication
- Better performance for high-volume scenarios
- Support for typing indicators, presence, etc.

---

## Frontend State Management

### Key State Variables

```typescript
const [conversations, setConversations] = useState<Conversation[]>([]);
const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
const [guestContext, setGuestContext] = useState<any>(null);
const [filters, setFilters] = useState({
  status: '' as ConversationStatus | '',
  assignedTo: '',
  propertyId: '',
  search: '',
  channel: '' as MessageChannel | '',
});
const [integrations, setIntegrations] = useState<{ 
  postmark?: { enabled: boolean; status?: string };
  gupshup?: { enabled: boolean; status?: string };
  exotel?: { enabled: boolean; status?: string };
}>({});
```

### Filters

- **Status**: NEW, IN_PROGRESS, WAITING_FOR_GUEST, RESOLVED, ARCHIVED
- **Channel**: EMAIL, WHATSAPP, SMS, VOICE
- **Property**: Property filter (RBAC-based)
- **Assignee**: Assigned to user
- **Search**: Guest name, email, phone, booking reference

---

## Next Steps & Priorities

### ✅ All 4 Phases Complete - Final Polish & Enhancements

Since all 4 phases are complete, the focus is now on:

### Potential Enhancements (Optional)

1. **Export Functionality** (Future Enhancement)
   - Export conversations to CSV/PDF
   - Export analytics reports
   - Scheduled reports

2. **Advanced Search** (Future Enhancement)
   - Date range filter in conversation list
   - Booking reference search
   - Saved filters
   - Advanced search operators

3. **Guest Context Enhancements** (Future Enhancement)
   - Guest history view (all past conversations)
   - Booking timeline visualization
   - Guest preferences display
   - Quick actions (send confirmation, modify booking)

4. **SLA Visual Indicators** (Future Enhancement)
   - Color-coded SLA indicators (green/yellow/red)
   - Visual response time display in conversation list
   - SLA breach alerts/notifications

5. **WebSocket Upgrade** (Future Enhancement)
   - Upgrade from Server-Sent Events to WebSocket
   - Bi-directional communication
   - Typing indicators
   - Presence indicators

6. **Mobile App** (Future Enhancement)
   - Native mobile app
   - Push notifications
   - Offline support

### Current Status: Production Ready

The Communication Hub is **production-ready** with all core features implemented:
- ✅ Unified conversations (Email, WhatsApp, SMS, Voice)
- ✅ Workflow management (assignment, status, priority)
- ✅ RBAC integration (property-based filtering)
- ✅ Message templates
- ✅ Analytics dashboard
- ✅ Real-time updates
- ✅ Desktop notifications
- ✅ Guest context panel
- ✅ Bulk actions
- ✅ Search and filters

### Bug Fixes & Polish (Ongoing)

Recent work has focused on:
- Analytics UI improvements
- Real-time updates fixes
- Integration status display
- Seed data improvements
- Error handling improvements
- UI/UX polish

---

## Key Decisions Made

### ✅ Assignment
- **Auto-assignment**: Included in Phase 1
- **Strategy**: Round-robin (least busy)
- **Fallback**: Property manager → Property staff → Unassigned

### ✅ SLA Targets
- **WhatsApp/SMS**: 5 minutes
- **Email**: 30 minutes
- **Voice**: 5 minutes
- **Urgent Priority**: 5 minutes (all channels)

### ✅ Templates Priority
1. Booking confirmation
2. Check-in instructions
3. Cancellation policy
4. FAQ responses

### ✅ Notifications
- **Current**: In-app only (EventSource)
- **Future**: Desktop notifications (browser)
- **Future**: WebSocket for real-time updates (Phase 4)

### ✅ Archive Policy
- **Auto-archive**: After 90 days (resolved conversations)
- **Searchable**: Archived conversations still searchable
- **Status**: ARCHIVED status (not deleted)

---

## Testing & Quality Assurance

### Test Scenarios

1. **Thread Linking**
   - Email creates thread
   - WhatsApp message links to existing thread
   - Voice call links to existing thread
   - New thread created when no match found

2. **Auto-Assignment**
   - Property manager assigned first
   - Round-robin when multiple staff
   - Unassigned when no staff available

3. **RBAC Filtering**
   - Property staff see only their property
   - ADMIN/SUPERADMIN see all properties
   - Assignment permissions enforced

4. **SLA Tracking**
   - SLA breach calculated correctly
   - Urgent priority uses 5-minute target
   - Channel-specific targets applied

5. **Real-Time Updates**
   - New messages appear in real-time
   - Unread count updates
   - Desktop notifications work

---

## Known Issues & Limitations

### Current Limitations (Minor)

1. **EventSource (not WebSocket)**
   - Currently using Server-Sent Events (SSE) for real-time updates
   - One-way communication (server → client)
   - Works well for current use case
   - Can be upgraded to WebSocket in the future for bi-directional communication

2. **Export Functionality**
   - No export to CSV/PDF yet
   - Can be added as future enhancement

3. **Advanced Search**
   - Basic search implemented
   - Date range filter not in conversation list (available in analytics)
   - Saved filters not implemented
   - Can be added as future enhancement

4. **Guest History View**
   - Guest context panel shows active booking
   - Full guest history (all past conversations) not displayed
   - Can be added as future enhancement

5. **SLA Visual Indicators**
   - SLA tracking is functional
   - Visual color-coded indicators (green/yellow/red) not in conversation list
   - Can be added as future enhancement

### Resolved Issues

All major features are implemented and working:
- ✅ Unified conversations
- ✅ Workflow management
- ✅ Message templates
- ✅ Analytics dashboard
- ✅ Real-time updates
- ✅ Guest context panel
- ✅ Mobile responsiveness
- ✅ Integration status display

---

## Integration Points

### Email (Postmark)
- **Inbound**: `/webhooks/postmark/inbound` → Creates/links to thread
- **Outbound**: `/api/email/send` → Links to thread
- **Events**: Email events tracked in `EmailEvent` model

### WhatsApp/SMS (Gupshup)
- **Inbound**: `/webhooks/gupshup` → Creates/links to thread
- **Outbound**: `/api/notify/booking` → Links to thread
- **Status**: Message status tracked in `MessageLog` model

### Voice (Exotel)
- **Inbound**: `/webhooks/exotel` → Creates/links to thread
- **Outbound**: `/api/voice/call-reception` → Links to thread
- **Status**: Call status tracked in `CallLog` model

### Booking System
- **Auto-linking**: Email/phone → Booking → Thread
- **Quick Actions**: Send confirmation, view booking (to be implemented)
- **Context**: Booking details shown in guest context panel

---

## Documentation References

1. **COMMUNICATION_HUB_REDESIGN.md** - Original redesign proposal
2. **COMMUNICATION_HUB_PHASED_PLAN.md** - Initial phased plan
3. **COMMUNICATION_HUB_PHASED_PLAN_V2.md** - Updated plan based on current codebase
4. **SEED_CONVERSATIONS.md** - Seed data for testing

---

## Code Patterns & Conventions

### Backend API Pattern

```javascript
// RBAC filtering
const propertyIds = await getAccessiblePropertyIds(userId);
const where = propertyIds === null 
  ? {} 
  : { propertyId: { in: propertyIds } };

// Get conversations
const conversations = await prisma.thread.findMany({
  where: { ...where, ...filters },
  include: { ... },
  orderBy: { lastMessageAt: 'desc' },
});
```

### Frontend Pattern

```typescript
// Load conversations
const loadConversations = async () => {
  const response = await fetch(`/api/conversations?${queryParams}`);
  const data = await response.json();
  setConversations(data);
};

// Real-time updates
useEffect(() => {
  const es = new EventSource(`/api/realtime/events?userId=${userId}`);
  es.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle update
  };
}, [userId]);
```

---

## Agent Instructions

When working on the Communication Hub:

1. **All 4 phases are complete** - Core features are implemented and production-ready
2. **Focus on polish and enhancements** - Work on bug fixes, UI improvements, and optional enhancements
3. **Maintain RBAC integration** - All features must respect RBAC permissions
4. **Test thread linking** - Ensure messages/calls are properly linked to threads
5. **Maintain real-time updates** - New features should support real-time updates via SSE
6. **Follow existing patterns** - Use existing code patterns and conventions
7. **Update documentation** - Keep this document and related docs up to date

### Current Focus Areas

- **Bug fixes and polish** - Fix any remaining bugs and improve UI/UX
- **Performance optimization** - Optimize queries, reduce API calls, improve loading times
- **Error handling** - Improve error handling and user feedback
- **Testing** - Add tests for critical features
- **Documentation** - Update user documentation and API docs

### Future Enhancements (Optional)

- Export functionality (CSV/PDF)
- Advanced search (date range, saved filters)
- Guest history view
- SLA visual indicators
- WebSocket upgrade
- Mobile app

---

## Quick Reference

### Key Endpoints

#### Conversations
- `GET /api/conversations` - List conversations (RBAC-filtered)
- `GET /api/conversations/:id` - Get conversation details
- `POST /api/conversations/:id/assign` - Assign conversation (MANAGER+)
- `POST /api/conversations/:id/status` - Update status
- `POST /api/conversations/:id/priority` - Update priority
- `POST /api/conversations/:id/notes` - Add internal note
- `GET /api/conversations/:id/messages` - Get unified messages
- `POST /api/conversations/bulk` - Bulk actions (assign, status, archive)

#### Templates
- `GET /api/templates` - List templates
- `GET /api/templates/:id` - Get template
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `GET /api/templates/variables` - Get available variables
- `POST /api/templates/:id/preview` - Preview template

#### Analytics
- `GET /api/analytics/conversations` - Get conversation analytics
- Filters: startDate, endDate, propertyId, timePeriod

#### Real-Time
- `GET /api/realtime/events` - Server-Sent Events endpoint
- `POST /api/realtime/broadcast` - Broadcast event (internal)

### Key Models
- `Thread` - Unified conversation model
- `Email` - Email messages
- `MessageLog` - WhatsApp/SMS messages
- `CallLog` - Voice calls
- `ConversationNote` - Internal notes
- `MessageTemplate` - Message templates
- `Contact` - Unified contact information

### Key Services
- `thread-linking.js` - Thread linking and auto-assignment
- `template-engine.js` - Template rendering and variable replacement
- `gupshup.js` - WhatsApp/SMS integration
- `exotel.js` - Voice integration

### Key Frontend Pages
- `/admin/communication-hub` - Main Communication Hub page
- `/admin/templates` - Template management page
- `/admin/analytics` - Analytics dashboard
- `/admin/integrations` - Integration management

### Key Frontend Components
- `communication-hub.tsx` - Main Communication Hub component
- `templates.tsx` - Template management component
- `analytics.tsx` - Analytics dashboard component
- Conversation list sidebar
- Conversation thread view
- Guest context panel
- Internal notes section
- Reply form with channel selection

---

## Summary

**Status**: ✅ **ALL 4 PHASES COMPLETE** - Production Ready

**Implementation Complete**:
- ✅ Phase 1: Foundation & Unified Conversations
- ✅ Phase 2: Enhanced UI & Guest Context
- ✅ Phase 3: Workflow & Templates
- ✅ Phase 4: Analytics & Advanced

**Recent Work** (Last 24 hours):
- Analytics UI improvements
- Real-time updates fixes
- Integration status in header
- Seed data improvements
- Bug fixes and polish

**Next Steps**:
- Final polish and bug fixes
- Optional enhancements (export, advanced search, guest history)
- Performance optimization
- Testing and documentation

---

**Last Updated**: November 12, 2025
**Maintained By**: Development team
**Version**: 2.0 (All Phases Complete)

