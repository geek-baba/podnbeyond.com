# Third-Party Integrations Administration

## Overview

This system provides a unified UI-based administration interface for managing all third-party integrations. Instead of storing API keys and secrets in environment variables, all configurations are stored in the database with encryption, and can be managed through a web interface.

## Features

- ✅ **Unified Management**: All third-party integrations in one place
- ✅ **Secure Storage**: API keys and secrets are encrypted in the database
- ✅ **UI-Based Configuration**: No need to edit environment variables or code
- ✅ **Enable/Disable**: Toggle integrations on/off without code changes
- ✅ **Connection Testing**: Test integrations directly from the UI
- ✅ **Category Organization**: Integrations grouped by category (Payment, Email, Messaging, Voice, OTA)

## Supported Integrations

### Payment
- **Razorpay** - Payment gateway for processing transactions

### Email
- **Postmark** - Transactional email delivery service

### Messaging
- **Gupshup** - WhatsApp and SMS messaging

### Voice
- **Exotel** - Voice calls and SMS

### OTA (Online Travel Agencies)
- **Go-MMT** - Go-MMT channel manager
- **Booking.com** - Booking.com channel manager
- **EaseMyTrip.com** - EaseMyTrip channel manager
- **Cleartrip.com** - Cleartrip channel manager

## Setup

### 1. Database Migration

First, create and run the Prisma migration to add the `ThirdPartyIntegration` model:

```bash
cd backend
npx prisma migrate dev --name add_third_party_integrations
```

### 2. Environment Variable

Add an encryption key for securing sensitive data (optional, will auto-generate if not set):

```bash
# In your .env file
INTEGRATION_ENCRYPTION_KEY=your-32-character-encryption-key-here
```

**Important**: If you change this key, all encrypted data will become unreadable. Store this securely.

### 3. Migrate Existing Configurations (Optional)

If you have existing integrations configured via environment variables, you can migrate them:

```bash
cd backend
node scripts/migrate-integrations-from-env.js
```

This script will:
- Read configurations from environment variables
- Encrypt sensitive fields
- Store them in the database
- Skip integrations that already exist

## Usage

### Accessing the Admin Interface

Navigate to `/admin/integrations` in your admin panel. You must be logged in as an admin, manager, or superadmin.

### Adding a New Integration

1. Click the "+ Add [Integration Name]" button for the integration you want to configure
2. Fill in the required configuration fields:
   - **API Keys/Secrets**: Enter your provider credentials
   - **Webhook URL**: (Optional) Your webhook endpoint URL
   - **Test Mode**: (For payment gateways) Enable sandbox/test mode
   - **Enable Integration**: Check to activate the integration
3. Click "Save Integration"
4. Test the connection using the "Test" button

### Editing an Integration

1. Click "Edit" on the integration card
2. Update the configuration fields
3. Click "Save Integration"
4. The cache will be automatically cleared

### Enabling/Disabling Integrations

- Click "Enable" or "Disable" on any integration card
- Changes take effect immediately (cache is cleared automatically)

### Testing Connections

- Click "Test" on any integration card
- The system will attempt to connect to the provider API
- Results are displayed in the UI
- Last test time and any errors are shown

## Architecture

### Database Schema

```prisma
model ThirdPartyIntegration {
  id          Int      @id @default(autoincrement())
  provider    String   @unique // e.g., "RAZORPAY", "POSTMARK"
  name        String
  category    String   // "PAYMENT", "EMAIL", "MESSAGING", "VOICE", "OTA"
  enabled     Boolean  @default(false)
  config      Json     // Encrypted configuration
  status      String   // "ACTIVE", "INACTIVE", "ERROR", "TESTING"
  // ... other fields
}
```

### Encryption

Sensitive fields (API keys, secrets, tokens) are encrypted using AES-256-GCM before storage. The encryption key is derived from the `INTEGRATION_ENCRYPTION_KEY` environment variable.

### Caching

Integration configurations are cached in memory for 5 minutes to reduce database queries. The cache is automatically cleared when:
- An integration is updated
- An integration is deleted
- The cache clear endpoint is called

### Backward Compatibility

The system maintains backward compatibility with environment variables:
- If a database configuration exists, it's used
- If not, the system falls back to environment variables
- This allows gradual migration

## API Endpoints

### Get All Integrations
```
GET /api/integrations
```

### Get Single Integration
```
GET /api/integrations/:provider
```

### Create/Update Integration
```
POST /api/integrations
Body: {
  provider: string,
  name: string,
  category: string,
  enabled: boolean,
  config: object,
  ...
}
```

### Toggle Integration
```
PATCH /api/integrations/:provider/toggle
Body: { enabled: boolean }
```

### Test Integration
```
POST /api/integrations/:provider/test
```

### Clear Cache
```
POST /api/integrations/clear-cache
Body: { provider?: string } // Optional, clears all if omitted
```

## Code Integration

### Using Integration Configs in Services

```javascript
const { getRazorpayConfig } = require('./lib/integrationConfig');

// In your service
async function processPayment() {
  const config = await getRazorpayConfig();
  
  if (!config || !config.enabled) {
    throw new Error('Razorpay is not configured or disabled');
  }
  
  const Razorpay = require('razorpay');
  const razorpay = new Razorpay({
    key_id: config.keyId,
    key_secret: config.keySecret
  });
  
  // Use razorpay...
}
```

### Available Config Getters

- `getRazorpayConfig()` - Payment gateway
- `getPostmarkConfig()` - Email service
- `getGupshupConfig()` - WhatsApp/SMS
- `getExotelConfig()` - Voice/SMS
- `getOTAConfig(provider)` - OTA integrations

## Security Considerations

1. **Encryption**: All sensitive data is encrypted at rest
2. **Access Control**: Only admins/managers can access the UI
3. **Masked Display**: Secrets are masked in API responses (showing only first/last 4 chars)
4. **Audit Trail**: Created/updated timestamps and user tracking
5. **Environment Variables**: Still supported for backward compatibility

## Migration from Environment Variables

### Step 1: Run Migration Script
```bash
node scripts/migrate-integrations-from-env.js
```

### Step 2: Verify in UI
- Go to `/admin/integrations`
- Verify all integrations are present
- Test each integration

### Step 3: Update Code (Optional)
- Refactor services to use `getIntegrationConfig()` functions
- Remove environment variable dependencies

### Step 4: Remove Environment Variables (Optional)
- Once verified, you can remove integration-related env vars
- Keep `INTEGRATION_ENCRYPTION_KEY` for decryption

## Troubleshooting

### Integration Not Working

1. Check if integration is enabled in the UI
2. Verify configuration fields are correct
3. Test the connection using the "Test" button
4. Check the "Last Error" field for details
5. Verify webhook URLs are accessible (if applicable)

### Cache Issues

If changes aren't taking effect:
1. Click "Test" on the integration (clears cache)
2. Or call `/api/integrations/clear-cache` endpoint
3. Cache auto-expires after 5 minutes

### Encryption Errors

If you see decryption errors:
- Verify `INTEGRATION_ENCRYPTION_KEY` hasn't changed
- Re-enter the configuration if the key was changed
- The key must remain constant for encrypted data to be readable

## Future Enhancements

- [ ] Webhook management UI
- [ ] Integration usage analytics
- [ ] Automated health checks
- [ ] Integration templates marketplace
- [ ] Multi-environment support (dev/staging/prod)
- [ ] Integration logs and audit trail

