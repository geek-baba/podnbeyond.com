const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Seed script to create sample conversations (emails, WhatsApp, calls)
 * linked to bookings and users for testing the unified conversation hub
 */

// Sample data
const sampleGuests = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    phone: '919876543210',
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '919876543211',
  },
  {
    name: 'Amit Patel',
    email: 'amit.patel@example.com',
    phone: '919876543212',
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    phone: '919876543213',
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    phone: '919876543214',
  },
];

const sampleMessages = {
  whatsapp: [
    {
      inbound: "Hi, I have a booking for tomorrow. What time is check-in?",
      outbound: "Hello! Check-in time is from 2:00 PM onwards. We look forward to welcoming you!",
    },
    {
      inbound: "Can I get an early check-in? I'll be arriving around 11 AM.",
      outbound: "We'll do our best to accommodate early check-in based on room availability. Please let us know when you arrive, and we'll check if your room is ready.",
    },
    {
      inbound: "What amenities are available at the property?",
      outbound: "We offer free WiFi, 24/7 reception, housekeeping, and complimentary breakfast. For more details, please visit our website or contact reception.",
    },
    {
      inbound: "I need to cancel my booking. What's the cancellation policy?",
      outbound: "Cancellations made 24 hours before check-in are free. Cancellations within 24 hours may incur charges. Please provide your booking ID for assistance.",
    },
    {
      inbound: "Is parking available?",
      outbound: "Yes, we have parking facilities available. Please inform us in advance if you'll be bringing a vehicle.",
    },
  ],
  email: [
    {
      inbound: {
        subject: "Booking Confirmation Request",
        body: "Hello, I recently made a booking and would like to confirm the details. Can you please send me a confirmation email with all the booking information?",
      },
      outbound: {
        subject: "Re: Booking Confirmation Request",
        body: "Thank you for your booking! Your reservation has been confirmed. Please find your booking details attached. We look forward to hosting you.",
      },
    },
    {
      inbound: {
        subject: "Special Request - Late Check-out",
        body: "Hi, I would like to request a late check-out for my stay. Is it possible to extend check-out until 2 PM?",
      },
      outbound: {
        subject: "Re: Special Request - Late Check-out",
        body: "We'll be happy to accommodate your late check-out request, subject to room availability. We'll confirm on the day of check-out. Thank you!",
      },
    },
    {
      inbound: {
        subject: "Question about Room Amenities",
        body: "I'm planning to stay next week and wanted to know if the rooms have a mini-fridge and coffee maker?",
      },
      outbound: {
        subject: "Re: Question about Room Amenities",
        body: "Yes, all our rooms are equipped with a mini-fridge. Coffee and tea making facilities are available in the common area. We also provide room service for beverages.",
      },
    },
  ],
};

function normalizePhone(phone) {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.length === 10) {
    normalized = '91' + normalized;
  }
  return normalized;
}

