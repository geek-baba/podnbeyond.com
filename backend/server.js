const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const app = express();
const port = process.env.PORT || 4000;

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

const bookingRoutes = require('./routes/booking');
const loyaltyRoutes = require('./routes/loyalty');
const usersRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payment');
const channelRoutes = require('./routes/channels');
const inventoryRoutes = require('./routes/inventory');
const bufferRuleRoutes = require('./routes/bufferRules');
const adminPropertiesRoutes = require('./routes/adminProperties');
const otaMappingRoutes = require('./routes/otaMappings');
const cronRoutes = require('./routes/cron');
const cmsRoutes = require('./routes/cms');
const notifyRoutes = require('./routes/notify');
const voiceRoutes = require('./routes/voice');
const webhookRoutes = require('./routes/webhooks');
const { initHoldReleaseJob } = require('./jobs/holdReleaseJob');

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
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/account', apiLimiter, require('./routes/account'));

// OTP authentication - Strict rate limiting
app.use('/api/otp', authLimiter, require('./routes/otp'));

// Admin routes - Higher limit
app.use('/api/admin/invites', adminLimiter, require('./routes/invites'));
app.use('/api/users', adminLimiter, usersRoutes);

// Email routes (Postmark integration)
app.use('/api/email/send', apiLimiter, require('./routes/email').router || require('./routes/email'));
app.use('/api/email/inbound', require('./routes/emailInbound')); // No rate limit for webhooks
app.use('/api/email/events', require('./routes/emailEvents')); // No rate limit for webhooks
app.use('/api/email', apiLimiter, require('./routes/email')); // Other email endpoints

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
app.use('/api/gallery', apiLimiter, require('./routes/gallery'));
app.use('/api/properties', apiLimiter, require('./routes/properties'));
// Integrations route - wrapped in try-catch to prevent startup failures
try {
  app.use('/api/integrations', adminLimiter, require('./routes/integrations'));
} catch (error) {
  console.error('Warning: Failed to load integrations route:', error.message);
  // Server will continue to start even if integrations route fails to load
}
app.use('/api/brands', apiLimiter, require('./routes/brands'));
app.use('/api/admin/ota-mappings', adminLimiter, otaMappingRoutes);

// Communication integration routes
app.use('/api/notify', apiLimiter, notifyRoutes);
app.use('/api/voice', apiLimiter, voiceRoutes);
app.use('/webhooks', webhookRoutes); // No rate limit for webhooks

// Health check endpoint for deployment
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
  
  // Start the cron service for external bookings (disabled for local development)
  // Uncomment the line below to enable external booking sync on production
  // cronService.start();
  console.log('ℹ️  Cron service disabled for local development');

  initHoldReleaseJob();
});
