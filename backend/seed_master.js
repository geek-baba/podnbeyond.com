const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

/**
 * Master Seed Script
 * Creates comprehensive test data for one year of hotel operations:
 * - 100 Loyalty users with Indian names, phones, emails
 * - 12 months of booking data across all properties and sources
 * - Communication Hub data (emails, WhatsApp, SMS, calls, mixed conversations)
 * - All booking scenarios (cancellations, no-shows, check-ins, check-outs, modifications)
 * - Payments, room assignments, audit logs, and related data
 */

// ============================================================================
// DATA GENERATORS
// ============================================================================

// Indian first names
const INDIAN_FIRST_NAMES = [
  'Aarav', 'Aditya', 'Akshay', 'Aman', 'Amit', 'Anil', 'Arjun', 'Arun', 'Ashish', 'Ayush',
  'Deepak', 'Gaurav', 'Harsh', 'Karan', 'Krishna', 'Manish', 'Mohit', 'Nikhil', 'Pankaj', 'Prateek',
  'Rahul', 'Raj', 'Rajesh', 'Ravi', 'Rohit', 'Sachin', 'Sandeep', 'Sanjay', 'Saurabh', 'Shivam',
  'Siddharth', 'Suresh', 'Vikram', 'Vishal', 'Yash',
  'Aarti', 'Anjali', 'Anita', 'Deepika', 'Divya', 'Geeta', 'Kavita', 'Meera', 'Neha', 'Nisha',
  'Pooja', 'Priya', 'Radha', 'Rekha', 'Ritu', 'Sakshi', 'Sanjana', 'Shreya', 'Sneha', 'Sonia',
  'Sunita', 'Swati', 'Tanvi', 'Uma', 'Vidya'
];

// Indian last names
const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Mehta', 'Agarwal', 'Shah',
  'Jain', 'Malhotra', 'Khanna', 'Kapoor', 'Bansal', 'Chopra', 'Bhatt', 'Nair', 'Iyer', 'Menon',
  'Pillai', 'Narayan', 'Rao', 'Desai', 'Joshi', 'Pandey', 'Yadav', 'Khan', 'Ali', 'Hussain',
  'Ahmed', 'Sheikh', 'Ansari', 'Qureshi', 'Malik'
];

// Indian cities for email domains
const INDIAN_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com',
  'example.com', 'test.com', 'mail.com'
];

// Booking sources with weights (for realistic distribution)
const BOOKING_SOURCES = [
  { source: 'WEB_DIRECT', weight: 30 },
  { source: 'OTA_MMT', weight: 20 },
  { source: 'OTA_BOOKING_COM', weight: 15 },
  { source: 'OTA_GOIBIBO', weight: 10 },
  { source: 'OTA_YATRA', weight: 8 },
  { source: 'OTA_AGODA', weight: 5 },
  { source: 'WALK_IN', weight: 7 },
  { source: 'PHONE', weight: 4 },
  { source: 'CORPORATE', weight: 1 }
];

// OTA commission percentages
const OTA_COMMISSIONS = {
  'OTA_MMT': 15,
  'OTA_BOOKING_COM': 18,
  'OTA_GOIBIBO': 12,
  'OTA_YATRA': 10,
  'OTA_AGODA': 20
};

// Booking statuses with realistic distribution
const BOOKING_STATUSES = [
  { status: 'CONFIRMED', weight: 60 },
  { status: 'CHECKED_IN', weight: 5 },
  { status: 'CHECKED_OUT', weight: 20 },
  { status: 'CANCELLED', weight: 10 },
  { status: 'NO_SHOW', weight: 3 },
  { status: 'PENDING', weight: 2 }
];

// Payment statuses
const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'];

// Communication channels
const COMMUNICATION_CHANNELS = ['EMAIL', 'WHATSAPP', 'SMS', 'VOICE'];

