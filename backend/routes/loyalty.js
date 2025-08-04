const express = require('express');
const router = express.Router();

router.get('/points', async (req, res) => {
  res.json({ points: 1200 });
});

module.exports = router;
