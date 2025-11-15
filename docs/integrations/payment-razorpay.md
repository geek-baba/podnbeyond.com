# Razorpay Payment Integration

**Last Updated:** 2025-01-21  
**Status:** ⚠️ **Partial Implementation - Client-Side Only**

---

## Overview

The platform integrates with Razorpay for payment processing. **Current implementation is client-side only** - Razorpay order creation and payment handling happen entirely in the frontend. The backend receives payment confirmation and creates payment records.

**⚠️ Important:** This integration does NOT include:
- Backend Razorpay order creation
- Payment signature verification
- Razorpay webhook handling
- Razorpay refund API integration

---

## Architecture

### Payment Flow (Current Implementation)

```
1. Frontend creates booking (PENDING status)
   ↓ POST /api/bookings
   
2. Frontend creates Razorpay order (client-side)
   ↓ Razorpay SDK (client-side only)
   
3. User completes payment in Razorpay window
   ↓ Razorpay processes payment
   
4. Frontend receives payment success callback
   ↓ Razorpay SDK callback
   
5. Frontend calls backend to record payment
   ↓ POST /api/payments (with razorpayPaymentId)
   
6. Backend creates payment record
   ↓ Payment status: COMPLETED
   
7. Backend auto-confirms booking
   ↓ bookingService.transitionState(bookingId, 'CONFIRMED')
   
8. Loyalty points awarded (if direct booking)
   ↓ Automatic on confirmation
```

---

## Configuration

### Environment Variables

**Backend (.env):**
```env
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"  # Used for integration testing only
RAZORPAY_KEY_SECRET="your_key_secret"     # Used for integration testing only
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"  # Used for Razorpay SDK
```

**Note:** Backend Razorpay keys are currently only used for testing the connection in the integrations page. Actual payment processing uses frontend keys only.

### Razorpay Dashboard Setup

1. **Sign up**: https://razorpay.com/
2. **Get API Keys**:
   - Go to Dashboard → Settings → API Keys
   - Generate test keys (for development)
   - Generate live keys (for production)
3. **Webhook Configuration** (⚠️ NOT IMPLEMENTED):
   - Currently no webhook endpoint exists
   - Webhook handling is planned for future implementation

---

## API Endpoints

### Create Payment Record

**Endpoint:** `POST /api/payments`

**Purpose:** Record a payment after Razorpay payment is completed (called by frontend).

**Request:**
```json
{
  "bookingId": 123,
  "amount": 5000,
  "method": "RAZORPAY",
  "currency": "INR",
  "externalTxnId": "pay_xxxxxxxxxxxx",  // Razorpay payment ID
  "notes": "Payment completed via Razorpay"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "payment": {
      "id": 1,
      "bookingId": 123,
      "amount": 5000,
      "status": "COMPLETED",
      "razorpayPaymentId": "pay_xxxxxxxxxxxx",
      "razorpayOrderId": null,
      "metadata": {
        "method": "RAZORPAY",
        "currency": "INR",
        "createdBy": "user123",
        "notes": "Payment completed via Razorpay",
        "createdAt": "2024-01-21T10:00:00Z"
      },
      "createdAt": "2024-01-21T10:00:00Z",
      "updatedAt": "2024-01-21T10:00:00Z"
    },
    "booking": {
      "id": 123,
      "status": "CONFIRMED",
      "confirmationNumber": "CPH-2024-001234",
      // ... full booking details
    }
  }
}
```

**Payment Status Logic:**
- If `method === 'RAZORPAY'` and `externalTxnId` provided → Status: `COMPLETED`
- If `method === 'RAZORPAY'` and no `externalTxnId` → Status: `PENDING`
- If `method === 'CASH'` or `'CARD_ON_FILE'` → Status: `COMPLETED` (immediately)

