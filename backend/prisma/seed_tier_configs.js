const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Seed Tier Configurations
 * Creates tier configurations for all loyalty tiers: MEMBER, SILVER, GOLD, PLATINUM, DIAMOND
 */
async function seedTierConfigs() {
  console.log('🏆 Seeding tier configurations...');

  const tierConfigs = [
    {
      tier: 'MEMBER',
      name: 'Member',
      description: 'Entry level tier - Free to join and start earning points',
      minPoints: null, // Free to join
      minStays: null,
      minNights: null,
      minSpend: null,
      qualificationPeriod: 12,
      basePointsPer100Rupees: 5,
      benefits: [
        {
          code: 'FASTER_CHECKIN',
          name: 'Faster Check-in',
          description: 'Priority check-in queue',
        },
        {
          code: 'MEMBER_RATES',
          name: 'Member-Only Rates',
          description: '2-3% discount on member rates',
        },
        {
          code: 'EARN_REDEEM',
          name: 'Earn & Redeem Points',
          description: 'Earn points on every stay and redeem for rewards',
        },
        {
          code: 'EMAIL_SUPPORT',
          name: 'Email Support',
          description: 'Dedicated email support',
        },
      ],
      sortOrder: 0,
    },
    {
      tier: 'SILVER',
      name: 'Silver',
      description: 'Earned tier with enhanced benefits and faster point earning',
      minPoints: 5000,
      minStays: 2,
      minNights: 5,
      minSpend: null,
      qualificationPeriod: 12,
      basePointsPer100Rupees: 7,
      benefits: [
        {
          code: 'ALL_MEMBER_BENEFITS',
          name: 'All Member Benefits',
          description: 'All benefits from Member tier',
        },
        {
          code: 'LATE_CHECKOUT',
          name: 'Late Checkout',
          description: 'Late checkout until 2 PM (subject to availability)',
        },
        {
          code: 'PRIORITY_WAITLIST',
          name: 'Priority Waitlist',
          description: 'Priority on waitlist for sold-out dates',
        },
        {
          code: 'FREE_LOCKER',
          name: 'Free Locker Access',
          description: '1 free locker access per stay',
        },
      ],
      sortOrder: 1,
    },
    {
      tier: 'GOLD',
      name: 'Gold',
      description: 'Premium tier with room upgrades and exclusive perks',
      minPoints: 25000,
      minStays: 6,
      minNights: 15,
      minSpend: null,
      qualificationPeriod: 12,
      basePointsPer100Rupees: 10,
      benefits: [
        {
          code: 'ALL_SILVER_BENEFITS',
          name: 'All Silver Benefits',
          description: 'All benefits from Silver tier',
        },
        {
          code: 'FREE_BREAKFAST',
          name: 'Free Breakfast',
          description: 'Free breakfast on 1 morning per stay',
        },
        {
          code: 'ROOM_UPGRADE',
          name: 'Room Upgrade',
          description: '1 category room upgrade (if available)',
        },
        {
          code: 'FNB_DISCOUNT',
          name: 'Food & Beverage Discount',
          description: '10% discount on food & beverage',
        },
        {
          code: 'ANNIVERSARY_VOUCHER',
          name: 'Anniversary Voucher',
          description: '1 free night voucher on anniversary year',
        },
      ],
      sortOrder: 2,
    },
    {
      tier: 'PLATINUM',
      name: 'Platinum',
      description: 'Elite tier with guaranteed benefits and premium services',
      minPoints: 75000,
      minStays: 12,
      minNights: 30,
      minSpend: null,
      qualificationPeriod: 12,
      basePointsPer100Rupees: 12,
      benefits: [
        {
          code: 'ALL_GOLD_BENEFITS',
          name: 'All Gold Benefits',
          description: 'All benefits from Gold tier',
        },
        {
          code: 'DAILY_BREAKFAST',
          name: 'Daily Free Breakfast',
          description: 'Free breakfast daily during stay',
        },
        {
          code: 'FLEXIBLE_CHECKIN',
          name: 'Flexible Check-in/Check-out',
          description: 'Free early check-in + late checkout',
        },
        {
          code: 'GUARANTEED_AVAILABILITY',
          name: 'Guaranteed Room Availability',
          description: 'Guaranteed room availability (48 hrs notice)',
        },
        {
          code: 'WEEKEND_DOUBLE_POINTS',
          name: 'Weekend Double Points',
          description: 'Double points on weekend bookings',
        },
        {
          code: 'PRIORITY_SUPPORT',
          name: 'Priority Customer Service',
          description: 'Priority customer service support',
        },
        {
          code: 'WHATSAPP_CONCIERGE',
          name: 'Dedicated WhatsApp Concierge',
          description: 'Dedicated WhatsApp concierge service',
        },
      ],
      sortOrder: 3,
    },
    {
      tier: 'DIAMOND',
      name: 'Diamond',
      description: 'Ultimate tier with VIP benefits and personalized service',
      minPoints: 150000,
      minStays: null,
      minNights: 60,
      minSpend: 150000, // ₹1.5L
      qualificationPeriod: 12,
      basePointsPer100Rupees: 15,
      benefits: [
        {
          code: 'ALL_PLATINUM_BENEFITS',
          name: 'All Platinum Benefits',
          description: 'All benefits from Platinum tier',
        },
        {
          code: 'GUARANTEED_UPGRADE',
          name: 'Guaranteed Upgrade',
          description: 'Guaranteed room upgrade on every stay',
        },
        {
          code: 'LOUNGE_ACCESS',
          name: 'Lounge Access',
          description: 'Free lounge access at all properties',
        },
        {
          code: 'TRAVEL_COORDINATOR',
          name: 'Dedicated Travel Coordinator',
          description: 'Personal travel coordinator for bookings',
        },
        {
          code: 'ANNUAL_FREE_NIGHT',
          name: 'Annual Free Night',
          description: '1 free night every year',
        },
      ],
      sortOrder: 4,
    },
  ];

  for (const config of tierConfigs) {
    const { benefits, ...tierData } = config;

    const tierConfig = await prisma.tierConfig.upsert({
      where: { tier: config.tier },
      update: {
        name: tierData.name,
        description: tierData.description,
        minPoints: tierData.minPoints,
        minStays: tierData.minStays,
        minNights: tierData.minNights,
        minSpend: tierData.minSpend,
        qualificationPeriod: tierData.qualificationPeriod,
        basePointsPer100Rupees: tierData.basePointsPer100Rupees,
        benefits: benefits,
        sortOrder: tierData.sortOrder,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        ...tierData,
        benefits: benefits,
      },
    });

    console.log(`  ✅ ${tierConfig.tier}: ${tierConfig.name} (${tierConfig.basePointsPer100Rupees} pts/₹100)`);
  }

  console.log('🎉 Tier configurations seeded successfully!\n');
}

// Run if called directly
if (require.main === module) {
  seedTierConfigs()
    .catch((error) => {
      console.error('❌ Error seeding tier configurations:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedTierConfigs };

