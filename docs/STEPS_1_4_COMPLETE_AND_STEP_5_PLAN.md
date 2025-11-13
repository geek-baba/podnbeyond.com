# Steps 1-4 Complete - Step 5 Implementation Plan

## Overview

Steps 1-4 of the booking module implementation have been successfully completed. This document provides a comprehensive summary of what was accomplished and outlines the plan for Step 5 (Phase 3 UI Implementation).

---

## Steps 1-4 Completion Summary

### ✅ Step 1: Wire Up Routes (server.js)

**Status**: Complete  
**Files Created**:
- `backend/server.js` - Main Express server file

**Features Implemented**:
- Express app setup with CORS, JSON parsing, and cookie parser
- Health check endpoint (`/api/health`)
- Route registration for booking, guest, and cancellation policy routes
- Error handling middleware
- 404 handler
- Graceful shutdown handling
- Trust proxy configuration (for production behind Nginx)
- Server only starts when run directly (not when required)

**Configuration**:
- CORS configured to allow credentials
- Supports multiple cookie names for session tokens
- Environment variables: `PORT`, `FRONTEND_URL`, `NODE_ENV`

---

### ✅ Step 2: Implement Authentication Middleware

**Status**: Complete  
**Files Created**:
- `backend/middleware/auth.js` - Authentication middleware

**Features Implemented**:
- Session token verification from cookies or Authorization header
- Supports multiple cookie names:
  - `session-token`
  - `next-auth.session-token`
  - `__Secure-next-auth.session-token`
  - Authorization header (Bearer token)
  - `x-session-token` header
- Session validation against database
- Expiration checking
- User context loading with roles and permissions
- Helper methods on `req.user`:
  - `hasPermission(permission)` - Check if user has permission
  - `hasRole(roleKey, scopeType, scopeId)` - Check if user has role
- Optional authentication middleware for endpoints that work with or without auth

**Error Handling**:
- 401 for missing/invalid/expired sessions
- Clear error messages for debugging
- 500 for database errors

---

### ✅ Step 3: Implement RBAC Middleware

**Status**: Complete  
**Files Created**:
- `backend/lib/rbac.js` - RBAC middleware

**Features Implemented**:
- `requirePermission(permission)` - Require specific permission
- `requireAnyPermission(...permissions)` - Require any of the specified permissions
- `requireAllPermissions(...permissions)` - Require all of the specified permissions
- `requireRole(roleKey, scopeType, scopeId)` - Require specific role
- Permission checking with support for:
  - Exact permission matches
  - Wildcard permissions (e.g., `bookings:*:scoped`)
  - Global permissions (e.g., `bookings:read:global`)
  - Scoped permissions (property, brand, org level)
- Helper functions:
  - `hasPermission(user, permission)` - Check if user has permission
  - `hasRole(user, roleKey, scopeType, scopeId)` - Check if user has role

**Error Handling**:
- 401 for unauthenticated users
- 403 for insufficient permissions
- Detailed error messages with required permissions and user roles

---

### ✅ Step 4: Test and Verify

**Status**: Complete  
**Files Created**:
- `backend/test-server-setup.js` - Test script to verify server setup

**Tests Performed**:
- ✅ Server.js loads successfully
- ✅ Authentication middleware loads successfully
- ✅ RBAC middleware loads successfully
- ✅ Booking routes load successfully
- ✅ Guest routes load successfully
- ✅ Cancellation policy routes load successfully
- ✅ Services load successfully

**Bugs Fixed**:
- Fixed syntax error in `stayService.js` (extra closing brace)
- Modified server.js to only start when run directly (not when required)

---

## Route Updates

### Updated Routes
- `backend/routes/booking.js` - Updated to use real authentication and RBAC middleware
- `backend/routes/cancellationPolicy.js` - Updated to use real authentication and RBAC middleware
- `backend/routes/guest.js` - No changes needed (public endpoints with token-based auth)

### Changes Made
- Removed placeholder authentication middleware
- Removed placeholder RBAC middleware
- Added real authentication middleware (`authenticate`)
- Added real RBAC middleware (`requirePermission`)
- Applied authentication to all booking and cancellation policy routes
- Guest routes remain public (use token-based authentication)

