# Cron Service Documentation

## Overview

The Cron Service automatically synchronizes external bookings from travel platforms (MakeMyTrip, Yatra, etc.) every 15 minutes. It fetches new bookings, creates them in the local database, and updates existing bookings with the latest information.

## Features

- **Automatic Scheduling**: Runs every 15 minutes
- **Multi-Channel Support**: Fetches from all enabled channels
- **Duplicate Prevention**: Checks for existing bookings before creating new ones
- **Loyalty Integration**: Automatically creates/updates loyalty accounts
- **Comprehensive Logging**: Detailed logs of all operations
- **Manual Trigger**: Ability to manually trigger the fetch process
- **Status Monitoring**: Real-time status and health monitoring

## Schedule

- **Frequency**: Every 15 minutes
- **Timezone**: Asia/Kolkata (IST)
- **Cron Expression**: `*/15 * * * *`

## API Endpoints

### 1. Get Cron Service Status
**GET** `/api/cron/status`

**Response:**
```json
{
  "success": true,
  "status": {
    "isRunning": true,
    "lastRun": "2025-08-04T18:12:22.625Z",
    "nextRun": "2025-08-04T18:27:22.625Z",
    "schedule": "*/15 * * * * (every 15 minutes)",
    "timezone": "Asia/Kolkata"
  }
}
```

### 2. Start Cron Service
**POST** `/api/cron/start`

**Response:**
```json
{
  "success": true,
  "message": "Cron service started successfully",
  "status": {
    "isRunning": true,
    "nextRun": "2025-08-04T18:27:22.625Z",
    "schedule": "*/15 * * * * (every 15 minutes)",
    "timezone": "Asia/Kolkata"
  }
}
```

### 3. Stop Cron Service
**POST** `/api/cron/stop`

**Response:**
```json
{
  "success": true,
  "message": "Cron service stopped successfully"
}
```

### 4. Manually Trigger Fetch
**POST** `/api/cron/trigger`

**Response:**
```json
{
  "success": true,
  "message": "External bookings fetch triggered successfully",
  "note": "Check server logs for detailed results"
}
```

### 5. Get Cron Logs
**GET** `/api/cron/logs`

**Response:**
```json
{
  "success": true,
  "logs": {
    "lastRun": "2025-08-04T18:12:22.625Z",
    "nextRun": "2025-08-04T18:27:22.625Z",
    "isRunning": true,
    "schedule": "*/15 * * * * (every 15 minutes)",
    "timezone": "Asia/Kolkata"
  },
  "note": "Detailed logs are available in server console output"
}
```

## How It Works

### 1. Scheduled Execution
The cron job runs every 15 minutes automatically when the server starts.

### 2. Channel Discovery
- Fetches list of enabled channels from Channel Manager
- Skips execution if no channels are enabled

### 3. Booking Fetch
For each enabled channel:
- Calls `fetchExternalBookings()` with date range
- Date range: Last 24 hours to next 7 days
- Processes all returned bookings

### 4. Booking Processing
For each external booking:

**Duplicate Check:**
- Checks for existing booking by `externalBookingId` and `externalChannel`
- Also checks by email, check-in, and check-out dates

**New Booking Creation:**
- Finds matching room by type
- Creates/updates loyalty account
- Creates new booking with external reference
- Sets status to 'CONFIRMED'

**Existing Booking Update:**
- Updates status if changed
- Updates total price if changed

### 5. Logging and Monitoring
- Logs start and end times
- Tracks duration of execution
- Counts new bookings found
- Reports success/failure for each channel
- Updates last run time

## Database Schema Updates

### Booking Model
Added external booking fields:

```prisma
model Booking {
  // ... existing fields ...
  
  // External booking fields
  externalBookingId String?     // External booking ID from channel
  externalChannel   String?     // Channel name (makemytrip, yatra, etc.)
  
  // ... rest of fields ...
}
```

## Configuration

### Environment Variables
The cron service uses the same environment variables as the Channel Manager:

```env
# MakeMyTrip Configuration
MAKEMYTRIP_ENABLED=false
MAKEMYTRIP_API_KEY=your_api_key_here
MAKEMYTRIP_SECRET_KEY=your_secret_key_here
MAKEMYTRIP_HOTEL_ID=your_hotel_id_here

# Yatra Configuration
YATRA_ENABLED=false
YATRA_API_KEY=your_api_key_here
YATRA_SECRET_KEY=your_secret_key_here
YATRA_HOTEL_ID=your_hotel_id_here

# ... other channels ...
```

