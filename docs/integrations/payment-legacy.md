# Frontend Payment Integration Guide

## Overview
This guide explains how the Razorpay payment integration works in the frontend booking form.

## Features Implemented

### 1. Payment Flow
1. **User fills booking form** → Validates dates and room availability
2. **User clicks "Proceed to Payment"** → Creates booking and payment order
3. **Razorpay window opens** → User enters payment details
4. **Payment verification** → Backend verifies payment signature
5. **Success/Error handling** → Updates UI and booking status

### 2. UI States
- **Creating Booking**: Shows spinner while creating booking
- **Payment in Progress**: Shows spinner while payment window is open
- **Success**: Shows success message and resets form
- **Error**: Shows error message with details

### 3. Error Handling
- **Double-booking**: Shows availability error
- **Payment cancellation**: Shows cancellation message
- **Payment failure**: Shows verification error
- **Network errors**: Shows generic error message

## Configuration

### 1. Environment Variables
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_actual_key_id
```

### 2. Razorpay Script
The Razorpay script is loaded in `pages/_document.tsx`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 3. Configuration File
`config/razorpay.ts` contains:
- Key ID configuration
- Hotel information
- Theme settings

## Code Structure

### 1. Form Submission Flow
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // Step 1: Create booking
  const bookingResponse = await axios.post('/api/booking/book', formData);
  
  // Step 2: Create payment order
  const paymentResponse = await axios.post('/api/payment/create-order', {
    amount: booking.totalPrice,
    guestName: formData.guestName,
    bookingId: booking.id
  });
  
  // Step 3: Launch Razorpay payment window
  const rzp = new Razorpay(options);
  rzp.open();
};
```

### 2. Payment Success Handler
```typescript
const handlePaymentSuccess = async (response: any, bookingId: number) => {
  // Verify payment on backend
  const verifyResponse = await axios.post('/api/payment/verify-payment', {
    razorpay_order_id: response.razorpay_order_id,
    razorpay_payment_id: response.razorpay_payment_id,
    razorpay_signature: response.razorpay_signature
  });
  
  // Handle success/error
  if (verifyResponse.data.success) {
    // Show success message and reset form
  } else {
    // Show error message
  }
};
```

### 3. Razorpay Options
```typescript
const options = {
  key: RAZORPAY_CONFIG.KEY_ID,
  amount: orderData.amount,
  currency: orderData.currency,
  name: RAZORPAY_CONFIG.HOTEL_NAME,
  description: `Booking for ${formData.roomType}`,
  order_id: orderData.orderId,
  handler: handlePaymentSuccess,
  prefill: {
    name: formData.guestName,
    email: formData.email,
    contact: formData.phone
  },
  theme: RAZORPAY_CONFIG.THEME,
  modal: {
    ondismiss: handlePaymentCancellation
  }
};
```

## Testing

### 1. Test Cards
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### 2. Test Scenarios
1. **Successful Payment**: Complete booking and payment
2. **Payment Cancellation**: Close payment window
3. **Payment Failure**: Use failure test card
4. **Double-booking**: Try to book same room/dates
5. **Network Error**: Disconnect internet during payment

### 3. Error Messages
- **"Payment was cancelled. Please try again."** - User closed payment window
- **"Payment verification failed. Please contact support."** - Backend verification failed
- **"Room is not available for the selected dates."** - Double-booking attempt
- **"Failed to submit booking. Please try again."** - Network/server error

## Production Deployment

### 1. Environment Setup
- Replace test key with live key
- Update `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- Test thoroughly before going live

### 2. Security Considerations
- Never expose key_secret in frontend
- Always verify payments on backend
- Use HTTPS in production
- Implement proper error logging

### 3. Monitoring
- Track payment success/failure rates
- Monitor user experience
- Log payment errors for debugging

## Troubleshooting

### Common Issues

1. **"Razorpay is not defined"**
   - Check if script is loaded in `_document.tsx`
   - Verify script URL is accessible

2. **"Authentication failed"**
   - Check Razorpay key ID is correct
   - Ensure key is from same environment (test/live)

3. **Payment window not opening**
   - Check browser console for errors
   - Verify all required options are provided

4. **Payment verification failing**
   - Check backend logs for signature verification errors
   - Verify webhook configuration

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify network requests in browser dev tools
3. Check backend logs for API errors
4. Test with Razorpay test cards
5. Verify environment variables are set correctly

## Support
- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Support: support@razorpay.com 