// Message templates for different scenarios
const MESSAGE_TEMPLATES = {
  booking_confirmation: {
    email: {
      subject: 'Booking Confirmation - {confirmationNumber}',
      body: 'Dear {guestName}, Your booking has been confirmed. Confirmation Number: {confirmationNumber}. Check-in: {checkIn}, Check-out: {checkOut}.'
    },
    whatsapp: 'Hi {guestName}! Your booking is confirmed. Confirmation: {confirmationNumber}. Check-in: {checkIn}. We look forward to hosting you!'
  },
  cancellation: {
    email: {
      subject: 'Booking Cancellation - {confirmationNumber}',
      body: 'Dear {guestName}, Your booking {confirmationNumber} has been cancelled. Refund will be processed as per cancellation policy.'
    },
    whatsapp: 'Hi {guestName}, Your booking {confirmationNumber} has been cancelled. Refund will be processed within 5-7 business days.'
  },
  check_in_reminder: {
    email: {
      subject: 'Check-in Reminder - {confirmationNumber}',
      body: 'Dear {guestName}, This is a reminder that your check-in is scheduled for {checkIn}. We look forward to welcoming you!'
    },
    whatsapp: 'Hi {guestName}! Reminder: Your check-in is tomorrow at {checkIn}. See you soon!'
  },
  inquiry: {
    email: {
      subject: 'Inquiry about {propertyName}',
      body: 'Hello, I would like to know more about availability and rates for {dates}. Thank you!'
    },
    whatsapp: 'Hi, I\'m interested in booking a room. Can you share availability and rates?'
  }
};

/**
 * Generate random Indian name
 */
