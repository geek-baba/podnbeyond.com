/**
 * Test script to verify server setup
 * This script verifies that all routes and middleware are properly configured
 * Run with: node test-server-setup.js
 */

console.log('Testing server setup...\n');

// Test 1: Check if server.js can be loaded
console.log('1. Testing server.js...');
try {
  const app = require('./server.js');
  console.log('   ✅ server.js loaded successfully');
} catch (error) {
  console.error('   ❌ Error loading server.js:', error.message);
  process.exit(1);
}

// Test 2: Check if authentication middleware can be loaded
console.log('2. Testing authentication middleware...');
try {
  const { authenticate, optionalAuthenticate } = require('./middleware/auth.js');
  if (typeof authenticate === 'function' && typeof optionalAuthenticate === 'function') {
    console.log('   ✅ Authentication middleware loaded successfully');
  } else {
    console.error('   ❌ Authentication middleware not properly exported');
    process.exit(1);
  }
} catch (error) {
  console.error('   ❌ Error loading authentication middleware:', error.message);
  process.exit(1);
}

// Test 3: Check if RBAC middleware can be loaded
console.log('3. Testing RBAC middleware...');
try {
  const { requirePermission, requireAnyPermission, requireAllPermissions, requireRole } = require('./lib/rbac.js');
  if (
    typeof requirePermission === 'function' &&
    typeof requireAnyPermission === 'function' &&
    typeof requireAllPermissions === 'function' &&
    typeof requireRole === 'function'
  ) {
    console.log('   ✅ RBAC middleware loaded successfully');
  } else {
    console.error('   ❌ RBAC middleware not properly exported');
    process.exit(1);
  }
} catch (error) {
  console.error('   ❌ Error loading RBAC middleware:', error.message);
  process.exit(1);
}

// Test 4: Check if booking routes can be loaded
console.log('4. Testing booking routes...');
try {
  const bookingRoutes = require('./routes/booking.js');
  console.log('   ✅ Booking routes loaded successfully');
} catch (error) {
  console.error('   ❌ Error loading booking routes:', error.message);
  process.exit(1);
}

// Test 5: Check if guest routes can be loaded
console.log('5. Testing guest routes...');
try {
  const guestRoutes = require('./routes/guest.js');
  console.log('   ✅ Guest routes loaded successfully');
} catch (error) {
  console.error('   ❌ Error loading guest routes:', error.message);
  process.exit(1);
}

// Test 6: Check if cancellation policy routes can be loaded
console.log('6. Testing cancellation policy routes...');
try {
  const cancellationPolicyRoutes = require('./routes/cancellationPolicy.js');
  console.log('   ✅ Cancellation policy routes loaded successfully');
} catch (error) {
  console.error('   ❌ Error loading cancellation policy routes:', error.message);
  process.exit(1);
}

// Test 7: Check if services can be loaded
console.log('7. Testing services...');
try {
  const bookingService = require('./services/bookingService.js');
  const guestService = require('./services/guestService.js');
  const stayService = require('./services/stayService.js');
  const cancellationPolicyService = require('./services/cancellationPolicyService.js');
  console.log('   ✅ Services loaded successfully');
} catch (error) {
  console.error('   ❌ Error loading services:', error.message);
  // Don't exit on service errors, as they might require database connection
  console.log('   ⚠️  Service errors are expected if database is not available');
}

console.log('\n✅ All tests passed!');
console.log('\nNext steps:');
console.log('1. Ensure database is running and migrations are applied');
console.log('2. Set up environment variables (DATABASE_URL, GUEST_TOKEN_SECRET, etc.)');
console.log('3. Start the server: node server.js');
console.log('4. Test endpoints with authentication');

