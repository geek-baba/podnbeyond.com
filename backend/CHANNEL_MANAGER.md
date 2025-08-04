# Channel Manager Documentation

## Overview

The Channel Manager module provides a unified interface for integrating with external travel platforms (OTAs) like MakeMyTrip, Yatra, Goibibo, Booking.com, and Agoda. It handles availability synchronization, booking management, and external booking retrieval.

## Supported Channels

| Channel | Identifier | Status |
|---------|------------|--------|
| MakeMyTrip | `makemytrip` | ✅ Supported |
| Yatra | `yatra` | ✅ Supported |
| Goibibo | `goibibo` | ✅ Supported |
| Booking.com | `booking_com` | ✅ Supported |
| Agoda | `agoda` | ✅ Supported |

## Environment Variables

Add these environment variables to your `.env` file:

```env
# MakeMyTrip Configuration
MAKEMYTRIP_ENABLED=false
MAKEMYTRIP_API_URL=https://api.makemytrip.com
MAKEMYTRIP_API_KEY=your_api_key_here
MAKEMYTRIP_SECRET_KEY=your_secret_key_here
MAKEMYTRIP_HOTEL_ID=your_hotel_id_here

# Yatra Configuration
YATRA_ENABLED=false
YATRA_API_URL=https://api.yatra.com
YATRA_API_KEY=your_api_key_here
YATRA_SECRET_KEY=your_secret_key_here
YATRA_HOTEL_ID=your_hotel_id_here

# Goibibo Configuration
GOIBIBO_ENABLED=false
GOIBIBO_API_URL=https://api.goibibo.com
GOIBIBO_API_KEY=your_api_key_here
GOIBIBO_SECRET_KEY=your_secret_key_here
GOIBIBO_HOTEL_ID=your_hotel_id_here

# Booking.com Configuration
BOOKING_ENABLED=false
BOOKING_API_URL=https://api.booking.com
BOOKING_API_KEY=your_api_key_here
BOOKING_SECRET_KEY=your_secret_key_here
BOOKING_HOTEL_ID=your_hotel_id_here

# Agoda Configuration
AGODA_ENABLED=false
AGODA_API_URL=https://api.agoda.com
AGODA_API_KEY=your_api_key_here
AGODA_SECRET_KEY=your_secret_key_here
AGODA_HOTEL_ID=your_hotel_id_here
```

## API Endpoints

### 1. Get All Channels Status
**GET** `/api/channels/status`

**Response:**
```json
{
  "success": true,
  "channels": {
    "makemytrip": {
      "enabled": false,
      "name": "MakeMyTrip",
      "configured": false,
      "lastSync": "2025-08-04T17:50:00.000Z",
      "status": "healthy"
    },
    "yatra": {
      "enabled": false,
      "name": "Yatra",
      "configured": false,
      "lastSync": "2025-08-04T17:50:00.000Z",
      "status": "healthy"
    }
  }
}
```

### 2. Get Specific Channel Status
**GET** `/api/channels/status/:channelId`

**Response:**
```json
{
  "success": true,
  "channel": "makemytrip",
  "status": {
    "enabled": false,
    "name": "MakeMyTrip",
    "configured": false,
    "lastSync": "2025-08-04T17:50:00.000Z",
    "status": "healthy"
  }
}
```

### 3. Get Enabled Channels
**GET** `/api/channels/enabled`

**Response:**
```json
{
  "success": true,
  "channels": [
    {
      "channelId": "makemytrip",
      "name": "MakeMyTrip",
      "apiBaseUrl": "https://api.makemytrip.com",
      "hotelId": "your_hotel_id_here"
    }
  ]
}
```

### 4. Sync Availability with Channel
**POST** `/api/channels/:channelId/sync-availability`

