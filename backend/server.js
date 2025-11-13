// CRITICAL: Set up error handlers FIRST before any other code
// PM2 captures console.log/error immediately, so use those for logging
process.on('uncaughtException', (error) => {
  try {
    console.error('❌ UNCAUGHT EXCEPTION');
    console.error('Error name: ' + (error.name || 'Unknown'));
    console.error('Error message: ' + (error.message || 'Unknown'));
    if (error.stack) {
      console.error('Stack trace: ' + error.stack);
    }
    if (error.code) {
      console.error('Error code: ' + error.code);
    }
  } catch (logErr) {
    // If we can't even log, try to write to stderr directly
    try {
      process.stderr.write('FATAL: Cannot log error\n');
      process.stderr.write(String(error) + '\n');
    } catch (e) {
      // Give up
    }
  }
  // Give PM2 time to capture logs before exiting
  setTimeout(() => process.exit(1), 2000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION');
  if (reason instanceof Error) {
    console.error('Error name: ' + reason.name);
    console.error('Error message: ' + reason.message);
    if (reason.stack) {
      console.error('Stack trace: ' + reason.stack);
    }
  } else {
    console.error('Reason: ' + String(reason));
  }
});

// Log startup immediately (before any requires)
// Use console.log for PM2 compatibility (PM2 buffers process.stdout.write)
console.log('🚀 Starting backend server...');
try {
  console.log('📁 Working directory: ' + process.cwd());
  console.log('📦 Node version: ' + process.version);
} catch (err) {
  console.error('Error logging startup info:', err);
  throw err;
}

// Try to require core modules with error handling
let express, cors, cookieParser, rateLimit;
try {
  console.log('Loading express...');
  express = require('express');
  console.log('Loading cors...');
  cors = require('cors');
  console.log('Loading cookie-parser...');
  cookieParser = require('cookie-parser');
  console.log('Loading express-rate-limit...');
  rateLimit = require('express-rate-limit');
  console.log('✓ Core modules loaded');
} catch (error) {
  console.error('❌ ERROR: Failed to load core modules');
  console.error(`Error: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 4000;

// Log startup information
console.log(`📍 Port: ${port}`);
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`🗄️  DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
console.log('');

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

// Load routes one by one to identify which one fails
const loadRoute = (name, path) => {
  try {
    console.log(`Loading route: ${name}...`);
    const route = require(path);
    console.log(`✓ Loaded route: ${name}`);
    return route;
  } catch (error) {
    console.error(`❌ ERROR: Failed to load route ${name} from ${path}`);
    console.error(`Error name: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    if (error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
    throw error; // Re-throw to be caught by outer try-catch
  }
};

try {
  console.log('Loading routes...');
  bookingRoutes = loadRoute('booking', './routes/booking');
  loyaltyRoutes = loadRoute('loyalty', './routes/loyalty');
  usersRoutes = loadRoute('users', './routes/users');
  paymentRoutes = loadRoute('payment', './routes/payment');
  channelRoutes = loadRoute('channels', './routes/channels');
  inventoryRoutes = loadRoute('inventory', './routes/inventory');
  bufferRuleRoutes = loadRoute('bufferRules', './routes/bufferRules');
  adminPropertiesRoutes = loadRoute('adminProperties', './routes/adminProperties');
  otaMappingRoutes = loadRoute('otaMappings', './routes/otaMappings');
  cronRoutes = loadRoute('cron', './routes/cron');
  cmsRoutes = loadRoute('cms', './routes/cms');
  notifyRoutes = loadRoute('notify', './routes/notify');
  voiceRoutes = loadRoute('voice', './routes/voice');
  webhookRoutes = loadRoute('webhooks', './routes/webhooks');
  conversationsRoutes = loadRoute('conversations', './routes/conversations');
  guestContextRoutes = loadRoute('guest-context', './routes/guest-context');
  templatesRoutes = loadRoute('templates', './routes/templates');
  analyticsRoutes = loadRoute('analytics', './routes/analytics');
  
  console.log('Loading realtime module...');
  const realtimeModule = loadRoute('realtime', './routes/realtime');
  realtimeRoutes = realtimeModule.router;
  broadcastEvent = realtimeModule.broadcastEvent;
  
  console.log('Loading holdReleaseJob...');
  const holdReleaseJobModule = require('./jobs/holdReleaseJob');
  initHoldReleaseJob = holdReleaseJobModule.initHoldReleaseJob;
  console.log('✓ All routes loaded successfully');
  console.log('');
} catch (error) {
  console.error('❌ ERROR: Failed to load routes');
  console.error(`Error name: ${error.name}`);
  console.error(`Error message: ${error.message}`);
  if (error.stack) {
    console.error(`Stack trace: ${error.stack}`);
  }
  // Exit immediately - server cannot start without routes
  process.exit(1);
}

// Make broadcastEvent available globally for use in other modules
global.broadcastEvent = broadcastEvent;

// Import cron service with error handling
let cronService;
try {
  console.log('Loading cronService...');
  cronService = require('./services/cronService');
  console.log('✓ cronService loaded');
} catch (error) {
  console.error('❌ ERROR: Failed to load cronService');
  console.error(`Error: ${error.message}`);
  if (error.stack) {
    console.error(`Stack: ${error.stack}`);
  }
  console.error('⚠️  Server will continue to start, but cron service will not be available');
  // Don't exit - allow server to start without cron service
  cronService = null;
}

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
    console.log('');
    
    // Start the cron service for external bookings (disabled for local development)
    // Uncomment the line below to enable external booking sync on production
    if (cronService) {
      // cronService.start();
      console.log('ℹ️  Cron service disabled for local development');
    } else {
      console.log('⚠️  Cron service not available (failed to load)');
    }

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
  console.error('❌ ERROR: Failed to start server');
  console.error(`Error name: ${error.name}`);
  console.error(`Error message: ${error.message}`);
  if (error.stack) {
    console.error(`Stack trace: ${error.stack}`);
  }
  // Exit immediately - server cannot start
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
