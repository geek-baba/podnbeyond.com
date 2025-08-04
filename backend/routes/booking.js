const express = require('express');
const router = express.Router();

router.post('/book', async (req, res) => {
  res.json({ message: 'Booking route works' });
});

module.exports = router;