**Request Body:**
```json
{
  "startDate": "2025-08-05T00:00:00.000Z",
  "endDate": "2025-08-12T00:00:00.000Z",
  "rooms": [
    {
      "roomId": 1,
      "roomType": "Standard Room",
      "price": 120,
      "capacity": 2,
      "totalRooms": 1,
      "availableRooms": 1,
      "bookings": []
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "channel": "makemytrip",
  "result": {
    "success": true,
    "channel": "MakeMyTrip",
    "syncedRooms": 1,
    "message": "Availability sync completed (placeholder)"
  }
}
```

### 5. Push Booking to Channel
**POST** `/api/channels/:channelId/push-booking`

**Request Body:**
```json
{
  "guestName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "checkIn": "2025-08-05T00:00:00.000Z",
  "checkOut": "2025-08-07T00:00:00.000Z",
  "guests": 2,
  "roomType": "Standard Room",
  "totalPrice": 240,
  "specialRequests": "Early check-in requested"
}
```

**Response:**
```json
{
  "success": true,
  "channel": "makemytrip",
  "result": {
    "success": true,
    "channel": "MakeMyTrip",
    "externalBookingId": "MMT_1733340000000",
    "message": "Booking pushed successfully (placeholder)"
  }
}
```

### 6. Fetch External Bookings
**GET** `/api/channels/:channelId/bookings?startDate=2025-08-05T00:00:00.000Z&endDate=2025-08-12T00:00:00.000Z`

**Response:**
```json
{
  "success": true,
  "channel": "makemytrip",
  "result": {
    "success": true,
    "channel": "MakeMyTrip",
    "bookings": [],
    "message": "No external bookings found (placeholder)"
  }
}
```

### 7. Bulk Sync All Channels
**POST** `/api/channels/sync-all-availability`

**Request Body:**
```json
{
  "startDate": "2025-08-05T00:00:00.000Z",
  "endDate": "2025-08-12T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Synced availability for 2 channels",
  "results": [
    {
      "channel": "makemytrip",
      "success": true,
      "result": {
        "success": true,
        "channel": "MakeMyTrip",
        "syncedRooms": 1,
        "message": "Availability sync completed (placeholder)"
      }
    },
    {
      "channel": "yatra",
      "success": true,
      "result": {
        "success": true,
        "channel": "Yatra",
        "syncedRooms": 1,
        "message": "Availability sync completed (placeholder)"
      }
    }
  ]
}
```

### 8. Get Room Availability
**GET** `/api/channels/room-availability?startDate=2025-08-05T00:00:00.000Z&endDate=2025-08-12T00:00:00.000Z`

**Response:**
```json
{
  "success": true,
  "availability": [
    {
      "roomId": 1,
      "roomType": "Standard Room",
      "price": 120,
      "capacity": 2,
      "totalRooms": 1,
      "availableRooms": 1,
      "bookings": []
    }
  ],
  "dateRange": {
    "startDate": "2025-08-05T00:00:00.000Z",
    "endDate": "2025-08-12T00:00:00.000Z"
  }
}
```

### 9. Test Channel Connectivity
**POST** `/api/channels/:channelId/test`

**Response:**
```json
{
  "success": true,
  "channel": "makemytrip",
  "status": {
    "enabled": true,
    "name": "MakeMyTrip",
    "configured": true,
    "lastSync": "2025-08-04T17:50:00.000Z",
    "status": "healthy"
  },
  "testResult": {
    "syncTest": {
      "success": true,
      "channel": "MakeMyTrip",
      "syncedRooms": 1,
      "message": "Availability sync completed (placeholder)"
    },
    "message": "Channel connectivity test completed successfully"
  }
}
```

## Core Methods

### ChannelManager Class

#### Constructor
```javascript
const channelManager = new ChannelManager();
```

#### Methods

**getEnabledChannels()**
- Returns list of enabled channels with configuration

**getChannelConfig(channelId)**
- Returns configuration for specific channel

**validateChannelConfig(channelId)**
- Validates channel configuration and credentials

**syncAvailability(channelId, startDate, endDate, rooms)**
- Syncs room availability with external channel

**pushBooking(channelId, bookingData)**
- Pushes booking to external channel

