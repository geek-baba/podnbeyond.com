const express = require('express');
const cronService = require('../services/cronService');
const router = express.Router();

// Get cron service status
router.get('/status', async (req, res) => {
  try {
    const status = cronService.getStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting cron status:', error);
    res.status(500).json({ error: 'Failed to get cron status' });
  }
});

// Start cron service
router.post('/start', async (req, res) => {
  try {
    cronService.start();
    const status = cronService.getStatus();
    
    res.json({
      success: true,
      message: 'Cron service started successfully',
      status
    });
  } catch (error) {
    console.error('Error starting cron service:', error);
    res.status(500).json({ error: 'Failed to start cron service' });
  }
});

// Stop cron service
router.post('/stop', async (req, res) => {
  try {
    cronService.stop();
    
    res.json({
      success: true,
      message: 'Cron service stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping cron service:', error);
    res.status(500).json({ error: 'Failed to stop cron service' });
  }
});

// Manually trigger external bookings fetch
router.post('/trigger', async (req, res) => {
  try {
    // Trigger the fetch asynchronously
    cronService.triggerManualFetch().catch(error => {
      console.error('Error in manual trigger:', error);
    });
    
    res.json({
      success: true,
      message: 'External bookings fetch triggered successfully',
      note: 'Check server logs for detailed results'
    });
  } catch (error) {
    console.error('Error triggering manual fetch:', error);
    res.status(500).json({ error: 'Failed to trigger manual fetch' });
  }
});

// Get cron service logs (last N runs)
router.get('/logs', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // For now, return basic info since we don't store logs in DB
    // In a production system, you'd want to store logs in a database
    const status = cronService.getStatus();
    
    res.json({
      success: true,
      logs: {
        lastRun: status.lastRun,
        nextRun: status.nextRun,
        isRunning: status.isRunning,
        schedule: status.schedule,
        timezone: status.timezone
      },
      note: 'Detailed logs are available in server console output'
    });
  } catch (error) {
    console.error('Error getting cron logs:', error);
    res.status(500).json({ error: 'Failed to get cron logs' });
  }
});

module.exports = router; 