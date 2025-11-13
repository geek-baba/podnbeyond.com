#!/usr/bin/env node

/**
 * Script to convert all routes from eager PrismaClient initialization
 * to lazy initialization pattern
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

const pattern1 = /const prisma = new PrismaClient\(\);?\s*\n/g;
const replacement1 = `// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
`;

function convertRoute(filePath) {
  console.log(`Converting ${path.basename(filePath)}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Skip if already converted
  if (content.includes('function getPrisma()')) {
    console.log(`  ✓ Already converted`);
    return false;
  }
  
  // Replace PrismaClient initialization
  if (content.includes('const prisma = new PrismaClient()')) {
    content = content.replace(
      /const prisma = new PrismaClient\(\);?\s*\n/g,
      replacement1
    );
    
    // Replace all prisma. calls with getPrisma().
    // This is a simple regex replacement - manual review may be needed for complex cases
    content = content.replace(/\bprisma\./g, 'getPrisma().');
    
    // Handle special cases where prisma is passed as a parameter
    // We'll keep those as-is for now
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Converted`);
    return true;
  } else {
    console.log(`  - No PrismaClient found`);
    return false;
  }
}

console.log('Converting routes to lazy PrismaClient initialization...\n');

let converted = 0;
for (const file of routeFiles) {
  const filePath = path.join(routesDir, file);
  if (convertRoute(filePath)) {
    converted++;
  }
}

console.log(`\n✓ Converted ${converted} route files`);