---

## API Endpoints Summary

### Booking Management (Staff) - Requires Authentication
- `GET /api/bookings` - List bookings (requires `bookings:read:scoped`)
- `GET /api/bookings/:id` - Get booking details (requires `bookings:read:scoped`)
- `POST /api/bookings` - Create booking (requires `bookings:write:scoped`)
- `PUT /api/bookings/:id` - Modify booking (requires `bookings:write:scoped`)
- `POST /api/bookings/:id/check-in` - Check-in booking (requires `checkin:write:scoped`)
- `POST /api/bookings/:id/check-out` - Check-out booking (requires `checkout:write:scoped`)
- `POST /api/bookings/:id/no-show` - Mark as no-show (requires `bookings:write:scoped`)
- `POST /api/bookings/:id/reject` - Reject booking (requires `bookings:*:scoped`)
- `POST /api/bookings/:id/cancel` - Cancel booking (requires `bookings:write:scoped`)
- `GET /api/bookings/:id/audit-log` - Get audit log (requires `bookings:read:scoped`)
- `POST /api/bookings/:id/calculate-cancellation-fee` - Calculate cancellation fee (requires `bookings:read:scoped`)

### Guest Self-Service (Public) - No Authentication Required
- `GET /api/guest/bookings` - Get guest's bookings by email/phone
- `GET /api/guest/bookings/:token` - Get booking by token
- `PUT /api/guest/bookings/:token` - Modify booking
- `POST /api/guest/bookings/:token/cancel` - Cancel booking
- `POST /api/guest/bookings/:token/request-modification` - Request modification

### Cancellation Policy (Staff) - Requires Authentication
- `GET /api/cancellation-policies` - List policies (requires `bookings:read:scoped`)
- `GET /api/cancellation-policies/:id` - Get policy (requires `bookings:read:scoped`)
- `POST /api/cancellation-policies` - Create policy (requires `bookings:*:scoped`)
- `PUT /api/cancellation-policies/:id` - Update policy (requires `bookings:*:scoped`)
- `DELETE /api/cancellation-policies/:id` - Delete policy (requires `bookings:*:scoped`)

### Health Check (Public)
- `GET /api/health` - Health check endpoint

---

## Environment Variables

Add to `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Guest Token Secret (for guest self-service)
GUEST_TOKEN_SECRET="your-secret-key-here-change-in-production"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# Server
PORT=4000
NODE_ENV=development
```

---

## Step 5: Phase 3 UI Implementation Plan

### Overview

Step 5 focuses on creating the frontend UI components for the booking module. This includes:
1. Booking list page (staff)
2. Booking detail page (staff)
3. Guest self-service pages
4. Booking action modals
5. Reusable components

### Epic 5.1: Booking List Page

**Goals**: Create advanced booking list with filters and actions

**Tasks**:
1. **Create `frontend/pages/admin/bookings.tsx`**:
   - Booking list table with columns:
     - Confirmation number
     - Guest name
     - Property
     - Room type
     - Check-in/out dates
     - Status badge
     - Source badge
     - Total amount
     - Outstanding balance
     - Actions dropdown
   - Filters:
     - Date range (check-in/check-out)
     - Status
     - Source
     - Property
     - Search (name, email, confirmation number)
   - Pagination
   - Sorting
   - Quick actions:
     - Confirm
     - Check-in
     - Check-out
     - Cancel
     - View details

2. **Create `frontend/components/booking/BookingList.tsx`**:
   - Reusable booking list component
   - Filter component
   - Status badges
   - Action buttons

3. **Create `frontend/components/booking/BookingFilters.tsx`**:
   - Date range picker
   - Status filter
   - Source filter
   - Property filter
   - Search input

**Deliverables**:
- Booking list page
- Reusable components
- Filter functionality
- Responsive design

**Dependencies**: Epic 2.1 (Backend API) ✅

---

### Epic 5.2: Booking Detail View

**Goals**: Create comprehensive booking detail page with tabs

