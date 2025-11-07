/**
 * Backfill member numbers for existing loyalty accounts
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfillMemberNumbers() {
  try {
    console.log('🔍 Finding accounts without member numbers...');
    
    const accounts = await prisma.loyaltyAccount.findMany();
    console.log(`Found ${accounts.length} total accounts`);
    
    let updated = 0;
    for (const account of accounts) {
      if (!account.memberNumber) {
        // Use account ID to generate member number
        const memberNumber = String(account.id).padStart(6, '0');
        
        await prisma.loyaltyAccount.update({
          where: { id: account.id },
          data: { 
            memberNumber,
            lifetimeStays: account.lifetimeStays || 0
          }
        });
        
        console.log(`✅ Member #${memberNumber} assigned to ${account.user?.email || account.userId}`);
        updated++;
      }
    }
    
    console.log(`\n✅ Backfill complete! ${updated} accounts updated.`);
    
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillMemberNumbers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