async function seedConversations() {
  console.log('🌱 Starting conversation seed...');

  try {
    // Clear existing seed data first
    console.log('🧹 Cleaning up existing seed data...');
    
    // Delete threads that match seed patterns
    const seedThreads = await prisma.thread.findMany({
      where: {
        OR: [
          { subject: { startsWith: 'Booking Inquiry' } },
          { subject: { startsWith: 'General Inquiry' } },
          { subject: { startsWith: 'Booking Confirmation Request' } },
          { subject: { startsWith: 'Special Request' } },
          { subject: { startsWith: 'Question about' } },
        ],
      },
    });

    if (seedThreads.length > 0) {
      const threadIds = seedThreads.map(t => t.id);
      
      // Delete related data first (due to foreign key constraints)
      await prisma.conversationNote.deleteMany({
        where: { threadId: { in: threadIds } },
      });
      await prisma.email.deleteMany({
        where: { threadId: { in: threadIds } },
      });
      await prisma.messageLog.deleteMany({
        where: { threadId: { in: threadIds } },
      });
      await prisma.callLog.deleteMany({
        where: { threadId: { in: threadIds } },
      });
      
      // Delete threads
      await prisma.thread.deleteMany({
        where: { id: { in: threadIds } },
      });
      
      console.log(`   ✅ Deleted ${seedThreads.length} existing seed conversations`);
    } else {
      console.log('   ℹ️  No existing seed data found to clean up');
    }

    // Get existing properties and bookings
    const properties = await prisma.property.findMany({ take: 3 });
    if (properties.length === 0) {
      console.log('⚠️  No properties found. Please seed properties first.');
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'PENDING'] } },
      take: 10,
      include: { property: true },
    });

    console.log(`📋 Found ${properties.length} properties and ${bookings.length} bookings`);

    // Get or create staff users for assignment
    const staffUsers = await prisma.userRole.findMany({
      where: {
        roleKey: { in: ['STAFF_FRONTDESK', 'MANAGER'] },
        scopeType: 'PROPERTY',
      },
      include: { user: true },
      take: 5,
    });

    const assignableUsers = staffUsers.map(su => su.user);
    if (assignableUsers.length === 0) {
      console.log('⚠️  No staff users found. Conversations will be unassigned.');
    }

    let conversationCount = 0;
    let messageCount = 0;
    let callCount = 0;

    // Create conversations for existing bookings
    for (let i = 0; i < Math.min(bookings.length, 5); i++) {
      const booking = bookings[i];
      const guest = sampleGuests[i % sampleGuests.length];
      const property = booking.property || properties[i % properties.length];
      
      // Normalize phone
      const normalizedPhone = normalizePhone(booking.phone || guest.phone);

      // Create or get contact
      const contact = await prisma.contact.upsert({
        where: { phone: normalizedPhone },
        update: {
          name: booking.guestName || guest.name,
          email: booking.email || guest.email,
        },
        create: {
          phone: normalizedPhone,
          name: booking.guestName || guest.name,
          email: booking.email || guest.email,
          metadata: {
            bookingId: booking.id,
            propertyId: property.id,
          },
        },
      });

      // Create thread
      const threadCreatedAt = new Date(Date.now() - (i * 3600000)); // Stagger timestamps
      const thread = await prisma.thread.create({
        data: {
          subject: `Booking Inquiry - ${booking.guestName}`,
          participants: [booking.email || guest.email],
          propertyId: property.id,
          bookingId: booking.id,
          status: i % 3 === 0 ? 'NEW' : i % 3 === 1 ? 'IN_PROGRESS' : 'WAITING_FOR_GUEST',
          priority: i % 4 === 0 ? 'URGENT' : i % 4 === 1 ? 'HIGH' : i % 4 === 2 ? 'NORMAL' : 'LOW',
          assignedTo: assignableUsers.length > 0 ? assignableUsers[i % assignableUsers.length].id : null,
          createdAt: threadCreatedAt, // Set createdAt to match conversation timeline
          lastMessageAt: threadCreatedAt, // Stagger timestamps
        },
      });

      conversationCount++;

      // Create email conversation
      const emailThreadCreatedAt = new Date(Date.now() - (i * 3600000) - 1800000);
      const emailThread = await prisma.thread.create({
        data: {
          subject: sampleMessages.email[i % sampleMessages.email.length].inbound.subject,
          participants: [booking.email || guest.email, property.email || 'support@capsulepodhotel.com'],
          propertyId: property.id,
          bookingId: booking.id,
          status: 'IN_PROGRESS',
          priority: 'NORMAL',
          assignedTo: assignableUsers.length > 0 ? assignableUsers[i % assignableUsers.length].id : null,
          createdAt: emailThreadCreatedAt, // Set createdAt to match conversation timeline
          lastMessageAt: emailThreadCreatedAt,
        },
      });

      conversationCount++;

      // Create inbound email
      const inboundEmail = await prisma.email.create({
        data: {
          threadId: emailThread.id,
          messageId: `seed-inbound-${emailThread.id}-${Date.now()}-${i}`,
          fromEmail: booking.email || guest.email,
          fromName: booking.guestName || guest.name,
          toEmails: [property.email || 'support@capsulepodhotel.com'],
          subject: sampleMessages.email[i % sampleMessages.email.length].inbound.subject,
          textBody: sampleMessages.email[i % sampleMessages.email.length].inbound.body,
          htmlBody: `<p>${sampleMessages.email[i % sampleMessages.email.length].inbound.body}</p>`,
          direction: 'INBOUND',
          status: 'DELIVERED',
          createdAt: new Date(Date.now() - (i * 3600000) - 1800000),
        },
      });

      messageCount++;

      // Create outbound email reply
      const outboundEmail = await prisma.email.create({
        data: {
          threadId: emailThread.id,
          messageId: `seed-outbound-${emailThread.id}-${Date.now()}-${i}`,
          fromEmail: property.email || 'support@capsulepodhotel.com',
          fromName: property.name,
          toEmails: [booking.email || guest.email],
          subject: sampleMessages.email[i % sampleMessages.email.length].outbound.subject,
          textBody: sampleMessages.email[i % sampleMessages.email.length].outbound.body,
          htmlBody: `<p>${sampleMessages.email[i % sampleMessages.email.length].outbound.body}</p>`,
          direction: 'OUTBOUND',
          status: 'SENT',
          createdAt: new Date(Date.now() - (i * 3600000) - 900000),
        },
      });

      messageCount++;

      // Create WhatsApp messages
      const whatsappMessage = sampleMessages.whatsapp[i % sampleMessages.whatsapp.length];
      
      // Inbound WhatsApp
      const inboundWhatsApp = await prisma.messageLog.create({
        data: {
          threadId: thread.id,
          contactId: contact.id,
          channel: 'WHATSAPP',
          direction: 'INBOUND',
          status: 'DELIVERED',
          phone: normalizedPhone,
          message: whatsappMessage.inbound,
          provider: 'GUPSHUP',
          providerMessageId: `wa-inbound-${thread.id}-${Date.now()}`,
          providerStatus: 'delivered',
          sentAt: new Date(Date.now() - (i * 3600000) - 1200000),
          deliveredAt: new Date(Date.now() - (i * 3600000) - 1200000),
          metadata: { bookingId: booking.id, propertyId: property.id },
        },
      });

      messageCount++;

      // Outbound WhatsApp reply
      const outboundWhatsApp = await prisma.messageLog.create({
        data: {
          threadId: thread.id,
          contactId: contact.id,
          channel: 'WHATSAPP',
          direction: 'OUTBOUND',
          status: 'DELIVERED',
          phone: normalizedPhone,
          message: whatsappMessage.outbound,
          provider: 'GUPSHUP',
          providerMessageId: `wa-outbound-${thread.id}-${Date.now()}`,
          providerStatus: 'delivered',
          sentAt: new Date(Date.now() - (i * 3600000) - 600000),
          deliveredAt: new Date(Date.now() - (i * 3600000) - 600000),
          readAt: new Date(Date.now() - (i * 3600000) - 300000),
          metadata: { bookingId: booking.id, propertyId: property.id },
        },
      });

      messageCount++;

      // Update thread lastMessageAt
      await prisma.thread.update({
        where: { id: thread.id },
        data: { lastMessageAt: outboundWhatsApp.createdAt },
      });

      // Create a call log (every other conversation)
      if (i % 2 === 0) {
        const callLog = await prisma.callLog.create({
          data: {
            threadId: thread.id,
            contactId: contact.id,
            direction: 'OUTBOUND',
            status: 'COMPLETED',
            fromNumber: property.phone || '919876543200',
            toNumber: normalizedPhone,
            duration: 120 + (i * 10), // 2-3 minutes
            provider: 'EXOTEL',
            providerCallId: `exotel-${thread.id}-${Date.now()}`,
            providerStatus: 'completed',
            initiatedAt: new Date(Date.now() - (i * 3600000) - 300000),
            answeredAt: new Date(Date.now() - (i * 3600000) - 290000),
            completedAt: new Date(Date.now() - (i * 3600000) - 180000),
            metadata: {
              bookingId: booking.id,
              propertyId: property.id,
              reason: 'Follow-up on booking inquiry',
            },
          },
        });

        callCount++;

        // Update thread with call
        await prisma.thread.update({
          where: { id: thread.id },
          data: { lastMessageAt: callLog.completedAt },
        });
      }

      // Add some internal notes (for some conversations)
      if (i % 3 === 0 && assignableUsers.length > 0) {
        await prisma.conversationNote.create({
          data: {
            threadId: thread.id,
            authorId: assignableUsers[i % assignableUsers.length].id,
            content: `Guest requested early check-in. Room availability confirmed.`,
            isInternal: true,
          },
        });
      }
    }

    // Create some standalone conversations (not linked to bookings)
    for (let i = 0; i < 3; i++) {
      const guest = sampleGuests[(i + bookings.length) % sampleGuests.length];
      const property = properties[i % properties.length];
      const normalizedPhone = normalizePhone(guest.phone);

      const contact = await prisma.contact.upsert({
        where: { phone: normalizedPhone },
        update: { name: guest.name, email: guest.email },
        create: {
          phone: normalizedPhone,
          name: guest.name,
          email: guest.email,
        },
      });

      const standaloneThreadCreatedAt = new Date(Date.now() - (i * 7200000));
      const thread = await prisma.thread.create({
        data: {
          subject: `General Inquiry - ${guest.name}`,
          participants: [guest.email],
          propertyId: property.id,
          status: 'NEW',
          priority: 'NORMAL',
          createdAt: standaloneThreadCreatedAt, // Set createdAt to match conversation timeline
          lastMessageAt: standaloneThreadCreatedAt,
        },
      });

      conversationCount++;

      // Inbound WhatsApp
      await prisma.messageLog.create({
        data: {
          threadId: thread.id,
          contactId: contact.id,
          channel: 'WHATSAPP',
          direction: 'INBOUND',
          status: 'DELIVERED',
          phone: normalizedPhone,
          message: "Hi, I'm interested in booking a room. Can you tell me about availability?",
          provider: 'GUPSHUP',
          providerMessageId: `wa-standalone-${thread.id}-${Date.now()}`,
          providerStatus: 'delivered',
          sentAt: new Date(Date.now() - (i * 7200000)),
          deliveredAt: new Date(Date.now() - (i * 7200000)),
        },
      });

      messageCount++;
    }

    console.log(`✅ Seeding complete!`);
    console.log(`   - ${conversationCount} conversations created`);
    console.log(`   - ${messageCount} messages created (email + WhatsApp)`);
    console.log(`   - ${callCount} call logs created`);
    console.log(`   - All linked to bookings and properties`);

  } catch (error) {
    console.error('❌ Error seeding conversations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedConversations()
    .then(() => {
      console.log('✨ Seed completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error);
      process.exit(1);
    });
}

module.exports = { seedConversations };