function generateIndianName() {
  const firstName = INDIAN_FIRST_NAMES[Math.floor(Math.random() * INDIAN_FIRST_NAMES.length)];
  const lastName = INDIAN_LAST_NAMES[Math.floor(Math.random() * INDIAN_LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

/**
 * Generate Indian phone number
 */
function generateIndianPhone() {
  const prefixes = ['91'];
  const prefix = prefixes[0];
  const number = Math.floor(1000000000 + Math.random() * 9000000000);
  return `${prefix}${number}`;
}

/**
 * Generate email from name
 */
function generateEmail(name) {
  const domain = INDIAN_EMAIL_DOMAINS[Math.floor(Math.random() * INDIAN_EMAIL_DOMAINS.length)];
  const emailName = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
  const randomNum = Math.floor(Math.random() * 1000);
  return `${emailName}${randomNum}@${domain}`;
}

/**
 * Generate confirmation number
 */
function generateConfirmationNumber(propertyId, bookingId) {
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `PNB-${propertyId}-${bookingId}-${random}`;
}

/**
 * Generate OTA reservation ID
 */
function generateOTAReservationId(source) {
  const prefixes = {
    'OTA_MMT': 'MMT',
    'OTA_BOOKING_COM': 'BK',
    'OTA_GOIBIBO': 'GB',
    'OTA_YATRA': 'YT',
    'OTA_AGODA': 'AG'
  };
  const prefix = prefixes[source] || 'OTA';
  const random = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${random}`;
}

/**
 * Weighted random selection
 */
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
}

/**
 * Random date between two dates
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Add days to date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Start of day
 */
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format date for display
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

/**
 * Seed 100 Loyalty Users
 */
async function seedLoyaltyUsers() {
  console.log('👥 Creating 100 loyalty users...');
  
  const loyaltyUsers = [];
  const tiers = ['SILVER', 'GOLD', 'PLATINUM'];
  const tierWeights = [
    { tier: 'SILVER', weight: 50 },
    { tier: 'GOLD', weight: 35 },
    { tier: 'PLATINUM', weight: 15 }
  ];

  // Get existing loyalty accounts to find next available member number
  const existingAccounts = await prisma.loyaltyAccount.findMany({
    orderBy: { memberNumber: 'desc' },
    take: 1,
  });
  
  let startMemberNumber = 1;
  if (existingAccounts.length > 0) {
    const lastMemberNumber = parseInt(existingAccounts[0].memberNumber, 10);
    startMemberNumber = lastMemberNumber + 1;
  }

  for (let i = 0; i < 100; i++) {
    const name = generateIndianName();
    const email = generateEmail(name);
    const phone = generateIndianPhone();
    const memberNumber = String(startMemberNumber + i).padStart(6, '0');
    const tier = weightedRandom(tierWeights).tier;
    
    // Points based on tier
    let points = 0;
    let lifetimeStays = 0;
    if (tier === 'SILVER') {
      points = Math.floor(500 + Math.random() * 1000);
      lifetimeStays = Math.floor(1 + Math.random() * 3);
    } else if (tier === 'GOLD') {
      points = Math.floor(2000 + Math.random() * 2000);
      lifetimeStays = Math.floor(4 + Math.random() * 5);
    } else if (tier === 'PLATINUM') {
      points = Math.floor(5000 + Math.random() * 5000);
      lifetimeStays = Math.floor(10 + Math.random() * 10);
    }

    // Create user (upsert to avoid duplicates)
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, phone },
      create: {
        name,
        email,
        phone,
      },
    });

    // Check if loyalty account already exists for this user
    const existingLoyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.id },
    });

    let loyaltyAccount;
    if (existingLoyaltyAccount) {
      // Update existing account
      loyaltyAccount = await prisma.loyaltyAccount.update({
        where: { id: existingLoyaltyAccount.id },
        data: {
          points: existingLoyaltyAccount.points + points,
          lifetimeStays: existingLoyaltyAccount.lifetimeStays + lifetimeStays,
          tier: tier > existingLoyaltyAccount.tier ? tier : existingLoyaltyAccount.tier,
        },
      });
    } else {
      // Create new loyalty account with unique member number
      // Check if member number is already taken
      let finalMemberNumber = memberNumber;
      let memberNumberExists = await prisma.loyaltyAccount.findUnique({
        where: { memberNumber: finalMemberNumber },
      });
      
      // If taken, find next available
      while (memberNumberExists) {
        startMemberNumber++;
        finalMemberNumber = String(startMemberNumber).padStart(6, '0');
        memberNumberExists = await prisma.loyaltyAccount.findUnique({
          where: { memberNumber: finalMemberNumber },
        });
      }
      
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          userId: user.id,
          memberNumber: finalMemberNumber,
          points,
          lifetimeStays,
          tier,
        },
      });
    }

    loyaltyUsers.push({ user, loyaltyAccount });
    
    if ((i + 1) % 20 === 0) {
      console.log(`  ✓ Created ${i + 1}/100 loyalty users`);
    }
  }

  console.log(`✅ Created 100 loyalty users`);
  return loyaltyUsers;
}

/**
 * Seed 12 months of bookings
 */
async function seedBookings(loyaltyUsers, properties) {
  console.log('📅 Creating 12 months of booking data...');
  
  const today = startOfDay(new Date());
  const startDate = addDays(today, -365); // 12 months ago
  const endDate = addDays(today, 30); // 30 days in future
  
  const bookings = [];
  const totalBookings = 1500; // ~125 bookings per month
  
  // Get all room types and rate plans (READ ONLY - uses existing data)
  const allRoomTypes = await prisma.roomType.findMany({
    include: { 
      ratePlans: true, 
      property: {
        include: { brand: true }
      }
    }
  });
  
  // Get cancellation policies
  const cancellationPolicies = await prisma.cancellationPolicy.findMany({
    where: { isActive: true }
  });
  
  // Get admin user for audit logs
  const adminUser = await prisma.user.findFirst({
    where: { email: 'shwet@thedesi.email' }
  });
  const systemUserId = adminUser?.id || 'system';

  for (let i = 0; i < totalBookings; i++) {
    // Random booking date (when booking was created)
    const bookingDate = randomDate(startDate, endDate);
    
    // Random check-in date (1-90 days after booking date)
    const daysUntilCheckIn = Math.floor(1 + Math.random() * 90);
    const checkIn = addDays(bookingDate, daysUntilCheckIn);
    
    // Random nights (1-7 nights)
    const nights = Math.floor(1 + Math.random() * 7);
    const checkOut = addDays(checkIn, nights);
    
    // Skip if check-out is in the future beyond our range
    if (checkOut > endDate) continue;
    
    // Select random room type
    const roomType = allRoomTypes[Math.floor(Math.random() * allRoomTypes.length)];
    const ratePlan = roomType.ratePlans[0] || null;
    
    if (!ratePlan) continue;
    
    // Calculate price
    const basePrice = ratePlan.seasonalPrice * nights;
    const taxAmount = basePrice * 0.18; // 18% GST
    const totalPrice = basePrice + taxAmount;
    
    // Select booking source
    const sourceItem = weightedRandom(BOOKING_SOURCES);
    const source = sourceItem.source;
    
    // Select booking status based on dates
    let status = 'CONFIRMED';
    if (checkOut < today) {
      // Past booking
      const statusItem = weightedRandom(BOOKING_STATUSES);
      status = statusItem.status;
    } else if (checkIn <= today && checkOut > today) {
      // Current stay
      status = Math.random() > 0.3 ? 'CHECKED_IN' : 'CONFIRMED';
    } else {
      // Future booking
      status = Math.random() > 0.9 ? 'PENDING' : 'CONFIRMED';
    }
    
    // Determine if loyalty user or regular guest
    const isLoyaltyUser = Math.random() < 0.3 && loyaltyUsers.length > 0;
    let guest, loyaltyAccountId = null;
    
    if (isLoyaltyUser) {
      const loyaltyData = loyaltyUsers[Math.floor(Math.random() * loyaltyUsers.length)];
      guest = {
        name: loyaltyData.user.name,
        email: loyaltyData.user.email,
        phone: loyaltyData.user.phone
      };
      loyaltyAccountId = loyaltyData.loyaltyAccount.id;
    } else {
      guest = {
        name: generateIndianName(),
        email: generateEmail(generateIndianName()),
        phone: generateIndianPhone()
      };
    }
    
    // OTA-specific fields
    let sourceReservationId = null;
    let sourceCommissionPct = null;
    let commissionAmount = null;
    
    if (source.startsWith('OTA_')) {
      sourceReservationId = generateOTAReservationId(source);
      sourceCommissionPct = OTA_COMMISSIONS[source] || 15;
      commissionAmount = (totalPrice * sourceCommissionPct) / 100;
    }
    
    // Select cancellation policy
    const cancellationPolicy = cancellationPolicies.length > 0
      ? cancellationPolicies[Math.floor(Math.random() * cancellationPolicies.length)]
      : null;
    
    // Create booking
    const booking = await prisma.booking.create({
      data: {
        guestName: guest.name,
        email: guest.email,
        phone: guest.phone,
        checkIn,
        checkOut,
        guests: Math.min(roomType.capacity, Math.floor(1 + Math.random() * 3)),
        rooms: 1,
        totalPrice,
        netAmount: basePrice,
        taxAmount,
        status,
        currency: 'INR',
        source,
        sourceReservationId,
        sourceCommissionPct,
        commissionAmount,
        cancellationPolicyId: cancellationPolicy?.id,
        loyaltyAccountId,
        confirmationNumber: generateConfirmationNumber(roomType.propertyId, i + 1),
        notesInternal: Math.random() > 0.7 ? 'Special request: Late check-in' : null,
        notesGuest: Math.random() > 0.8 ? 'Welcome! We look forward to hosting you.' : null,
        propertyId: roomType.propertyId,
        roomTypeId: roomType.id,
        ratePlanId: ratePlan.id,
        createdAt: bookingDate,
        updatedAt: bookingDate,
      },
    });
    
    // Create stay
    await prisma.stay.create({
      data: {
        bookingId: booking.id,
        roomTypeId: roomType.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numGuests: booking.guests,
        ratePlanId: ratePlan.id,
        status: status === 'CHECKED_IN' ? 'CHECKED_IN' : 
                status === 'CHECKED_OUT' ? 'CHECKED_OUT' :
                status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED',
        nightlyRates: generateNightlyRates(ratePlan.seasonalPrice, nights),
      },
    });
    
    // Create primary guest
    await prisma.bookingGuest.create({
      data: {
        bookingId: booking.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        isPrimary: true,
        loyaltyAccountId,
      },
    });
    
    // Create audit log for booking creation
    await prisma.bookingAuditLog.create({
      data: {
        bookingId: booking.id,
        performedBy: systemUserId,
        action: 'CREATE',
        meta: {
          source,
          status: 'PENDING',
          createdAt: bookingDate.toISOString(),
        },
        timestamp: bookingDate,
      },
    });
    
    // Create audit log for confirmation if confirmed
    if (status !== 'PENDING') {
      await prisma.bookingAuditLog.create({
        data: {
          bookingId: booking.id,
          performedBy: systemUserId,
          action: 'TRANSITION_CONFIRMED',
          meta: {
            fromState: 'PENDING',
            toState: 'CONFIRMED',
            confirmationNumber: booking.confirmationNumber,
          },
          timestamp: addDays(bookingDate, Math.random() * 2),
        },
      });
    }
    
    // Create payments
    await createPaymentsForBooking(booking, status, bookingDate);
    
    // Handle status-specific actions
    if (status === 'CHECKED_IN' || status === 'CHECKED_OUT') {
      await handleCheckIn(booking, roomType, systemUserId);
    }
    
    if (status === 'CHECKED_OUT') {
      await handleCheckOut(booking, systemUserId);
    }
    
    if (status === 'CANCELLED') {
      await handleCancellation(booking, cancellationPolicy, systemUserId);
    }
    
    if (status === 'NO_SHOW') {
      await handleNoShow(booking, systemUserId);
    }
    
    bookings.push(booking);
    
    if ((i + 1) % 150 === 0) {
      console.log(`  ✓ Created ${i + 1}/${totalBookings} bookings`);
    }
  }
  
  console.log(`✅ Created ${bookings.length} bookings`);
  return bookings;
}

/**
 * Generate nightly rates breakdown
 */
function generateNightlyRates(basePrice, nights) {
  const rates = {};
  for (let i = 0; i < nights; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = formatDate(date);
    const base = basePrice;
    const tax = base * 0.18;
    rates[dateStr] = {
      base,
      tax,
      total: base + tax
    };
  }
  return rates;
}

/**
 * Create payments for booking
 */
async function createPaymentsForBooking(booking, status, bookingDate) {
  const paymentMethods = ['RAZORPAY', 'CASH', 'CARD_ON_FILE', 'UPI'];
  
  // Most bookings have at least one payment
  if (status === 'CANCELLED' || status === 'NO_SHOW') {
    // Cancelled/no-show might have partial payment or refund
    if (Math.random() > 0.3) {
      const paymentStatus = Math.random() > 0.5 ? 'COMPLETED' : 'REFUNDED';
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: paymentStatus === 'REFUNDED' ? -booking.totalPrice * 0.8 : booking.totalPrice * 0.5,
          status: paymentStatus,
          metadata: {
            method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            currency: 'INR',
          },
          createdAt: bookingDate,
        },
      });
    }
  } else {
    // Active bookings have payments
    const numPayments = Math.random() > 0.7 ? 2 : 1; // Some have multiple payments
    let remaining = booking.totalPrice;
    
    for (let i = 0; i < numPayments; i++) {
      const amount = i === numPayments - 1 ? remaining : booking.totalPrice * (0.3 + Math.random() * 0.4);
      remaining -= amount;
      
      let paymentStatus = 'COMPLETED';
      if (status === 'PENDING' && i === 0) {
        paymentStatus = Math.random() > 0.8 ? 'PENDING' : 'COMPLETED';
      }
      
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount,
          status: paymentStatus,
          metadata: {
            method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            currency: 'INR',
          },
          createdAt: addDays(bookingDate, i),
        },
      });
    }
  }
}

/**
 * Handle check-in
 */
async function handleCheckIn(booking, roomType, userId) {
  // Get available rooms for this room type, or create one if none exist
  let rooms = await prisma.room.findMany({
    where: {
      roomTypeId: roomType.id,
      status: 'ACTIVE'
    },
    take: 1
  });
  
  // Create a room if none exists (for seed data purposes)
  if (rooms.length === 0) {
    const room = await prisma.room.create({
      data: {
        name: `${roomType.name} - Room 1`,
        type: roomType.name,
        capacity: roomType.capacity,
        pricePerNight: 0, // Not used in new model
        status: 'ACTIVE',
        propertyId: roomType.propertyId,
        roomTypeId: roomType.id,
      },
    });
    rooms = [room];
  }
  
  if (rooms.length > 0) {
    const stay = await prisma.stay.findFirst({
      where: { bookingId: booking.id }
    });
    
    if (stay) {
      await prisma.roomAssignment.create({
        data: {
          bookingId: booking.id,
          stayId: stay.id,
          roomId: rooms[0].id,
          assignedBy: userId,
          assignedAt: booking.checkIn,
          checkedInAt: booking.checkIn,
        },
      });
      
      await prisma.bookingAuditLog.create({
        data: {
          bookingId: booking.id,
          performedBy: userId,
          action: 'TRANSITION_CHECKED_IN',
          meta: {
            fromState: 'CONFIRMED',
            toState: 'CHECKED_IN',
            roomId: rooms[0].id,
          },
          timestamp: booking.checkIn,
        },
      });
    }
  }
}

/**
 * Handle check-out
 */
async function handleCheckOut(booking, userId) {
  await prisma.bookingAuditLog.create({
    data: {
      bookingId: booking.id,
      performedBy: userId,
      action: 'TRANSITION_CHECKED_OUT',
      meta: {
        fromState: 'CHECKED_IN',
        toState: 'CHECKED_OUT',
      },
      timestamp: booking.checkOut,
    },
  });
  
  // Update room assignment
  const assignment = await prisma.roomAssignment.findFirst({
    where: { bookingId: booking.id }
  });
  
  if (assignment) {
    await prisma.roomAssignment.update({
      where: { id: assignment.id },
      data: {
        checkedOutAt: booking.checkOut,
      },
    });
  }
}

/**
 * Handle cancellation
 */
async function handleCancellation(booking, cancellationPolicy, userId) {
  const cancellationDate = addDays(booking.checkIn, -Math.random() * 30); // Cancelled 0-30 days before check-in
  
  await prisma.bookingAuditLog.create({
    data: {
      bookingId: booking.id,
      performedBy: userId,
      action: 'TRANSITION_CANCELLED',
      meta: {
        fromState: 'CONFIRMED',
        toState: 'CANCELLED',
        cancellationDate: cancellationDate.toISOString(),
        reason: 'Guest request',
      },
      timestamp: cancellationDate,
    },
  });
  
  // Create refund payment if applicable
  if (Math.random() > 0.3) {
    const refundAmount = booking.totalPrice * (0.5 + Math.random() * 0.5);
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: -refundAmount,
        status: 'REFUNDED',
        metadata: {
          method: 'RAZORPAY',
          currency: 'INR',
          reason: 'Cancellation refund',
        },
        createdAt: cancellationDate,
      },
    });
  }
}

/**
 * Handle no-show
 */
async function handleNoShow(booking, userId) {
  const noShowDate = addDays(booking.checkIn, 1); // Marked no-show day after check-in
  
  await prisma.bookingAuditLog.create({
    data: {
      bookingId: booking.id,
      performedBy: userId,
      action: 'TRANSITION_NO_SHOW',
      meta: {
        fromState: 'CONFIRMED',
        toState: 'NO_SHOW',
      },
      timestamp: noShowDate,
    },
  });
  
  // Charge no-show fee
  if (Math.random() > 0.5) {
    const noShowFee = booking.totalPrice * 0.5;
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: noShowFee,
        status: 'COMPLETED',
        metadata: {
          method: 'CARD_ON_FILE',
          currency: 'INR',
          reason: 'No-show fee',
        },
        createdAt: noShowDate,
      },
    });
  }
}

/**
 * Seed Communication Hub data
 */
async function seedCommunications(bookings) {
  console.log('💬 Creating communication hub data...');
  
  const adminUser = await prisma.user.findFirst({
    where: { email: 'shwet@thedesi.email' }
  });
  
  const properties = await prisma.property.findMany();
  const totalConversations = 800; // Mix of emails, WhatsApp, SMS, calls
  
  for (let i = 0; i < totalConversations; i++) {
    // Random booking (70% linked to booking, 30% general inquiry)
    const linkedToBooking = Math.random() < 0.7;
    const booking = linkedToBooking ? bookings[Math.floor(Math.random() * bookings.length)] : null;
    const property = properties[Math.floor(Math.random() * properties.length)];
    
    // Select channel
    const channel = COMMUNICATION_CHANNELS[Math.floor(Math.random() * COMMUNICATION_CHANNELS.length)];
    
    // Create conversation based on channel
    if (channel === 'EMAIL') {
      await createEmailThread(booking, property, adminUser);
    } else if (channel === 'WHATSAPP' || channel === 'SMS') {
      await createMessageLog(booking, property, channel);
    } else if (channel === 'VOICE') {
      await createCallLog(booking, property);
    }
    
    if ((i + 1) % 100 === 0) {
      console.log(`  ✓ Created ${i + 1}/${totalConversations} conversations`);
    }
  }
  
  console.log(`✅ Created communication hub data`);
}

/**
 * Create email thread
 */
async function createEmailThread(booking, property, adminUser) {
  const guestEmail = booking?.email || generateEmail(generateIndianName());
  const guestName = booking?.guestName || generateIndianName();
  const subject = booking 
    ? `Re: Booking ${booking.confirmationNumber}`
    : `Inquiry about ${property.name}`;
  
  const thread = await prisma.thread.create({
    data: {
      subject,
      participants: [guestEmail, property.email || 'info@podnbeyond.com'],
      userId: adminUser?.id,
      bookingId: booking?.id,
      propertyId: property.id,
      lastMessageAt: randomDate(addDays(new Date(), -90), new Date()),
    },
  });
  
  // Create inbound email
  const inboundEmail = await prisma.email.create({
    data: {
      threadId: thread.id,
      messageId: `inbound-${Date.now()}-${Math.random()}`,
      direction: 'INBOUND',
      status: 'DELIVERED',
      fromEmail: guestEmail,
      fromName: guestName,
      toEmails: [property.email || 'info@podnbeyond.com'],
      subject,
      htmlBody: `<p>Hello, ${booking ? `I have a question about my booking ${booking.confirmationNumber}.` : 'I would like to know more about availability and rates.'}</p>`,
      textBody: `Hello, ${booking ? `I have a question about my booking ${booking.confirmationNumber}.` : 'I would like to know more about availability and rates.'}`,
      createdAt: thread.lastMessageAt,
    },
  });
  
  // Create outbound email (reply)
  const replyDate = addDays(thread.lastMessageAt, Math.random() * 2);
  await prisma.email.create({
    data: {
      threadId: thread.id,
      messageId: `outbound-${Date.now()}-${Math.random()}`,
      direction: 'OUTBOUND',
      status: 'SENT',
      fromEmail: property.email || 'info@podnbeyond.com',
      fromName: property.name,
      toEmails: [guestEmail],
      subject: `Re: ${subject}`,
      htmlBody: `<p>Dear ${guestName}, Thank you for contacting us. ${booking ? 'We have reviewed your booking and everything looks good.' : 'We would be happy to assist you with your inquiry.'}</p>`,
      textBody: `Dear ${guestName}, Thank you for contacting us. ${booking ? 'We have reviewed your booking and everything looks good.' : 'We would be happy to assist you with your inquiry.'}`,
      createdAt: replyDate,
    },
  });
  
  // Update thread last message
  await prisma.thread.update({
    where: { id: thread.id },
    data: { lastMessageAt: replyDate },
  });
}

/**
 * Create message log (WhatsApp/SMS)
 */
async function createMessageLog(booking, property, channel) {
  const phone = booking?.phone || generateIndianPhone();
  const guestName = booking?.guestName || generateIndianName();
  
  // Create or get contact
  let contact = await prisma.contact.findUnique({
    where: { phone }
  });
  
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        phone,
        name: guestName,
        email: booking?.email || generateEmail(guestName),
      },
    });
  }
  
  // Inbound message
  const inboundMessage = booking
    ? `Hi, I have a question about my booking ${booking.confirmationNumber}.`
    : 'Hi, I\'m interested in booking a room. Can you share availability?';
  
  await prisma.messageLog.create({
    data: {
      contactId: contact.id,
      channel: channel === 'WHATSAPP' ? 'WHATSAPP' : 'SMS',
      direction: 'INBOUND',
      status: 'DELIVERED',
      phone,
      message: inboundMessage,
      bookingId: booking?.id,
      createdAt: randomDate(addDays(new Date(), -90), new Date()),
    },
  });
  
  // Outbound message (reply)
  const replyDate = randomDate(addDays(new Date(), -90), new Date());
  const outboundMessage = booking
    ? `Hi ${guestName}! Thank you for contacting us. Your booking ${booking.confirmationNumber} is confirmed. We look forward to hosting you!`
    : `Hi ${guestName}! Thank you for your interest. We have availability. Please visit our website or call us for more details.`;
  
  await prisma.messageLog.create({
    data: {
      contactId: contact.id,
      channel: channel === 'WHATSAPP' ? 'WHATSAPP' : 'SMS',
      direction: 'OUTBOUND',
      status: 'SENT',
      phone,
      message: outboundMessage,
      bookingId: booking?.id,
      providerMessageId: `msg-${Date.now()}-${Math.random()}`,
      createdAt: replyDate,
      sentAt: replyDate,
    },
  });
}

/**
 * Create call log
 */
async function createCallLog(booking, property) {
  const phone = booking?.phone || generateIndianPhone();
  const guestName = booking?.guestName || generateIndianName();
  
  // Create or get contact
  let contact = await prisma.contact.findUnique({
    where: { phone }
  });
  
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        phone,
        name: guestName,
        email: booking?.email || generateEmail(guestName),
      },
    });
  }
  
  const callDate = randomDate(addDays(new Date(), -90), new Date());
  const duration = Math.floor(60 + Math.random() * 300); // 1-5 minutes
  const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'NO_ANSWER', 'BUSY', 'FAILED'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  await prisma.callLog.create({
    data: {
      contactId: contact.id,
      direction: Math.random() > 0.3 ? 'INBOUND' : 'OUTBOUND',
      status,
      fromNumber: Math.random() > 0.3 ? phone : property.phone || '+918235071333',
      toNumber: Math.random() > 0.3 ? property.phone || '+918235071333' : phone,
      duration: status === 'COMPLETED' ? duration : null,
      bookingId: booking?.id,
      providerCallId: `call-${Date.now()}-${Math.random()}`,
      createdAt: callDate,
      initiatedAt: callDate,
      answeredAt: status === 'COMPLETED' ? addDays(callDate, duration / 86400) : null,
      completedAt: status === 'COMPLETED' ? addDays(callDate, duration / 86400) : null,
    },
  });
}

/**
 * Update loyalty points for bookings
 */
async function updateLoyaltyPoints(bookings) {
  console.log('🎁 Updating loyalty points...');
  
  const loyaltyBookings = bookings.filter(b => b.loyaltyAccountId);
  let pointsUpdated = 0;
  
  for (const booking of loyaltyBookings) {
    if (booking.status === 'CHECKED_OUT' || booking.status === 'COMPLETED') {
      // Award points: 10 points per 100 INR spent
      const points = Math.floor(booking.totalPrice / 10);
      
      const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
        where: { id: booking.loyaltyAccountId }
      });
      
      if (loyaltyAccount) {
        const newBalance = loyaltyAccount.points + points;
        
        await prisma.loyaltyAccount.update({
          where: { id: loyaltyAccount.id },
          data: {
            points: newBalance,
            lifetimeStays: { increment: 1 },
          },
        });
        
        await prisma.pointsLedger.create({
          data: {
            loyaltyAccountId: loyaltyAccount.id,
            userId: loyaltyAccount.userId,
            points,
            reason: `Booking ${booking.confirmationNumber}`,
            bookingId: booking.id,
            balanceBefore: loyaltyAccount.points,
            balanceAfter: newBalance,
          },
        });
        
        pointsUpdated++;
      }
    }
  }
  
  console.log(`✅ Updated loyalty points for ${pointsUpdated} bookings`);
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log('🌱 Starting Master Seed Script...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Get existing data (READ ONLY - does not modify brands or properties)
    // IMPORTANT: This script preserves all existing brands and properties.
    // It only creates bookings, loyalty users, communications, and related data.
    const properties = await prisma.property.findMany({
      include: {
        brand: true,
        roomTypes: {
          include: {
            ratePlans: true
          }
        }
      }
    });
    if (properties.length === 0) {
      console.error('❌ No properties found. Please run property seed script first.');
      process.exit(1);
    }
    
    console.log(`📊 Found ${properties.length} properties (preserved - not modified)\n`);
    properties.forEach(p => {
      console.log(`  ✓ ${p.name} (Brand: ${p.brand?.name || 'None'})`);
    });
    console.log('');
    
    // Step 1: Seed loyalty users
    const loyaltyUsers = await seedLoyaltyUsers();
    console.log('');
    
    // Step 2: Seed bookings
    const bookings = await seedBookings(loyaltyUsers, properties);
    console.log('');
    
    // Step 3: Seed communications
    await seedCommunications(bookings);
    console.log('');
    
    // Step 4: Update loyalty points
    await updateLoyaltyPoints(bookings);
    console.log('');
    
    // Summary
    const summary = {
      loyaltyUsers: await prisma.loyaltyAccount.count(),
      bookings: await prisma.booking.count(),
      payments: await prisma.payment.count(),
      stays: await prisma.stay.count(),
      bookingGuests: await prisma.bookingGuest.count(),
      auditLogs: await prisma.bookingAuditLog.count(),
      roomAssignments: await prisma.roomAssignment.count(),
      emailThreads: await prisma.thread.count(),
      emails: await prisma.email.count(),
      messageLogs: await prisma.messageLog.count(),
      callLogs: await prisma.callLog.count(),
      contacts: await prisma.contact.count(),
      pointsLedger: await prisma.pointsLedger.count(),
    };
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 SEED SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Loyalty Users: ${summary.loyaltyUsers}`);
    console.log(`Bookings: ${summary.bookings}`);
    console.log(`Payments: ${summary.payments}`);
    console.log(`Stays: ${summary.stays}`);
    console.log(`Booking Guests: ${summary.bookingGuests}`);
    console.log(`Audit Logs: ${summary.auditLogs}`);
    console.log(`Room Assignments: ${summary.roomAssignments}`);
    console.log(`Email Threads: ${summary.emailThreads}`);
    console.log(`Emails: ${summary.emails}`);
    console.log(`Message Logs: ${summary.messageLogs}`);
    console.log(`Call Logs: ${summary.callLogs}`);
    console.log(`Contacts: ${summary.contacts}`);
    console.log(`Points Ledger Entries: ${summary.pointsLedger}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Master seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { main };

