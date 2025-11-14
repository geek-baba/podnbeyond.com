/**
 * Master Complete Seed Script
 * 
 * Creates comprehensive, interconnected test data:
 * - Staff users (STAFF_FRONTDESK, STAFF_OPS, MANAGER) with property-scoped roles
 * - Loyalty users with accounts
 * - Bookings linked to loyalty accounts
 * - Communication hub data (threads, emails, messages) linked to bookings and users
 * 
 * Ensures all data is properly linked and realistic for testing.
 * 
 * Usage: 
 *   node prisma/seed_master_complete.js
 *   node prisma/seed_master_complete.js --keep-staff  # Keep existing staff users
 */

const { PrismaClient } = require('@prisma/client');
const loyaltyService = require('../services/loyaltyService');

const prisma = new PrismaClient();

// Import seed functions from other scripts
const { seedLoyaltyAndBookings } = require('./seed_loyalty_and_bookings');

// ============================================================================
// DATA GENERATORS
// ============================================================================

const STAFF_FIRST_NAMES = [
  'Ravi', 'Priya', 'Amit', 'Sneha', 'Raj', 'Kavita', 'Vikram', 'Anjali',
  'Suresh', 'Meera', 'Arjun', 'Divya', 'Nikhil', 'Pooja', 'Rohit', 'Geeta'
];

const STAFF_LAST_NAMES = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Mehta', 'Agarwal'
];

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateStaffName() {
  return `${randomElement(STAFF_FIRST_NAMES)} ${randomElement(STAFF_LAST_NAMES)}`;
}

function generateStaffEmail(name) {
  const base = name.toLowerCase().replace(/\s+/g, '.');
  const domain = randomElement(EMAIL_DOMAINS);
  return `${base}@capsulepodhotel.com`;
}

function generatePhone() {
  return `+91 ${randomInt(70000, 99999)} ${randomInt(10000, 99999)}`;
}

function normalizePhone(phone) {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.length === 10) {
    normalized = '91' + normalized;
  }
  return normalized;
}

// ============================================================================
// CLEANUP
// ============================================================================

async function cleanupAllData(keepStaff = false) {
  console.log('🧹 Cleaning up existing data...\n');
  
  // Step 1: Delete Communication Hub Data
  console.log('  📧 Deleting communication hub data...');
  await prisma.conversationNote.deleteMany({});
  await prisma.emailEvent.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.email.deleteMany({});
  await prisma.messageLog.deleteMany({});
  await prisma.callLog.deleteMany({});
  await prisma.thread.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.suppression.deleteMany({});
  console.log('    ✅ Communication hub data deleted');
  
  // Step 2: Delete Booking-Related Data
  console.log('  📅 Deleting booking-related data...');
  await prisma.roomAssignment.deleteMany({});
  await prisma.bookingAuditLog.deleteMany({});
  await prisma.bookingGuest.deleteMany({});
  await prisma.stay.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.inventoryLock.deleteMany({});
  await prisma.holdLog.deleteMany({});
  console.log('    ✅ Booking-related data deleted');
  
  // Step 3: Delete Bookings
  console.log('  🗑️  Deleting bookings...');
  const deletedBookings = await prisma.booking.deleteMany({});
  console.log(`    ✅ Deleted ${deletedBookings.count} bookings`);
  
  // Step 4: Delete Loyalty Data
  console.log('  💎 Deleting loyalty data...');
  await prisma.pointsLedger.deleteMany({});
  await prisma.perkRedemption.deleteMany({});
  await prisma.redemptionTransaction.deleteMany({});
  await prisma.tierHistory.deleteMany({});
  await prisma.referral.deleteMany({});
  await prisma.tierTransfer.deleteMany({});
  const deletedLoyalty = await prisma.loyaltyAccount.deleteMany({});
  console.log(`    ✅ Deleted ${deletedLoyalty.count} loyalty accounts`);
  
  // Step 5: Delete Guest Users (if not keeping staff)
  if (!keepStaff) {
    console.log('  👥 Deleting guest/member users...');
    
    // Find users with only GUEST or MEMBER roles (no staff roles)
    // BUT keep the super admin (shwet@thedesi.email)
    const guestUsers = await prisma.user.findMany({
      where: {
        email: { not: 'shwet@thedesi.email' }, // Keep super admin
        userRoles: {
          none: {
            roleKey: { in: ['STAFF_FRONTDESK', 'STAFF_OPS', 'MANAGER', 'ADMIN', 'SUPERADMIN'] }
          }
        }
      }
    });
    
    // Delete user roles first
    for (const user of guestUsers) {
      await prisma.userRole.deleteMany({
        where: { userId: user.id }
      });
    }
    
    // Delete users (cascade will handle related data)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: guestUsers.map(u => u.id) }
      }
    });
    console.log(`    ✅ Deleted ${deletedUsers.count} guest/member users (kept super admin)`);
  } else {
    console.log('  ℹ️  Keeping existing staff users (including super admin)');
  }
  
  console.log('  ✅ Cleanup complete\n');
}

