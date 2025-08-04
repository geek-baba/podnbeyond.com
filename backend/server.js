const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

const bookingRoutes = require('./routes/booking');
const loyaltyRoutes = require('./routes/loyalty');
const paymentRoutes = require('./routes/payment');
const channelRoutes = require('./routes/channels');

app.use(cors());
app.use(express.json());
app.use('/api/booking', bookingRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/channels', channelRoutes);

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
