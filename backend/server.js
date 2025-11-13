const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// Trust proxy (for production behind Nginx)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
const bookingRoutes = require('./routes/booking');
const guestRoutes = require('./routes/guest');
const cancellationPolicyRoutes = require('./routes/cancellationPolicy');
const paymentRoutes = require('./routes/payment');
const otpRoutes = require('./routes/otp');
const authRoutes = require('./routes/auth');

app.use('/api', bookingRoutes);
app.use('/api', guestRoutes);
app.use('/api', cancellationPolicyRoutes);
app.use('/api', paymentRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Only start server if this file is run directly (not when required)
if (require.main === module) {
  const PORT = process.env.PORT || 4000;

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📝 Booking routes: /api/bookings`);
    console.log(`👤 Guest routes: /api/guest/bookings`);
    console.log(`📋 Cancellation policy routes: /api/cancellation-policies`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

module.exports = app;

