const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/brands
 * Get all brands with their properties
 */
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = status ? { status: status.toUpperCase() } : {};
    
    const brands = await prisma.brand.findMany({
      where,
      include: {
        properties: {
          where: { status: 'ACTIVE' },
          include: {
            _count: {
              select: { rooms: true }
            }
          }
        },
        _count: {
          select: { properties: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({
      success: true,
      count: brands.length,
      brands
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brands'
    });
  }
});

/**
 * GET /api/brands/:slug
 * Get a specific brand with all its properties
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const brand = await prisma.brand.findUnique({
      where: { slug },
      include: {
        properties: {
          where: { status: 'ACTIVE' },
          include: {
            rooms: true,
            _count: {
              select: { rooms: true }
            }
          }
        }
      }
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }

    res.json({
      success: true,
      brand
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand'
    });
  }
});

module.exports = router;

