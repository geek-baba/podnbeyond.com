const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Remaining gallery images to add
const remainingImages = [
  {
    url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&h=600&fit=crop&auto=format&q=80',
    title: 'Bathroom Facilities',
    description: 'Clean and modern bathroom facilities',
    altText: 'Modern bathroom with shower facilities and clean design'
  },
  {
    url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop&auto=format&q=80',
    title: 'Dining Area',
    description: 'Cozy dining and meal area for guests',
    altText: 'Dining area with tables and comfortable seating'
  },
  {
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900&h=600&fit=crop&auto=format&q=80',
    title: 'Lounge Space',
    description: 'Relaxing lounge and entertainment area',
    altText: 'Lounge area with comfortable seating and modern decor'
  },
  {
    url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&h=600&fit=crop&auto=format&q=80',
    title: 'Pod Layout',
    description: 'Efficient pod layout and design',
    altText: 'Overview of pod layout and efficient space design'
  }
];

async function downloadImage(url, filename) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000
    });

    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    const writer = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Failed to download ${url}:`, error.message);
    return null;
  }
}

async function addRemainingImages() {
  console.log('🚀 Adding remaining gallery images...');
  
  try {
    // Get current count for sort order
    const existingCount = await prisma.image.count({
      where: { type: 'GALLERY_IMAGE' }
    });

    let importedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < remainingImages.length; i++) {
      const imageData = remainingImages[i];
      const filename = `gallery-${existingCount + i + 1}-${Date.now()}.jpg`;
      
      console.log(`📥 Downloading: ${imageData.title}...`);
      
      const filePath = await downloadImage(imageData.url, filename);
      
      if (filePath) {
        try {
          const imageUrl = `/uploads/${filename}`;
          
          await prisma.image.create({
            data: {
              type: 'GALLERY_IMAGE',
              filename: filename,
              originalName: `gallery-${existingCount + i + 1}.jpg`,
              path: filePath,
              url: imageUrl,
              altText: imageData.altText,
              title: imageData.title,
              description: imageData.description,
              sortOrder: existingCount + i + 1
            }
          });
          
          console.log(`✅ Added: ${imageData.title}`);
          importedCount++;
        } catch (dbError) {
          console.error(`❌ Database error for ${imageData.title}:`, dbError.message);
          failedCount++;
        }
      } else {
        console.error(`❌ Failed to download: ${imageData.title}`);
        failedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully added: ${importedCount} images`);
    console.log(`❌ Failed: ${failedCount} images`);
    
    if (importedCount > 0) {
      console.log('\n🎉 Remaining gallery images added successfully!');
      console.log('Total gallery images in CMS:', existingCount + importedCount);
    }

  } catch (error) {
    console.error('❌ Failed to add images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  addRemainingImages();
}

module.exports = { addRemainingImages };