## Testing

### Test Cron Service
```bash
cd backend
node test_cron_service.js
```

### Test API Endpoints
```bash
# Get status
curl "http://localhost:4000/api/cron/status"

# Manual trigger
curl -X POST "http://localhost:4000/api/cron/trigger"

# Get logs
curl "http://localhost:4000/api/cron/logs"
```

## Log Output Example

```
🔄 Starting external bookings fetch at 2025-08-04T18:12:22.625Z
📡 Found 2 enabled channels: MakeMyTrip, Yatra

📥 Fetching bookings from MakeMyTrip...
✅ Found 3 bookings from MakeMyTrip
🆕 New booking found: John Doe - Standard Room (MakeMyTrip)
🆕 New booking found: Jane Smith - Deluxe Room (MakeMyTrip)
✅ Created new booking from MakeMyTrip: John Doe - Standard Room

📥 Fetching bookings from Yatra...
ℹ️  No bookings found from Yatra

📊 External Bookings Fetch Summary:
⏱️  Duration: 2450ms
📡 Channels processed: 2
🆕 New bookings found: 2
✅ Successful channels: 2
❌ Failed channels: 0
  ✅ MakeMyTrip: 3 bookings
  ✅ Yatra: 0 bookings

✅ External bookings fetch completed at 2025-08-04T18:12:25.075Z
⏰ Next scheduled run: 2025-08-04T18:27:22.625Z
```

## Error Handling

### Channel Errors
- Individual channel failures don't stop the entire process
- Failed channels are logged with error details
- Other channels continue processing

### Database Errors
- Booking creation failures are logged
- Process continues with remaining bookings
- No partial data corruption

### Network Errors
- API timeouts are handled gracefully
- Retry logic can be added in future versions

## Monitoring

### Health Checks
- Monitor cron service status via API
- Check last run time
- Verify next scheduled run

### Log Monitoring
- Watch server logs for cron activity
- Monitor for errors and warnings
- Track booking creation success rates

### Performance Metrics
- Execution duration
- Number of channels processed
- New bookings found per run
- Success/failure rates

## Future Enhancements

### Planned Features
1. **Database Logging**: Store logs in database for persistence
2. **Retry Logic**: Automatic retry for failed API calls
3. **Rate Limiting**: Respect API rate limits
4. **Webhook Support**: Real-time updates via webhooks
5. **Email Notifications**: Alert on failures or new bookings
6. **Metrics Dashboard**: Web interface for monitoring
7. **Configurable Schedule**: Allow schedule changes via API
8. **Backup Channels**: Fallback channels for critical operations

### Advanced Features
1. **Booking Reconciliation**: Match external bookings with internal ones
2. **Price Parity**: Ensure consistent pricing across channels
3. **Inventory Sync**: Real-time inventory synchronization
4. **Analytics**: Track channel performance and trends
5. **Automated Testing**: Self-healing and validation

## Troubleshooting

### Common Issues

**Cron Not Running:**
- Check if cron service is started
- Verify server is running
- Check for errors in server logs

**No External Bookings:**
- Verify channels are enabled
- Check API credentials
- Confirm date range is correct

**Database Errors:**
- Check database connection
- Verify schema is up to date
- Check for constraint violations

**Performance Issues:**
- Monitor execution duration
- Check API response times
- Consider reducing frequency

### Debug Commands
```bash
# Check cron status
curl "http://localhost:4000/api/cron/status"

# Manual trigger with logging
curl -X POST "http://localhost:4000/api/cron/trigger"

# Check server logs
tail -f backend/logs/server.log

# Test channel connectivity
curl "http://localhost:4000/api/channels/status"
```

## Security Considerations

1. **API Credentials**: Store securely in environment variables
2. **Database Access**: Use read-only connections where possible
3. **Log Security**: Don't log sensitive booking information
4. **Rate Limiting**: Respect external API limits
5. **Error Handling**: Don't expose internal errors to clients

## Support

For issues and questions:
1. Check cron service status via API
2. Review server logs for detailed error information
3. Test manual trigger to isolate issues
4. Verify channel configurations 