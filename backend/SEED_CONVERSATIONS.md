# Seeding Sample Conversations

This script creates sample conversations (emails, WhatsApp messages, and calls) linked to existing bookings and properties for testing the unified conversation hub.

## Prerequisites

1. **Database must be migrated** - Run Prisma migrations first:
   ```bash
   npx prisma migrate deploy
   # or for development:
   npx prisma migrate dev
   ```

2. **Properties must exist** - The script needs at least one property in the database.

3. **Bookings are optional but recommended** - The script will create conversations linked to existing bookings. If no bookings exist, it will create some standalone conversations.

4. **Staff users are optional** - If staff users with `STAFF_FRONTDESK` or `MANAGER` roles exist, conversations will be auto-assigned to them.

## Running the Seed

### Option 1: Using npm script
```bash
cd backend
npm run seed:conversations
```

### Option 2: Direct node execution
```bash
cd backend
node seed_conversations.js
```

## What Gets Created

The script creates:

1. **5-10 Conversations** (Threads)
   - Linked to existing bookings
   - Various statuses: NEW, IN_PROGRESS, WAITING_FOR_GUEST
   - Various priorities: LOW, NORMAL, HIGH, URGENT
   - Auto-assigned to staff (if available)

2. **Email Conversations**
   - Inbound emails from guests
   - Outbound email replies from staff
   - Linked to bookings and properties

3. **WhatsApp Messages**
   - Inbound messages from guests
   - Outbound replies from staff
   - Delivery status tracking
   - Read receipts

4. **Call Logs**
   - Outbound calls to guests
   - Duration tracking
   - Status tracking (COMPLETED)
   - Linked to conversations

5. **Internal Notes**
   - Staff notes on conversations
   - Not visible to guests

6. **Contacts**
   - Auto-created from phone numbers
   - Linked to bookings and properties

## Sample Data

The script uses realistic sample data:
- Guest names: Rajesh Kumar, Priya Sharma, Amit Patel, Sneha Reddy, Vikram Singh
- Phone numbers: Indian format (+91)
- Realistic message content about bookings, check-in, amenities, etc.
- Timestamps staggered to show conversation history

## Verification

After seeding, you can verify the data:

1. **Check the Communication Hub UI:**
   - Visit `/admin/communication-hub`
   - You should see multiple conversations with different statuses and priorities

2. **Check via API:**
   ```bash
   curl http://localhost:4000/api/conversations
   ```

3. **Check database directly:**
   ```sql
   SELECT COUNT(*) FROM email_threads;
   SELECT COUNT(*) FROM message_logs;
   SELECT COUNT(*) FROM call_logs;
   SELECT COUNT(*) FROM conversation_notes;
   ```

## Troubleshooting

### "No properties found"
- Run property seed first: `node seed_properties.js` (if available)
- Or manually create at least one property in the database

### "No bookings found"
- The script will still create standalone conversations
- To create bookings, use the booking API or seed bookings separately

### "No staff users found"
- Conversations will be created but unassigned
- To assign conversations, create staff users with roles first

## Cleanup

To remove seeded conversations (if needed):

```sql
-- WARNING: This will delete ALL conversations, not just seeded ones
DELETE FROM conversation_notes;
DELETE FROM call_logs;
DELETE FROM message_logs;
DELETE FROM emails;
DELETE FROM email_threads;
DELETE FROM contacts WHERE phone LIKE '9198765432%';
```

Or use Prisma Studio:
```bash
npx prisma studio
```

## Notes

- The script is idempotent for contacts (uses upsert)
- Each run creates new conversations (doesn't check for duplicates)
- Phone numbers are normalized to Indian format (+91)
- Timestamps are staggered to show realistic conversation flow

