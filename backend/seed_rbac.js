const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRBAC() {
  console.log('🔐 Starting RBAC seeding...\n');

  try {
    // 1. Create/Update Organization
    console.log('📊 Creating organization...');
    const org = await prisma.organization.upsert({
      where: { slug: 'podnbeyond-group' },
      update: {},
      create: {
        name: 'POD N BEYOND GROUP',
        slug: 'podnbeyond-group',
        description: 'India\'s First Multi-Brand Pod Hotel Group',
        settings: {
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          dateFormat: 'DD/MM/YYYY'
        }
      }
    });
    console.log(`   ✅ Organization: ${org.name} (ID: ${org.id})\n`);

    // 2. Seed Roles with Permissions
    console.log('👥 Seeding roles with permissions...');
    
    const roles = [
      {
        key: 'GUEST',
        name: 'Guest',
        description: 'Unauthenticated user browsing the website',
        permissions: ['properties:read', 'rooms:read', 'brands:read']
      },
      {
        key: 'MEMBER',
        name: 'Loyalty Member',
        description: 'Registered loyalty customer',
        permissions: [
          'properties:read', 'rooms:read', 'brands:read',
          'bookings:read:own', 'loyalty:read:own',
          'profile:read:own', 'profile:update:own'
        ]
      },
      {
        key: 'STAFF_FRONTDESK',
        name: 'Front Desk Staff',
        description: 'Check-in/out, view/modify bookings for assigned properties only',
        permissions: [
          'bookings:read:scoped', 'bookings:write:scoped',
          'checkin:write:scoped', 'checkout:write:scoped',
          'guests:read:scoped', 'rooms:read:scoped',
          'inventory:read:scoped'
        ]
      },
      {
        key: 'STAFF_OPS',
        name: 'Operations Staff',
        description: 'Inventory/room status, pricing calendar for assigned properties',
        permissions: [
          'inventory:read:scoped', 'inventory:update:scoped',
          'rooms:read:scoped', 'rooms:update:scoped',
          'pricing:read:scoped', 'pricing:update:scoped',
          'maintenance:write:scoped'
        ]
      },
      {
        key: 'MANAGER',
        name: 'Property Manager',
        description: 'Property-level; manage staff, pricing, availability, refunds, comps',
        permissions: [
          'bookings:*:scoped', 'inventory:*:scoped',
          'rooms:*:scoped', 'pricing:*:scoped',
          'staff:read:scoped', 'staff:invite:scoped',
          'refunds:write:scoped', 'comps:write:scoped',
          'reports:read:scoped', 'analytics:read:scoped'
        ]
      },
      {
        key: 'ADMIN',
        name: 'Group Administrator',
        description: 'Group-level across all properties; OTA mapping, payment settings, CMS',
        permissions: [
          'properties:*', 'brands:*', 'bookings:*',
          'inventory:*', 'rooms:*', 'pricing:*',
          'ota:configure', 'payments:configure',
          'cms:*', 'users:invite', 'users:read',
          'reports:read', 'analytics:read',
          'loyalty:adjust', 'settings:update'
        ]
      },
      {
        key: 'SUPERADMIN',
        name: 'Super Administrator',
        description: 'Platform config, feature flags, secrets, user impersonation',
        permissions: [
          '*'  // Wildcard - all permissions
        ]
      }
    ];

    for (const roleData of roles) {
      const role = await prisma.role.upsert({
        where: { key: roleData.key },
        update: {
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions
        },
        create: roleData
      });
      console.log(`   ✅ ${role.name} (${role.key})`);
      console.log(`      Permissions: ${role.permissions.join(', ')}`);
    }

    console.log('\n📧 Checking for bootstrap superadmin...');
    
    // 3. Create Bootstrap Superadmin if specified in env
    const superadminEmail = process.env.BOOTSTRAP_SUPERADMIN_EMAIL;
    
    if (superadminEmail) {
      console.log(`   Found BOOTSTRAP_SUPERADMIN_EMAIL: ${superadminEmail}`);
      
      // Create or find user
      let superadminUser = await prisma.user.findUnique({
        where: { email: superadminEmail }
      });

      if (!superadminUser) {
        console.log(`   Creating superadmin user...`);
        superadminUser = await prisma.user.create({
          data: {
            email: superadminEmail,
            name: 'Super Administrator',
            emailVerified: new Date()
          }
        });
        console.log(`   ✅ Created user: ${superadminUser.email}`);
      } else {
        console.log(`   ✅ User already exists: ${superadminUser.email}`);
      }

      // Assign SUPERADMIN role
      const existingRole = await prisma.userRole.findFirst({
        where: {
          userId: superadminUser.id,
          roleKey: 'SUPERADMIN'
        }
      });

      if (!existingRole) {
        await prisma.userRole.create({
          data: {
            userId: superadminUser.id,
            roleKey: 'SUPERADMIN',
            scopeType: 'ORG',
            scopeId: org.id
          }
        });
        console.log(`   ✅ Assigned SUPERADMIN role to ${superadminUser.email}\n`);
      } else {
        console.log(`   ✅ User already has SUPERADMIN role\n`);
      }

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🎉 SUPERADMIN CREATED!`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(``);
      console.log(`   📧 Email: ${superadminEmail}`);
      console.log(`   🔑 Role: SUPERADMIN`);
      console.log(`   🏢 Organization: ${org.name}`);
      console.log(``);
      console.log(`   ⚡ To login, request a magic link at:`);
      console.log(`      https://capsulepodhotel.com/admin/login`);
      console.log(``);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    } else {
      console.log(`   ⚠️  No BOOTSTRAP_SUPERADMIN_EMAIL set in .env`);
      console.log(`   Add BOOTSTRAP_SUPERADMIN_EMAIL=your@email.com to create superadmin\n`);
    }

    console.log('📊 RBAC Seeding Summary:');
    console.log(`   Organizations: ${await prisma.organization.count()}`);
    console.log(`   Roles: ${await prisma.role.count()}`);
    console.log(`   Users: ${await prisma.user.count()}`);
    console.log(`   User Roles: ${await prisma.userRole.count()}`);
    
    console.log('\n✨ RBAC seeding completed successfully!\n');

  } catch (error) {
    console.error('❌ Error seeding RBAC:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedRBAC();