**Auto-Confirmation:**
- If payment status is `COMPLETED` and booking is not `CONFIRMED`
- Backend automatically calls `bookingService.transitionState(bookingId, 'CONFIRMED')`
- This triggers loyalty points awarding (if direct booking)

---

### Process Refund

**Endpoint:** `POST /api/payments/:id/refund`

**Purpose:** Process refund for a completed payment.

**Request:**
```json
{
  "amount": 2500,  // Optional, defaults to full payment amount
  "reason": "Guest requested cancellation",
  "processRefund": true  // Optional, default: true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "refund": {
      "id": 2,
      "bookingId": 123,
      "amount": -2500,  // Negative amount for refund
      "status": "REFUNDED",
      "razorpayPaymentId": "REFUND-pay_xxxxxxxxxxxx",
      "metadata": {
        "method": "RAZORPAY",
        "currency": "INR",
        "originalPaymentId": 1,
        "refundedBy": "user123",
        "refundReason": "Guest requested cancellation",
        "refundedAt": "2024-01-21T11:00:00Z",
        "processRefund": true
      }
    },
    "booking": {
      // Updated booking details
    }
  }
}
```

**⚠️ Current Limitation:**
- Razorpay refund API call is **NOT IMPLEMENTED** (TODO in code)
- Refund record is created in database
- Actual Razorpay refund must be processed manually or via future implementation

---

### Charge Card on File

**Endpoint:** `POST /api/bookings/:id/payments/charge-card`

**Purpose:** Charge a card that's on file for a booking.

**Request:**
```json
{
  "amount": 3000,  // Optional, defaults to outstanding balance
  "cardId": "card_xxxxxxxxxxxx",  // Optional
  "notes": "Charging card on file"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Card charged successfully",
  "data": {
    "payment": {
      "id": 3,
      "bookingId": 123,
      "amount": 3000,
      "status": "COMPLETED",
      "razorpayPaymentId": "CARD-card_xxxxxxxxxxxx",
      "metadata": {
        "method": "CARD_ON_FILE",
        "currency": "INR",
        "createdBy": "user123",
        "cardId": "card_xxxxxxxxxxxx",
        "notes": "Charging card on file",
        "chargedAt": "2024-01-21T12:00:00Z"
      }
    },
    "booking": {
      // Updated booking details
    }
  }
}
```

**⚠️ Current Limitation:**
- Razorpay card charging API call is **NOT IMPLEMENTED** (TODO in code)
- Payment record is created as COMPLETED
- Actual card charging must be done manually or via future implementation

---

## Frontend Integration

### Razorpay Script

**Location:** `frontend/pages/_document.tsx`

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Payment Flow Implementation

**Current Implementation (from `index-old-backup.tsx`):**

```typescript
// Step 1: Create booking
const bookingResponse = await axios.post('/api/booking/book', bookingData);
const bookingId = bookingResponse.data.booking.id;
const bookingTotalPrice = bookingResponse.data.booking.totalPrice;

// Step 2: Create Razorpay order (client-side only)
// Note: This happens entirely in frontend - no backend endpoint
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: bookingTotalPrice * 100, // Convert to paise
  currency: 'INR',
  name: 'Pod & Beyond',
  description: `Booking for ${roomType}`,
  handler: async (response) => {
    // Step 3: Record payment in backend
    await handlePaymentSuccess(response, bookingId);
  },
  prefill: {
    name: formData.guestName,
    email: formData.email,
    contact: formData.phone
  },
  theme: {
    color: '#000000'
  }
};

const rzp = new Razorpay(options);
rzp.open();

// Step 4: Handle payment success
const handlePaymentSuccess = async (response, bookingId) => {
  // Record payment in backend
  await axios.post('/api/payments', {
    bookingId: bookingId,
    amount: bookingTotalPrice,
    method: 'RAZORPAY',
    currency: 'INR',
    externalTxnId: response.razorpay_payment_id,  // Razorpay payment ID
    notes: 'Payment completed via Razorpay'
  });
  
  // Backend automatically confirms booking and awards points
};
```

