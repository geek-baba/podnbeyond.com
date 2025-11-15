# Booking Module - Current Implementation Analysis

## Overview
This document provides a comprehensive analysis of the current booking module implementation, including available actions, UI components, and API endpoints.

---

## 🎯 Current Booking Module Status

### ✅ **What's Implemented**

#### **1. Backend API (Complete)**

**Booking Management Routes** (`backend/routes/booking.js`):
- ✅ `POST /api/bookings` - **Create booking** (for walk-in, phone, OTA, etc.)
- ✅ `GET /api/bookings` - List bookings with filters, pagination, search
- ✅ `GET /api/bookings/:id` - Get booking details
- ✅ `PUT /api/bookings/:id` - **Modify booking** (dates, guests, room type, pricing)
- ✅ `POST /api/bookings/:id/check-in` - **Check-in booking** (assign rooms)
- ✅ `POST /api/bookings/:id/check-out` - **Check-out booking** (finalize stay)
- ✅ `POST /api/bookings/:id/cancel` - **Cancel booking** (with cancellation fee calculation)
- ✅ `POST /api/bookings/:id/no-show` - **Mark as no-show** (charge no-show fee)
- ✅ `POST /api/bookings/:id/reject` - **Reject booking** (manual rejection)
- ✅ `GET /api/bookings/:id/audit-log` - Get audit trail
- ✅ `POST /api/bookings/:id/calculate-cancellation-fee` - Calculate cancellation fees

**All routes are:**
- ✅ Protected with `authenticate` middleware
- ✅ Enforced with RBAC permissions (`bookings:read:scoped`, `bookings:write:scoped`, etc.)
- ✅ Transaction-safe (using Prisma transactions)
- ✅ Include audit logging

#### **2. Frontend UI Components (Complete)**

**Pages:**
- ✅ `/admin/bookings` - **Booking List Page** (filters, search, pagination)
- ✅ `/admin/bookings/[id]` - **Booking Detail Page** (tabs: Summary, Timeline, Payments, Notes, Actions)

**Action Modals:**
- ✅ `ModifyBookingModal` - Modify booking details
- ✅ `CheckInModal` - Check-in and assign rooms
- ✅ `CheckOutModal` - Check-out and finalize
- ✅ `CancelBookingModal` - Cancel booking with fee calculation
- ✅ `ChargeCardModal` - Charge card on file
- ✅ `RecordCashModal` - Record cash payment
- ✅ `IssueRefundModal` - Issue refund for payment

**Display Components:**
- ✅ `BookingList` - List view with actions
- ✅ `BookingFilters` - Advanced filtering (status, source, dates, property)
- ✅ `BookingTimeline` - Audit trail display
- ✅ `BookingPayments` - Payment history and management
- ✅ `BookingNotes` - Internal and guest notes

#### **3. Booking Service Layer (Complete)**

**Business Logic** (`backend/services/bookingService.js`):
- ✅ State transition validation (validates lifecycle states)
- ✅ Confirmation number generation
- ✅ Commission calculation (for OTA bookings)
- ✅ Audit log creation
- ✅ Booking details fetching with relations

---

## ❌ **What's MISSING - Critical Gap**

### **🚨 No "Create Booking" UI for Staff**

**The Problem:**
- The backend API supports creating bookings via `POST /api/bookings`
- The frontend has a `createBooking()` function in `frontend/lib/booking.ts`
- **BUT there is NO UI form/page for staff to create bookings**

**Current Workaround:**
- Staff can only create bookings by:
  1. Using API tools (Postman, curl, etc.)
  2. Writing custom scripts
  3. Manually inserting into the database

**What Staff Need:**
A **"Create Booking"** form/page that allows staff to:
1. Select property
2. Select room type
3. Select rate plan
4. Enter check-in/check-out dates
5. Enter guest information (name, email, phone)
6. Add additional guests (optional)
7. Set booking source (WALK_IN, PHONE, OTA, etc.)
8. Set special requests
9. Add internal notes
10. Create the booking with proper validation

---

## 📍 **Where Booking Actions Are Located**

### **1. Booking List Page** (`/admin/bookings`)

**Location:** `frontend/pages/admin/bookings/index.tsx`

