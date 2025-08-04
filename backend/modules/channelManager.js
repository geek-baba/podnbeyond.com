const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Channel Manager for External Travel Platform Integrations
 * Handles synchronization with MakeMyTrip, Yatra, and other OTAs
 */
class ChannelManager {
  constructor() {
    this.supportedChannels = {
      MAKEMYTRIP: 'makemytrip',
      YATRA: 'yatra',
      GOIBIBO: 'goibibo',
      BOOKING_COM: 'booking_com',
      AGODA: 'agoda'
    };
    
    this.channelConfigs = {
      [this.supportedChannels.MAKEMYTRIP]: {
        name: 'MakeMyTrip',
        apiBaseUrl: process.env.MAKEMYTRIP_API_URL || 'https://api.makemytrip.com',
        apiKey: process.env.MAKEMYTRIP_API_KEY,
        secretKey: process.env.MAKEMYTRIP_SECRET_KEY,
        hotelId: process.env.MAKEMYTRIP_HOTEL_ID,
        enabled: process.env.MAKEMYTRIP_ENABLED === 'true'
      },
      [this.supportedChannels.YATRA]: {
        name: 'Yatra',
        apiBaseUrl: process.env.YATRA_API_URL || 'https://api.yatra.com',
        apiKey: process.env.YATRA_API_KEY,
        secretKey: process.env.YATRA_SECRET_KEY,
        hotelId: process.env.YATRA_HOTEL_ID,
        enabled: process.env.YATRA_ENABLED === 'true'
      },
      [this.supportedChannels.GOIBIBO]: {
        name: 'Goibibo',
        apiBaseUrl: process.env.GOIBIBO_API_URL || 'https://api.goibibo.com',
        apiKey: process.env.GOIBIBO_API_KEY,
        secretKey: process.env.GOIBIBO_SECRET_KEY,
        hotelId: process.env.GOIBIBO_HOTEL_ID,
        enabled: process.env.GOIBIBO_ENABLED === 'true'
      },
      [this.supportedChannels.BOOKING_COM]: {
        name: 'Booking.com',
        apiBaseUrl: process.env.BOOKING_API_URL || 'https://api.booking.com',
        apiKey: process.env.BOOKING_API_KEY,
        secretKey: process.env.BOOKING_SECRET_KEY,
        hotelId: process.env.BOOKING_HOTEL_ID,
        enabled: process.env.BOOKING_ENABLED === 'true'
      },
      [this.supportedChannels.AGODA]: {
        name: 'Agoda',
        apiBaseUrl: process.env.AGODA_API_URL || 'https://api.agoda.com',
        apiKey: process.env.AGODA_API_KEY,
        secretKey: process.env.AGODA_SECRET_KEY,
        hotelId: process.env.AGODA_HOTEL_ID,
        enabled: process.env.AGODA_ENABLED === 'true'
      }
    };
  }

  /**
   * Get list of enabled channels
   */
  getEnabledChannels() {
    return Object.entries(this.channelConfigs)
      .filter(([key, config]) => config.enabled)
      .map(([key, config]) => ({
        channelId: key,
        name: config.name,
        apiBaseUrl: config.apiBaseUrl,
        hotelId: config.hotelId
      }));
  }

  /**
   * Get channel configuration
   */
  getChannelConfig(channelId) {
    return this.channelConfigs[channelId];
  }

  /**
   * Validate channel configuration
   */
  validateChannelConfig(channelId) {
    const config = this.getChannelConfig(channelId);
    if (!config) {
      throw new Error(`Channel ${channelId} not found`);
    }
    if (!config.enabled) {
      throw new Error(`Channel ${channelId} is not enabled`);
    }
    if (!config.apiKey || !config.secretKey) {
      throw new Error(`Channel ${channelId} missing API credentials`);
    }
    return config;
  }

  /**
   * Sync room availability with external channels
   * @param {string} channelId - Channel identifier
   * @param {Date} startDate - Start date for availability sync
   * @param {Date} endDate - End date for availability sync
   * @param {Array} rooms - Array of room availability data
   */
  async syncAvailability(channelId, startDate, endDate, rooms = null) {
    try {
      console.log(`🔄 Syncing availability for channel: ${channelId}`);
      
      const config = this.validateChannelConfig(channelId);
      
      // If no rooms provided, fetch from database
      if (!rooms) {
        rooms = await this.getRoomAvailability(startDate, endDate);
      }

      // Channel-specific availability sync
      switch (channelId) {
        case this.supportedChannels.MAKEMYTRIP:
          return await this.syncMakeMyTripAvailability(config, startDate, endDate, rooms);
        
        case this.supportedChannels.YATRA:
          return await this.syncYatraAvailability(config, startDate, endDate, rooms);
        
        case this.supportedChannels.GOIBIBO:
          return await this.syncGoibiboAvailability(config, startDate, endDate, rooms);
        
        case this.supportedChannels.BOOKING_COM:
          return await this.syncBookingAvailability(config, startDate, endDate, rooms);
        
        case this.supportedChannels.AGODA:
          return await this.syncAgodaAvailability(config, startDate, endDate, rooms);
        
        default:
          throw new Error(`Unsupported channel: ${channelId}`);
      }
    } catch (error) {
      console.error(`❌ Error syncing availability for ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Push booking to external channel
   * @param {string} channelId - Channel identifier
   * @param {Object} bookingData - Booking information
   */
  async pushBooking(channelId, bookingData) {
    try {
      console.log(`📤 Pushing booking to channel: ${channelId}`);
      
      const config = this.validateChannelConfig(channelId);
      
      // Validate booking data
      this.validateBookingData(bookingData);
      
      // Channel-specific booking push
      switch (channelId) {
        case this.supportedChannels.MAKEMYTRIP:
          return await this.pushMakeMyTripBooking(config, bookingData);
        
        case this.supportedChannels.YATRA:
          return await this.pushYatraBooking(config, bookingData);
        
        case this.supportedChannels.GOIBIBO:
          return await this.pushGoibiboBooking(config, bookingData);
        
        case this.supportedChannels.BOOKING_COM:
          return await this.pushBookingComBooking(config, bookingData);
        
        case this.supportedChannels.AGODA:
          return await this.pushAgodaBooking(config, bookingData);
        
        default:
          throw new Error(`Unsupported channel: ${channelId}`);
      }
    } catch (error) {
      console.error(`❌ Error pushing booking to ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch bookings from external channel
   * @param {string} channelId - Channel identifier
   * @param {Date} startDate - Start date for booking fetch
   * @param {Date} endDate - End date for booking fetch
   */
  async fetchExternalBookings(channelId, startDate, endDate) {
    try {
      console.log(`📥 Fetching external bookings from channel: ${channelId}`);
      
      const config = this.validateChannelConfig(channelId);
      
      // Channel-specific booking fetch
      switch (channelId) {
        case this.supportedChannels.MAKEMYTRIP:
          return await this.fetchMakeMyTripBookings(config, startDate, endDate);
        
        case this.supportedChannels.YATRA:
          return await this.fetchYatraBookings(config, startDate, endDate);
        
        case this.supportedChannels.GOIBIBO:
          return await this.fetchGoibiboBookings(config, startDate, endDate);
        
        case this.supportedChannels.BOOKING_COM:
          return await this.fetchBookingComBookings(config, startDate, endDate);
        
        case this.supportedChannels.AGODA:
          return await this.fetchAgodaBookings(config, startDate, endDate);
        
        default:
          throw new Error(`Unsupported channel: ${channelId}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching external bookings from ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Get room availability from database
   */
  async getRoomAvailability(startDate, endDate) {
    try {
      const rooms = await prisma.room.findMany({
        include: {
          bookings: {
            where: {
              checkIn: { lte: endDate },
              checkOut: { gte: startDate },
              status: { in: ['PENDING', 'CONFIRMED'] }
            }
          }
        }
      });

      return rooms.map(room => ({
        roomId: room.id,
        roomType: room.type,
        price: room.price,
        capacity: room.capacity,
        totalRooms: 1, // Assuming 1 room per type for now
        availableRooms: room.bookings.length === 0 ? 1 : 0,
        bookings: room.bookings.map(booking => ({
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          status: booking.status
        }))
      }));
    } catch (error) {
      console.error('Error fetching room availability:', error);
      throw error;
    }
  }

  /**
   * Validate booking data structure
   */
  validateBookingData(bookingData) {
    const requiredFields = [
      'guestName', 'email', 'checkIn', 'checkOut', 
      'guests', 'roomType', 'totalPrice'
    ];
    
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate dates
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    
    if (checkIn >= checkOut) {
      throw new Error('Check-out date must be after check-in date');
    }
    
    if (checkIn < new Date()) {
      throw new Error('Check-in date cannot be in the past');
    }
  }

  // ===== MakeMyTrip Integration Methods =====
  
  async syncMakeMyTripAvailability(config, startDate, endDate, rooms) {
    // TODO: Implement MakeMyTrip availability sync
    console.log(`🔄 [MakeMyTrip] Syncing availability for ${rooms.length} rooms`);
    console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Placeholder implementation
    return {
      success: true,
      channel: 'MakeMyTrip',
      syncedRooms: rooms.length,
      message: 'Availability sync completed (placeholder)'
    };
  }

  async pushMakeMyTripBooking(config, bookingData) {
    // TODO: Implement MakeMyTrip booking push
    console.log(`📤 [MakeMyTrip] Pushing booking for ${bookingData.guestName}`);
    
    // Placeholder implementation
    return {
      success: true,
      channel: 'MakeMyTrip',
      externalBookingId: `MMT_${Date.now()}`,
      message: 'Booking pushed successfully (placeholder)'
    };
  }

  async fetchMakeMyTripBookings(config, startDate, endDate) {
    // TODO: Implement MakeMyTrip booking fetch
    console.log(`📥 [MakeMyTrip] Fetching bookings from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Placeholder implementation
    return {
      success: true,
      channel: 'MakeMyTrip',
      bookings: [],
      message: 'No external bookings found (placeholder)'
    };
  }

  // ===== Yatra Integration Methods =====
  
  async syncYatraAvailability(config, startDate, endDate, rooms) {
    // TODO: Implement Yatra availability sync
    console.log(`🔄 [Yatra] Syncing availability for ${rooms.length} rooms`);
    console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Placeholder implementation
    return {
      success: true,
      channel: 'Yatra',
      syncedRooms: rooms.length,
      message: 'Availability sync completed (placeholder)'
    };
  }

  async pushYatraBooking(config, bookingData) {
    // TODO: Implement Yatra booking push
    console.log(`📤 [Yatra] Pushing booking for ${bookingData.guestName}`);
    
    // Placeholder implementation
    return {
      success: true,
      channel: 'Yatra',
      externalBookingId: `YATRA_${Date.now()}`,
      message: 'Booking pushed successfully (placeholder)'
    };
  }

  async fetchYatraBookings(config, startDate, endDate) {
    // TODO: Implement Yatra booking fetch
    console.log(`📥 [Yatra] Fetching bookings from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Placeholder implementation
    return {
      success: true,
      channel: 'Yatra',
      bookings: [],
      message: 'No external bookings found (placeholder)'
    };
  }

  // ===== Goibibo Integration Methods =====
  
  async syncGoibiboAvailability(config, startDate, endDate, rooms) {
    // TODO: Implement Goibibo availability sync
    console.log(`🔄 [Goibibo] Syncing availability for ${rooms.length} rooms`);
    
    return {
      success: true,
      channel: 'Goibibo',
      syncedRooms: rooms.length,
      message: 'Availability sync completed (placeholder)'
    };
  }

  async pushGoibiboBooking(config, bookingData) {
    // TODO: Implement Goibibo booking push
    console.log(`📤 [Goibibo] Pushing booking for ${bookingData.guestName}`);
    
    return {
      success: true,
      channel: 'Goibibo',
      externalBookingId: `GOIBIBO_${Date.now()}`,
      message: 'Booking pushed successfully (placeholder)'
    };
  }

  async fetchGoibiboBookings(config, startDate, endDate) {
    // TODO: Implement Goibibo booking fetch
    console.log(`📥 [Goibibo] Fetching bookings from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    return {
      success: true,
      channel: 'Goibibo',
      bookings: [],
      message: 'No external bookings found (placeholder)'
    };
  }

  // ===== Booking.com Integration Methods =====
  
  async syncBookingAvailability(config, startDate, endDate, rooms) {
    // TODO: Implement Booking.com availability sync
    console.log(`🔄 [Booking.com] Syncing availability for ${rooms.length} rooms`);
    
    return {
      success: true,
      channel: 'Booking.com',
      syncedRooms: rooms.length,
      message: 'Availability sync completed (placeholder)'
    };
  }

  async pushBookingComBooking(config, bookingData) {
    // TODO: Implement Booking.com booking push
    console.log(`📤 [Booking.com] Pushing booking for ${bookingData.guestName}`);
    
    return {
      success: true,
      channel: 'Booking.com',
      externalBookingId: `BOOKING_${Date.now()}`,
      message: 'Booking pushed successfully (placeholder)'
    };
  }

  async fetchBookingComBookings(config, startDate, endDate) {
    // TODO: Implement Booking.com booking fetch
    console.log(`📥 [Booking.com] Fetching bookings from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    return {
      success: true,
      channel: 'Booking.com',
      bookings: [],
      message: 'No external bookings found (placeholder)'
    };
  }

  // ===== Agoda Integration Methods =====
  
  async syncAgodaAvailability(config, startDate, endDate, rooms) {
    // TODO: Implement Agoda availability sync
    console.log(`🔄 [Agoda] Syncing availability for ${rooms.length} rooms`);
    
    return {
      success: true,
      channel: 'Agoda',
      syncedRooms: rooms.length,
      message: 'Availability sync completed (placeholder)'
    };
  }

  async pushAgodaBooking(config, bookingData) {
    // TODO: Implement Agoda booking push
    console.log(`📤 [Agoda] Pushing booking for ${bookingData.guestName}`);
    
    return {
      success: true,
      channel: 'Agoda',
      externalBookingId: `AGODA_${Date.now()}`,
      message: 'Booking pushed successfully (placeholder)'
    };
  }

  async fetchAgodaBookings(config, startDate, endDate) {
    // TODO: Implement Agoda booking fetch
    console.log(`📥 [Agoda] Fetching bookings from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    return {
      success: true,
      channel: 'Agoda',
      bookings: [],
      message: 'No external bookings found (placeholder)'
    };
  }

  /**
   * Get channel status and health check
   */
  async getChannelStatus(channelId) {
    try {
      const config = this.getChannelConfig(channelId);
      if (!config) {
        return { enabled: false, error: 'Channel not found' };
      }

      return {
        enabled: config.enabled,
        name: config.name,
        configured: !!(config.apiKey && config.secretKey),
        lastSync: new Date().toISOString(), // TODO: Store actual last sync time
        status: 'healthy'
      };
    } catch (error) {
      return {
        enabled: false,
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * Get all channels status
   */
  async getAllChannelsStatus() {
    const statuses = {};
    
    for (const [key, value] of Object.entries(this.supportedChannels)) {
      statuses[value] = await this.getChannelStatus(value);
    }
    
    return statuses;
  }
}

module.exports = ChannelManager; 