const { seed } = require('./prisma/seed');

seed()
  .then(() => {
    console.log('\nℹ️  seed_properties.js executed the primary Prisma seed script.');
  })
  .catch((error) => {
    console.error('❌ Error executing seed:', error);
    process.exit(1);
  });