**Tasks**:
1. **Create `frontend/pages/admin/bookings/[id].tsx`**:
   - Booking detail page with tabs:
     - **Summary Tab**:
       - Guest details
       - Stay details
       - Room assignments
       - Pricing breakdown
       - Payment summary
       - Source information
       - Cancellation policy
     - **Timeline Tab**:
       - Audit log timeline
       - Status changes
       - Payment history
       - Communication history
     - **Payments Tab**:
       - Payment list
       - Refund history
       - Outstanding balance
       - Actions: Charge card, Record cash, Issue refund
     - **Notes Tab**:
       - Internal notes
       - Guest notes
       - Add/edit notes
     - **Actions Tab**:
       - Modify booking
       - Check-in
       - Check-out
       - Cancel
       - Mark no-show
       - Reject

2. **Create `frontend/components/booking/BookingDetail.tsx`**:
   - Booking detail component
   - Tab navigation
   - Summary card

3. **Create `frontend/components/booking/BookingTimeline.tsx`**:
   - Timeline component
   - Audit log display
   - Status change indicators

4. **Create `frontend/components/booking/BookingPayments.tsx`**:
   - Payment list
   - Refund history
   - Payment actions

5. **Create `frontend/components/booking/BookingNotes.tsx`**:
   - Notes display
   - Add/edit notes
   - Internal/guest note toggle

**Deliverables**:
- Booking detail page
- Tab components
- Timeline component
- Payment management UI
- Notes management UI

**Dependencies**: Epic 5.1, Epic 2.1 (Backend API) ✅

---

### Epic 5.3: Booking Actions UI

**Goals**: Create UI for booking actions (modify, check-in, check-out, etc.)

**Tasks**:
1. **Create `frontend/components/booking/BookingActions.tsx`**:
   - Action buttons
   - State transition validation
   - Confirmation dialogs

2. **Create `frontend/components/booking/ModifyBookingModal.tsx`**:
   - Modify booking form
   - Date change
   - Guest count change
   - Room type change
   - Price recalculation
   - Policy validation

3. **Create `frontend/components/booking/CheckInModal.tsx`**:
   - Check-in form
   - Room assignment
   - Guest verification
   - Special requests

4. **Create `frontend/components/booking/CheckOutModal.tsx`**:
   - Check-out form
   - Final charges
   - Invoice generation
   - Payment settlement

5. **Create `frontend/components/booking/CancelBookingModal.tsx`**:
   - Cancellation form
   - Fee calculation
   - Refund options
   - Confirmation

**Deliverables**:
- Action modals
- Form validation
- State management
- Error handling

**Dependencies**: Epic 5.2, Epic 2.1 (Backend API) ✅

---

### Epic 5.4: Guest Self-Service UI

**Goals**: Create guest-facing booking management pages

**Tasks**:
1. **Create `frontend/pages/guest/bookings/[token].tsx`**:
   - Guest booking detail page
   - View booking details
   - Modify booking (if allowed)
   - Cancel booking (if allowed)
   - Request modification
   - View cancellation policy

2. **Create `frontend/components/guest/GuestBookingDetail.tsx`**:
   - Guest booking detail component
   - Read-only fields
   - Action buttons
   - Cancellation policy display

3. **Create `frontend/components/guest/ModifyBookingForm.tsx`**:
   - Modify booking form (guest)
   - Date change
   - Guest count change
   - Policy validation
   - Request modification

4. **Create `frontend/components/guest/CancelBookingForm.tsx`**:
   - Cancellation form (guest)
   - Fee calculation
   - Refund options
   - Confirmation

**Deliverables**:
- Guest booking detail page
- Guest booking management UI
- Cancellation UI
- Responsive design

**Dependencies**: Epic 5.3, Epic 2.1 (Backend API) ✅

---

## Implementation Order

### Phase 1: Core Components (Week 1)
1. Create booking list page
2. Create booking detail page (summary tab)
3. Create basic action modals
4. Implement API integration

### Phase 2: Advanced Features (Week 2)
1. Add timeline tab
2. Add payments tab
3. Add notes tab
4. Add actions tab
5. Implement advanced filters