**⚠️ Important Notes:**
- Razorpay order creation happens **entirely client-side**
- No backend endpoint for order creation
- No signature verification (backend trusts frontend payment ID)
- Payment ID is sent directly to backend via `externalTxnId`

---

## Database Schema

### Payment Model

```prisma
model Payment {
  id                Int           @id @default(autoincrement())
  bookingId         Int
  booking           Booking       @relation(fields: [bookingId], references: [id])
  
  // Razorpay fields
  razorpayOrderId   String?       // Currently not used (nullable)
  razorpayPaymentId String?       // Stores Razorpay payment ID from frontend
  
  // Payment details
  amount            Float
  status            PaymentStatus @default(PENDING)
  metadata          Json?         // Stores method, currency, createdBy, notes, etc.
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
}
```

**Field Usage:**
- `razorpayOrderId`: Currently nullable and not used (Razorpay orders created client-side)
- `razorpayPaymentId`: Stores `razorpay_payment_id` from Razorpay SDK response
- `metadata.method`: Stores payment method ('RAZORPAY', 'CASH', 'CARD_ON_FILE', etc.)
- `metadata.currency`: Stores currency (default: 'INR')
- `metadata.createdBy`: User ID who created the payment
- `metadata.notes`: Optional payment notes

---

## Booking Integration

### Payment Completion → Booking Confirmation

**Flow:**
1. Payment created with status `COMPLETED`
2. Backend checks: `if (paymentStatus === 'COMPLETED' && booking.status !== 'CONFIRMED')`
3. Backend calls `bookingService.transitionState(bookingId, 'CONFIRMED')`
4. Booking confirmation triggers:
   - Confirmation number generated
   - Loyalty points awarded (if direct booking)
   - Audit log created
   - Email confirmation sent (if configured)

**Code Location:** `backend/routes/payment.js` (lines 94-109)

---

## Current Limitations & Gaps

### ⚠️ **Not Implemented:**

1. **Razorpay Order Creation (Backend)**
   - Currently handled entirely client-side
   - No backend endpoint for order creation
   - Frontend creates orders directly via Razorpay SDK

2. **Payment Signature Verification**
   - Backend does NOT verify Razorpay payment signatures
   - Frontend sends payment ID directly, backend trusts it
   - **Security Risk:** Payment could be faked if frontend is compromised

3. **Razorpay Webhook Handler**
   - No webhook endpoint exists (`/api/payment/webhook`)
   - Payment status updates must come from frontend
   - No server-side payment status verification

4. **Razorpay Refund API**
   - Refund records created in database
   - Actual Razorpay refund API call **NOT IMPLEMENTED** (TODO)
   - Refunds must be processed manually in Razorpay dashboard

5. **Card Charging API**
   - Card charging records created in database
   - Actual Razorpay card charging **NOT IMPLEMENTED** (TODO)
   - Card charges must be done manually

### 🔧 **TODOs in Code:**

**backend/routes/payment.js:219-235**
```javascript
// TODO: Process refund via Razorpay if processRefund is true
if (processRefund && payment.metadata?.method === 'RAZORPAY' && payment.razorpayPaymentId) {
  // TODO: Implement Razorpay refund API call
  // const razorpayRefund = await razorpayClient.payments.refund(payment.razorpayPaymentId, {
  //   amount: refundAmount * 100 // Convert to paise
  // });
}
```

**backend/routes/payment.js:326-331**
```javascript
// TODO: Charge card via Razorpay or payment gateway
// For now, create payment record as CAPTURED
// In production, this would:
// 1. Charge the card via payment gateway
// 2. Create payment record with CAPTURED status
// 3. Handle authorization failures
```

---

## Security Considerations

### ⚠️ **Current Security Gaps:**