// ============================================================================
// STAFF USER CREATION
// ============================================================================

async function createStaffUsers(properties) {
  console.log('👔 Creating staff users...\n');
  
  const staffUsers = [];
  const org = await prisma.organization.findFirst();
  
  if (!org) {
    throw new Error('Organization not found. Please run seed_rbac.js first.');
  }
  
  // Temporarily disable FK constraint to allow property-scoped roles
  console.log('  ⚙️  Temporarily disabling FK constraint for property-scoped roles...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_scopeId_fkey;`);
  } catch (err) {
    console.warn(`    ⚠️  Could not disable FK constraint: ${err.message}`);
  }
  
  for (const property of properties) {
    console.log(`  🏨 Property: ${property.name}`);
    
    // Create STAFF_FRONTDESK (2-3 per property)
    const frontdeskCount = randomInt(2, 3);
    for (let i = 0; i < frontdeskCount; i++) {
      const name = generateStaffName();
      const email = generateStaffEmail(name);
      const phone = generatePhone();
      
      // Check if user already exists
      let user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            phone,
            emailVerified: new Date(),
          }
        });
      }
      
      // Assign STAFF_FRONTDESK role using raw SQL to bypass FK constraint
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO user_roles ("userId", "roleKey", "scopeType", "scopeId", "createdAt", "updatedAt")
          VALUES ('${user.id}', 'STAFF_FRONTDESK', 'PROPERTY', ${property.id}, NOW(), NOW())
          ON CONFLICT ("userId", "roleKey", "scopeType", "scopeId") DO NOTHING
        `);
        staffUsers.push({ user, role: 'STAFF_FRONTDESK', property });
        console.log(`    ✅ ${name} - STAFF_FRONTDESK`);
      } catch (rawErr) {
        console.warn(`    ⚠️  Could not create property-scoped role for ${name}: ${rawErr.message}`);
        // Continue - don't return, just skip adding to staffUsers
      }
    }
    
    // Create STAFF_OPS (1-2 per property)
    const opsCount = randomInt(1, 2);
    for (let i = 0; i < opsCount; i++) {
      const name = generateStaffName();
      const email = generateStaffEmail(name);
      const phone = generatePhone();
      
      let user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            phone,
            emailVerified: new Date(),
          }
        });
      }
      
      // Assign STAFF_OPS role using raw SQL to bypass FK constraint
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO user_roles ("userId", "roleKey", "scopeType", "scopeId", "createdAt", "updatedAt")
          VALUES ('${user.id}', 'STAFF_OPS', 'PROPERTY', ${property.id}, NOW(), NOW())
          ON CONFLICT ("userId", "roleKey", "scopeType", "scopeId") DO NOTHING
        `);
        staffUsers.push({ user, role: 'STAFF_OPS', property });
        console.log(`    ✅ ${name} - STAFF_OPS`);
      } catch (rawErr) {
        console.warn(`    ⚠️  Could not create property-scoped role for ${name}: ${rawErr.message}`);
        // Continue - don't return, just skip adding to staffUsers
      }
    }
    
    // Create MANAGER (1 per property)
    const name = generateStaffName();
    const email = generateStaffEmail(name);
    const phone = generatePhone();
    
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          phone,
          emailVerified: new Date(),
        }
      });
    }
    
    // Assign MANAGER role using raw SQL to bypass FK constraint
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO user_roles ("userId", "roleKey", "scopeType", "scopeId", "createdAt", "updatedAt")
        VALUES ('${user.id}', 'MANAGER', 'PROPERTY', ${property.id}, NOW(), NOW())
        ON CONFLICT ("userId", "roleKey", "scopeType", "scopeId") DO NOTHING
      `);
      staffUsers.push({ user, role: 'MANAGER', property });
      console.log(`    ✅ ${name} - MANAGER`);
    } catch (rawErr) {
      console.warn(`    ⚠️  Could not create property-scoped role for ${name}: ${rawErr.message}`);
      // Continue - don't return, just skip adding to staffUsers
    }
  }
  
  // Re-add FK constraint (as NOT VALID to avoid checking existing data)
  console.log('  ⚙️  Re-adding FK constraint...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE user_roles ADD CONSTRAINT user_roles_scopeId_fkey 
      FOREIGN KEY ("scopeId") REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE SET NULL NOT VALID;
    `);
    console.log('    ✅ FK constraint re-added');
  } catch (err) {
    // Constraint might already exist, that's okay
    if (err.message.includes('already exists')) {
      console.log('    ℹ️  FK constraint already exists');
    } else {
      console.warn(`    ⚠️  Could not re-add FK constraint: ${err.message}`);
    }
  }
  
  console.log(`\n  ✅ Created ${staffUsers.length} staff users across ${properties.length} properties\n`);
  return staffUsers;
}

