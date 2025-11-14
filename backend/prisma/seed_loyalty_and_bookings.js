/**
 * Comprehensive Loyalty Program & Bookings Seed Script
 * 
 * Creates realistic loyalty accounts and bookings that align with each other.
 * Ensures loyalty metrics (stays, nights, spend) match actual booking data.
 * 
 * Usage: node prisma/seed_loyalty_and_bookings.js
 */

const { PrismaClient } = require('@prisma/client');
const loyaltyService = require('../services/loyaltyService');
const bookingService = require('../services/bookingService');

const prisma = new PrismaClient();

// ============================================================================
// DATA GENERATORS
// ============================================================================

const INDIAN_FIRST_NAMES = [
  'Aarav', 'Aditya', 'Akshay', 'Aman', 'Amit', 'Anil', 'Arjun', 'Arun', 'Ashish', 'Ayush',
  'Deepak', 'Gaurav', 'Harsh', 'Karan', 'Krishna', 'Manish', 'Mohit', 'Nikhil', 'Pankaj', 'Prateek',
  'Rahul', 'Raj', 'Rajesh', 'Ravi', 'Rohit', 'Sachin', 'Sandeep', 'Sanjay', 'Saurabh', 'Shivam',
  'Siddharth', 'Suresh', 'Vikram', 'Vishal', 'Yash',
  'Aarti', 'Anjali', 'Anita', 'Deepika', 'Divya', 'Geeta', 'Kavita', 'Meera', 'Neha', 'Nisha',
  'Pooja', 'Priya', 'Radha', 'Rekha', 'Ritu', 'Sakshi', 'Sanjana', 'Shreya', 'Sneha', 'Sonia',
  'Sunita', 'Swati', 'Tanvi', 'Uma', 'Vidya'
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Mehta', 'Agarwal', 'Shah',
  'Jain', 'Malhotra', 'Khanna', 'Kapoor', 'Bansal', 'Chopra', 'Bhatt', 'Nair', 'Iyer', 'Menon',
  'Pillai', 'Narayan', 'Rao', 'Desai', 'Joshi', 'Pandey', 'Yadav', 'Khan', 'Ali', 'Hussain',
  'Ahmed', 'Sheikh', 'Ansari', 'Qureshi', 'Malik'
];

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com'];

// Tier distribution (percentage)
const TIER_DISTRIBUTION = {
  MEMBER: 40,
  SILVER: 30,
  GOLD: 20,
  PLATINUM: 8,
  DIAMOND: 2
};

// Tier requirements (minimums to qualify)
const TIER_REQUIREMENTS = {
  MEMBER: { points: 0, stays: 0, nights: 0, spend: 0 },
  SILVER: { points: 5000, stays: 2, nights: 5, spend: 0 },
  GOLD: { points: 25000, stays: 6, nights: 15, spend: 0 },
  PLATINUM: { points: 75000, stays: 12, nights: 30, spend: 0 },
  DIAMOND: { points: 150000, stays: null, nights: 60, spend: 150000 }
};

