# Booking Architecture

**Last Updated:** 2025-01-21  
**Status:** ✅ **Fully Implemented** (except Create Booking UI)

---

## Overview

The booking system manages the complete lifecycle of reservations from creation to completion, supporting multiple booking sources (direct, OTA, walk-in, phone), state transitions, payment integration, and loyalty program integration.

---

## Booking Lifecycle

### State Definitions

```
HOLD          → Booking created, inventory held temporarily (15 minutes default)
PENDING       → Booking created, awaiting payment/confirmation
CONFIRMED     → Booking confirmed, payment received/authorized
CHECKED_IN    → Guest checked in, room assigned
CHECKED_OUT   → Guest checked out, stay completed
CANCELLED     → Booking cancelled, inventory released
NO_SHOW       → Guest didn't show up, no-show fee charged
REJECTED      → Booking rejected (e.g., OTA overbooking, invalid details)
COMPLETED     → Stay completed, all charges settled
FAILED        → Booking creation/payment failed
```

### State Transition Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      BOOKING LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────┘

                                    ┌─────────┐
                                    │   NEW   │
                                    └────┬────┘
                                         │
                                         │ Create Booking
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                          │
                    ▼                                          ▼
            ┌──────────────┐                          ┌──────────────┐
            │    HOLD      │                          │   PENDING    │
            │ (15 min TTL) │                          │              │
            └──────┬───────┘                          └──────┬───────┘
                   │                                          │
                   │ Payment Success                          │ Payment Success
                   │ Manual Confirm                           │ Manual Confirm
                   │                                          │
                   └──────────────┬───────────────────────────┘
                                  │
                                  ▼
                          ┌──────────────┐
                          │  CONFIRMED   │
                          └──────┬───────┘
                                 │
                                 │ Check-In
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         │
            ┌──────────────┐                 │
            │ CHECKED_IN   │                 │
            └──────┬───────┘                 │
                   │                         │
                   │ Check-Out               │ No-Show
                   │                         │
                   └────────────┬────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │ CHECKED_OUT  │
                        └──────┬───────┘
                               │
                               │ All Charges Settled
                               │
                               ▼
                        ┌──────────────┐
                        │  COMPLETED   │
                        └──────────────┘

         ┌──────────────────────────────────────┐
         │         CANCELLATION PATH            │
         └──────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
    ┌─────────┐          ┌─────────┐          ┌─────────┐
    │ HOLD    │          │ PENDING │          │CONFIRMED│
    └────┬────┘          └────┬────┘          └────┬────┘
         │                    │                    │
         │ Cancel             │ Cancel             │ Cancel
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │  CANCELLED   │
                       └──────────────┘
```

### Valid Transitions

- `HOLD → CONFIRMED, CANCELLED, REJECTED, FAILED`
- `PENDING → CONFIRMED, CANCELLED, REJECTED, FAILED`
- `CONFIRMED → CHECKED_IN, CANCELLED, NO_SHOW, REJECTED`
- `CHECKED_IN → CHECKED_OUT`
- `CHECKED_OUT → COMPLETED`
- Terminal states: `CANCELLED`, `NO_SHOW`, `REJECTED`, `COMPLETED`, `FAILED`

---

## Database Schema

### Core Models

```prisma
model Booking {
  id                   Int           @id @default(autoincrement())
  guestName            String
  email                String
  phone                String?
  checkIn              DateTime
  checkOut             DateTime
  guests               Int           @default(1)
  rooms                Int           @default(1)
  totalPrice           Float
  status               BookingStatus @default(PENDING)
  currency             String?       @default("INR")
  source               BookingSource @default(WEB_DIRECT)
  
  // Relationships
  propertyId           Int
  property             Property      @relation(...)
  roomTypeId           Int
  roomType             RoomType     @relation(...)
  ratePlanId           Int?
  ratePlan             RatePlan?    @relation(...)
  
  // Loyalty
  loyaltyAccountId     Int?
  loyaltyAccount       LoyaltyAccount? @relation(...)
  
  // Payments
  payments             Payment[]
  
  // Stays (multi-room support)
  stays                Stay[]
  bookingGuests        BookingGuest[]
  bookingAuditLogs     BookingAuditLog[]
  roomAssignments      RoomAssignment[]
  
  // Communication
  emailThreads         Thread[]
  
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt
}

