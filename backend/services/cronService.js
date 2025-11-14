const cron = require('node-cron');
const ChannelManager = require('../modules/channelManager');
const loyaltyService = require('./loyaltyService');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

const channelManager = new ChannelManager();

/**
 * Cron Service for External Booking Synchronization
 * Runs every 15 minutes to fetch new bookings from external channels
 */
class CronService {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.nextRun = null;
    this.job = null;
    this.requalificationJob = null;
  }

  /**
   * Start the cron job
   */
  start() {
    if (this.job) {
      console.log('⚠️  Cron job is already running');
      return;
    }

    console.log('🚀 Starting external bookings cron job (every 15 minutes)');
    
    // Schedule job to run every 15 minutes
    this.job = cron.schedule('*/15 * * * *', async () => {
      await this.fetchExternalBookings();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata' // Indian timezone
    });

    // Calculate next run time
    this.updateNextRunTime();
    
    console.log(`✅ Cron job started successfully`);
    console.log(`⏰ Next run: ${this.nextRun}`);
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      this.isRunning = false;
      console.log('🛑 Cron job stopped');
    }
  }

  /**
   * Get cron job status
   */
  getStatus() {
    return {
      isRunning: !!this.job,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      schedule: '*/15 * * * * (every 15 minutes)',
      timezone: 'Asia/Kolkata'
    };
  }

  /**
   * Manually trigger the external bookings fetch
   */
  async triggerManualFetch() {
    console.log('🔧 Manual trigger of external bookings fetch');
    await this.fetchExternalBookings();
  }

  /**
   * Fetch external bookings from all enabled channels
   */
  async fetchExternalBookings() {
    if (this.isRunning) {
      console.log('⚠️  External bookings fetch already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    
    try {
      console.log(`\n🔄 Starting external bookings fetch at ${startTime.toISOString()}`);
      
      // Get enabled channels
      const enabledChannels = channelManager.getEnabledChannels();
      
      if (enabledChannels.length === 0) {
        console.log('ℹ️  No enabled channels found, skipping external bookings fetch');
        return;
      }

      console.log(`📡 Found ${enabledChannels.length} enabled channels: ${enabledChannels.map(c => c.name).join(', ')}`);

      // Set date range for fetching (last 24 hours to next 7 days)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // Last 24 hours

      const results = [];
      let totalNewBookings = 0;

      // Fetch bookings from each enabled channel
      for (const channel of enabledChannels) {
        try {
          console.log(`\n📥 Fetching bookings from ${channel.name}...`);
          
          const result = await channelManager.fetchExternalBookings(
            channel.channelId,
            startDate,
            endDate
          );

          if (result.success && result.bookings && result.bookings.length > 0) {
            console.log(`✅ Found ${result.bookings.length} bookings from ${channel.name}`);
            
            // Process each booking
            for (const booking of result.bookings) {
              const processedBooking = await this.processExternalBooking(booking, channel);
              if (processedBooking.isNew) {
                totalNewBookings++;
                console.log(`🆕 New booking found: ${booking.guestName} - ${booking.roomType} (${channel.name})`);
              }
            }
          } else {
            console.log(`ℹ️  No bookings found from ${channel.name}`);
          }

          results.push({
            channel: channel.name,
            channelId: channel.channelId,
            success: true,
            bookingsCount: result.bookings ? result.bookings.length : 0,
            message: result.message || 'Fetch completed successfully'
          });

        } catch (error) {
          console.error(`❌ Error fetching bookings from ${channel.name}:`, error.message);
          results.push({
            channel: channel.name,
            channelId: channel.channelId,
            success: false,
            error: error.message
          });
        }
      }

      // Log summary
      const endTime = new Date();
      const duration = endTime - startTime;
      
      console.log(`\n📊 External Bookings Fetch Summary:`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📡 Channels processed: ${enabledChannels.length}`);
      console.log(`🆕 New bookings found: ${totalNewBookings}`);
      console.log(`✅ Successful channels: ${results.filter(r => r.success).length}`);
      console.log(`❌ Failed channels: ${results.filter(r => !r.success).length}`);

      // Log detailed results
      results.forEach(result => {
        if (result.success) {
          console.log(`  ✅ ${result.channel}: ${result.bookingsCount} bookings`);
        } else {
          console.log(`  ❌ ${result.channel}: ${result.error}`);
        }
      });

      // Update last run time
      this.lastRun = endTime;
      this.updateNextRunTime();

      // Log completion
      console.log(`\n✅ External bookings fetch completed at ${endTime.toISOString()}`);
      console.log(`⏰ Next scheduled run: ${this.nextRun}`);

    } catch (error) {
      console.error('❌ Critical error in external bookings fetch:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process an external booking and check if it's new
   */
  async processExternalBooking(externalBooking, channel) {
    try {
      // Check if booking already exists in our system
      const existingBooking = await getPrisma().booking.findFirst({
        where: {
          OR: [
            {
              externalBookingId: externalBooking.externalBookingId,
              externalChannel: channel.channelId
            },
            {
              email: externalBooking.email,
              checkIn: new Date(externalBooking.checkIn),
              checkOut: new Date(externalBooking.checkOut)
            }
          ]
        }
      });

      if (existingBooking) {
        // Update existing booking if needed
        await this.updateExistingBooking(existingBooking, externalBooking, channel);
        return { isNew: false, booking: existingBooking };
      } else {
        // Create new booking
        const newBooking = await this.createNewBooking(externalBooking, channel);
        return { isNew: true, booking: newBooking };
      }

    } catch (error) {
      console.error(`❌ Error processing external booking:`, error);
      return { isNew: false, error: error.message };
    }
  }

  /**
   * Create a new booking from external booking data
   */
  async createNewBooking(externalBooking, channel) {
    try {
      // Find the room by type
      const room = await getPrisma().room.findFirst({
        where: {
          type: {
            contains: externalBooking.roomType,
            mode: 'insensitive'
          }
        }
      });

      if (!room) {
        console.warn(`⚠️  Room not found for type: ${externalBooking.roomType}`);
        return null;
      }

      // Create or update loyalty account
      let loyaltyAccount = null;
      if (externalBooking.email) {
        loyaltyAccount = await getPrisma().loyaltyAccount.upsert({
          where: { email: externalBooking.email },
          update: {
            guestName: externalBooking.guestName,
            phone: externalBooking.phone || null,
            lastActivityDate: new Date()
          },
          create: {
            email: externalBooking.email,
            guestName: externalBooking.guestName,
            phone: externalBooking.phone || null,
            pointsBalance: 0,
            tier: 'SILVER'
          }
        });
      }

      // Create the booking
      const booking = await getPrisma().booking.create({
        data: {
          guestName: externalBooking.guestName,
          email: externalBooking.email,
          phone: externalBooking.phone || null,
          checkIn: new Date(externalBooking.checkIn),
          checkOut: new Date(externalBooking.checkOut),
          guests: externalBooking.guests || 1,
          totalPrice: externalBooking.totalPrice || room.price,
          specialRequests: externalBooking.specialRequests || null,
          roomId: room.id,
          status: 'CONFIRMED', // External bookings are typically confirmed
          externalBookingId: externalBooking.externalBookingId,
          externalChannel: channel.channelId,
          loyaltyAccountId: loyaltyAccount?.id || null
        },
        include: {
          room: true,
          loyaltyAccount: true
        }
      });

      console.log(`✅ Created new booking from ${channel.name}: ${booking.guestName} - ${booking.room.type}`);
      return booking;

    } catch (error) {
      console.error(`❌ Error creating new booking from ${channel.name}:`, error);
      throw error;
    }
  }

  /**
   * Update existing booking with external booking data
   */
  async updateExistingBooking(existingBooking, externalBooking, channel) {
    try {
      // Update booking if external data is more recent
      const updates = {};
      
      if (externalBooking.status && externalBooking.status !== existingBooking.status) {
        updates.status = externalBooking.status;
      }
      
      if (externalBooking.totalPrice && externalBooking.totalPrice !== existingBooking.totalPrice) {
        updates.totalPrice = externalBooking.totalPrice;
      }

      if (Object.keys(updates).length > 0) {
        await getPrisma().booking.update({
          where: { id: existingBooking.id },
          data: updates
        });
        
        console.log(`🔄 Updated existing booking from ${channel.name}: ${existingBooking.guestName}`);
      }

    } catch (error) {
      console.error(`❌ Error updating existing booking from ${channel.name}:`, error);
    }
  }

  /**
   * Update next run time
   */
  updateNextRunTime() {
    const now = new Date();
    // Next run is 15 minutes from now
    this.nextRun = new Date(now.getTime() + 15 * 60 * 1000);
  }

  /**
   * Start tier re-qualification cron job
   * Runs daily at 2 AM to check and process tier re-qualifications
   */
  startTierRequalificationJob() {
    if (this.requalificationJob) {
      console.log('⚠️  Tier re-qualification cron job is already running');
      return;
    }

    console.log('🚀 Starting tier re-qualification cron job (daily at 2 AM)');
    
    // Schedule job to run daily at 2 AM
    this.requalificationJob = cron.schedule('0 2 * * *', async () => {
      await this.processTierRequalification();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });

    console.log('✅ Tier re-qualification cron job started successfully');
  }

  /**
   * Stop tier re-qualification cron job
   */
  stopTierRequalificationJob() {
    if (this.requalificationJob) {
      this.requalificationJob.stop();
      this.requalificationJob = null;
      console.log('🛑 Tier re-qualification cron job stopped');
    }
  }

  /**
   * Process tier re-qualification
   */
  async processTierRequalification() {
    console.log('\n🔄 Starting tier re-qualification process...');
    const startTime = new Date();

    try {
      const results = await loyaltyService.processTierRequalification();
      const duration = new Date() - startTime;

      console.log(`✅ Tier re-qualification completed in ${duration}ms`);
      console.log(`   - Checked: ${results.checked} accounts`);
      console.log(`   - Upgraded: ${results.upgraded}`);
      console.log(`   - Downgraded: ${results.downgraded}`);
      console.log(`   - Unchanged: ${results.unchanged}`);
      if (results.errors.length > 0) {
        console.log(`   - Errors: ${results.errors.length}`);
        results.errors.forEach(err => {
          console.error(`     Account ${err.accountId}: ${err.error}`);
        });
      }
    } catch (error) {
      console.error('❌ Error processing tier re-qualification:', error);
    }
  }
}

// Create singleton instance
const cronService = new CronService();

module.exports = cronService; 