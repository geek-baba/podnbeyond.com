/**
 * Test script for Gupshup integration
 * Run: node scripts/test-gupshup.js <phone-number>
 */

require('dotenv').config({ path: '.env' });
const { sendWhatsAppMessage } = require('../services/gupshup');

const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('Usage: node scripts/test-gupshup.js <phone-number>');
  console.error('Example: node scripts/test-gupshup.js 919876543210');
  process.exit(1);
}

async function testGupshup() {
  console.log('🧪 Testing Gupshup WhatsApp Integration...\n');
  console.log('Configuration:');
  console.log(`  API Key: ${process.env.GUPSHUP_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  App ID: ${process.env.GUPSHUP_APP_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`  App Name: ${process.env.GUPSHUP_APP_NAME || '❌ Missing'}`);
  console.log(`  Source: ${process.env.GUPSHUP_SOURCE || '❌ Missing'}`);
  console.log(`  Phone: ${phoneNumber}\n`);

  try {
    const result = await sendWhatsAppMessage({
      phone: phoneNumber,
      message: 'Hello from Pod & Beyond! This is a test message from Gupshup integration. 🎉',
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      console.log('✅ Message sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Provider Message ID: ${result.providerMessageId}`);
      console.log(`   Status: ${result.status}`);
    } else {
      console.error('❌ Failed to send message:');
      console.error(`   Error: ${result.error}`);
      if (result.code) {
        console.error(`   Code: ${result.code}`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testGupshup();