**Available Actions:**
- View booking (click to open detail page)
- Filter bookings (status, source, dates, property)
- Search bookings (by name, email, confirmation number)
- Pagination

**Navigation:**
- Header button: "📋 Bookings" (highlights when active)
- Also accessible from admin dashboard

### **2. Booking Detail Page** (`/admin/bookings/[id]`)

**Location:** `frontend/pages/admin/bookings/[id].tsx`

**Available Actions:**
- **Summary Tab:**
  - View all booking details
  - View guest information
  - View stay details
  - View cancellation policy
  - Quick action buttons (Modify, Check-in, Check-out, Cancel)

- **Timeline Tab:**
  - View complete audit trail
  - See who performed which actions
  - View change history

- **Payments Tab:**
  - View all payments
  - Charge card on file
  - Record cash payment
  - Issue refunds
  - View outstanding balance

- **Notes Tab:**
  - Add internal notes (staff only)
  - Add guest-visible notes
  - View note history

- **Actions Tab:**
  - Modify booking
  - Check-in booking
  - Check-out booking
  - Cancel booking
  - Mark as no-show
  - Reject booking

### **3. Booking Action Modals**

**Location:** `frontend/components/booking/`

All modals are triggered from the booking detail page:
- `ModifyBookingModal.tsx` - Modify dates, guests, room type
- `CheckInModal.tsx` - Check-in with room assignment
- `CheckOutModal.tsx` - Check-out with final charges
- `CancelBookingModal.tsx` - Cancel with fee calculation
- `ChargeCardModal.tsx` - Charge card on file
- `RecordCashModal.tsx` - Record cash payment
- `IssueRefundModal.tsx` - Issue refund

---

## 🔄 **Booking Lifecycle States**

**Valid States:**
- `HOLD` - Booking on hold (temporary)
- `PENDING` - Awaiting confirmation/payment
- `CONFIRMED` - Booking confirmed, room committed
- `CHECKED_IN` - Guest checked in
- `CHECKED_OUT` - Guest checked out
- `CANCELLED` - Booking cancelled
- `NO_SHOW` - Guest did not show up
- `REJECTED` - Booking rejected (e.g., overbooking)
- `COMPLETED` - Stay completed
- `FAILED` - Booking failed (e.g., payment failed)

**Valid Transitions:**
```
HOLD → CONFIRMED, CANCELLED, REJECTED, FAILED
PENDING → CONFIRMED, CANCELLED, REJECTED, FAILED
CONFIRMED → CHECKED_IN, CANCELLED, NO_SHOW, REJECTED
CHECKED_IN → CHECKED_OUT
CHECKED_OUT → COMPLETED
(CANCELLED, NO_SHOW, REJECTED, COMPLETED, FAILED are terminal)
```

---

## 📝 **Booking Sources Supported**

- `WEB_DIRECT` - Direct booking from website
- `OTA_BOOKING_COM` - Booking.com
- `OTA_MMT` - MakeMyTrip
- `OTA_GOIBIBO` - Goibibo
- `OTA_YATRA` - Yatra
- `OTA_AGODA` - Agoda
- `WALK_IN` - Walk-in booking (front desk)
- `PHONE` - Phone booking
- `CORPORATE` - Corporate booking

---

## 🎨 **How to Create a Booking (Currently)**

### **Option 1: Using API (Current Method)**

**Using cURL:**
```bash
curl -X POST https://staging.capsulepodhotel.com/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session-token>" \
  -d '{
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
    "specialRequests": "Late check-in requested"
  }'
```

**Using JavaScript:**
```javascript
import { createBooking } from '../lib/booking';

const newBooking = await createBooking({
  propertyId: 1,
  roomTypeId: 1,
  ratePlanId: 1,
  checkIn: '2024-12-01',
  checkOut: '2024-12-03',
  guests: 2,
  source: 'WALK_IN',
  guestName: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  specialRequests: 'Late check-in requested'
});
```

### **Option 2: Using Admin Dashboard (Limited)**

**Current Flow:**
1. Go to `/admin/bookings`
2. **❌ No "Create Booking" button exists**
3. You can only view/manage existing bookings

---

## 🚀 **Recommendations**

### **Priority 1: Add "Create Booking" UI for Staff**

**Create:** `frontend/pages/admin/bookings/new.tsx` or a modal

