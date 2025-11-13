const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// High-quality placeholder gallery images for pod/hotel theme
const galleryImages = [
  {
    url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&h=600&fit=crop&auto=format&q=80',
    title: 'Pod Interior',
    description: 'Comfortable and modern pod interior design',
    altText: 'Pod interior showing comfortable sleeping area with modern amenities'
  },
  {
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&h=600&fit=crop&auto=format&q=80',
    title: 'Common Area',
    description: 'Spacious common area for socializing and relaxation',
    altText: 'Common area with comfortable seating and social space'
  },
  {
    url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&h=600&fit=crop&auto=format&q=80',
    title: 'Reception Area',
    description: 'Welcoming reception and check-in area',
    altText: 'Hotel reception desk and lobby area with modern design'
  },
  {
    url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&h=600&fit=crop&auto=format&q=80',
    title: 'Pod Exterior',
    description: 'Modern pod exterior design and architecture',
    altText: 'Exterior view of modern pod accommodation building'
  },
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
  },
  {
    url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900&h=600&fit=crop&auto=format&q=80',
    title: 'Outdoor Space',
    description: 'Peaceful outdoor relaxation area',
    altText: 'Outdoor seating and relaxation area with natural surroundings'
  }
];

async function downloadImage(url, filename) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000 // 30 second timeout
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

async function importGalleryImages() {
  console.log('🚀 Starting gallery image import...');
  
  try {
    // Check if images already exist
    const existingImages = await prisma.image.findMany({
      where: { type: 'GALLERY_IMAGE' }
    });

    if (existingImages.length > 0) {
      console.log(`⚠️  Found ${existingImages.length} existing gallery images. Skipping import.`);
      console.log('To re-import, delete existing gallery images first.');
      return;
    }

    let importedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < galleryImages.length; i++) {
      const imageData = galleryImages[i];
      const filename = `gallery-${i + 1}-${Date.now()}.jpg`;
      
      console.log(`📥 Downloading: ${imageData.title}...`);
      
      const filePath = await downloadImage(imageData.url, filename);
      
      if (filePath) {
        try {
          const imageUrl = `/uploads/${filename}`;
          
          await prisma.image.create({
            data: {
              type: 'GALLERY_IMAGE',
              filename: filename,
              originalName: `gallery-${i + 1}.jpg`,
              path: filePath,
              url: imageUrl,
              altText: imageData.altText,
              title: imageData.title,
              description: imageData.description,
              sortOrder: i + 1
            }
          });
          
          console.log(`✅ Imported: ${imageData.title}`);
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

    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${importedCount} images`);
    console.log(`❌ Failed imports: ${failedCount} images`);
    
    if (importedCount > 0) {
      console.log('\n🎉 Gallery images imported successfully!');
      console.log('You can now manage these images in the CMS admin panel.');
      console.log('Visit: http://localhost:3000/admin/cms');
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (require.main === module) {
  importGalleryImages();
}

module.exports = { importGalleryImages };
