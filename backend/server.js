const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

const bookingRoutes = require('./routes/booking');
const loyaltyRoutes = require('./routes/loyalty');
const paymentRoutes = require('./routes/payment');
const channelRoutes = require('./routes/channels');
const cronRoutes = require('./routes/cron');
const cmsRoutes = require('./routes/cms');

// Import cron service
const cronService = require('./services/cronService');

app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));
app.use('/api/booking', bookingRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/brands', require('./routes/brands'));

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
});
