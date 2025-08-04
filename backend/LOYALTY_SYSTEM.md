# Loyalty System Documentation

## Overview
The Pod & Beyond Hotel loyalty system tracks guest points, tiers, and provides automatic rewards based on spending and activity.

## Database Models

### LoyaltyAccount Model
```prisma
model LoyaltyAccount {
  id              Int      @id @default(autoincrement())
  guestName       String
  email           String   @unique
  phone           String?
  pointsBalance   Int      @default(0)
  tier            LoyaltyTier @default(SILVER)
  lastActivityDate DateTime @default(now())
  totalSpent      Float    @default(0)
  totalBookings   Int      @default(0)
  isActive        Boolean  @default(true)
  
  // Relationship to Bookings
  bookings        Booking[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum LoyaltyTier {
  SILVER
  GOLD
  PLATINUM
}
```

## Loyalty Tiers

### Silver Tier (0-4,999 points)
- **Points Multiplier**: 1.0x (1 point per $1 spent)
- **Benefits**:
  - Free WiFi
  - Late checkout (1 PM)
  - Welcome drink on arrival

### Gold Tier (5,000-9,999 points)
- **Points Multiplier**: 1.5x (1.5 points per $1 spent)
- **Benefits**:
  - All Silver benefits
  - Late checkout (2 PM)
  - Room upgrade (subject to availability)
  - 10% discount on room service
  - Priority booking

### Platinum Tier (10,000+ points)
- **Points Multiplier**: 2.0x (2 points per $1 spent)
- **Benefits**:
  - All Gold benefits
  - Late checkout (3 PM)
  - 20% discount on room service
  - Free breakfast
  - Concierge service
  - Exclusive events access

## API Endpoints

### 1. Get Loyalty Account
**GET** `/api/loyalty/account/:email`

**Response:**
```json
{
  "success": true,
  "account": {
    "id": 1,
    "guestName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "pointsBalance": 1500,
    "tier": "SILVER",
    "lastActivityDate": "2025-08-04T17:38:11.726Z",
    "totalSpent": 1500.00,
    "totalBookings": 3,
    "isActive": true,
    "bookings": [
      {
        "id": 1,
        "checkIn": "2024-01-15T00:00:00.000Z",
        "checkOut": "2024-01-17T00:00:00.000Z",
        "totalPrice": 360.00,
        "status": "CONFIRMED",
        "roomType": "Deluxe Room",
        "createdAt": "2025-08-04T16:52:17.723Z"
      }
    ]
  }
}
```

### 2. Get Loyalty Points (Legacy)
**GET** `/api/loyalty/points?email=john@example.com`

**Response:**
```json
{
  "points": 1500,
  "tier": "SILVER"
}
```

### 3. Add Points
**POST** `/api/loyalty/points/add`

**Request Body:**
```json
{
  "email": "john@example.com",
  "points": 500,
  "reason": "Welcome bonus"
}
```

**Response:**
```json
{
  "success": true,
  "message": "500 points added successfully",
  "account": {
    "pointsBalance": 2000,
    "tier": "SILVER",
    "reason": "Welcome bonus"
  }
}
```

### 4. Redeem Points
**POST** `/api/loyalty/points/redeem`

**Request Body:**
```json
{
  "email": "john@example.com",
  "points": 100,
  "reason": "Room service discount"
}
```

**Response:**
```json
{
  "success": true,
  "message": "100 points redeemed successfully",
  "account": {
    "pointsBalance": 1400,
    "tier": "SILVER",
    "reason": "Room service discount"
  }
}
```

### 5. Get Tier Benefits
**GET** `/api/loyalty/tier-benefits/:tier`

**Response:**
```json
{
  "success": true,
  "tier": "GOLD",
  "benefits": {
    "name": "Gold Tier",
    "minPoints": 5000,
    "benefits": [
      "Earn 1.5 points per $1 spent",
      "Free WiFi",
      "Late checkout (2 PM)",
      "Welcome drink on arrival",
      "Room upgrade (subject to availability)",
      "10% discount on room service",
      "Priority booking"
    ]
  }
}
```

### 6. Get All Loyalty Accounts (Admin)
**GET** `/api/loyalty/accounts`

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "id": 1,
      "guestName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "pointsBalance": 1500,
      "tier": "SILVER",
      "lastActivityDate": "2025-08-04T17:38:11.726Z",
      "totalSpent": 1500.00,
      "totalBookings": 3,
      "isActive": true,
      "bookingCount": 3
    }
  ]
}
```

## Automatic Features

### 1. Account Creation
- Loyalty accounts are automatically created when guests make their first booking
- Email is used as the unique identifier
- Default tier is SILVER with 0 points

### 2. Points Earning
- Points are automatically added when payments are completed
- Points calculation: `amount_spent × tier_multiplier`
- Example: $100 booking for Gold member = 150 points

### 3. Tier Upgrades
- Automatic tier upgrades when points thresholds are reached
- No downgrades (tiers are permanent once achieved)
- Tier benefits are immediately available

### 4. Activity Tracking
- `lastActivityDate` is updated on every interaction
- `totalSpent` and `totalBookings` are automatically incremented
- Guest information is updated when they make new bookings

## Integration with Booking System

### Booking Creation
When a booking is created:
1. Check if loyalty account exists for the email
2. Create new account if it doesn't exist
3. Update guest information if it has changed
4. Link booking to loyalty account

### Payment Completion
When payment is completed:
1. Update booking status to CONFIRMED
2. Calculate points based on payment amount and tier
3. Add points to loyalty account
4. Update total spent and booking count
5. Check for tier upgrade
6. Update last activity date

## Testing Examples

### Create a new loyalty account
```bash
curl "http://localhost:4000/api/loyalty/account/newguest@example.com"
```

### Add points to account
```bash
curl -X POST http://localhost:4000/api/loyalty/points/add \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "points": 1000, "reason": "Test"}'
```

### Redeem points
```bash
curl -X POST http://localhost:4000/api/loyalty/points/redeem \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "points": 100, "reason": "Test redemption"}'
```

### Check tier benefits
```bash
curl "http://localhost:4000/api/loyalty/tier-benefits/platinum"
```

## Business Rules

### Points Earning
- Points are only earned on completed payments
- Points are calculated based on the tier at the time of payment
- No points for cancelled or failed payments

### Tier Progression
- SILVER: 0-4,999 points
- GOLD: 5,000-9,999 points
- PLATINUM: 10,000+ points
- Tiers are permanent (no downgrades)

### Account Management
- One account per email address
- Accounts are automatically created on first booking
- Guest information is updated with each booking
- Inactive accounts can be marked as inactive

## Future Enhancements

### Potential Features
1. **Point Expiration**: Set expiration dates for points
2. **Special Promotions**: Bonus points for specific events
3. **Referral System**: Points for referring new guests
4. **Redemption Catalog**: Points for specific rewards
5. **Analytics Dashboard**: Track loyalty program performance
6. **Email Notifications**: Notify guests of points and tier changes
7. **Mobile App Integration**: Loyalty features in mobile app 