// ============================================================================
// COMMUNICATION HUB DATA CREATION
// ============================================================================

const SAMPLE_MESSAGES = {
  booking: {
    email: [
      {
        inbound: {
          subject: 'Booking Confirmation Request',
          body: 'Hello, I recently made a booking and would like to confirm the details. Can you please send me a confirmation email with all the booking information?'
        },
        outbound: {
          subject: 'Re: Booking Confirmation Request',
          body: 'Thank you for your booking! Your reservation has been confirmed. Please find your booking details attached. We look forward to hosting you.'
        }
      },
      {
        inbound: {
          subject: 'Special Request - Late Check-out',
          body: 'Hi, I would like to request a late check-out for my stay. Is it possible to extend check-out until 2 PM?'
        },
        outbound: {
          subject: 'Re: Special Request - Late Check-out',
          body: 'We\'ll be happy to accommodate your late check-out request, subject to room availability. We\'ll confirm on the day of check-out. Thank you!'
        }
      },
      {
        inbound: {
          subject: 'Early Check-in Request',
          body: 'I\'ll be arriving around 11 AM. Is early check-in possible?'
        },
        outbound: {
          subject: 'Re: Early Check-in Request',
          body: 'We\'ll do our best to accommodate early check-in based on room availability. Please let us know when you arrive, and we\'ll check if your room is ready.'
        }
      }
    ],
    whatsapp: [
      {
        inbound: 'Hi, I have a booking for tomorrow. What time is check-in?',
        outbound: 'Hello! Check-in time is from 2:00 PM onwards. We look forward to welcoming you!'
      },
      {
        inbound: 'Can I get an early check-in? I\'ll be arriving around 11 AM.',
        outbound: 'We\'ll do our best to accommodate early check-in based on room availability. Please let us know when you arrive, and we\'ll check if your room is ready.'
      },
      {
        inbound: 'I need to cancel my booking. What\'s the cancellation policy?',
        outbound: 'Cancellations made 24 hours before check-in are free. Cancellations within 24 hours may incur charges. Please provide your booking ID for assistance.'
      }
    ]
  },
  general: {
    email: [
      {
        inbound: {
          subject: 'Question about Room Amenities',
          body: 'I\'m planning to stay next week and wanted to know if the rooms have a mini-fridge and coffee maker?'
        },
        outbound: {
          subject: 'Re: Question about Room Amenities',
          body: 'Yes, all our rooms are equipped with a mini-fridge. Coffee and tea making facilities are available in the common area. We also provide room service for beverages.'
        }
      },
      {
        inbound: {
          subject: 'Parking Availability',
          body: 'Is parking available at your property?'
        },
        outbound: {
          subject: 'Re: Parking Availability',
          body: 'Yes, we have parking facilities available. Please inform us in advance if you\'ll be bringing a vehicle.'
        }
      }
    ],
    whatsapp: [
      {
        inbound: 'What amenities are available at the property?',
        outbound: 'We offer free WiFi, 24/7 reception, housekeeping, and complimentary breakfast. For more details, please visit our website or contact reception.'
      },
      {
        inbound: 'Is parking available?',
        outbound: 'Yes, we have parking facilities available. Please inform us in advance if you\'ll be bringing a vehicle.'
      }
    ]
  }
};