model Stay {
  id                Int      @id @default(autoincrement())
  bookingId         Int
  booking           Booking  @relation(...)
  roomTypeId        Int
  checkIn           DateTime
  checkOut          DateTime
  status            StayStatus @default(PENDING)
  roomId            Int?      // Assigned at check-in
  room              Room?     @relation(...)
  nightlyRate       Float
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model Payment {
  id                Int           @id @default(autoincrement())
  bookingId         Int
  booking           Booking       @relation(...)
  amount            Float
  status            PaymentStatus @default(PENDING)
  razorpayOrderId   String?
  razorpayPaymentId String?
  metadata          Json?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}
```

---

## API Endpoints

### Booking Management

**Location:** `backend/routes/booking.js`

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyId": 1,
  "roomTypeId": 1,
  "ratePlanId": 1,
  "checkIn": "2024-12-01",
  "checkOut": "2024-12-03",
  "guests": 2,
  "source": "WALK_IN",
  "guestName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "loyaltyAccountId": 1
}
```

**RBAC:** `bookings:write:scoped`

#### Get Booking
```http
GET /api/bookings/:id
Authorization: Bearer <token>
```

**RBAC:** `bookings:read:scoped`

#### Update Booking
```http
PUT /api/bookings/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "checkIn": "2024-12-02",
  "checkOut": "2024-12-04",
  "guests": 3
}
```

**RBAC:** `bookings:write:scoped`

#### Check-In Booking
```http
POST /api/bookings/:id/check-in
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomAssignments": [
    { "stayId": 1, "roomId": 101 }
  ],
  "notes": "Early check-in approved"
}
```

**RBAC:** `checkin:write:scoped`

#### Check-Out Booking
```http
POST /api/bookings/:id/check-out
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Guest checked out early"
}
```

**RBAC:** `checkout:write:scoped`

#### Cancel Booking
```http
POST /api/bookings/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Guest requested cancellation",
  "cancellationDate": "2024-11-30"
}
```

**RBAC:** `bookings:write:scoped`

**Features:**
- Calculates cancellation fee based on policy
- Reverses loyalty points if booking was confirmed
- Updates stay statuses to CANCELLED
- Creates refund payment record (if applicable)

#### Reject Booking
```http
POST /api/bookings/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Overbooking"
}
```

**RBAC:** `bookings:write:scoped`

#### Mark No-Show
```http
POST /api/bookings/:id/no-show
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Guest did not arrive"
}
```

**RBAC:** `bookings:write:scoped`

#### Get Audit Log
```http
GET /api/bookings/:id/audit-log
Authorization: Bearer <token>
```

**RBAC:** `bookings:read:scoped`

---

## Service Layer

### Booking Service

**Location:** `backend/services/bookingService.js`

**Key Functions:**
- `transitionState(bookingId, newStatus, options)` - Validates and executes state transitions
- `getBookingWithDetails(bookingId)` - Fetches booking with all relations
- `updateNotes(bookingId, notes, options)` - Updates internal/guest notes
- `generateConfirmationNumber()` - Generates unique confirmation number

**State Transition Logic:**
- Validates current state allows transition
- Creates audit log entry
- Updates booking status
- Triggers side effects (loyalty points, inventory release, etc.)

---

## Frontend Components

### Pages

**Booking List:** `frontend/pages/admin/bookings/index.tsx`
- List view with filters (status, source, dates, property)
- Search by name, email, confirmation number
- Pagination
- **⚠️ Missing:** "Create Booking" button/form

**Booking Detail:** `frontend/pages/admin/bookings/[id].tsx`
- Tabs: Summary, Timeline, Payments, Notes, Actions
- Quick action buttons (Modify, Check-in, Check-out, Cancel)
- Full booking information display

### Components

**Location:** `frontend/components/booking/`

- `BookingList.tsx` - List view component
- `BookingFilters.tsx` - Filter component
- `BookingTimeline.tsx` - Audit trail display
- `BookingPayments.tsx` - Payment management
- `BookingNotes.tsx` - Notes management
- `ModifyBookingModal.tsx` - Modify booking modal
- `CheckInModal.tsx` - Check-in modal
- `CheckOutModal.tsx` - Check-out modal
- `CancelBookingModal.tsx` - Cancel booking modal

---

## Booking Sources

Supported sources:
- `WEB_DIRECT` - Direct booking from website
- `OTA_BOOKING_COM` - Booking.com
- `OTA_MMT` - MakeMyTrip
- `OTA_GOIBIBO` - Goibibo
- `OTA_YATRA` - Yatra
- `OTA_AGODA` - Agoda
- `WALK_IN` - Walk-in booking (front desk)
- `PHONE` - Phone booking
- `CORPORATE` - Corporate booking

**Loyalty Points:**
- Direct bookings (`WEB_DIRECT`, `PHONE`, `WALK_IN`, `CORPORATE`) earn points
- OTA bookings do NOT earn points

---

## Loyalty Integration

### Points Awarding

**On Booking Confirmation:**
1. Check if booking has `loyaltyAccountId`
2. Check if booking source is direct (earns points)
3. Calculate points based on booking amount and tier
4. Create `PointsLedger` entry
5. Update loyalty account points balance
6. Recalculate tier if needed

**On Booking Cancellation:**
1. Find points awarded for this booking
2. Reverse points via `loyaltyService.redeemPoints()`
3. Update loyalty account balance
4. Recalculate tier if needed

**Code Location:** `backend/routes/booking.js` (lines 96-109, 1256-1282)

---

## Payment Integration

### Payment Flow

1. Booking created (status: `PENDING`)
2. Payment processed (Razorpay or other)
3. Payment record created via `POST /api/payments`
4. If payment status is `COMPLETED`:
   - Booking automatically transitions to `CONFIRMED`
   - Loyalty points awarded (if direct booking)
   - Confirmation number generated

**Code Location:** `backend/routes/payment.js` (lines 94-109)

---

## RBAC Integration

### Permissions

- `bookings:read:scoped` - View bookings at assigned properties
- `bookings:write:scoped` - Create/modify bookings at assigned properties
- `checkin:write:scoped` - Check guests in
- `checkout:write:scoped` - Check guests out
- `bookings:*` - Full access (ADMIN/SUPERADMIN only)

**Scope:**
- Staff roles (`STAFF_FRONTDESK`, `STAFF_OPS`, `MANAGER`) are property-scoped
- Admin roles (`ADMIN`, `SUPERADMIN`) have full access

---

## Current Status

### ✅ Implemented

- Complete backend API for booking management
- State transition validation
- Audit logging
- Payment integration
- Loyalty points integration
- Cancellation fee calculation
- Multi-room booking support (Stay model)
- Guest management (BookingGuest model)
- Room assignment at check-in
- Booking detail page with tabs
- Action modals (Modify, Check-in, Check-out, Cancel)
- Payment management modals
- RBAC integration

### ❌ Missing

- **"Create Booking" UI for staff** (CRITICAL)
  - Backend API exists (`POST /api/bookings`)
  - Frontend function exists (`createBooking()`)
  - No UI form/page for staff to create bookings
  - Staff currently must use API tools or scripts

### 🎯 Recommended Next Steps

1. **Implement "Create Booking" form/page** (highest priority)
   - Location: `frontend/pages/admin/bookings/new.tsx`
   - Features: Property selector, room type, dates, guest info, source selector
   - Integration: Add "Create Booking" button to booking list page

2. Add availability checking to create booking form
3. Add bulk actions to booking list
4. Add export functionality (CSV, Excel)
5. Add calendar view for bookings

---

## Related Documentation

- [Loyalty Architecture](./loyalty.md) - Points awarding and tier calculation
- [RBAC Architecture](./rbac.md) - Permission system
- [Payment Integration](../integrations/payment-razorpay.md) - Payment flow
- [Deployment Guide](../operations/deployment.md) - Environment setup

---

**Code Locations:**
- Backend Routes: `backend/routes/booking.js`
- Service Layer: `backend/services/bookingService.js`
- Frontend Pages: `frontend/pages/admin/bookings/`
- Frontend Components: `frontend/components/booking/`
- Database Schema: `backend/prisma/schema.prisma` (Booking, Stay, Payment models)

