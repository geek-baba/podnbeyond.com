const express = require('express');
const ChannelManager = require('../modules/channelManager');
const router = express.Router();

const channelManager = new ChannelManager();

// Get all channels status
router.get('/status', async (req, res) => {
  try {
    const statuses = await channelManager.getAllChannelsStatus();
    res.json({
      success: true,
      channels: statuses
    });
  } catch (error) {
    console.error('Error fetching channel statuses:', error);
    res.status(500).json({ error: 'Failed to fetch channel statuses' });
  }
});

// Get specific channel status
router.get('/status/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const status = await channelManager.getChannelStatus(channelId);
    res.json({
      success: true,
      channel: channelId,
      status
    });
  } catch (error) {
    console.error('Error fetching channel status:', error);
    res.status(500).json({ error: 'Failed to fetch channel status' });
  }
});

// Get enabled channels
router.get('/enabled', async (req, res) => {
  try {
    const enabledChannels = channelManager.getEnabledChannels();
    res.json({
      success: true,
      channels: enabledChannels
    });
  } catch (error) {
    console.error('Error fetching enabled channels:', error);
    res.status(500).json({ error: 'Failed to fetch enabled channels' });
  }
});

// Sync availability with external channel
router.post('/:channelId/sync-availability', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { startDate, endDate, rooms } = req.body;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Start date and end date are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ 
        error: 'End date must be after start date' 
      });
    }

    const result = await channelManager.syncAvailability(channelId, start, end, rooms);
    
    res.json({
      success: true,
      channel: channelId,
      result
    });

  } catch (error) {
    console.error('Error syncing availability:', error);
    res.status(500).json({ 
      error: 'Failed to sync availability',
      message: error.message 
    });
  }
});

// Push booking to external channel
router.post('/:channelId/push-booking', async (req, res) => {
  try {
    const { channelId } = req.params;
    const bookingData = req.body;

    // Validate booking data
    if (!bookingData) {
      return res.status(400).json({ 
        error: 'Booking data is required' 
      });
    }

    const result = await channelManager.pushBooking(channelId, bookingData);
    
    res.json({
      success: true,
      channel: channelId,
      result
    });

  } catch (error) {
    console.error('Error pushing booking:', error);
    res.status(500).json({ 
      error: 'Failed to push booking',
      message: error.message 
    });
  }
});

// Fetch external bookings from channel
router.get('/:channelId/bookings', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Start date and end date are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ 
        error: 'End date must be after start date' 
      });
    }

    const result = await channelManager.fetchExternalBookings(channelId, start, end);
    
    res.json({
      success: true,
      channel: channelId,
      result
    });

  } catch (error) {
    console.error('Error fetching external bookings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch external bookings',
      message: error.message 
    });
  }
});

// Bulk sync availability for all enabled channels
router.post('/sync-all-availability', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Start date and end date are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ 
        error: 'End date must be after start date' 
      });
    }

    const enabledChannels = channelManager.getEnabledChannels();
    const results = [];

    // Sync availability for all enabled channels
    for (const channel of enabledChannels) {
      try {
        const result = await channelManager.syncAvailability(
          channel.channelId, 
          start, 
          end
        );
        results.push({
          channel: channel.channelId,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          channel: channel.channelId,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Synced availability for ${enabledChannels.length} channels`,
      results
    });

  } catch (error) {
    console.error('Error in bulk sync:', error);
    res.status(500).json({ 
      error: 'Failed to sync all channels',
      message: error.message 
    });
  }
});

// Get room availability for channel sync
router.get('/room-availability', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Start date and end date are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ 
        error: 'End date must be after start date' 
      });
    }

    const availability = await channelManager.getRoomAvailability(start, end);
    
    res.json({
      success: true,
      availability,
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching room availability:', error);
    res.status(500).json({ 
      error: 'Failed to fetch room availability',
      message: error.message 
    });
  }
});

// Test channel connectivity
router.post('/:channelId/test', async (req, res) => {
  try {
    const { channelId } = req.params;
    
    // Test basic channel operations
    const status = await channelManager.getChannelStatus(channelId);
    
    if (!status.enabled) {
      return res.status(400).json({
        success: false,
        error: 'Channel is not enabled'
      });
    }

    if (!status.configured) {
      return res.status(400).json({
        success: false,
        error: 'Channel is not properly configured'
      });
    }

    // Test availability sync with sample data
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const testRooms = [
      {
        roomId: 1,
        roomType: 'Standard Room',
        price: 120,
        capacity: 2,
        totalRooms: 1,
        availableRooms: 1,
        bookings: []
      }
    ];

    const syncResult = await channelManager.syncAvailability(
      channelId, 
      startDate, 
      endDate, 
      testRooms
    );

    res.json({
      success: true,
      channel: channelId,
      status,
      testResult: {
        syncTest: syncResult,
        message: 'Channel connectivity test completed successfully'
      }
    });

  } catch (error) {
    console.error('Error testing channel:', error);
    res.status(500).json({ 
      error: 'Channel test failed',
      message: error.message 
    });
  }
});

module.exports = router; 