const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Seed Cancellation Policies
 * Creates default cancellation policies for the system
 */
async function seedCancellationPolicies() {
  console.log('🌱 Seeding cancellation policies...');

  const policies = [
    {
      name: 'Free Cancellation - 24 Hours',
      description: 'Free cancellation up to 24 hours before check-in',
      rules: {
        freeUntilHours: 24,
        firstNightPenalty: false,
        percentage: 0,
        type: 'FREE_CANCELLATION'
      },
      humanReadable: 'Free cancellation up to 24 hours before check-in. No charges applied.',
      isActive: true,
      propertyId: null // Global policy
    },
    {
      name: 'Free Cancellation - 48 Hours',
      description: 'Free cancellation up to 48 hours before check-in',
      rules: {
        freeUntilHours: 48,
        firstNightPenalty: false,
        percentage: 0,
        type: 'FREE_CANCELLATION'
      },
      humanReadable: 'Free cancellation up to 48 hours before check-in. No charges applied.',
      isActive: true,
      propertyId: null // Global policy
    },
    {
      name: 'First Night Penalty - 24 Hours',
      description: 'First night penalty if cancelled within 24 hours',
      rules: {
        freeUntilHours: 24,
        firstNightPenalty: true,
        percentage: 100,
        type: 'FIRST_NIGHT_PENALTY'
      },
      humanReadable: 'Free cancellation up to 24 hours before check-in. Cancellation within 24 hours will incur a charge of 100% of the first night.',
      isActive: true,
      propertyId: null // Global policy
    },
    {
      name: 'Non-Refundable',
      description: 'Non-refundable booking - no cancellation allowed',
      rules: {
        freeUntilHours: 0,
        firstNightPenalty: true,
        percentage: 100,
        type: 'NON_REFUNDABLE'
      },
      humanReadable: 'This is a non-refundable booking. No cancellation or refund is available.',
      isActive: true,
      propertyId: null // Global policy
    },
    {
      name: 'Partial Refund - 50%',
      description: '50% refund if cancelled within 24 hours',
      rules: {
        freeUntilHours: 24,
        firstNightPenalty: false,
        percentage: 50,
        type: 'PARTIAL_REFUND'
      },
      humanReadable: 'Free cancellation up to 24 hours before check-in. Cancellation within 24 hours will incur a charge of 50% of the total booking amount.',
      isActive: true,
      propertyId: null // Global policy
    },
    {
      name: 'Full Refund - 7 Days',
      description: 'Full refund if cancelled 7 days or more before check-in',
      rules: {
        freeUntilHours: 168, // 7 days = 168 hours
        firstNightPenalty: false,
        percentage: 0,
        type: 'FULL_REFUND'
      },
      humanReadable: 'Full refund available if cancelled 7 days or more before check-in. Cancellation within 7 days will incur a charge of 100% of the total booking amount.',
      isActive: true,
      propertyId: null // Global policy
    }
  ];

  for (const policy of policies) {
    try {
      const existing = await prisma.cancellationPolicy.findFirst({
        where: {
          name: policy.name,
          propertyId: policy.propertyId
        }
      });

      if (existing) {
        console.log(`  ✓ Policy "${policy.name}" already exists, skipping...`);
        continue;
      }

      const created = await prisma.cancellationPolicy.create({
        data: policy
      });

      console.log(`  ✓ Created policy: ${created.name} (ID: ${created.id})`);
    } catch (error) {
      console.error(`  ✗ Error creating policy "${policy.name}":`, error.message);
    }
  }

  console.log('✅ Cancellation policies seeded successfully!');
}

/**
 * Main seed function
 */
async function main() {
  try {
    await seedCancellationPolicies();
  } catch (error) {
    console.error('Error seeding cancellation policies:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if called directly
if (require.main === module) {
  main();
}

module.exports = { seedCancellationPolicies };

