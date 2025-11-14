const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Seed Points Rules
 * Creates example points calculation rules for the loyalty program
 */

const exampleRules = [
  {
    name: 'Weekend Bonus',
    description: '50% bonus points for weekend bookings (Friday-Sunday)',
    ruleType: 'BONUS',
    conditions: {
      isWeekend: true,
    },
    actions: {
      multiplier: 1.5,
      type: 'PERCENTAGE',
    },
    propertyIds: [],
    tierIds: [],
    priority: 10,
    isActive: true,
  },
  {
    name: 'Long Stay Bonus',
    description: '30% bonus points for stays of 5 nights or more',
    ruleType: 'BONUS',
    conditions: {
      stayLength: {
        min: 5,
      },
    },
    actions: {
      multiplier: 1.3,
      type: 'PERCENTAGE',
    },
    propertyIds: [],
    tierIds: [],
    priority: 9,
    isActive: true,
  },
  {
    name: 'Direct Booking Bonus',
    description: '20% bonus points for direct website bookings',
    ruleType: 'BONUS',
    conditions: {
      bookingSource: 'WEB_DIRECT',
    },
    actions: {
      multiplier: 1.2,
      type: 'PERCENTAGE',
    },
    propertyIds: [],
    tierIds: [],
    priority: 8,
    isActive: true,
  },
  {
    name: 'Off-Season Bonus',
    description: '25% bonus points for bookings in November (off-season)',
    ruleType: 'SEASONAL',
    conditions: {
      checkInMonth: 11, // November
    },
    actions: {
      multiplier: 1.25,
      type: 'PERCENTAGE',
    },
    propertyIds: [],
    tierIds: [],
    priority: 7,
    startDate: new Date('2024-11-01'),
    endDate: new Date('2024-11-30'),
    isActive: true,
  },
  {
    name: 'Prepaid Booking Bonus',
    description: '10% bonus points for non-refundable prepaid bookings',
    ruleType: 'BONUS',
    conditions: {
      isPrepaid: true,
    },
    actions: {
      multiplier: 1.1,
      type: 'PERCENTAGE',
    },
    propertyIds: [],
    tierIds: [],
    priority: 6,
    isActive: true,
  },
  {
    name: 'Premium Room Bonus',
    description: '10% bonus points for premium room category bookings',
    ruleType: 'BONUS',
    conditions: {
      roomTypeCategory: 'PREMIUM',
    },
    actions: {
      multiplier: 1.1,
      type: 'PERCENTAGE',
    },
    propertyIds: [],
    tierIds: [],
    priority: 5,
    isActive: true,
  },
];

async function main() {
  console.log('🌱 Seeding points rules...');

  for (const rule of exampleRules) {
    try {
      // Check if rule already exists (by name)
      const existing = await prisma.pointsRule.findFirst({
        where: {
          name: rule.name,
        },
      });

      if (existing) {
        console.log(`⏭️  Rule "${rule.name}" already exists, skipping...`);
        continue;
      }

      await prisma.pointsRule.create({
        data: rule,
      });

      console.log(`✅ Created rule: ${rule.name}`);
    } catch (error) {
      console.error(`❌ Error creating rule "${rule.name}":`, error.message);
    }
  }

  console.log('✨ Points rules seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding points rules:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

