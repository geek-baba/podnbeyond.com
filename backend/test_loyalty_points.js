// Test script to demonstrate loyalty points calculation
// Run with: node test_loyalty_points.js

// Helper function to calculate loyalty points based on amount spent and tier
function calculateLoyaltyPoints(amount, tier) {
  // Base rate: 1 point per ₹100 spent
  const basePoints = Math.floor(amount / 100);
  
  // Apply tier multiplier
  const tierMultiplier = getTierMultiplier(tier);
  const totalPoints = Math.round(basePoints * tierMultiplier);
  
  return totalPoints;
}

// Helper function to get tier multiplier for points calculation
function getTierMultiplier(tier) {
  switch (tier) {
    case 'PLATINUM':
      return 2.0; // 2x points (2 points per ₹100)
    case 'GOLD':
      return 1.5; // 1.5x points (1.5 points per ₹100)
    case 'SILVER':
    default:
      return 1.0; // 1x points (1 point per ₹100)
  }
}

// Test cases
const testCases = [
  { amount: 100, tier: 'SILVER', expected: 1 },
  { amount: 200, tier: 'SILVER', expected: 2 },
  { amount: 500, tier: 'SILVER', expected: 5 },
  { amount: 1000, tier: 'SILVER', expected: 10 },
  { amount: 100, tier: 'GOLD', expected: 2 },
  { amount: 200, tier: 'GOLD', expected: 3 },
  { amount: 500, tier: 'GOLD', expected: 8 },
  { amount: 1000, tier: 'GOLD', expected: 15 },
  { amount: 100, tier: 'PLATINUM', expected: 2 },
  { amount: 200, tier: 'PLATINUM', expected: 4 },
  { amount: 500, tier: 'PLATINUM', expected: 10 },
  { amount: 1000, tier: 'PLATINUM', expected: 20 },
];

console.log('🧪 Testing Loyalty Points Calculation\n');
console.log('Base Rate: 1 point per ₹100 spent');
console.log('Tier Multipliers:');
console.log('  SILVER: 1.0x (1 point per ₹100)');
console.log('  GOLD: 1.5x (1.5 points per ₹100)');
console.log('  PLATINUM: 2.0x (2 points per ₹100)\n');

console.log('Test Results:');
console.log('┌─────────┬─────────┬─────────────┬──────────┬──────────┐');
console.log('│ Amount  │ Tier    │ Calculation │ Expected │ Actual   │');
console.log('├─────────┼─────────┼─────────────┼──────────┼──────────┤');

testCases.forEach(test => {
  const actual = calculateLoyaltyPoints(test.amount, test.tier);
  const calculation = `₹${test.amount}/100 × ${getTierMultiplier(test.tier)}x`;
  const status = actual === test.expected ? '✅' : '❌';
  
  console.log(`│ ₹${test.amount.toString().padStart(6)} │ ${test.tier.padStart(7)} │ ${calculation.padStart(11)} │ ${test.expected.toString().padStart(8)} │ ${actual.toString().padStart(8)} │ ${status}`);
});

console.log('└─────────┴─────────┴─────────────┴──────────┴──────────┘');

// Real-world examples
console.log('\n📊 Real-world Examples:');
console.log('─────────────────────');

const examples = [
  { description: 'Budget Room (₹1,200/night)', amount: 1200, tier: 'SILVER' },
  { description: 'Deluxe Room (₹1,800/night)', amount: 1800, tier: 'GOLD' },
  { description: 'Suite (₹2,800/night)', amount: 2800, tier: 'PLATINUM' },
  { description: 'Weekend Stay (₹3,600 total)', amount: 3600, tier: 'GOLD' },
  { description: 'Luxury Package (₹5,000 total)', amount: 5000, tier: 'PLATINUM' },
];

examples.forEach(example => {
  const points = calculateLoyaltyPoints(example.amount, example.tier);
  console.log(`${example.description}:`);
  console.log(`  Amount: ₹${example.amount}`);
  console.log(`  Tier: ${example.tier}`);
  console.log(`  Points Earned: ${points} points`);
  console.log(`  Calculation: ₹${example.amount} ÷ 100 × ${getTierMultiplier(example.tier)} = ${points}`);
  console.log('');
});

console.log('🎯 Points to Tier Progression:');
console.log('─────────────────────────────');
console.log('SILVER: 0-4,999 points');
console.log('GOLD: 5,000-9,999 points');
console.log('PLATINUM: 10,000+ points');

// Calculate how much spending is needed for each tier
console.log('\n💰 Spending Required for Tier Upgrades:');
console.log('─────────────────────────────────────');

const silverToGold = 5000; // points needed
const goldToPlatinum = 10000; // points needed

console.log(`SILVER → GOLD:`);
console.log(`  Points needed: ${silverToGold}`);
console.log(`  Spending needed: ₹${silverToGold * 100} (at 1x rate)`);
console.log(`  Or: ₹${Math.ceil(silverToGold * 100 / 1.5)} (at 1.5x GOLD rate)`);

console.log(`\nGOLD → PLATINUM:`);
console.log(`  Points needed: ${goldToPlatinum}`);
console.log(`  Spending needed: ₹${goldToPlatinum * 100 / 1.5} (at 1.5x GOLD rate)`);
console.log(`  Or: ₹${goldToPlatinum * 100 / 2} (at 2x PLATINUM rate)`); 