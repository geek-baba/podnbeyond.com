const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCommunications() {
  try {
    const [threads, emails, messages, calls, contacts] = await Promise.all([
      prisma.thread.count(),
      prisma.email.count(),
      prisma.messageLog.count(),
      prisma.callLog.count(),
      prisma.contact.count(),
    ]);
    
    console.log('Threads:', threads);
    console.log('Emails:', emails);
    console.log('Message Logs:', messages);
    console.log('Call Logs:', calls);
    console.log('Contacts:', contacts);
    
    const sampleThreads = await prisma.thread.findMany({
      take: 5,
      include: {
        emails: {
          take: 1,
        },
        booking: {
          select: { id: true, guestName: true },
        },
        property: {
          select: { id: true, name: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
    
    console.log('\nSample threads:');
    sampleThreads.forEach(t => {
      console.log(`  - ID: ${t.id}, Subject: ${t.subject || 'No subject'}, Emails: ${t.emails.length}, Booking: ${t.booking?.guestName || 'None'}, Property: ${t.property?.name || 'None'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkCommunications();

