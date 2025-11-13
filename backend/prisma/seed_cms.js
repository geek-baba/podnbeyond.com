const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCMS() {
  console.log('🌱 Seeding CMS content...');

  try {
    // Create initial content sections
    const contentSections = [
      {
        type: 'HERO_SECTION',
        title: 'Pod & Beyond Hotel',
        subtitle: 'Experience Luxury and Comfort',
        description: 'Discover our world-class amenities and exceptional service in the heart of the city',
        isActive: true,
        sortOrder: 1
      },
      {
        type: 'ABOUT_SECTION',
        title: 'About Pod & Beyond',
        subtitle: 'Your Perfect Stay Awaits',
        description: 'Located in the heart of the city, Pod & Beyond Hotel offers luxurious accommodations with modern amenities and exceptional service. Our commitment to excellence ensures every guest enjoys a memorable and comfortable stay.',
        isActive: true,
        sortOrder: 2
      },
      {
        type: 'CONTACT_SECTION',
        title: 'Contact Us',
        subtitle: 'Get in Touch',
        description: 'We\'re here to help you plan your perfect stay. Contact us for reservations, inquiries, or special requests.',
        isActive: true,
        sortOrder: 3
      },
      {
        type: 'FOOTER_SECTION',
        title: 'Pod & Beyond Hotel',
        subtitle: 'Luxury Redefined',
        description: 'Experience luxury and comfort in the heart of the city. Book your perfect stay with us.',
        isActive: true,
        sortOrder: 4
      }
    ];

    for (const content of contentSections) {
      // Check if content already exists
      const existingContent = await prisma.content.findFirst({
        where: { type: content.type }
      });
      
      if (existingContent) {
        await prisma.content.update({
          where: { id: existingContent.id },
          data: content
        });
      } else {
        await prisma.content.create({
          data: content
        });
      }
    }

    // Create initial amenities
    const amenities = [
      {
        name: 'Free WiFi',
        description: 'High-speed internet access throughout the hotel',
        iconName: 'wifi',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Swimming Pool',
        description: 'Relaxing outdoor pool with lounge chairs',
        iconName: 'pool',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Fitness Center',
        description: '24/7 gym with modern equipment',
        iconName: 'gym',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Restaurant',
        description: 'Fine dining with local and international cuisine',
        iconName: 'restaurant',
        isActive: true,
        sortOrder: 4
      },
      {
        name: 'Spa & Wellness',
        description: 'Rejuvenating spa treatments and massage services',
        iconName: 'spa',
        isActive: true,
        sortOrder: 5
      },
      {
        name: 'Conference Rooms',
        description: 'Business facilities for meetings and events',
        iconName: 'conference',
        isActive: true,
        sortOrder: 6
      }
    ];

    for (const amenity of amenities) {
      await prisma.amenity.create({
        data: amenity
      });
    }

    // Create initial testimonials
    const testimonials = [
      {
        guestName: 'Sarah Johnson',
        guestEmail: 'sarah.johnson@email.com',
        rating: 5,
        title: 'Exceptional Service',
        content: 'The staff went above and beyond to make our stay memorable. The rooms were spotless and the amenities were top-notch. Highly recommend!',
        isActive: true,
        sortOrder: 1
      },
      {
        guestName: 'Michael Chen',
        guestEmail: 'michael.chen@email.com',
        rating: 5,
        title: 'Perfect Location',
        content: 'Great location in the heart of the city. Easy access to attractions and restaurants. The hotel itself is beautiful with excellent service.',
        isActive: true,
        sortOrder: 2
      },
      {
        guestName: 'Emily Rodriguez',
        guestEmail: 'emily.rodriguez@email.com',
        rating: 4,
        title: 'Comfortable Stay',
        content: 'Very comfortable rooms and friendly staff. The breakfast was delicious and the pool area was perfect for relaxation.',
        isActive: true,
        sortOrder: 3
      }
    ];

    for (const testimonial of testimonials) {
      await prisma.testimonial.create({
        data: testimonial
      });
    }

    // Create initial settings
    const settings = [
      {
        key: 'hotel_name',
        value: 'Pod & Beyond Hotel',
        description: 'Hotel name displayed on website',
        type: 'text',
        isPublic: true
      },
      {
        key: 'hotel_address',
        value: '123 Hotel Street, City, State 12345',
        description: 'Hotel physical address',
        type: 'text',
        isPublic: true
      },
      {
        key: 'hotel_phone',
        value: '+1 (555) 123-4567',
        description: 'Hotel contact phone number',
        type: 'text',
        isPublic: true
      },
      {
        key: 'hotel_email',
        value: 'info@podnbeyond.com',
        description: 'Hotel contact email',
        type: 'text',
        isPublic: true
      },
      {
        key: 'booking_enabled',
        value: 'true',
        description: 'Whether online booking is enabled',
        type: 'boolean',
        isPublic: false
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Whether the website is in maintenance mode',
        type: 'boolean',
        isPublic: false
      }
    ];

    for (const setting of settings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: setting,
        create: setting
      });
    }

    console.log('✅ CMS content seeded successfully!');
    console.log(`📝 Created ${contentSections.length} content sections`);
    console.log(`🏨 Created ${amenities.length} amenities`);
    console.log(`💬 Created ${testimonials.length} testimonials`);
    console.log(`⚙️ Created ${settings.length} settings`);

  } catch (error) {
    console.error('❌ Error seeding CMS content:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedCMS()
  .then(() => {
    console.log('🎉 CMS seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 CMS seeding failed:', error);
    process.exit(1);
  }); 