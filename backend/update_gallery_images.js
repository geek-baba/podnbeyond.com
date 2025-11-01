const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateGalleryImages() {
  try {
    console.log('🖼️  Updating gallery images with podnbeyond.com images...\n');
    
    // Delete old gallery images
    const deletedGallery = await prisma.image.deleteMany({
      where: { type: 'GALLERY_IMAGE' }
    });
    console.log(`🗑️  Deleted ${deletedGallery.count} old gallery images`);
    
    // Insert new gallery images
    const galleryImages = [];
    for (let i = 1; i <= 9; i++) {
      const filename = `podnbeyond-gallery-${i}.jpg`;
      galleryImages.push({
        type: 'GALLERY_IMAGE',
        filename: filename,
        originalName: filename,
        path: `/uploads/${filename}`,
        url: `/uploads/${filename}`,
        altText: `POD N BEYOND Gallery Image ${i}`,
        title: `Gallery ${i}`,
        description: `Gallery image ${i} from POD N BEYOND Jamshedpur`,
        isActive: true
      });
    }
    
    for (const img of galleryImages) {
      await prisma.image.create({ data: img });
    }
    
    console.log(`✅ Successfully added ${galleryImages.length} gallery images!\n`);
    
    // Handle logo
    const existingLogo = await prisma.image.findFirst({
      where: { type: 'LOGO' }
    });
    
    if (existingLogo) {
      await prisma.image.updateMany({
        where: { type: 'LOGO' },
        data: { 
          filename: 'logo-podnbeyond.png',
          originalName: 'logo-podnbeyond.png',
          path: '/uploads/logo-podnbeyond.png',
          url: '/uploads/logo-podnbeyond.png' 
        }
      });
      console.log('✅ Updated logo image!\n');
    } else {
      await prisma.image.create({
        data: {
          type: 'LOGO',
          filename: 'logo-podnbeyond.png',
          originalName: 'logo-podnbeyond.png',
          path: '/uploads/logo-podnbeyond.png',
          url: '/uploads/logo-podnbeyond.png',
          altText: 'POD N BEYOND Logo',
          title: 'POD N BEYOND Logo',
          description: 'Official POD N BEYOND logo',
          isActive: true
        }
      });
      console.log('✅ Added logo image!\n');
    }
    
    // List all images
    const allImages = await prisma.image.findMany({
      where: {
        OR: [
          { type: 'GALLERY_IMAGE' },
          { type: 'LOGO' }
        ]
      },
      orderBy: { id: 'asc' }
    });
    
    console.log('📋 Current Images in Database:');
    allImages.forEach(img => {
      console.log(`  [${img.type}] ${img.filename}`);
    });
    
    console.log('\n🎉 Image update complete!');
    
  } catch (error) {
    console.error('❌ Error updating images:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateGalleryImages();
