# Master Seed Script

This comprehensive seed script creates realistic test data for one full year of hotel operations, covering all functionality built in the system.

## What It Creates

### 1. **100 Loyalty Users** 👥
- Real Indian names (first and last names)
- Indian phone numbers (91XXXXXXXXXX format)
- Realistic email addresses
- User profiles with:
  - Member numbers (000001-000100)
  - Loyalty tiers (SILVER, GOLD, PLATINUM) with realistic distribution
  - Points balances based on tier
  - Lifetime stays count

### 2. **12 Months of Booking Data** 📅
- **1,500 bookings** across all properties (~125 per month)
- **All booking sources** with realistic distribution:
  - WEB_DIRECT (30%)
  - OTA_MMT (20%)
  - OTA_BOOKING_COM (15%)
  - OTA_GOIBIBO (10%)
  - OTA_YATRA (8%)
  - OTA_AGODA (5%)
  - WALK_IN (7%)
  - PHONE (4%)
  - CORPORATE (1%)
- **All booking statuses**:
  - CONFIRMED (60%)
  - CHECKED_OUT (20%)
  - CANCELLED (10%)
  - CHECKED_IN (5%)
  - NO_SHOW (3%)
  - PENDING (2%)
- **Booking scenarios**:
  - Past bookings (completed, cancelled, no-shows)
  - Current stays (checked-in)
  - Future bookings (confirmed, pending)
  - Multi-night stays (1-7 nights)
  - Various guest counts
  - OTA bookings with commission calculations
  - Loyalty member bookings (30% of bookings)

### 3. **Communication Hub Data** 💬
- **800 conversations** across all channels:
  - **Email threads** with inbound/outbound messages
  - **WhatsApp messages** (inbound/outbound)
  - **SMS messages** (inbound/outbound)
  - **Voice calls** (inbound/outbound) with call logs
- **Mixed conversations**:
  - 70% linked to bookings
  - 30% general inquiries
  - Realistic message content
  - Proper threading and linking

### 4. **All Booking Scenarios** 🎯
- **Cancellations**:
  - Cancelled at various times before check-in
  - Refund payments created
  - Cancellation policy applied
  - Audit logs created
- **No-Shows**:
  - Marked no-show after check-in date
  - No-show fees charged
  - Audit logs created
- **Check-Ins**:
  - Room assignments created
  - Stay status updated
  - Audit logs created
- **Check-Outs**:
  - Room assignments updated
  - Stay status updated
  - Audit logs created
- **Modifications**:
  - Audit logs for changes
  - Status transitions tracked

### 5. **Related Data** 📊
- **Payments**:
  - Multiple payment methods (RAZORPAY, CASH, CARD_ON_FILE, UPI)
  - Various payment statuses (COMPLETED, PENDING, FAILED, REFUNDED)
  - Partial payments, full payments, refunds
  - Payment metadata
- **Stays**:
  - One stay per booking
  - Nightly rate breakdowns
  - Status tracking
- **Booking Guests**:
  - Primary guest for each booking
  - Linked to loyalty accounts where applicable
- **Room Assignments**:
  - Created for checked-in bookings
  - Room assignment tracking
  - Check-in/check-out timestamps
- **Audit Logs**:
  - Complete audit trail for all booking actions
  - Status transitions
  - User actions
  - System actions
- **Loyalty Points**:
  - Points awarded for completed stays
  - Points ledger entries
  - Tier calculations
  - Lifetime stays tracking
- **Contacts**:
  - Unified contact information
  - Linked to bookings and communications

## Usage

### Prerequisites

1. **Properties and Room Types must exist**:
   ```bash
   # Run the property seed script first
   cd backend
   node seed_properties.js
   # OR
   node prisma/seed.js
   ```

2. **Database must be migrated**:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

3. **Environment variables**:
   - `DATABASE_URL` must be set in your `.env` file

### Running the Seed Script

```bash
cd backend
node seed_master.js
```

### Expected Runtime

- **Time**: ~5-10 minutes (depending on database performance)
- **Progress**: Shows progress every 100-150 records
- **Output**: Detailed summary at the end

### What Gets Created

The script will output a summary like:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 SEED SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Loyalty Users: 100
Bookings: 1500
Payments: ~2000
Stays: 1500
Booking Guests: 1500
Audit Logs: ~3000
Room Assignments: ~75
Email Threads: ~400
Emails: ~800
Message Logs: ~200
Call Logs: ~200
Contacts: ~500
Points Ledger Entries: ~450
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Data Characteristics

### Realistic Distribution

- **Booking Sources**: Weighted distribution matching real-world patterns
- **Booking Statuses**: Realistic status distribution based on booking dates
- **Loyalty Tiers**: 50% SILVER, 35% GOLD, 15% PLATINUM
- **Payment Methods**: Mix of online and offline payments
- **Communication Channels**: Balanced across email, WhatsApp, SMS, and voice

### Time Distribution

- **Bookings**: Spread across 12 months (365 days in past, 30 days future)
- **Communications**: Linked to bookings with realistic timing
- **Payments**: Created at booking time or later
- **Status Changes**: Realistic progression over time

### Indian Context

- **Names**: Real Indian first and last names
- **Phone Numbers**: Indian format (91XXXXXXXXXX)
- **Email Domains**: Common Indian email providers
- **Currency**: INR (Indian Rupees)
- **Tax**: 18% GST applied

## Testing Scenarios Covered

This seed data enables testing of:

1. **Booking Management**:
   - View bookings by status, source, property
   - Filter and search bookings
   - View booking details
   - Modify bookings
   - Cancel bookings
   - Check-in/check-out workflows

2. **Payment Management**:
   - View payment history
   - Record cash payments
   - Charge cards on file
   - Issue refunds
   - Track payment statuses

3. **Loyalty System**:
   - View loyalty members
   - Track points and tiers
   - View points ledger
   - Test tier upgrades

4. **Communication Hub**:
   - View all conversations
   - Filter by channel, status, property
   - View email threads
   - View WhatsApp/SMS messages
   - View call logs
   - Link conversations to bookings

5. **Reporting & Analytics**:
   - Booking reports by source
   - Revenue reports
   - Occupancy reports
   - Communication metrics

## Notes

- **Idempotency**: The script uses `upsert` for users and loyalty accounts, so it's safe to run multiple times
- **Performance**: Uses batch operations where possible for efficiency
- **Relationships**: All relationships are properly maintained (bookings → stays → guests → payments)
- **Audit Trail**: Complete audit trail for all booking actions
- **Realistic Data**: All data follows realistic patterns and distributions

## Troubleshooting

### "No properties found"
- Run `node seed_properties.js` first to create properties and room types

### "Database connection error"
- Check your `DATABASE_URL` in `.env`
- Ensure database is running and accessible

### "Unique constraint violation"
- The script handles duplicates for users/loyalty accounts
- If you get errors on other fields, you may need to clear existing data first

### Performance Issues
- The script processes ~1500 bookings, which may take time
- Consider running during off-peak hours
- Monitor database performance

## Next Steps

After running the seed script:

1. **Test the Admin Dashboard**: View all the data in the admin interface
2. **Test Booking Management**: Try filtering, searching, and managing bookings
3. **Test Communication Hub**: View and interact with conversations
4. **Test Payment Flows**: Record payments, issue refunds
5. **Test Loyalty System**: View loyalty members and points

## Customization

You can modify the script to:
- Change the number of bookings (modify `totalBookings` variable)
- Adjust booking source distribution (modify `BOOKING_SOURCES` weights)
- Change time ranges (modify `startDate` and `endDate`)
- Add more communication channels or scenarios
- Customize Indian names or other data generators

