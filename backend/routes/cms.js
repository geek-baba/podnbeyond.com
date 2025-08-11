const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Content Management Routes

// Get all content
router.get('/content/all', async (req, res) => {
  try {
    const content = await prisma.content.findMany({
      orderBy: {
        sortOrder: 'asc'
      }
    });
    
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error fetching all content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Get all content by type
router.get('/content/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const content = await prisma.content.findMany({
      where: {
        type: type,
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });
    
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Create or update content
router.post('/content', async (req, res) => {
  try {
    const { type, title, subtitle, description, content, isActive, sortOrder } = req.body;
    
    const existingContent = await prisma.content.findFirst({
      where: { type: type }
    });
    
    let result;
    if (existingContent) {
      result = await prisma.content.update({
        where: { id: existingContent.id },
        data: { title, subtitle, description, content, isActive, sortOrder }
      });
    } else {
      result = await prisma.content.create({
        data: { type, title, subtitle, description, content, isActive, sortOrder }
      });
    }
    
    res.json({ success: true, content: result });
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// Image Management Routes

// Upload image
router.post('/images/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const { type, altText, title, description } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;
    
    const image = await prisma.image.create({
      data: {
        type: type,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        url: imageUrl,
        altText,
        title,
        description
      }
    });
    
    res.json({ success: true, image });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get all images
router.get('/images/all', async (req, res) => {
  try {
    const images = await prisma.image.findMany({
      orderBy: {
        sortOrder: 'asc'
      }
    });
    
    res.json({ success: true, images });
  } catch (error) {
    console.error('Error fetching all images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Get all images by type
router.get('/images/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate that type is a valid ImageType enum value
    const validTypes = ['HERO_IMAGE', 'ROOM_IMAGE', 'AMENITY_ICON', 'TESTIMONIAL_AVATAR', 'GALLERY_IMAGE', 'LOGO', 'FAVICON'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid image type' });
    }
    
    const images = await prisma.image.findMany({
      where: {
        type: type,
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });
    
    res.json({ success: true, images });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Delete image
router.delete('/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const image = await prisma.image.findUnique({ where: { id: parseInt(id) } });
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Delete file from filesystem
    if (fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }
    
    await prisma.image.delete({ where: { id: parseInt(id) } });
    
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Testimonials Management Routes

// Get all testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      include: { avatarImage: true },
      orderBy: { sortOrder: 'asc' }
    });
    
    res.json({ success: true, testimonials });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Create testimonial
router.post('/testimonials', async (req, res) => {
  try {
    const { guestName, guestEmail, rating, title, content, avatarImageId, isActive, sortOrder } = req.body;
    
    const testimonial = await prisma.testimonial.create({
      data: {
        guestName,
        guestEmail,
        rating: parseInt(rating),
        title,
        content,
        avatarImageId: avatarImageId ? parseInt(avatarImageId) : null,
        isActive,
        sortOrder: parseInt(sortOrder) || 0
      },
      include: { avatarImage: true }
    });
    
    res.json({ success: true, testimonial });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

// Update testimonial
router.put('/testimonials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { guestName, guestEmail, rating, title, content, avatarImageId, isActive, sortOrder } = req.body;
    
    const testimonial = await prisma.testimonial.update({
      where: { id: parseInt(id) },
      data: {
        guestName,
        guestEmail,
        rating: parseInt(rating),
        title,
        content,
        avatarImageId: avatarImageId ? parseInt(avatarImageId) : null,
        isActive,
        sortOrder: parseInt(sortOrder) || 0
      },
      include: { avatarImage: true }
    });
    
    res.json({ success: true, testimonial });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

// Delete testimonial
router.delete('/testimonials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.testimonial.delete({ where: { id: parseInt(id) } });
    
    res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

// Amenities Management Routes

// Get all amenities
router.get('/amenities', async (req, res) => {
  try {
    const amenities = await prisma.amenity.findMany({
      where: { isActive: true },
      include: { iconImage: true },
      orderBy: { sortOrder: 'asc' }
    });
    
    res.json({ success: true, amenities });
  } catch (error) {
    console.error('Error fetching amenities:', error);
    res.status(500).json({ error: 'Failed to fetch amenities' });
  }
});

// Create amenity
router.post('/amenities', async (req, res) => {
  try {
    const { name, description, iconName, iconImageId, isActive, sortOrder } = req.body;
    
    const amenity = await prisma.amenity.create({
      data: {
        name,
        description,
        iconName,
        iconImageId: iconImageId ? parseInt(iconImageId) : null,
        isActive,
        sortOrder: parseInt(sortOrder) || 0
      },
      include: { iconImage: true }
    });
    
    res.json({ success: true, amenity });
  } catch (error) {
    console.error('Error creating amenity:', error);
    res.status(500).json({ error: 'Failed to create amenity' });
  }
});

// Update amenity
router.put('/amenities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, iconName, iconImageId, isActive, sortOrder } = req.body;
    
    const amenity = await prisma.amenity.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        iconName,
        iconImageId: iconImageId ? parseInt(iconImageId) : null,
        isActive,
        sortOrder: parseInt(sortOrder) || 0
      },
      include: { iconImage: true }
    });
    
    res.json({ success: true, amenity });
  } catch (error) {
    console.error('Error updating amenity:', error);
    res.status(500).json({ error: 'Failed to update amenity' });
  }
});

// Delete amenity
router.delete('/amenities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.amenity.delete({ where: { id: parseInt(id) } });
    
    res.json({ success: true, message: 'Amenity deleted successfully' });
  } catch (error) {
    console.error('Error deleting amenity:', error);
    res.status(500).json({ error: 'Failed to delete amenity' });
  }
});

// Settings Management Routes

// Get all settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' }
    });
    
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get setting by key
router.get('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await prisma.setting.findUnique({
      where: { key }
    });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ success: true, setting });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Create or update setting
router.post('/settings', async (req, res) => {
  try {
    const { key, value, description, type, isPublic } = req.body;
    
    const existingSetting = await prisma.setting.findUnique({
      where: { key }
    });
    
    let result;
    if (existingSetting) {
      result = await prisma.setting.update({
        where: { key },
        data: { value, description, type, isPublic }
      });
    } else {
      result = await prisma.setting.create({
        data: { key, value, description, type, isPublic }
      });
    }
    
    res.json({ success: true, setting: result });
  } catch (error) {
    console.error('Error saving setting:', error);
    res.status(500).json({ error: 'Failed to save setting' });
  }
});

// Delete setting
router.delete('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await prisma.setting.delete({ where: { key } });
    
    res.json({ success: true, message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

module.exports = router; 