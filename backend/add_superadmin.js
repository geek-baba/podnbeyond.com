const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSuperadmin() {
  const email = process.argv[2] || 'shwet@thedesi.email';
  const name = process.argv[3] || 'Shwet';

  console.log(`\n🔐 Adding superadmin user: ${email}\n`);

  try {
    // Create or find the user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          emailVerified: new Date(), // Auto-verify
        },
      });
      console.log(`✅ User created: ${email}`);
    } else {
      console.log(`ℹ️  User already exists: ${email}`);
    }

    // Check if user already has SUPERADMIN role
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleKey: 'SUPERADMIN',
      },
    });

    if (existingRole) {
      console.log(`ℹ️  User already has SUPERADMIN role`);
    } else {
      // Get organization
      const org = await prisma.organization.findFirst();
      
      if (!org) {
        console.error('❌ No organization found. Run seed_rbac.js first!');
        process.exit(1);
      }

      // Assign SUPERADMIN role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleKey: 'SUPERADMIN',
          scopeType: 'ORG',
          scopeId: org.id,
        },
      });
      console.log(`✅ SUPERADMIN role assigned`);
    }

    // Create or find loyalty account
    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.id },
    });

    if (!loyaltyAccount) {
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          userId: user.id,
          points: 0,
          tier: 'PLATINUM', // Give superadmin platinum tier
        },
      });
      console.log(`✅ Loyalty account created with PLATINUM tier`);
    } else {
      console.log(`ℹ️  Loyalty account already exists`);
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ SUPERADMIN USER READY!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Email: ${email}`);
    console.log(`Name: ${user.name || 'Not set'}`);
    console.log(`Role: SUPERADMIN (ORG-wide)`);
    console.log(`Loyalty: ${loyaltyAccount.tier} (${loyaltyAccount.points} points)`);
    console.log(`\nYou can now login at:`);
    console.log(`  → http://localhost:3000/admin/login`);
    console.log(`  → https://capsulepodhotel.com/admin/login\n`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

addSuperadmin();