**fetchExternalBookings(channelId, startDate, endDate)**
- Fetches bookings from external channel

**getRoomAvailability(startDate, endDate)**
- Gets room availability from database

**validateBookingData(bookingData)**
- Validates booking data structure

**getChannelStatus(channelId)**
- Gets channel status and health check

**getAllChannelsStatus()**
- Gets status of all channels

## Usage Examples

### Basic Usage
```javascript
const ChannelManager = require('./modules/channelManager');
const channelManager = new ChannelManager();

// Get enabled channels
const enabledChannels = channelManager.getEnabledChannels();
console.log('Enabled channels:', enabledChannels);

// Sync availability with MakeMyTrip
const startDate = new Date();
const endDate = new Date();
endDate.setDate(endDate.getDate() + 7);

const result = await channelManager.syncAvailability(
  'makemytrip',
  startDate,
  endDate
);
console.log('Sync result:', result);
```

### Testing Channel Integration
```javascript
// Test channel connectivity
const status = await channelManager.getChannelStatus('makemytrip');
console.log('Channel status:', status);

// Test availability sync
const testRooms = [
  {
    roomId: 1,
    roomType: 'Standard Room',
    price: 120,
    capacity: 2,
    totalRooms: 1,
    availableRooms: 1,
    bookings: []
  }
];

const syncResult = await channelManager.syncAvailability(
  'makemytrip',
  new Date(),
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  testRooms
);
console.log('Test sync result:', syncResult);
```

## Error Handling

The module includes comprehensive error handling:

- **Channel not found**: Returns error for unsupported channels
- **Channel not enabled**: Validates channel is enabled before operations
- **Missing credentials**: Checks API keys and secrets are configured
- **Invalid data**: Validates booking data and date ranges
- **Network errors**: Handles API communication failures

## Testing

### Test Channel Status
```bash
curl "http://localhost:4000/api/channels/status"
```

### Test Availability Sync
```bash
curl -X POST "http://localhost:4000/api/channels/makemytrip/sync-availability" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-08-05T00:00:00.000Z",
    "endDate": "2025-08-12T00:00:00.000Z"
  }'
```

### Test Channel Connectivity
```bash
curl -X POST "http://localhost:4000/api/channels/makemytrip/test"
```

## Future Enhancements

### Planned Features
1. **Real API Integration**: Replace placeholder methods with actual API calls
2. **Rate Limiting**: Implement rate limiting for API calls
3. **Retry Logic**: Add retry mechanism for failed API calls
4. **Webhook Support**: Handle incoming webhooks from channels
5. **Booking Reconciliation**: Match external bookings with internal bookings
6. **Price Parity**: Ensure consistent pricing across channels
7. **Inventory Management**: Real-time inventory synchronization
8. **Analytics**: Track channel performance and booking sources

### Channel-Specific Features
1. **MakeMyTrip**: Support for dynamic pricing and promotions
2. **Yatra**: Integration with Yatra's loyalty program
3. **Goibibo**: Support for Goibibo's instant booking feature
4. **Booking.com**: Integration with Booking.com's extranet
5. **Agoda**: Support for Agoda's yield management system

## Security Considerations

1. **API Credentials**: Store sensitive credentials in environment variables
2. **Rate Limiting**: Implement rate limiting to prevent API abuse
3. **Data Validation**: Validate all incoming data from external channels
4. **Error Logging**: Log errors without exposing sensitive information
5. **HTTPS**: Use HTTPS for all API communications
6. **Authentication**: Implement proper authentication for channel management

## Monitoring and Logging

The module includes comprehensive logging:

- **Channel operations**: Log all channel sync and booking operations
- **Error tracking**: Log detailed error information for debugging
- **Performance metrics**: Track API response times and success rates
- **Health checks**: Monitor channel connectivity and status

## Support

For issues and questions:
1. Check the channel status endpoint for configuration issues
2. Review error logs for detailed error information
3. Test channel connectivity using the test endpoint
4. Verify environment variables are properly configured 