const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Get all gallery images
router.get('/images', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Get all podnbeyond-gallery images
    const files = fs.readdirSync(uploadsDir);
    const galleryImages = files
      .filter(file => file.startsWith('podnbeyond-gallery-') && file.endsWith('.jpg'))
      .sort()
      .map((filename, index) => ({
        id: index + 1,
        filename,
        url: `/uploads/${filename}`,
        altText: `POD N BEYOND Gallery Image ${index + 1}`,
        title: `Gallery ${index + 1}`
      }));
    
    res.json({
      success: true,
      count: galleryImages.length,
      images: galleryImages
    });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch gallery images' });
  }
});

// Get logo
router.get('/logo', (req, res) => {
  res.json({
    success: true,
    logo: {
      url: '/uploads/logo-podnbeyond.png',
      altText: 'POD N BEYOND Logo'
    }
  });
});

module.exports = router;