// Points per ₹100 by tier
const POINTS_PER_100 = {
  MEMBER: 5,
  SILVER: 7,
  GOLD: 10,
  PLATINUM: 12,
  DIAMOND: 15
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function generateName() {
  return `${randomElement(INDIAN_FIRST_NAMES)} ${randomElement(INDIAN_LAST_NAMES)}`;
}

function generateEmail(name) {
  const base = name.toLowerCase().replace(/\s+/g, '.');
  const domain = randomElement(EMAIL_DOMAINS);
  return `${base}@${domain}`;
}

function generatePhone() {
  return `+91 ${randomInt(70000, 99999)} ${randomInt(10000, 99999)}`;
}

function getDaysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 5 || day === 6 || day === 0; // Friday, Saturday, Sunday
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function randomDateInPast(daysAgo) {
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - daysAgo);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

// ============================================================================
// CLEANUP
// ============================================================================

async function cleanupLoyaltyData(deleteBookings = false) {
  console.log('🧹 Cleaning up existing loyalty data...');
  
  // Delete in order to respect foreign key constraints
  await prisma.pointsLedger.deleteMany({});
  await prisma.perkRedemption.deleteMany({});
  await prisma.redemptionTransaction.deleteMany({});
  await prisma.tierHistory.deleteMany({});
  await prisma.referral.deleteMany({});
  await prisma.tierTransfer.deleteMany({});
  
  if (deleteBookings) {
    console.log('  🗑️  Deleting existing bookings and related data...');
    
    // Delete booking-related data first (in order of dependencies)
    await prisma.roomAssignment.deleteMany({});
    await prisma.bookingAuditLog.deleteMany({});
    await prisma.bookingGuest.deleteMany({});
    await prisma.stay.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.inventoryLock.deleteMany({});
    await prisma.holdLog.deleteMany({});
    
    // Update threads to remove booking references (SET NULL)
    await prisma.thread.updateMany({
      where: { bookingId: { not: null } },
      data: { bookingId: null }
    });
    
    // Delete all bookings
    const deletedBookings = await prisma.booking.deleteMany({});
    console.log(`  ✅ Deleted ${deletedBookings.count} bookings and related data`);
  } else {
    // Just unlink bookings from loyalty accounts
    await prisma.booking.updateMany({
      where: { loyaltyAccountId: { not: null } },
      data: { loyaltyAccountId: null }
    });
    console.log('  ℹ️  Kept existing bookings (unlinked from loyalty accounts)');
  }
  
  // Delete loyalty accounts (cascade will handle user relationships if needed)
  const deleted = await prisma.loyaltyAccount.deleteMany({});
  console.log(`  ✅ Deleted ${deleted.count} loyalty accounts\n`);
}

// ============================================================================
// USER & LOYALTY ACCOUNT CREATION
// ============================================================================

async function createUsersWithLoyaltyAccounts(totalUsers) {
  console.log(`👥 Creating ${totalUsers} users with loyalty accounts...`);
  
  const users = [];
  let memberNumber = 1;
  
  // Calculate tier distribution
  const tierCounts = {};
  Object.keys(TIER_DISTRIBUTION).forEach(tier => {
    tierCounts[tier] = Math.floor((totalUsers * TIER_DISTRIBUTION[tier]) / 100);
  });
  
  // Adjust for rounding
  const totalAssigned = Object.values(tierCounts).reduce((a, b) => a + b, 0);
  if (totalAssigned < totalUsers) {
    tierCounts.MEMBER += (totalUsers - totalAssigned);
  }
  
  console.log('  Tier distribution:', tierCounts);
  
  // Create users for each tier
  for (const [tier, count] of Object.entries(tierCounts)) {
    for (let i = 0; i < count; i++) {
      const name = generateName();
      const email = generateEmail(name);
      const phone = generatePhone();
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          phone,
          emailVerified: true,
        }
      });
      
      // Create loyalty account
      const memberNumberStr = String(memberNumber).padStart(6, '0');
      const loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          memberNumber: memberNumberStr,
          userId: user.id,
          tier: 'MEMBER', // Will be updated after bookings are created
          points: 0,
          lifetimeStays: 0,
          lifetimeNights: 0,
          lifetimeSpend: 0,
          qualificationYearStart: new Date(new Date().getFullYear(), 0, 1),
          qualificationYearEnd: new Date(new Date().getFullYear(), 11, 31),
        }
      });
      
      users.push({
        user,
        loyaltyAccount,
        targetTier: tier
      });
      
      memberNumber++;
    }
  }
  
  console.log(`  ✅ Created ${users.length} users with loyalty accounts\n`);
  return users;
}

// ============================================================================
// BOOKING GENERATION
// ============================================================================

