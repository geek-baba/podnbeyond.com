# Razorpay Payment Integration Setup

## Overview
This guide explains how to set up Razorpay payment integration for the Pod & Beyond Hotel booking system.

## Prerequisites
1. Razorpay account (sign up at https://razorpay.com)
2. Node.js and npm installed
3. PostgreSQL database running

## Setup Steps

### 1. Get Razorpay API Keys

1. **Sign up/Login** to Razorpay Dashboard
2. **Go to Settings** → **API Keys**
3. **Generate API Key** (if not already generated)
4. **Copy Key ID and Key Secret**

### 2. Environment Configuration

Add your Razorpay credentials to `backend/.env`:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/podnbeyond"

# Server Configuration
PORT=4000
NODE_ENV=development

# Razorpay Configuration
RAZORPAY_KEY_ID="rzp_test_your_actual_key_id"
RAZORPAY_KEY_SECRET="your_actual_key_secret"
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

## API Endpoints

### 1. Create Payment Order
**POST** `/api/payment/create-order`

**Request Body:**
```json
{
  "amount": 360,
  "guestName": "John Doe",
  "bookingId": 1,
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_ABC123",
  "amount": 36000,
  "currency": "INR",
  "receipt": "booking_1",
  "notes": {
    "guestName": "John Doe",
    "bookingId": "1",
    "hotel": "Pod & Beyond Hotel"
  }
}
```

### 2. Verify Payment
**POST** `/api/payment/verify-payment`

**Request Body:**
```json
{
  "razorpay_order_id": "order_ABC123",
  "razorpay_payment_id": "pay_XYZ789",
  "razorpay_signature": "generated_signature"
}
```

### 3. Get Order Details
**GET** `/api/payment/order/:orderId`

### 4. Get Booking Payments
**GET** `/api/payment/payments/:bookingId`

## Database Models

### Payment Model
```prisma
model Payment {
  id              Int      @id @default(autoincrement())
  bookingId       Int
  booking         Booking  @relation(fields: [bookingId], references: [id])
  razorpayOrderId String   @unique
  razorpayPaymentId String?
  amount          Float
  currency        String   @default("INR")
  status          PaymentStatus @default(PENDING)
  paymentMethod   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}
```

## Frontend Integration

### 1. Install Razorpay Checkout
Add to your HTML:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 2. Create Payment Flow
```javascript
// 1. Create order on your backend
const orderResponse = await fetch('/api/payment/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: totalPrice,
    guestName: guestName,
    bookingId: bookingId
  })
});

const orderData = await orderResponse.json();

// 2. Initialize Razorpay checkout
const options = {
  key: 'rzp_test_your_key_id', // Your Razorpay Key ID
  amount: orderData.amount,
  currency: orderData.currency,
  name: 'Pod & Beyond Hotel',
  description: 'Hotel Booking Payment',
  order_id: orderData.orderId,
  handler: function (response) {
    // Handle successful payment
    verifyPayment(response);
  },
  prefill: {
    name: guestName,
    email: guestEmail
  },
  theme: {
    color: '#3B82F6'
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

### 3. Verify Payment
```javascript
async function verifyPayment(response) {
  try {
    const verifyResponse = await fetch('/api/payment/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      })
    });

    const result = await verifyResponse.json();
    
    if (result.success) {
      // Payment successful - update UI
      showSuccessMessage('Payment completed successfully!');
    } else {
      // Payment failed
      showErrorMessage('Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    showErrorMessage('Payment verification failed');
  }
}
```

## Testing

### Test Mode
- Use test API keys for development
- Test cards available in Razorpay dashboard
- No real money is charged in test mode

### Test Cards
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## Production Deployment

### 1. Switch to Live Keys
- Replace test keys with live keys
- Update environment variables
- Test thoroughly before going live

### 2. Security Considerations
- Never expose key_secret in frontend code
- Always verify payment signatures
- Use HTTPS in production
- Implement proper error handling

### 3. Monitoring
- Set up webhook notifications
- Monitor payment success/failure rates
- Log all payment activities

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check API keys are correct
   - Ensure keys are from same environment (test/live)

2. **Payment Verification Failed**
   - Verify signature generation logic
   - Check webhook configuration

3. **Database Errors**
   - Run migrations: `npx prisma migrate dev`
   - Check database connection

### Support
- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Support: support@razorpay.com 