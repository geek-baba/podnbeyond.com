const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBrands() {
  console.log('🎨 Starting brand seeding...\n');

  try {
    // Create the 4 sub-brands
    const brands = [
      {
        name: 'POD N BEYOND | Capsule',
        slug: 'capsule',
        tagline: 'Budget-Friendly Capsule Experience',
        description: 'India\'s first capsule pod hotel. Affordable luxury for smart travelers who want to explore the city without breaking the bank.',
        concept: 'Inspired by Japanese capsule hotels, our Capsule brand offers a unique, space-efficient accommodation experience. Perfect for solo travelers, backpackers, and budget-conscious adventurers who don\'t want to compromise on cleanliness and comfort.',
        logoUrl: '/logos/capsule-brand.svg',
        primaryColor: '#3b82f6', // Blue
        accentColor: '#60a5fa',
        targetAudience: 'Budget travelers, Backpackers, Solo travelers',
        features: [
          'Compact capsule pods',
          'Shared facilities',
          'Budget-friendly pricing',
          'Self-service amenities',
          'Ideal for short stays'
        ],
        amenities: [
          'Free WiFi',
          'Hot Breakfast',
          'Self-Service Laundry',
          'Local Calls',
          '24/7 Check-in'
        ],
        images: ['/uploads/capsule-hero.jpg'],
        status: 'ACTIVE',
        sortOrder: 1
      },
      {
        name: 'POD N BEYOND | Smart',
        slug: 'smart',
        tagline: 'Premium Smart Hotel Experience',
        description: 'Elevated pod experience with smart amenities, modern design, and premium services. Perfect for business travelers and those seeking comfort.',
        concept: 'Smart Hotel combines technology, comfort, and convenience. Our premium pods feature smart controls, enhanced privacy, and business-friendly amenities. Designed for professionals, couples, and travelers who appreciate quality and innovation.',
        logoUrl: '/logos/smart-brand.svg',
        primaryColor: '#f59e0b', // Amber/Gold
        accentColor: '#fbbf24',
        targetAudience: 'Business professionals, Couples, Quality-conscious travelers',
        features: [
          'Spacious smart pods',
          'Smart room controls',
          'Business center access',
          'Premium breakfast',
          'Enhanced privacy',
          'Work desk in pods'
        ],
        amenities: [
          'Free WiFi',
          'Premium Hot Breakfast',
          'Free Cancellation',
          '20% F&B Discount',
          'Self-Service Laundry',
          'Local Calls',
          'E-Library',
          'Game Zones',
          'Business Center'
        ],
        images: ['/uploads/smart-hero.jpg'],
        status: 'ACTIVE',
        sortOrder: 2
      },
      {
        name: 'POD N BEYOND | Sanctuary',
        slug: 'sanctuary',
        tagline: 'Women-Only Safe Haven',
        description: 'Exclusively for women travelers. A safe, comfortable, and empowering space designed by women, for women.',
        concept: 'Sanctuary is India\'s first pod hotel exclusively for women. We understand the unique needs and concerns of women travelers. Our properties offer complete security, privacy, and comfort with female staff, women-only floors, and amenities designed specifically for our guests.',
        logoUrl: '/logos/sanctuary-brand.svg',
        primaryColor: '#ec4899', // Pink
        accentColor: '#f472b6',
        targetAudience: 'Women travelers, Female professionals, Solo women travelers',
        features: [
          'Women-only property',
          'Female staff only',
          'Enhanced security',
          'Privacy-focused design',
          'Wellness amenities',
          'Safe common areas'
        ],
        amenities: [
          'Free WiFi',
          'Hot Breakfast',
          '24/7 Female Security',
          'Beauty & Wellness Corner',
          'Self-Service Laundry',
          'Local Calls',
          'Reading Room',
          'Yoga Space'
        ],
        images: ['/uploads/sanctuary-hero.jpg'],
        status: 'COMING_SOON',
        sortOrder: 3
      },
      {
        name: 'POD N BEYOND | Sauna+Sleep',
        slug: 'sauna-sleep',
        tagline: 'Wellness-Focused Relaxation',
        description: 'Combining traditional sauna wellness with modern pod accommodation. Rejuvenate your body and mind.',
        concept: 'Inspired by Nordic wellness traditions and Japanese onsens, Sauna+Sleep offers a holistic wellness experience. Our properties feature sauna facilities, relaxation zones, and sleep-optimized pods. Perfect for health-conscious travelers and those seeking deep relaxation.',
        logoUrl: '/logos/sauna-brand.svg',
        primaryColor: '#10b981', // Green
        accentColor: '#34d399',
        targetAudience: 'Wellness enthusiasts, Health-conscious travelers, Relaxation seekers',
        features: [
          'Sauna facilities',
          'Wellness-optimized pods',
          'Relaxation zones',
          'Sleep therapy focus',
          'Healthy F&B options',
          'Meditation spaces'
        ],
        amenities: [
          'Free WiFi',
          'Healthy Breakfast',
          'Sauna Access',
          'Wellness Consultation',
          'Herbal Tea Bar',
          'Meditation Room',
          'Massage Services',
          'Sleep Analysis (coming soon)'
        ],
        images: ['/uploads/sauna-hero.jpg'],
        status: 'COMING_SOON',
        sortOrder: 4
      }
    ];

    for (const brandData of brands) {
      const brand = await prisma.brand.upsert({
        where: { slug: brandData.slug },
        update: brandData,
        create: brandData
      });
      
      console.log(`✅ Created/Updated: ${brand.name} (${brand.status})`);
    }

    console.log(`\n📊 Total brands: ${brands.length}`);
    
    // Now associate existing properties with brands
    console.log('\n🔗 Associating properties with brands...\n');

    // Get the brands
    const capsuleBrand = await prisma.brand.findUnique({ where: { slug: 'capsule' } });
    const smartBrand = await prisma.brand.findUnique({ where: { slug: 'smart' } });

    // Update properties
    // Kasidih → Capsule brand (budget-friendly)
    const kasidihProperty = await prisma.property.findFirst({
      where: { slug: 'capsule-pod-hotel-kasidih' }
    });
    
    if (kasidihProperty) {
      await prisma.property.update({
        where: { id: kasidihProperty.id },
        data: { brandId: capsuleBrand.id }
      });
      console.log(`✅ Associated: ${kasidihProperty.name} → ${capsuleBrand.name}`);
    }

    // Bistupur → Smart brand (premium)
    const bistupurProperty = await prisma.property.findFirst({
      where: { slug: 'pod-n-beyond-bistupur' }
    });
    
    if (bistupurProperty) {
      await prisma.property.update({
        where: { id: bistupurProperty.id },
        data: { brandId: smartBrand.id }
      });
      console.log(`✅ Associated: ${bistupurProperty.name} → ${smartBrand.name}`);
    }

    // Sakchi → Smart brand (premium, flagship)
    const sakchiProperty = await prisma.property.findFirst({
      where: { slug: 'pod-n-beyond-sakchi' }
    });
    
    if (sakchiProperty) {
      await prisma.property.update({
        where: { id: sakchiProperty.id },
        data: { brandId: smartBrand.id }
      });
      console.log(`✅ Associated: ${sakchiProperty.name} → ${smartBrand.name}`);
    }

    console.log('\n✨ Brand seeding completed successfully!\n');

    // Display summary
    const brandCount = await prisma.brand.count();
    const propertyCount = await prisma.property.count();
    
    console.log('📈 Summary:');
    console.log(`   Total Brands: ${brandCount}`);
    console.log(`   Total Properties: ${propertyCount}`);
    console.log(`   Properties with brands: ${propertyCount}`);

  } catch (error) {
    console.error('❌ Error seeding brands:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedBrands()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

