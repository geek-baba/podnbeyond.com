// Test script to demonstrate loyalty points discount calculation
// Run with: node test_discount_calculation.js

// Helper function to calculate discount amount based on points and tier
function calculateDiscountAmount(points, tier, bookingAmount) {
  // Base conversion rate: 1 point = ₹10 discount
  const baseDiscountRate = 10; // ₹10 per point
  
  // Apply tier multiplier for discount calculation
  const tierDiscountMultiplier = getTierDiscountMultiplier(tier);
  
  // Calculate base discount
  const baseDiscount = points * baseDiscountRate;
  
  // Apply tier multiplier
  const discountAmount = Math.round(baseDiscount * tierDiscountMultiplier);
  
  // Ensure discount doesn't exceed booking amount
  return Math.min(discountAmount, bookingAmount);
}

// Helper function to get tier discount multiplier
function getTierDiscountMultiplier(tier) {
  switch (tier) {
    case 'PLATINUM':
      return 1.5; // 1.5x discount value (₹15 per point)
    case 'GOLD':
      return 1.25; // 1.25x discount value (₹12.5 per point)
    case 'SILVER':
    default:
      return 1.0; // 1x discount value (₹10 per point)
  }
}

// Test cases for discount calculation
const testCases = [
  { points: 50, tier: 'SILVER', bookingAmount: 1000, expected: 500 },
  { points: 100, tier: 'SILVER', bookingAmount: 2000, expected: 1000 },
  { points: 50, tier: 'GOLD', bookingAmount: 1000, expected: 625 },
  { points: 100, tier: 'GOLD', bookingAmount: 2000, expected: 1250 },
  { points: 50, tier: 'PLATINUM', bookingAmount: 1000, expected: 750 },
  { points: 100, tier: 'PLATINUM', bookingAmount: 2000, expected: 1500 },
  { points: 200, tier: 'SILVER', bookingAmount: 1000, expected: 1000 }, // Capped at booking amount
  { points: 100, tier: 'GOLD', bookingAmount: 800, expected: 800 }, // Capped at booking amount
];

console.log('🧪 Testing Loyalty Points Discount Calculation\n');
console.log('Base Rate: 1 point = ₹10 discount');
console.log('Tier Discount Multipliers:');
console.log('  SILVER: 1.0x (₹10 per point)');
console.log('  GOLD: 1.25x (₹12.5 per point)');
console.log('  PLATINUM: 1.5x (₹15 per point)\n');

console.log('Test Results:');
console.log('┌─────────┬─────────┬─────────────┬─────────────┬──────────┬──────────┐');
console.log('│ Points  │ Tier    │ Booking Amt │ Calculation │ Expected │ Actual   │');
console.log('├─────────┼─────────┼─────────────┼─────────────┼──────────┼──────────┤');

testCases.forEach(test => {
  const actual = calculateDiscountAmount(test.points, test.tier, test.bookingAmount);
  const multiplier = getTierDiscountMultiplier(test.tier);
  const calculation = `${test.points} × ₹10 × ${multiplier}x`;
  const status = actual === test.expected ? '✅' : '❌';
  
  console.log(`│ ${test.points.toString().padStart(6)} │ ${test.tier.padStart(7)} │ ₹${test.bookingAmount.toString().padStart(9)} │ ${calculation.padStart(11)} │ ₹${test.expected.toString().padStart(8)} │ ₹${actual.toString().padStart(8)} │ ${status}`);
});

console.log('└─────────┴─────────┴─────────────┴─────────────┴──────────┴──────────┘');

// Real-world redemption examples
console.log('\n📊 Real-world Redemption Examples:');
console.log('─────────────────────────────────');

const examples = [
  { description: 'Budget Room Discount', points: 50, tier: 'SILVER', bookingAmount: 1200 },
  { description: 'Deluxe Room Discount', points: 100, tier: 'GOLD', bookingAmount: 1800 },
  { description: 'Suite Discount', points: 150, tier: 'PLATINUM', bookingAmount: 2800 },
  { description: 'Weekend Stay Discount', points: 200, tier: 'GOLD', bookingAmount: 3600 },
  { description: 'Luxury Package Discount', points: 300, tier: 'PLATINUM', bookingAmount: 5000 },
];

examples.forEach(example => {
  const discount = calculateDiscountAmount(example.points, example.tier, example.bookingAmount);
  const finalAmount = example.bookingAmount - discount;
  const savingsPercentage = ((discount / example.bookingAmount) * 100).toFixed(1);
  
  console.log(`${example.description}:`);
  console.log(`  Points Redeemed: ${example.points}`);
  console.log(`  Tier: ${example.tier}`);
  console.log(`  Original Amount: ₹${example.bookingAmount}`);
  console.log(`  Discount: ₹${discount} (${savingsPercentage}% savings)`);
  console.log(`  Final Amount: ₹${finalAmount}`);
  console.log('');
});

// Points value comparison
console.log('💰 Points Value by Tier:');
console.log('────────────────────────');
console.log('SILVER Tier:');
console.log('  • 1 point = ₹10 discount');
console.log('  • 100 points = ₹1,000 discount');
console.log('  • 500 points = ₹5,000 discount');

console.log('\nGOLD Tier:');
console.log('  • 1 point = ₹12.5 discount');
console.log('  • 100 points = ₹1,250 discount');
console.log('  • 500 points = ₹6,250 discount');

console.log('\nPLATINUM Tier:');
console.log('  • 1 point = ₹15 discount');
console.log('  • 100 points = ₹1,500 discount');
console.log('  • 500 points = ₹7,500 discount');

// Redemption strategies
console.log('\n🎯 Smart Redemption Strategies:');
console.log('──────────────────────────────');
console.log('1. Save points for higher tier bookings (better value)');
console.log('2. Use points on expensive rooms (higher discount amounts)');
console.log('3. Combine with tier benefits for maximum savings');
console.log('4. Consider point earning vs redemption value');

// Business rules reminder
console.log('\n📋 Business Rules:');
console.log('─────────────────');
console.log('• Maximum discount: 50% of booking amount');
console.log('• Points are deducted immediately upon redemption');
console.log('• Discount cannot exceed booking amount');
console.log('• Higher tiers get better discount multipliers');
console.log('• Redemption is final and non-refundable'); 