# Gupshup Integration Setup Guide

## Step-by-Step Configuration

### Part 1: Manual Steps (You Do These)

#### Step 1: Access Gupshup Dashboard
1. Go to https://apps.gupshup.io/
2. Log in to your Gupshup account
3. Navigate to your app: **podnbeyond**

#### Step 2: Get App Information
From the **Settings** tab (where you are now):
1. **App Name**: `podnbeyond` (already visible)
2. **App ID**: Copy the App ID `2a22997e-c702-4180-afad-abab89a5aa4b`
   - This is `GUPSHUP_APP_ID`

#### Step 3: Create API Key
1. In the **Settings** tab, scroll to **API Keys** section
2. Click **"+ Create API key"** button
3. Give it a name (e.g., "Pod & Beyond Production" or "Pod & Beyond Staging")
4. Copy the generated API key immediately (you won't be able to see it again!)
   - This is `GUPSHUP_API_KEY`
   - Format: Usually looks like `mtpi6wvsuevqh0b g7dof8j6qijq6pyw6` (with space)

#### Step 4: Get WhatsApp Business Number
1. Go to **WhatsApp** → **Phone Numbers** (or similar section)
2. Find your registered WhatsApp Business number
3. Note down the **phone number** with country code (e.g., `919876543210`)
   - This is `GUPSHUP_SOURCE`
   - Remove any `+` signs, just digits

#### Step 5: Configure Webhook URL
1. Go to **Webhooks** tab in your Gupshup dashboard
2. Click **Add Webhook** or **Configure Webhook**
3. Set the webhook URL to:
   ```
   https://staging.capsulepodhotel.com/webhooks/gupshup
   ```
   (For production: `https://capsulepodhotel.com/webhooks/gupshup`)
4. Enable webhook events:
   - ✅ Message delivery status
   - ✅ Message read receipts  
   - ✅ Inbound messages
5. (Optional) Set a **Webhook Secret** for security - this is `GUPSHUP_WEBHOOK_SECRET`
   - If not available, we can use a custom secret

#### Step 6: Verify Sandbox Status
- Your app is currently in **Sandbox** mode
- For production, you'll need to get your app approved by Meta/Facebook
- Sandbox allows testing with up to 5 phone numbers

---

### Part 2: Information to Collect

Please provide me with these values from your dashboard:

```bash
GUPSHUP_ENABLED=true
GUPSHUP_API_KEY="<api-key-from-step-3>"
GUPSHUP_APP_ID="2a22997e-c702-4180-afad-abab89a5aa4b"
GUPSHUP_APP_NAME="podnbeyond"
GUPSHUP_SOURCE="<your-whatsapp-business-number>"
GUPSHUP_WEBHOOK_SECRET="<optional-webhook-secret>"
GUPSHUP_WEBHOOK_URL="https://staging.capsulepodhotel.com/webhooks/gupshup"
```

**Example format:**
```bash
GUPSHUP_ENABLED=true
GUPSHUP_API_KEY="mtpi6wvsuevqh0b g7dof8j6qijq6pyw6"
GUPSHUP_APP_ID="2a22997e-c702-4180-afad-abab89a5aa4b"
GUPSHUP_APP_NAME="podnbeyond"
GUPSHUP_SOURCE="919876543210"
GUPSHUP_WEBHOOK_SECRET="my_custom_secret_123"
GUPSHUP_WEBHOOK_URL="https://staging.capsulepodhotel.com/webhooks/gupshup"
```

---

### Part 3: What I'll Do After You Provide Credentials

Once you provide the credentials, I will:

1. ✅ Update your `.env` file (or staging environment variables)
2. ✅ Verify the API endpoint format matches Gupshup's current API
3. ✅ Test the webhook endpoint is accessible
4. ✅ Create a test script to verify connectivity
5. ✅ Update any API format differences if needed
6. ✅ Add the credentials to GitHub Actions secrets (for staging deployment)

---

### Part 4: Testing After Configuration

Once configured, we'll test:

1. **Send Test Message**: Use Communication Hub UI to send a WhatsApp message
2. **Check Database**: Verify message appears in `MessageLog` table
3. **Test Webhook**: Send a test message TO your number and verify webhook receives it
4. **Verify Delivery**: Check that delivery status updates are received

---

## Quick Checklist

- [ ] App ID copied from Settings (`2a22997e-c702-4180-afad-abab89a5aa4b`)
- [ ] API Key created in API Keys section
- [ ] WhatsApp Business number identified (with country code)
- [ ] Webhook URL configured in Webhooks tab
- [ ] Webhook secret set (optional but recommended)
- [ ] All values ready to share

---

## Notes

- **API Key**: Once created, copy it immediately - you can't view it again!
- **Sandbox Mode**: Currently in sandbox - limited to 5 test numbers
- **Production**: Will need Meta approval to go live
- **Webhook**: Must be HTTPS and publicly accessible

---

## Troubleshooting

If you encounter issues:
1. Verify API key is correct (no extra spaces)
2. Check webhook URL is accessible (should return 200 OK)
3. Verify phone number format (country code + number, no + sign)
4. Check Gupshup dashboard logs for API errors
5. Ensure webhook events are enabled in Gupshup dashboard