async function generateBookingsForUser(userData, properties, roomTypes) {
  const { user, loyaltyAccount, targetTier } = userData;
  const requirements = TIER_REQUIREMENTS[targetTier];
  
  // Determine how to qualify for tier
  // Strategy: Use stays and nights (most realistic)
  let targetStays = requirements.stays || 0;
  let targetNights = requirements.nights || 0;
  let targetSpend = requirements.spend || 0;
  
  // Add buffer to ensure qualification
  if (targetStays > 0) targetStays += randomInt(0, 3);
  if (targetNights > 0) targetNights += randomInt(0, 5);
  if (targetSpend > 0) targetSpend += randomInt(0, 20000);
  
  // If no specific requirements, create 1-3 bookings for MEMBER tier
  if (targetStays === 0 && targetNights === 0 && targetSpend === 0) {
    targetStays = randomInt(0, 2);
    targetNights = randomInt(0, 3);
  }
  
  const bookings = [];
  let totalNights = 0;
  let totalSpend = 0;
  let staysCreated = 0;
  
  // Generate bookings until we meet requirements
  while (staysCreated < targetStays || totalNights < targetNights || totalSpend < targetSpend) {
    const property = randomElement(properties);
    const roomType = randomElement(roomTypes.filter(rt => rt.propertyId === property.id));
    
    if (!roomType) continue;
    
    // Random stay duration (1-7 nights, longer for higher tiers)
    const nights = targetTier === 'DIAMOND' 
      ? randomInt(3, 10)
      : targetTier === 'PLATINUM'
      ? randomInt(2, 7)
      : randomInt(1, 5);
    
    // Random price per night (₹1,500 - ₹5,000)
    const pricePerNight = randomFloat(1500, 5000);
    const totalPrice = pricePerNight * nights;
    
    // Random check-in date (past 12 months)
    const daysAgo = randomInt(1, 365);
    const checkIn = randomDateInPast(daysAgo);
    const checkOut = addDays(checkIn, nights);
    
    // Determine booking status (mostly CHECKED_OUT for completed stays)
    const statusRoll = Math.random();
    let status = 'CHECKED_OUT';
    if (statusRoll < 0.05) status = 'CHECKED_IN';
    else if (statusRoll < 0.10) status = 'CONFIRMED';
    else if (statusRoll < 0.15) status = 'CANCELLED';
    else if (statusRoll < 0.17) status = 'NO_SHOW';
    
    // Booking source (prefer WEB_DIRECT for loyalty)
    const sourceRoll = Math.random();
    const source = sourceRoll < 0.6 ? 'WEB_DIRECT' 
      : sourceRoll < 0.75 ? 'OTA_MMT'
      : sourceRoll < 0.85 ? 'OTA_BOOKING_COM'
      : sourceRoll < 0.92 ? 'OTA_GOIBIBO'
      : 'PHONE';
    
    // Create booking
    const booking = await prisma.booking.create({
      data: {
        guestName: user.name,
        email: user.email,
        phone: user.phone,
        checkIn,
        checkOut,
        guests: randomInt(1, 4),
        rooms: 1,
        totalPrice,
        status,
        currency: 'INR',
        netAmount: totalPrice * 0.85, // Assume 15% tax
        taxAmount: totalPrice * 0.15,
        source,
        propertyId: property.id,
        roomTypeId: roomType.id,
        loyaltyAccountId: loyaltyAccount.id,
        confirmationNumber: `PNB-${property.id}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      }
    });
    
    bookings.push(booking);
    
    // Update totals (only for completed stays)
    if (status === 'CHECKED_OUT') {
      staysCreated++;
      totalNights += nights;
      totalSpend += totalPrice;
    }
    
    // Break if we've exceeded requirements significantly
    if (staysCreated >= targetStays + 2 && totalNights >= targetNights + 5 && totalSpend >= targetSpend + 10000) {
      break;
    }
  }
  
  return { bookings, totalNights, totalSpend, staysCreated };
}

// ============================================================================
// POINTS CALCULATION & AWARDING
// ============================================================================

async function calculateAndAwardPoints(booking, loyaltyAccount, tierAtBooking) {
  const basePointsRate = POINTS_PER_100[tierAtBooking] || POINTS_PER_100.MEMBER;
  let points = Math.floor((booking.totalPrice / 100) * basePointsRate);
  
  // Apply bonuses
  if (isWeekend(booking.checkIn)) {
    points = Math.floor(points * 1.5); // Weekend bonus +50%
  }
  
  const nights = getDaysBetween(booking.checkIn, booking.checkOut);
  if (nights >= 5) {
    points = Math.floor(points * 1.3); // Long stay bonus +30%
  }
  
  if (booking.source === 'WEB_DIRECT') {
    points = Math.floor(points * 1.2); // Direct booking bonus +20%
  }
  
  // Award points (only for completed bookings)
  if (booking.status === 'CHECKED_OUT') {
    await prisma.loyaltyAccount.update({
      where: { id: loyaltyAccount.id },
      data: {
        points: { increment: points }
      }
    });
    
    // Create points ledger entry
    await prisma.pointsLedger.create({
      data: {
        loyaltyAccountId: loyaltyAccount.id,
        userId: loyaltyAccount.userId,
        points: points,
        type: 'EARNED',
        description: `Points earned from booking ${booking.confirmationNumber}`,
        bookingId: booking.id,
        metadata: {
          basePoints: Math.floor((booking.totalPrice / 100) * basePointsRate),
          bonuses: {
            weekend: isWeekend(booking.checkIn),
            longStay: nights >= 5,
            directBooking: booking.source === 'WEB_DIRECT'
          },
          tierAtBooking: tierAtBooking
        }
      }
    });
  }
  
  return points;
}

// ============================================================================
// UPDATE LOYALTY METRICS
// ============================================================================

async function updateLoyaltyMetrics(loyaltyAccount, bookings) {
  let totalStays = 0;
  let totalNights = 0;
  let totalSpend = 0;
  
  for (const booking of bookings) {
    if (booking.status === 'CHECKED_OUT') {
      totalStays++;
      const nights = getDaysBetween(booking.checkIn, booking.checkOut);
      totalNights += nights;
      totalSpend += booking.totalPrice;
    }
  }
  
  // Update loyalty account metrics
  await prisma.loyaltyAccount.update({
    where: { id: loyaltyAccount.id },
    data: {
      lifetimeStays: totalStays,
      lifetimeNights: totalNights,
      lifetimeSpend: totalSpend
    }
  });
  
  return { totalStays, totalNights, totalSpend };
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedLoyaltyAndBookings(options = {}) {
  const { deleteExistingBookings = false, skipCleanup = false } = options;
  
  console.log('🚀 Starting Loyalty Program & Bookings Seed...\n');
  if (deleteExistingBookings) {
    console.log('⚠️  WARNING: Will delete ALL existing bookings and related data!\n');
  }
  
  try {
    // Step 1: Cleanup (skip if called from master seed)
    if (!skipCleanup) {
      await cleanupLoyaltyData(deleteExistingBookings);
    }
    
    // Step 2: Get properties and room types
    console.log('📋 Fetching properties and room types...');
    const properties = await prisma.property.findMany({ where: { isActive: true } });
    const roomTypes = await prisma.roomType.findMany({ where: { isActive: true } });
    
    if (properties.length === 0 || roomTypes.length === 0) {
      throw new Error('No properties or room types found. Please seed properties first.');
    }
    
    console.log(`  ✅ Found ${properties.length} properties and ${roomTypes.length} room types\n`);
    
    // Step 3: Create users with loyalty accounts
    const totalUsers = options.totalUsers || 120; // Adjust as needed
    const users = await createUsersWithLoyaltyAccounts(totalUsers);
    
    // Step 4: Generate bookings for each user
    console.log('📅 Generating bookings for users...');
    let totalBookings = 0;
    
    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      const { bookings, totalNights, totalSpend, staysCreated } = await generateBookingsForUser(
        userData,
        properties,
        roomTypes
      );
      
      totalBookings += bookings.length;
      
      // Step 5: Update loyalty metrics first (for completed bookings)
      await updateLoyaltyMetrics(userData.loyaltyAccount, bookings);
      
      // Step 6: Calculate and award points (in chronological order)
      // Sort bookings by check-in date
      bookings.sort((a, b) => a.checkIn - b.checkIn);
      
      // Get updated account for tier calculation
      let account = await prisma.loyaltyAccount.findUnique({
        where: { id: userData.loyaltyAccount.id }
      });
      
      // Award points for each booking
      // For simplicity, use current tier for all bookings (in reality, tier would change over time)
      const tierAtBooking = account.tier;
      
      for (const booking of bookings) {
        // Award points based on tier (using final tier for simplicity)
        // In a real scenario, you'd track tier changes over time
        await calculateAndAwardPoints(booking, account, tierAtBooking);
      }
      
      // Step 7: Recalculate tier after points are awarded
      account = await prisma.loyaltyAccount.findUnique({
        where: { id: userData.loyaltyAccount.id }
      });
      
      const finalTier = await loyaltyService.calculateTier({
        points: account.points,
        stays: account.lifetimeStays,
        nights: account.lifetimeNights,
        spend: account.lifetimeSpend,
        qualificationYearStart: account.qualificationYearStart,
        qualificationYearEnd: account.qualificationYearEnd
      });
      
      if (finalTier !== account.tier) {
        await prisma.loyaltyAccount.update({
          where: { id: account.id },
          data: { tier: finalTier }
        });
        
        // Create tier history entry
        await prisma.tierHistory.create({
          data: {
            loyaltyAccountId: account.id,
            fromTier: account.tier,
            toTier: finalTier,
            pointsAtChange: account.points,
            staysAtChange: account.lifetimeStays,
            nightsAtChange: account.lifetimeNights,
            spendAtChange: account.lifetimeSpend,
            reason: 'AUTO_UPGRADE',
            validFrom: new Date()
          }
        });
      }
      
      if ((i + 1) % 20 === 0) {
        console.log(`  ✅ Processed ${i + 1}/${users.length} users...`);
      }
    }
    
    console.log(`  ✅ Generated ${totalBookings} bookings\n`);
    
    // Step 7: Summary
    console.log('📊 Final Statistics:');
    const tierStats = await prisma.loyaltyAccount.groupBy({
      by: ['tier'],
      _count: { tier: true }
    });
    
    tierStats.forEach(stat => {
      console.log(`  ${stat.tier}: ${stat._count.tier} members`);
    });
    
    const totalPoints = await prisma.loyaltyAccount.aggregate({
      _sum: { points: true }
    });
    
    const totalSpend = await prisma.loyaltyAccount.aggregate({
      _sum: { lifetimeSpend: true }
    });
    
    if (!skipCleanup) {
      console.log(`\n  Total Points: ${totalPoints._sum.points?.toLocaleString() || 0}`);
      console.log(`  Total Lifetime Spend: ₹${totalSpend._sum.lifetimeSpend?.toLocaleString() || 0}`);
      console.log(`  Total Bookings: ${totalBookings}`);
      console.log('\n🎉 Loyalty Program & Bookings seed completed successfully!\n');
    }
    
    return { totalBookings };
  } catch (error) {
    console.error('❌ Error seeding loyalty and bookings:', error);
    throw error;
  }
}

// ============================================================================
// RUN
// ============================================================================

if (require.main === module) {
  // Check for command line argument to delete bookings
  const deleteBookings = process.argv.includes('--delete-bookings') || process.argv.includes('-d');
  
  seedLoyaltyAndBookings({ deleteExistingBookings: deleteBookings })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedLoyaltyAndBookings };

