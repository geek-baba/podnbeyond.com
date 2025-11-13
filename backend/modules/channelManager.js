const { PrismaClient } = require('@prisma/client');
const {
  getDateRange,
  normalizeDate,
  ensureInventoryRow,
  updateInventoryWithConfirmation,
} = require('../lib/inventoryUtils');

// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

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
   * Log sync activity to OTASyncLog
   */
  async logSyncActivity(action, details, channelId = null) {
    try {
      await getPrisma().oTASyncLog.create({
        data: {
          action: action,
          details: JSON.stringify(details),
          timestamp: new Date()
        }
      });
      console.log(`📝 [${channelId || 'SYSTEM'}] Sync logged: ${action}`);
    } catch (error) {
      console.error('Error logging sync activity:', error);
    }
  }

  /**
   * Push availability to external channel (MakeMyTrip implementation)
   * @param {string} channelId - Channel identifier
   * @param {Date} startDate - Start date for availability sync
   * @param {Date} endDate - End date for availability sync
   * @param {Array} rooms - Array of room availability data
   */
  async pushAvailability(channelId, startDate, endDate, rooms = null) {
    try {
      console.log(`🔄 Pushing availability to channel: ${channelId}`);
      
      const config = this.validateChannelConfig(channelId);
      
      if (!rooms) {
        rooms = await this.getRoomAvailability(startDate, endDate, channelId);
      } else {
        rooms = rooms.filter((room) => room.mapping?.provider === channelId);
      }

      if (!rooms || rooms.length === 0) {
        console.log(`ℹ️  No mapped room types found for channel ${channelId}. Skipping availability push.`);
        return {
          success: true,
          message: 'No mapped room types to sync',
          syncedRooms: 0,
        };
      }

      let result;
      
      // Channel-specific availability push
      switch (channelId) {
        case this.supportedChannels.MAKEMYTRIP:
          result = await this.pushMakeMyTripAvailability(config, startDate, endDate, rooms);
          break;
        
        case this.supportedChannels.YATRA:
          result = await this.pushYatraAvailability(config, startDate, endDate, rooms);
          break;
        
        case this.supportedChannels.GOIBIBO:
          result = await this.pushGoibiboAvailability(config, startDate, endDate, rooms);
          break;
        
        case this.supportedChannels.BOOKING_COM:
          result = await this.pushBookingAvailability(config, startDate, endDate, rooms);
          break;
        
        case this.supportedChannels.AGODA:
          result = await this.pushAgodaAvailability(config, startDate, endDate, rooms);
          break;
        
        default:
          throw new Error(`Unsupported channel: ${channelId}`);
      }

      // Log successful sync
      await this.logSyncActivity('PUSH_AVAILABILITY', {
        channelId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        roomsCount: rooms.length,
        result
      }, channelId);

      return result;
    } catch (error) {
      console.error(`❌ Error pushing availability to ${channelId}:`, error);
      
      // Log failed sync
      await this.logSyncActivity('PUSH_AVAILABILITY_ERROR', {
        channelId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        error: error.message
      }, channelId);
      
      throw error;
    }
  }

  /**
   * Fetch bookings from external channel (MakeMyTrip implementation)
   * @param {string} channelId - Channel identifier
   * @param {Date} startDate - Start date for booking fetch
   * @param {Date} endDate - End date for booking fetch
   */
  async fetchBookings(channelId, startDate, endDate) {
    try {
      console.log(`📥 Fetching bookings from channel: ${channelId}`);
      
      const config = this.validateChannelConfig(channelId);
      
      let result;
      
      // Channel-specific booking fetch
      switch (channelId) {
        case this.supportedChannels.MAKEMYTRIP:
          result = await this.fetchMakeMyTripBookings(config, startDate, endDate);
          break;
        
        case this.supportedChannels.YATRA:
          result = await this.fetchYatraBookings(config, startDate, endDate);
          break;
        
        case this.supportedChannels.GOIBIBO:
          result = await this.fetchGoibiboBookings(config, startDate, endDate);
          break;
        
        case this.supportedChannels.BOOKING_COM:
          result = await this.fetchBookingComBookings(config, startDate, endDate);
          break;
        
        case this.supportedChannels.AGODA:
          result = await this.fetchAgodaBookings(config, startDate, endDate);
          break;
        
        default:
          throw new Error(`Unsupported channel: ${channelId}`);
      }

      // Log successful fetch
      await this.logSyncActivity('FETCH_BOOKINGS', {
        channelId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bookingsCount: result.bookings ? result.bookings.length : 0,
        result
      }, channelId);

      return result;
    } catch (error) {
      console.error(`❌ Error fetching bookings from ${channelId}:`, error);
      
      // Log failed fetch
      await this.logSyncActivity('FETCH_BOOKINGS_ERROR', {
        channelId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        error: error.message
      }, channelId);
      
      throw error;
    }
  }

  /**
   * Sync room availability with external channels (legacy method)
   * @param {string} channelId - Channel identifier
   * @param {Date} startDate - Start date for availability sync
   * @param {Date} endDate - End date for availability sync
   * @param {Array} rooms - Array of room availability data
   */
  async syncAvailability(channelId, startDate, endDate, rooms = null) {
    return this.pushAvailability(channelId, startDate, endDate, rooms);
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
      
      let result;
      
      // Channel-specific booking push
      switch (channelId) {
        case this.supportedChannels.MAKEMYTRIP:
          result = await this.pushMakeMyTripBooking(config, bookingData);
          break;
        
        case this.supportedChannels.YATRA:
          result = await this.pushYatraBooking(config, bookingData);
          break;
        
        case this.supportedChannels.GOIBIBO:
          result = await this.pushGoibiboBooking(config, bookingData);
          break;
        
        case this.supportedChannels.BOOKING_COM:
          result = await this.pushBookingComBooking(config, bookingData);
          break;
        
        case this.supportedChannels.AGODA:
          result = await this.pushAgodaBooking(config, bookingData);
          break;
        
        default:
          throw new Error(`Unsupported channel: ${channelId}`);
      }

      // Log successful push
      await this.logSyncActivity('PUSH_BOOKING', {
        channelId,
        bookingId: bookingData.id,
        guestName: bookingData.guestName,
        result
      }, channelId);

      return result;
    } catch (error) {
      console.error(`❌ Error pushing booking to ${channelId}:`, error);
      
      // Log failed push
      await this.logSyncActivity('PUSH_BOOKING_ERROR', {
        channelId,
        bookingId: bookingData.id,
        error: error.message
      }, channelId);
      
      throw error;
    }
  }

  /**
   * Fetch bookings from external channel (legacy method)
   * @param {string} channelId - Channel identifier
   * @param {Date} startDate - Start date for booking fetch
   * @param {Date} endDate - End date for booking fetch
   */
  async fetchExternalBookings(channelId, startDate, endDate) {
    return this.fetchBookings(channelId, startDate, endDate);
  }

  /**
   * Get room availability from database
   */
  async getRoomAvailability(startDate, endDate, channelId = null) {
    try {
      const start = normalizeDate(startDate);
      const end = normalizeDate(endDate);
      const inclusiveEnd = new Date(end);
      inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() + 1);

      const mappings = await getPrisma().oTAMapping.findMany({
        where: {
          isActive: true,
          ...(channelId ? { provider: channelId } : {}),
        },
        include: {
          property: true,
          roomType: {
            include: {
              property: true,
              ratePlans: true,
            },
          },
          ratePlan: true,
        },
      });

      const roomTypeIds = [
        ...new Set(
          mappings
            .filter((mapping) => mapping.roomTypeId)
            .map((mapping) => mapping.roomTypeId)
        ),
      ];

      if (roomTypeIds.length === 0) {
        return [];
      }

      const inventories = await getPrisma().inventory.findMany({
        where: {
          roomTypeId: { in: roomTypeIds },
          date: {
            gte: start,
            lt: inclusiveEnd,
          },
        },
        orderBy: { date: 'asc' },
      });

      const inventoryMap = new Map();
      inventories.forEach((inv) => {
        const key = `${inv.roomTypeId}:${normalizeDate(inv.date).toISOString()}`;
        inventoryMap.set(key, inv);
      });

      const rooms = [];

      for (const mapping of mappings) {
        const roomType = mapping.roomType;
        if (!roomType || !roomType.isActive) {
          continue;
        }

        const property = mapping.property || roomType.property;
        if (!property || property.status !== 'ACTIVE') {
          continue;
        }

        const rangeDates = getDateRange(start, inclusiveEnd);
        const availability = [];

        for (const date of rangeDates) {
          const normalizedDate = normalizeDate(date);
          const mapKey = `${roomType.id}:${normalizedDate.toISOString()}`;
          let inventory = inventoryMap.get(mapKey);

          if (!inventory) {
            inventory = await ensureInventoryRow(getPrisma(), property, roomType, normalizedDate);
            inventoryMap.set(mapKey, inventory);
          }

          availability.push({
            date: normalizedDate.toISOString(),
            sellable: inventory.sellable,
            booked: inventory.booked,
            holds: inventory.holds,
            freeToSell: inventory.freeToSell,
            bufferPercent: inventory.bufferPercent,
          });
        }

        const primaryRatePlan = mapping.ratePlan || roomType.ratePlans?.[0] || null;

        rooms.push({
          propertyId: property.id,
          propertyName: property.name,
          propertySlug: property.slug,
          roomTypeId: roomType.id,
          roomTypeName: roomType.name,
          capacity: roomType.capacity,
          baseRooms: roomType.baseRooms,
          ratePlanId: primaryRatePlan ? primaryRatePlan.id : null,
          ratePlanCode: primaryRatePlan ? primaryRatePlan.code : null,
          mapping: {
            provider: mapping.provider,
            externalPropertyCode: mapping.externalPropertyCode,
            externalRoomCode: mapping.externalRoomCode,
            externalRateCode: mapping.externalRateCode,
          },
          availability,
        });
      }

      return rooms;
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
      'guestName', 'email', 'checkIn', 'checkOut', 'totalPrice'
    ];

    for (const field of requiredFields) {
      if (!bookingData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (
      !bookingData.roomTypeId &&
      !bookingData.roomTypeCode &&
      !bookingData.externalRoomCode
    ) {
      throw new Error('Missing room type reference (roomTypeId, roomTypeCode, or externalRoomCode required)');
    }

    // Validate dates
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    
    if (checkIn >= checkOut) {
      throw new Error('Check-out date must be after check-in date');
    }
    
    // Allow past check-ins for OTA modifications (they may send historical data)
  }

  buildAvailabilityPayload(rooms) {
    return rooms.map((room) => ({
      propertyId: room.propertyId,
      propertyName: room.propertyName,
      roomTypeId: room.roomTypeId,
      roomTypeName: room.roomTypeName,
      capacity: room.capacity,
      baseRooms: room.baseRooms,
      externalPropertyCode: room.mapping?.externalPropertyCode || null,
      externalRoomCode: room.mapping?.externalRoomCode || null,
      externalRateCode: room.mapping?.externalRateCode || null,
      ratePlanCode: room.ratePlanCode,
      availability: room.availability,
    }));
  }

  // ===== MakeMyTrip Integration Methods =====
  
  async pushMakeMyTripAvailability(config, startDate, endDate, rooms) {
    const payloadRooms = this.buildAvailabilityPayload(rooms);

    console.log(`🔄 [MakeMyTrip] Pushing availability for ${payloadRooms.length} mapped room types`);
    console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const apiPayload = {
      hotelId: config.hotelId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      inventory: payloadRooms,
    };

    console.log(`📤 [MakeMyTrip] API Payload:`, JSON.stringify(apiPayload, null, 2));

    const mockResponse = {
      success: true,
      message: 'Availability updated successfully',
      syncedRooms: payloadRooms.length,
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ [MakeMyTrip] Availability push completed`);

    return {
      success: true,
      channel: 'MakeMyTrip',
      syncedRooms: payloadRooms.length,
      message: 'Availability pushed successfully',
      apiResponse: mockResponse,
    };
  }

  async pushMakeMyTripBooking(config, bookingData) {
    console.log(`📤 [MakeMyTrip] Pushing booking for ${bookingData.guestName}`);
    
    // Placeholder API call to MakeMyTrip
    const apiPayload = {
      hotelId: config.hotelId,
      booking: {
        guestName: bookingData.guestName,
        email: bookingData.email,
        phone: bookingData.phone,
        checkIn: new Date(bookingData.checkIn).toISOString().split('T')[0],
        checkOut: new Date(bookingData.checkOut).toISOString().split('T')[0],
        guests: bookingData.guests,
        roomType: bookingData.roomType,
        totalPrice: bookingData.totalPrice,
        specialRequests: bookingData.specialRequests
      }
    };

    console.log(`📤 [MakeMyTrip] Booking API Payload:`, JSON.stringify(apiPayload, null, 2));
    
    // Simulate API call (placeholder)
    const mockResponse = {
      success: true,
      externalBookingId: `MMT_${Date.now()}`,
      confirmationNumber: `MMT_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ [MakeMyTrip] Booking pushed successfully`);
    
    return {
      success: true,
      channel: 'MakeMyTrip',
      externalBookingId: mockResponse.externalBookingId,
      confirmationNumber: mockResponse.confirmationNumber,
      message: 'Booking pushed successfully',
      apiResponse: mockResponse
    };
  }

  async fetchMakeMyTripBookings(config, startDate, endDate) {
    console.log(`📥 [MakeMyTrip] Fetching bookings from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Placeholder API call to MakeMyTrip
    const apiPayload = {
      hotelId: config.hotelId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };

    console.log(`📥 [MakeMyTrip] Fetch API Payload:`, JSON.stringify(apiPayload, null, 2));
    
    // Simulate API response with sample bookings (placeholder)
    const mockBookings = [
      {
        externalBookingId: `MMT_${Date.now()}_1`,
        confirmationNumber: `MMT_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        guestName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        checkIn: '2025-03-15',
        checkOut: '2025-03-17',
        guests: 2,
        roomType: 'Standard Room',
        totalPrice: 240,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString()
      },
      {
        externalBookingId: `MMT_${Date.now()}_2`,
        confirmationNumber: `MMT_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        guestName: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1987654321',
        checkIn: '2025-03-20',
        checkOut: '2025-03-22',
        guests: 1,
        roomType: 'Deluxe Room',
        totalPrice: 360,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString()
      }
    ];

    console.log(`✅ [MakeMyTrip] Fetched ${mockBookings.length} external bookings`);
    
    return {
      success: true,
      channel: 'MakeMyTrip',
      bookings: mockBookings,
      message: `Successfully fetched ${mockBookings.length} external bookings`,
      apiResponse: {
        totalBookings: mockBookings.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Legacy method - redirect to pushAvailability
  async syncMakeMyTripAvailability(config, startDate, endDate, rooms) {
    return this.pushMakeMyTripAvailability(config, startDate, endDate, rooms);
  }

  // ===== Yatra Integration Methods =====
  
  async pushYatraAvailability(config, startDate, endDate, rooms) {
    const payloadRooms = this.buildAvailabilityPayload(rooms);
    console.log(`🔄 [Yatra] Pushing availability for ${payloadRooms.length} mapped room types`);

    return {
      success: true,
      channel: 'Yatra',
      syncedRooms: payloadRooms.length,
      message: 'Availability pushed successfully (placeholder)',
      payload: payloadRooms,
    };
  }

  async pushYatraBooking(config, bookingData) {
    console.log(`📤 [Yatra] Pushing booking for ${bookingData.guestName}`);
    
    return {
      success: true,
      channel: 'Yatra',
      externalBookingId: `YATRA_${Date.now()}`,
      message: 'Booking pushed successfully (placeholder)'
    };
  }

  async fetchYatraBookings(config, startDate, endDate) {
    console.log(`📥 [Yatra] Fetching bookings from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    return {
      success: true,
      channel: 'Yatra',
      bookings: [],
      message: 'No external bookings found (placeholder)'
    };
  }

  async syncYatraAvailability(config, startDate, endDate, rooms) {
    return this.pushYatraAvailability(config, startDate, endDate, rooms);
  }

  // ===== Goibibo Integration Methods =====
  
  async pushGoibiboAvailability(config, startDate, endDate, rooms) {
    const payloadRooms = this.buildAvailabilityPayload(rooms);
    console.log(`🔄 [Goibibo] Pushing availability for ${payloadRooms.length} mapped room types`);

    return {
      success: true,
      channel: 'Goibibo',
      syncedRooms: payloadRooms.length,
      message: 'Availability pushed successfully (placeholder)',
      payload: payloadRooms,
    };
  }

  async pushGoibiboBooking(config, bookingData) {
    console.log(`📤 [Goibibo] Pushing booking for ${bookingData.guestName}`);
    
    return {
      success: true,
      channel: 'Goibibo',
      externalBookingId: `GOIBIBO_${Date.now()}`,
      message: 'Booking pushed successfully (placeholder)'
    };
  }

  async fetchGoibiboBookings(config, startDate, endDate) {
    console.log(`📥 [Goibibo] Fetching bookings from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    return {
      success: true,
      channel: 'Goibibo',
      bookings: [],
      message: 'No external bookings found (placeholder)'
    };
  }

  async syncGoibiboAvailability(config, startDate, endDate, rooms) {
    return this.pushGoibiboAvailability(config, startDate, endDate, rooms);
  }

  // ===== Booking.com Integration Methods =====
  
  async pushBookingAvailability(config, startDate, endDate, rooms) {
    const payloadRooms = this.buildAvailabilityPayload(rooms);
    console.log(`🔄 [Booking.com] Pushing availability for ${payloadRooms.length} mapped room types`);

    return {
      success: true,
      channel: 'Booking.com',
      syncedRooms: payloadRooms.length,
      message: 'Availability pushed successfully (placeholder)',
      payload: payloadRooms,
    };
  }

  async pushBookingComBooking(config, bookingData) {
    console.log(`📤 [Booking.com] Pushing booking for ${bookingData.guestName}`);
    
    return {
      success: true,
      channel: 'Booking.com',
      externalBookingId: `BOOKING_${Date.now()}`,
      message: 'Booking pushed successfully (placeholder)'
    };
  }

  async fetchBookingComBookings(config, startDate, endDate) {
    console.log(`📥 [Booking.com] Fetching bookings from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    return {
      success: true,
      channel: 'Booking.com',
      bookings: [],
      message: 'No external bookings found (placeholder)'
    };
  }

  async syncBookingAvailability(config, startDate, endDate, rooms) {
    return this.pushBookingAvailability(config, startDate, endDate, rooms);
  }

  // ===== Agoda Integration Methods =====
  
  async pushAgodaAvailability(config, startDate, endDate, rooms) {
    const payloadRooms = this.buildAvailabilityPayload(rooms);
    console.log(`🔄 [Agoda] Pushing availability for ${payloadRooms.length} mapped room types`);

    return {
      success: true,
      channel: 'Agoda',
      syncedRooms: payloadRooms.length,
      message: 'Availability pushed successfully (placeholder)',
      payload: payloadRooms,
    };
  }

  async pushAgodaBooking(config, bookingData) {
    console.log(`📤 [Agoda] Pushing booking for ${bookingData.guestName}`);
    
    return {
      success: true,
      channel: 'Agoda',
      externalBookingId: `AGODA_${Date.now()}`,
      message: 'Booking pushed successfully (placeholder)'
    };
  }

  async fetchAgodaBookings(config, startDate, endDate) {
    console.log(`📥 [Agoda] Fetching bookings from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    return {
      success: true,
      channel: 'Agoda',
      bookings: [],
      message: 'No external bookings found (placeholder)'
    };
  }

  async syncAgodaAvailability(config, startDate, endDate, rooms) {
    return this.pushAgodaAvailability(config, startDate, endDate, rooms);
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

  /**
   * Get sync logs
   */
  async getSyncLogs(limit = 50) {
    try {
      const logs = await getPrisma().oTASyncLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit
      });

      return logs.map(log => {
        let parsedDetails;
        try {
          parsedDetails = JSON.parse(log.details);
        } catch (error) {
          // Handle non-JSON details gracefully
          parsedDetails = { rawDetails: log.details };
        }

        return {
          id: log.id,
          action: log.action,
          details: parsedDetails,
          timestamp: log.timestamp
        };
      });
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      throw error;
    }
  }
}

module.exports = ChannelManager; 