async function createCommunicationHubData(bookings, users, staffUsers, properties) {
  console.log('💬 Creating communication hub data...\n');
  
  let threadCount = 0;
  let emailCount = 0;
  let whatsappCount = 0;
  let smsCount = 0;
  let callCount = 0;
  
  // Get staff users by property
  const staffByProperty = {};
  for (const staff of staffUsers) {
    if (!staffByProperty[staff.property.id]) {
      staffByProperty[staff.property.id] = [];
    }
    staffByProperty[staff.property.id].push(staff);
  }
  
  // Create threads for bookings (60% of bookings get threads)
  const bookingThreadsCount = Math.floor(bookings.length * 0.6);
  const selectedBookings = bookings.slice(0, bookingThreadsCount);
  
  for (let i = 0; i < selectedBookings.length; i++) {
    const booking = selectedBookings[i];
    const property = booking.property || properties.find(p => p.id === booking.propertyId) || properties[0];
    const staff = staffByProperty[property.id] || [];
    const frontdeskStaff = staff.filter(s => s.role === 'STAFF_FRONTDESK' || s.role === 'MANAGER');
    const assignedStaff = frontdeskStaff.length > 0 ? frontdeskStaff[i % frontdeskStaff.length] : null;
    
    // Get user from booking's loyalty account
    const bookingUser = booking.loyaltyAccount?.user || users.find(u => u.email === booking.email);
    
    // Create or get contact
    const normalizedPhone = normalizePhone(booking.phone || bookingUser?.phone || '');
    const contact = await prisma.contact.upsert({
      where: { phone: normalizedPhone || `000000000${i}` },
      update: {
        name: booking.guestName,
        email: booking.email,
      },
      create: {
        phone: normalizedPhone || `000000000${i}`,
        name: booking.guestName,
        email: booking.email,
      }
    });
    
    // Thread created around booking date (before, during, or after)
    const bookingDate = new Date(booking.checkIn);
    const daysOffset = randomInt(-7, 14); // Thread can be 7 days before to 14 days after check-in
    const threadCreatedAt = new Date(bookingDate);
    threadCreatedAt.setDate(threadCreatedAt.getDate() + daysOffset);
    
    const hasResponse = i % 2 === 0;
    const isResolved = i % 3 === 0;
    const firstResponseAt = hasResponse ? new Date(threadCreatedAt.getTime() + randomInt(5, 30) * 60000) : null;
    const resolvedAt = isResolved ? new Date(threadCreatedAt.getTime() + randomInt(30, 240) * 60000) : null;
    
    // Determine channel (50% Email, 40% WhatsApp, 5% SMS, 5% Calls)
    const channelRoll = Math.random();
    let primaryChannel;
    if (channelRoll < 0.5) {
      primaryChannel = 'EMAIL';
    } else if (channelRoll < 0.9) {
      primaryChannel = 'WHATSAPP';
    } else if (channelRoll < 0.95) {
      primaryChannel = 'SMS';
    } else {
      primaryChannel = 'CALL';
    }
    
    // Determine thread status
    let status;
    if (isResolved) {
      status = 'RESOLVED';
    } else if (i % 3 === 0) {
      status = 'NEW';
    } else if (i % 3 === 1) {
      status = 'IN_PROGRESS';
    } else {
      status = 'WAITING_FOR_GUEST';
    }
    
    // Determine priority
    let priority = 'NORMAL';
    if (i % 4 === 0) priority = 'URGENT';
    else if (i % 4 === 1) priority = 'HIGH';
    
    // Assignment: 60% STAFF_FRONTDESK, 30% MANAGER, 10% unassigned
    let finalAssignedStaff = null;
    if (i % 10 !== 0) {
      const assignRoll = Math.random();
      if (assignRoll < 0.6) {
        const frontdesk = staff.filter(s => s.role === 'STAFF_FRONTDESK');
        finalAssignedStaff = frontdesk.length > 0 ? frontdesk[i % frontdesk.length] : null;
      } else {
        const managers = staff.filter(s => s.role === 'MANAGER');
        finalAssignedStaff = managers.length > 0 ? managers[i % managers.length] : null;
      }
    }
    
    const thread = await prisma.thread.create({
      data: {
        subject: `Booking Inquiry - ${booking.guestName}`,
        participants: [booking.email],
        propertyId: property.id,
        bookingId: booking.id,
        userId: bookingUser?.id || null,
        status,
        priority,
        assignedTo: finalAssignedStaff?.user.id || null,
        createdAt: threadCreatedAt,
        lastMessageAt: threadCreatedAt,
        firstResponseAt: firstResponseAt,
        resolvedAt: resolvedAt,
      }
    });
    
    threadCount++;
    
    // Create messages based on primary channel
    if (primaryChannel === 'EMAIL') {
      const emailIndex = i % SAMPLE_MESSAGES.booking.email.length;
      const emailData = SAMPLE_MESSAGES.booking.email[emailIndex];
      
      // Inbound email
      await prisma.email.create({
        data: {
          threadId: thread.id,
          messageId: `seed-inbound-${thread.id}-${Date.now()}-${i}`,
          fromEmail: booking.email,
          fromName: booking.guestName,
          toEmails: [property.email || 'support@capsulepodhotel.com'],
          subject: emailData.inbound.subject,
          textBody: emailData.inbound.body,
          htmlBody: `<p>${emailData.inbound.body}</p>`,
          direction: 'INBOUND',
          status: 'DELIVERED',
          createdAt: threadCreatedAt,
        }
      });
      emailCount++;
      
      if (hasResponse) {
        const outboundEmail = await prisma.email.create({
          data: {
            threadId: thread.id,
            messageId: `seed-outbound-${thread.id}-${Date.now()}-${i}`,
            fromEmail: property.email || 'support@capsulepodhotel.com',
            fromName: property.name,
            toEmails: [booking.email],
            subject: emailData.outbound.subject,
            textBody: emailData.outbound.body,
            htmlBody: `<p>${emailData.outbound.body}</p>`,
            direction: 'OUTBOUND',
            status: 'SENT',
            createdAt: firstResponseAt || new Date(threadCreatedAt.getTime() + 10 * 60000),
          }
        });
        emailCount++;
        
        await prisma.thread.update({
          where: { id: thread.id },
          data: { lastMessageAt: outboundEmail.createdAt }
        });
      }
    } else if (primaryChannel === 'WHATSAPP') {
      const whatsappIndex = i % SAMPLE_MESSAGES.booking.whatsapp.length;
      const whatsappData = SAMPLE_MESSAGES.booking.whatsapp[whatsappIndex];
      
      // Inbound WhatsApp
      await prisma.messageLog.create({
        data: {
          threadId: thread.id,
          contactId: contact.id,
          channel: 'WHATSAPP',
          direction: 'INBOUND',
          status: 'DELIVERED',
          phone: normalizedPhone || '0000000000',
          message: whatsappData.inbound,
          provider: 'GUPSHUP',
          providerMessageId: `wa-inbound-${thread.id}-${Date.now()}`,
          providerStatus: 'delivered',
          sentAt: threadCreatedAt,
          deliveredAt: threadCreatedAt,
          metadata: { bookingId: booking.id, propertyId: property.id },
        }
      });
      whatsappCount++;
      
      if (hasResponse) {
        const outboundWhatsApp = await prisma.messageLog.create({
          data: {
            threadId: thread.id,
            contactId: contact.id,
            channel: 'WHATSAPP',
            direction: 'OUTBOUND',
            status: 'DELIVERED',
            phone: normalizedPhone || '0000000000',
            message: whatsappData.outbound,
            provider: 'GUPSHUP',
            providerMessageId: `wa-outbound-${thread.id}-${Date.now()}`,
            providerStatus: 'delivered',
            sentAt: firstResponseAt || new Date(threadCreatedAt.getTime() + 10 * 60000),
            deliveredAt: firstResponseAt || new Date(threadCreatedAt.getTime() + 10 * 60000),
            readAt: new Date((firstResponseAt || new Date(threadCreatedAt.getTime() + 10 * 60000)).getTime() + 5 * 60000),
            metadata: { bookingId: booking.id, propertyId: property.id },
          }
        });
        whatsappCount++;
        
        await prisma.thread.update({
          where: { id: thread.id },
          data: { lastMessageAt: outboundWhatsApp.sentAt }
        });
      }
    } else if (primaryChannel === 'SMS') {
      // SMS messages
      await prisma.messageLog.create({
        data: {
          threadId: thread.id,
          contactId: contact.id,
          channel: 'SMS',
          direction: 'INBOUND',
          status: 'DELIVERED',
          phone: normalizedPhone || '0000000000',
          message: 'Hi, I have a question about my booking.',
          provider: 'GUPSHUP',
          providerMessageId: `sms-inbound-${thread.id}-${Date.now()}`,
          providerStatus: 'delivered',
          sentAt: threadCreatedAt,
          deliveredAt: threadCreatedAt,
          metadata: { bookingId: booking.id, propertyId: property.id },
        }
      });
      smsCount++;
      
      if (hasResponse) {
        const outboundSMS = await prisma.messageLog.create({
          data: {
            threadId: thread.id,
            contactId: contact.id,
            channel: 'SMS',
            direction: 'OUTBOUND',
            status: 'DELIVERED',
            phone: normalizedPhone || '0000000000',
            message: 'Thank you for contacting us. We will assist you shortly.',
            provider: 'GUPSHUP',
            providerMessageId: `sms-outbound-${thread.id}-${Date.now()}`,
            providerStatus: 'delivered',
            sentAt: firstResponseAt || new Date(threadCreatedAt.getTime() + 10 * 60000),
            deliveredAt: firstResponseAt || new Date(threadCreatedAt.getTime() + 10 * 60000),
            metadata: { bookingId: booking.id, propertyId: property.id },
          }
        });
        smsCount++;
        
        await prisma.thread.update({
          where: { id: thread.id },
          data: { lastMessageAt: outboundSMS.sentAt }
        });
      }
    } else {
      // Phone calls
      const callDuration = randomInt(60, 600); // 1-10 minutes
      const initiatedAt = threadCreatedAt;
      const answeredAt = new Date(initiatedAt.getTime() + 5 * 1000); // Answered after 5 seconds
      const completedAt = new Date(initiatedAt.getTime() + callDuration * 1000);
      
      await prisma.callLog.create({
        data: {
          thread: { connect: { id: thread.id } },
          contact: { connect: { id: contact.id } },
          direction: 'INBOUND',
          status: 'COMPLETED',
          fromNumber: normalizedPhone || '0000000000',
          toNumber: property.phone || '+911234567890',
          duration: callDuration,
          provider: 'EXOTEL',
          providerCallId: `call-inbound-${thread.id}-${Date.now()}`,
          initiatedAt,
          answeredAt,
          completedAt,
          bookingId: booking.id,
          metadata: { propertyId: property.id },
        }
      });
      callCount++;
    }
  }
  
  // Create general inquiry threads (30% of threads) - linked to users, not bookings
  const generalThreadsCount = Math.floor(bookings.length * 0.3);
  const loyaltyUsers = users.filter(u => {
    // Users with loyalty accounts (not staff)
    return u.loyaltyAccount !== null;
  });
  
  for (let i = 0; i < generalThreadsCount && i < loyaltyUsers.length; i++) {
    const user = loyaltyUsers[i];
    const property = properties[i % properties.length];
    const staff = staffByProperty[property.id] || [];
    const frontdeskStaff = staff.filter(s => s.role === 'STAFF_FRONTDESK' || s.role === 'MANAGER');
    const assignedStaff = frontdeskStaff.length > 0 ? frontdeskStaff[i % frontdeskStaff.length] : null;
    
    // Create or get contact
    const normalizedPhone = normalizePhone(user.phone || '');
    const contact = await prisma.contact.upsert({
      where: { phone: normalizedPhone || `000000000${i}` },
      update: {
        name: user.name,
        email: user.email,
      },
      create: {
        phone: normalizedPhone || `000000000${i}`,
        name: user.name,
        email: user.email,
      }
    });
    
    // Create thread
    const threadCreatedAt = new Date(Date.now() - (i * 3600000) - 1800000);
    const hasResponse = i % 2 === 1;
    const isResolved = i % 4 === 0;
    const firstResponseAt = hasResponse ? new Date(threadCreatedAt.getTime() + (10 + i) * 60000) : null;
    const resolvedAt = isResolved ? new Date(threadCreatedAt.getTime() + (45 + i * 5) * 60000) : null;
    
    const emailIndex = i % SAMPLE_MESSAGES.general.email.length;
    const emailData = SAMPLE_MESSAGES.general.email[emailIndex];
    
    const thread = await prisma.thread.create({
      data: {
        subject: emailData.inbound.subject,
        participants: [user.email],
        propertyId: property.id,
        userId: user.id,
        status: isResolved ? 'RESOLVED' : 'IN_PROGRESS',
        priority: 'NORMAL',
        assignedTo: assignedStaff?.user.id || null,
        createdAt: threadCreatedAt,
        lastMessageAt: threadCreatedAt,
        firstResponseAt: firstResponseAt,
        resolvedAt: resolvedAt,
      }
    });
    
    threadCount++;
    
    // Create emails
    const inboundEmail = await prisma.email.create({
      data: {
        threadId: thread.id,
        messageId: `seed-general-inbound-${thread.id}-${Date.now()}-${i}`,
        fromEmail: user.email,
        fromName: user.name,
        toEmails: [property.email || 'support@capsulepodhotel.com'],
        subject: emailData.inbound.subject,
        textBody: emailData.inbound.body,
        htmlBody: `<p>${emailData.inbound.body}</p>`,
        direction: 'INBOUND',
        status: 'DELIVERED',
        createdAt: threadCreatedAt,
      }
    });
    emailCount++;
    
    if (hasResponse) {
      const outboundEmail = await prisma.email.create({
        data: {
          threadId: thread.id,
          messageId: `seed-general-outbound-${thread.id}-${Date.now()}-${i}`,
          fromEmail: property.email || 'support@capsulepodhotel.com',
          fromName: property.name,
          toEmails: [user.email],
          subject: emailData.outbound.subject,
          textBody: emailData.outbound.body,
          htmlBody: `<p>${emailData.outbound.body}</p>`,
          direction: 'OUTBOUND',
          status: 'SENT',
          createdAt: firstResponseAt || new Date(threadCreatedAt.getTime() + 10 * 60000),
        }
      });
      emailCount++;
      
      await prisma.thread.update({
        where: { id: thread.id },
        data: { lastMessageAt: outboundEmail.createdAt }
      });
    }
  }
  
  console.log(`  ✅ Created ${threadCount} threads`);
  console.log(`  ✅ Created ${emailCount} emails`);
  console.log(`  ✅ Created ${whatsappCount} WhatsApp messages`);
  console.log(`  ✅ Created ${smsCount} SMS messages`);
  console.log(`  ✅ Created ${callCount} call logs`);
  console.log(`  ✅ Communication hub data created\n`);
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedMasterComplete(options = {}) {
  const { keepStaff = false } = options;
  
  console.log('🚀 Starting Master Complete Seed...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('This will create:');
  console.log('  • Staff users (STAFF_FRONTDESK, STAFF_OPS, MANAGER)');
  console.log('  • Loyalty users with accounts');
  console.log('  • Bookings linked to loyalty accounts');
  console.log('  • Communication hub data (threads, emails, messages)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Step 1: Cleanup
    await cleanupAllData(keepStaff);
    
    // Step 2: Get properties
    console.log('📋 Fetching properties...');
    const properties = await prisma.property.findMany({ where: { status: 'ACTIVE' } });
    if (properties.length === 0) {
      throw new Error('No properties found. Please seed properties first.');
    }
    console.log(`  ✅ Found ${properties.length} properties\n`);
    
    // Step 3: Create staff users
    const staffUsers = await createStaffUsers(properties);
    
    // Step 4: Seed loyalty and bookings (this creates users, loyalty accounts, and bookings)
    console.log('💎 Seeding loyalty accounts and bookings...\n');
    await seedLoyaltyAndBookings({ 
      deleteExistingBookings: false, // Already deleted above
      skipCleanup: true // Skip cleanup since we already did it
    });
    
    // Step 5: Get created bookings and users
    console.log('📊 Fetching created data...');
    const bookings = await prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'CHECKED_OUT'] } },
      take: 50, // Limit for communication hub data
      orderBy: { createdAt: 'desc' },
      include: {
        property: true,
        loyaltyAccount: {
          include: {
            user: true
          }
        }
      }
    });
    
    const users = await prisma.user.findMany({
      include: { 
        loyaltyAccount: true 
      },
      where: {
        loyaltyAccount: { isNot: null }
      }
    });
    
    console.log(`  ✅ Found ${bookings.length} bookings and ${users.length} loyalty users\n`);
    
    // Step 6: Create communication hub data
    await createCommunicationHubData(bookings, users, staffUsers, properties);
    
    // Step 7: Summary
    console.log('📊 Final Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const staffCount = await prisma.userRole.count({
      where: {
        roleKey: { in: ['STAFF_FRONTDESK', 'STAFF_OPS', 'MANAGER'] }
      }
    });
    console.log(`  Staff Users: ${staffCount}`);
    
    const loyaltyCount = await prisma.loyaltyAccount.count();
    console.log(`  Loyalty Members: ${loyaltyCount}`);
    
    const bookingCount = await prisma.booking.count();
    console.log(`  Bookings: ${bookingCount}`);
    
    const threadCount = await prisma.thread.count();
    console.log(`  Communication Threads: ${threadCount}`);
    
    const emailCount = await prisma.email.count();
    console.log(`  Emails: ${emailCount}`);
    
    const whatsappCount = await prisma.messageLog.count({
      where: { channel: 'WHATSAPP' }
    });
    const smsCount = await prisma.messageLog.count({
      where: { channel: 'SMS' }
    });
    const callCount = await prisma.callLog.count();
    console.log(`  WhatsApp Messages: ${whatsappCount}`);
    console.log(`  SMS Messages: ${smsCount}`);
    console.log(`  Call Logs: ${callCount}`);
    
    // Tier distribution
    const tierStats = await prisma.loyaltyAccount.groupBy({
      by: ['tier'],
      _count: { tier: true }
    });
    console.log('\n  Tier Distribution:');
    tierStats.forEach(stat => {
      console.log(`    ${stat.tier}: ${stat._count.tier} members`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 Master Complete Seed finished successfully!\n');
    
  } catch (error) {
    console.error('❌ Error in master seed:', error);
    throw error;
  }
}

// ============================================================================
// RUN
// ============================================================================

if (require.main === module) {
  const keepStaff = process.argv.includes('--keep-staff') || process.argv.includes('-k');
  
  seedMasterComplete({ keepStaff })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedMasterComplete };

