const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

const bookingRoutes = require('./routes/booking');
const loyaltyRoutes = require('./routes/loyalty');
const paymentRoutes = require('./routes/payment');
const channelRoutes = require('./routes/channels');
const cronRoutes = require('./routes/cron');

// Import cron service
const cronService = require('./services/cronService');

app.use(cors());
app.use(express.json());
app.use('/api/booking', bookingRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/cron', cronRoutes);

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
  
  // Start the cron service for external bookings
  cronService.start();
});