### Phase 3: Guest Self-Service (Week 3)
1. Create guest booking detail page
2. Create guest modification form
3. Create guest cancellation form
4. Implement token-based authentication

### Phase 4: Polish & Testing (Week 4)
1. Add error handling
2. Add loading states
3. Add responsive design
4. Add accessibility features
5. Test all workflows

---

## Technical Requirements

### Frontend Stack
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks (useState, useEffect, useQuery)
- **API Integration**: Fetch API or Axios
- **Form Handling**: React Hook Form
- **Date Handling**: date-fns or Day.js
- **UI Components**: Custom components or shadcn/ui

### API Integration
- Use existing API endpoints from Step 1-4
- Handle authentication via session cookies
- Handle RBAC permissions on frontend
- Implement error handling
- Implement loading states
- Implement optimistic updates

### Component Structure
```
frontend/
├── pages/
│   ├── admin/
│   │   └── bookings/
│   │       ├── index.tsx (list page)
│   │       └── [id].tsx (detail page)
│   └── guest/
│       └── bookings/
│           └── [token].tsx (guest detail page)
├── components/
│   └── booking/
│       ├── BookingList.tsx
│       ├── BookingFilters.tsx
│       ├── BookingDetail.tsx
│       ├── BookingTimeline.tsx
│       ├── BookingPayments.tsx
│       ├── BookingNotes.tsx
│       ├── BookingActions.tsx
│       ├── ModifyBookingModal.tsx
│       ├── CheckInModal.tsx
│       ├── CheckOutModal.tsx
│       └── CancelBookingModal.tsx
└── lib/
    ├── api.ts (API client)
    └── booking.ts (booking utilities)
```

---

## Testing Checklist

### Functional Testing
- [ ] Booking list loads correctly
- [ ] Filters work correctly
- [ ] Pagination works correctly
- [ ] Sorting works correctly
- [ ] Booking detail page loads correctly
- [ ] All tabs work correctly
- [ ] Action modals work correctly
- [ ] Guest self-service works correctly
- [ ] API integration works correctly
- [ ] Error handling works correctly

### UI/UX Testing
- [ ] Responsive design works on mobile
- [ ] Responsive design works on tablet
- [ ] Responsive design works on desktop
- [ ] Loading states are displayed
- [ ] Error messages are clear
- [ ] Success messages are displayed
- [ ] Forms validate correctly
- [ ] Accessibility features work

### Security Testing
- [ ] Authentication is enforced
- [ ] RBAC permissions are checked
- [ ] Guest tokens are validated
- [ ] CSRF protection is in place
- [ ] XSS protection is in place

---

## Next Steps

1. **Create frontend directory structure**
2. **Create booking list page**
3. **Create booking detail page**
4. **Create reusable components**
5. **Implement API integration**
6. **Add error handling**
7. **Add loading states**
8. **Add responsive design**
9. **Test all workflows**
10. **Deploy to staging**

---

## Files Changed Summary

### Created (Steps 1-4)
- `backend/server.js`
- `backend/middleware/auth.js`
- `backend/lib/rbac.js`
- `backend/test-server-setup.js`
- `docs/STEPS_1_3_COMPLETION.md`
- `docs/STEPS_1_4_COMPLETION.md`
- `docs/STEPS_1_4_COMPLETE_AND_STEP_5_PLAN.md`

### Updated (Steps 1-4)
- `backend/routes/booking.js`
- `backend/routes/cancellationPolicy.js`
- `backend/services/stayService.js` (fixed syntax error)

### To Be Created (Step 5)
- `frontend/pages/admin/bookings.tsx`
- `frontend/pages/admin/bookings/[id].tsx`
- `frontend/pages/guest/bookings/[token].tsx`
- `frontend/components/booking/*.tsx`
- `frontend/components/guest/*.tsx`
- `frontend/lib/booking.ts`

---

## Conclusion

Steps 1-4 are complete and verified. The backend is ready for UI development. Step 5 (Phase 3 UI Implementation) can now begin.

The next step is to create the frontend directory structure and start implementing the booking list page and components.

