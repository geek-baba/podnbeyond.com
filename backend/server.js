// Add error handler for unhandled errors
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  console.error('Stack trace:', error.stack);
  // Don't exit immediately - let PM2 handle it
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const app = express();
const port = process.env.PORT || 4000;

// Log startup information
console.log('🚀 Starting backend server...');
console.log(`📍 Port: ${port}`);
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`🗄️  DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for testing (was 5)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again after 15 minutes',
      retryAfter: 900 // 15 minutes in seconds
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many API requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for admin operations
  message: 'Too many admin requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Load routes with error handling to prevent startup failures
let bookingRoutes, loyaltyRoutes, usersRoutes, paymentRoutes, channelRoutes;
let inventoryRoutes, bufferRuleRoutes, adminPropertiesRoutes, otaMappingRoutes;
let cronRoutes, cmsRoutes, notifyRoutes, voiceRoutes, webhookRoutes;
let conversationsRoutes, guestContextRoutes, templatesRoutes, analyticsRoutes;
let realtimeRoutes, broadcastEvent, initHoldReleaseJob;

try {
  bookingRoutes = require('./routes/booking');
  loyaltyRoutes = require('./routes/loyalty');
  usersRoutes = require('./routes/users');
  paymentRoutes = require('./routes/payment');
  channelRoutes = require('./routes/channels');
  inventoryRoutes = require('./routes/inventory');
  bufferRuleRoutes = require('./routes/bufferRules');
  adminPropertiesRoutes = require('./routes/adminProperties');
  otaMappingRoutes = require('./routes/otaMappings');
  cronRoutes = require('./routes/cron');
  cmsRoutes = require('./routes/cms');
  notifyRoutes = require('./routes/notify');
  voiceRoutes = require('./routes/voice');
  webhookRoutes = require('./routes/webhooks');
  conversationsRoutes = require('./routes/conversations');
  guestContextRoutes = require('./routes/guest-context');
  templatesRoutes = require('./routes/templates');
  analyticsRoutes = require('./routes/analytics');
  const realtimeModule = require('./routes/realtime');
  realtimeRoutes = realtimeModule.router;
  broadcastEvent = realtimeModule.broadcastEvent;
  initHoldReleaseJob = require('./jobs/holdReleaseJob').initHoldReleaseJob;
} catch (error) {
  console.error('❌ ERROR: Failed to load routes:', error);
  console.error('Stack trace:', error.stack);
  // Exit with error code so PM2 knows the process failed
  process.exit(1);
}

// Make broadcastEvent available globally for use in other modules
global.broadcastEvent = broadcastEvent;

// Import cron service
const cronService = require('./services/cronService');

// Trust proxy (nginx) for rate limiting and security
// Trust only the first proxy (nginx) - more secure than 'true'
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Auth routes (session management) - Strict rate limiting
try {
  app.use('/api/auth', authLimiter, require('./routes/auth'));
} catch (error) {
  console.error('Warning: Failed to load auth route:', error.message);
}
try {
  app.use('/api/account', apiLimiter, require('./routes/account'));
} catch (error) {
  console.error('Warning: Failed to load account route:', error.message);
}

// OTP authentication - Strict rate limiting
try {
  app.use('/api/otp', authLimiter, require('./routes/otp'));
} catch (error) {
  console.error('Warning: Failed to load otp route:', error.message);
}

// Admin routes - Higher limit
try {
  app.use('/api/admin/invites', adminLimiter, require('./routes/invites'));
} catch (error) {
  console.error('Warning: Failed to load invites route:', error.message);
}
app.use('/api/users', adminLimiter, usersRoutes);

// Email routes (Postmark integration)
try {
  app.use('/api/email/send', apiLimiter, require('./routes/email').router || require('./routes/email'));
  app.use('/api/email/inbound', require('./routes/emailInbound')); // No rate limit for webhooks
  app.use('/api/email/events', require('./routes/emailEvents')); // No rate limit for webhooks
  app.use('/api/email', apiLimiter, require('./routes/email')); // Other email endpoints
} catch (error) {
  console.error('Warning: Failed to load email routes:', error.message);
}

// Business routes - General API limiting
app.use('/api/booking', apiLimiter, bookingRoutes);
app.use('/api/inventory', apiLimiter, inventoryRoutes);
app.use('/api/admin/buffer-rules', adminLimiter, bufferRuleRoutes);
app.use('/api/admin/properties', adminLimiter, adminPropertiesRoutes);
app.use('/api/loyalty', apiLimiter, loyaltyRoutes);
app.use('/api/payment', apiLimiter, paymentRoutes);
app.use('/api/channels', apiLimiter, channelRoutes);
app.use('/api/cron', apiLimiter, cronRoutes);
app.use('/api/cms', apiLimiter, cmsRoutes);
try {
  app.use('/api/gallery', apiLimiter, require('./routes/gallery'));
} catch (error) {
  console.error('Warning: Failed to load gallery route:', error.message);
}
try {
  app.use('/api/properties', apiLimiter, require('./routes/properties'));
} catch (error) {
  console.error('Warning: Failed to load properties route:', error.message);
}
// Integrations route - wrapped in try-catch to prevent startup failures
try {
  app.use('/api/integrations', adminLimiter, require('./routes/integrations'));
} catch (error) {
  console.error('Warning: Failed to load integrations route:', error.message);
  // Server will continue to start even if integrations route fails to load
}
try {
  app.use('/api/brands', apiLimiter, require('./routes/brands'));
} catch (error) {
  console.error('Warning: Failed to load brands route:', error.message);
}
app.use('/api/admin/ota-mappings', adminLimiter, otaMappingRoutes);

// Communication integration routes
app.use('/api/notify', apiLimiter, notifyRoutes);
app.use('/api/voice', apiLimiter, voiceRoutes);
app.use('/api/conversations', apiLimiter, conversationsRoutes);
app.use('/api/guest-context', apiLimiter, guestContextRoutes);
app.use('/api/templates', adminLimiter, templatesRoutes);
app.use('/api/analytics', adminLimiter, analyticsRoutes);
app.use('/api/realtime', realtimeRoutes); // No rate limit for SSE
app.use('/webhooks', webhookRoutes); // No rate limit for webhooks

// Health check endpoint for deployment
app.get('/api/health', (req, res) => {
  try {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Start server with error handling
try {
  app.listen(port, () => {
    console.log(`✅ Backend running at http://localhost:${port}`);
    console.log(`✅ Server started successfully at ${new Date().toISOString()}`);
    
    // Start the cron service for external bookings (disabled for local development)
    // Uncomment the line below to enable external booking sync on production
    // cronService.start();
    console.log('ℹ️  Cron service disabled for local development');

    // Initialize hold release job (wrapped in try-catch to prevent startup failures)
    try {
      initHoldReleaseJob();
    } catch (error) {
      console.error('Warning: Failed to initialize hold release job:', error.message);
      console.error('Server will continue to run without hold release job');
      // Server will continue to run even if hold release job fails to initialize
    }
  });
} catch (error) {
  console.error('❌ ERROR: Failed to start server:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

// Handle server errors
app.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Handle process errors
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