**Features:**
1. **Form Fields:**
   - Property selector (dropdown)
   - Room type selector (based on property)
   - Rate plan selector (based on room type)
   - Check-in/check-out date picker
   - Number of guests
   - Guest name, email, phone
   - Additional guests (expandable list)
   - Booking source selector (WALK_IN, PHONE, OTA, etc.)
   - Special requests (textarea)
   - Internal notes (textarea)
   - Cancellation policy selector

2. **Validation:**
   - Required fields
   - Date validation (check-out > check-in)
   - Email format validation
   - Phone format validation

3. **Real-time Pricing:**
   - Calculate total price based on:
     - Rate plan
     - Number of nights
     - Number of rooms
   - Display price breakdown

4. **Integration:**
   - Add "Create Booking" button to `/admin/bookings` page header
   - After successful creation, redirect to booking detail page

### **Priority 2: Enhance Booking List Actions**

**Add Quick Actions:**
- Bulk actions (bulk check-in, bulk cancel)
- Export bookings (CSV, Excel)
- Print booking confirmations
- Send confirmation emails

### **Priority 3: Add Booking Calendar View**

**Create:** `frontend/pages/admin/bookings/calendar.tsx`

**Features:**
- Calendar view of bookings
- Drag-and-drop to modify dates
- Visual availability indicators
- Color-coding by status

---

## 📊 **Summary**

### **✅ Implemented:**
- ✅ Complete backend API for booking management
- ✅ Booking list page with filters and search
- ✅ Booking detail page with tabs
- ✅ All action modals (Modify, Check-in, Check-out, Cancel)
- ✅ Payment management modals
- ✅ Timeline/audit trail
- ✅ Notes management
- ✅ RBAC integration
- ✅ State transition validation
- ✅ Audit logging

### **❌ Missing:**
- ❌ **"Create Booking" UI for staff** (CRITICAL)
- ❌ Bulk actions
- ❌ Export functionality
- ❌ Calendar view
- ❌ Availability checking in UI

### **🎯 Next Steps:**
1. **Implement "Create Booking" form/page** (highest priority)
2. Add availability checking to the create booking form
3. Add bulk actions to booking list
4. Add export functionality
5. Add calendar view

---

## 🔗 **Related Files**

**Backend:**
- `backend/routes/booking.js` - Booking API routes
- `backend/services/bookingService.js` - Booking business logic
- `backend/services/guestService.js` - Guest management
- `backend/services/stayService.js` - Stay management
- `backend/services/cancellationPolicyService.js` - Cancellation policy logic

**Frontend:**
- `frontend/pages/admin/bookings/index.tsx` - Booking list page
- `frontend/pages/admin/bookings/[id].tsx` - Booking detail page
- `frontend/components/booking/*` - Booking components
- `frontend/lib/booking.ts` - Booking API client

**Schema:**
- `backend/prisma/schema.prisma` - Database schema (Booking, Stay, BookingGuest, etc.)

---

## 📝 **API Endpoint Reference**

### **Create Booking**
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
  "rooms": 1,
  "source": "WALK_IN",
  "guestName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "additionalGuests": [
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1234567891"
    }
  ],
  "specialRequests": "Late check-in",
  "notesInternal": "VIP guest",
  "notesGuest": "Welcome message",
  "cancellationPolicyId": 1,
  "loyaltyAccountId": 1
}
```

### **Modify Booking**
```http
PUT /api/bookings/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "checkIn": "2024-12-02",
  "checkOut": "2024-12-04",
  "guests": 3,
  "roomTypeId": 2,
  "ratePlanId": 2,
  "notesInternal": "Updated notes"
}
```

### **Check-in Booking**
```http
POST /api/bookings/:id/check-in
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomAssignments": [
    {
      "stayId": 1,
      "roomId": 101
    }
  ],
  "notes": "Early check-in approved"
}
```

### **Check-out Booking**
```http
POST /api/bookings/:id/check-out
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Guest checked out early",
  "finalCharges": {
    "extraNights": 0,
    "additionalServices": 500,
    "tax": 90
  }
}
```

### **Cancel Booking**
```http
POST /api/bookings/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Guest requested cancellation",
  "refundAmount": 0,
  "notes": "No-show fee applied"
}
```

---

**Last Updated:** 2025-01-13
**Version:** 1.0