1. **No Signature Verification**
   - Backend doesn't verify Razorpay payment signatures
   - Frontend could potentially send fake payment IDs
   - **Recommendation:** Implement signature verification endpoint

2. **No Webhook Verification**
   - No webhook endpoint exists
   - Payment status relies on frontend callback
   - **Recommendation:** Implement webhook handler with signature verification

3. **Client-Side Order Creation**
   - Razorpay orders created entirely in frontend
   - Order amounts could be manipulated
   - **Recommendation:** Move order creation to backend

### ✅ **Implemented Security:**

- ✅ Payment records require authentication (`authenticate` middleware)
- ✅ Payment creation requires RBAC permission (`bookings:write:scoped`)
- ✅ Payment amounts validated (must be > 0)
- ✅ Payment linked to booking (prevents orphaned payments)

---

## Testing

### Test Cards (Razorpay Test Mode)

**Success:**
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**Failure:**
- Card: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

### Test Scenarios

1. **Successful Payment**
   - Complete booking and payment
   - Verify payment record created (status: COMPLETED)
   - Verify booking status → CONFIRMED
   - Verify loyalty points awarded (if direct booking)

2. **Payment Failure**
   - Use failure test card
   - Verify payment window shows error
   - Verify no payment record created
   - Verify booking remains PENDING

3. **Payment Cancellation**
   - Close payment window
   - Verify no payment record created
   - Verify booking remains PENDING

---

## Production Deployment

### Checklist

- [ ] Replace test keys with live keys
- [ ] Update `RAZORPAY_KEY_ID` in backend `.env` (for testing only)
- [ ] Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` in frontend `.env.local` (for SDK)
- [ ] Update `RAZORPAY_KEY_SECRET` in backend `.env` (for testing only)
- [ ] ⚠️ **CRITICAL:** Implement payment signature verification
- [ ] ⚠️ **CRITICAL:** Implement Razorpay webhook handler
- [ ] ⚠️ **RECOMMENDED:** Move order creation to backend
- [ ] Test payment flow end-to-end
- [ ] Configure payment failure handling
- [ ] Add payment success confirmation emails

### Security Recommendations

**Before Production:**
1. ⚠️ **Implement signature verification endpoint**
   - Create `POST /api/payment/verify` endpoint
   - Verify Razorpay signature before creating payment record
   - Reject payments with invalid signatures

2. ⚠️ **Implement webhook handler**
   - Create `POST /api/payment/webhook` endpoint
   - Verify webhook signature
   - Update payment status from webhook events
   - Handle payment failures automatically

3. ⚠️ **Move order creation to backend**
   - Create `POST /api/payment/create-order` endpoint
   - Generate Razorpay orders server-side
   - Prevent amount manipulation
   - Return order ID to frontend

---

## Future Enhancements

### Planned Features

1. **Backend Order Creation**
   - Endpoint: `POST /api/payment/create-order`
   - Generate Razorpay orders server-side
   - Return order ID to frontend
   - Prevent amount manipulation

2. **Payment Signature Verification**
   - Endpoint: `POST /api/payment/verify`
   - Verify Razorpay payment signatures
   - Reject invalid payments
   - Improve security

3. **Razorpay Webhook Handler**
   - Endpoint: `POST /api/payment/webhook`
   - Handle payment status updates
   - Auto-update payment records
   - Handle payment failures

4. **Razorpay Refund API**
   - Implement actual Razorpay refund API calls
   - Process refunds automatically
   - Update refund records with Razorpay refund IDs

5. **Card Charging API**
   - Implement Razorpay card charging
   - Charge cards on file automatically
   - Handle authorization failures

---

## Related Documentation

- [Booking Architecture](../architecture/booking.md) - Booking confirmation flow
- [Loyalty Architecture](../architecture/loyalty.md) - Points awarding on payment
- [Deployment Guide](../operations/deployment.md) - Environment setup

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-21  
**Status:** ⚠️ **Partial Implementation - Client-Side Only**

