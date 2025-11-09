const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const { propertyId, provider } = req.query;

  try {
    const mappings = await prisma.oTAMapping.findMany({
      where: {
        ...(propertyId && { propertyId: parseInt(propertyId, 10) }),
        ...(provider && { provider }),
      },
      include: {
        property: true,
        roomType: true,
        ratePlan: true,
      },
      orderBy: [{ provider: 'asc' }, { propertyId: 'asc' }],
    });

    res.json({ success: true, mappings });
  } catch (error) {
    console.error('Error fetching OTA mappings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch OTA mappings' });
  }
});

router.post('/', async (req, res) => {
  const {
    propertyId,
    roomTypeId,
    ratePlanId,
    provider,
    externalPropertyCode,
    externalRoomCode,
    externalRateCode,
    credentials,
    isActive = true,
    supportsPush = true,
    supportsPull = true,
  } = req.body;

  if (!propertyId || !provider || !externalPropertyCode) {
    return res.status(400).json({ success: false, error: 'propertyId, provider, and externalPropertyCode are required' });
  }

  try {
    const mapping = await prisma.oTAMapping.create({
      data: {
        propertyId: parseInt(propertyId, 10),
        roomTypeId: roomTypeId ? parseInt(roomTypeId, 10) : null,
        ratePlanId: ratePlanId ? parseInt(ratePlanId, 10) : null,
        provider,
        externalPropertyCode,
        externalRoomCode: externalRoomCode || null,
        externalRateCode: externalRateCode || null,
        credentials: credentials || null,
        isActive,
        supportsPush,
        supportsPull,
      },
    });

    res.status(201).json({ success: true, mapping });
  } catch (error) {
    console.error('Error creating OTA mapping:', error);
    res.status(500).json({ success: false, error: 'Failed to create OTA mapping' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    externalPropertyCode,
    externalRoomCode,
    externalRateCode,
    credentials,
    isActive,
    supportsPush,
    supportsPull,
  } = req.body;

  try {
    const mapping = await prisma.oTAMapping.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(externalPropertyCode && { externalPropertyCode }),
        ...(externalRoomCode !== undefined && { externalRoomCode }),
        ...(externalRateCode !== undefined && { externalRateCode }),
        ...(credentials !== undefined && { credentials }),
        ...(isActive !== undefined && { isActive }),
        ...(supportsPush !== undefined && { supportsPush }),
        ...(supportsPull !== undefined && { supportsPull }),
      },
    });

    res.json({ success: true, mapping });
  } catch (error) {
    console.error('Error updating OTA mapping:', error);
    res.status(500).json({ success: false, error: 'Failed to update OTA mapping' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.oTAMapping.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting OTA mapping:', error);
    res.status(500).json({ success: false, error: 'Failed to delete OTA mapping' });
  }
});

module.exports = router;

