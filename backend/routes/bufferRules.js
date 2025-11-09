const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const { propertyId, roomTypeId } = req.query;
  try {
    const filters = {
      ...(propertyId && { propertyId: parseInt(propertyId, 10) }),
      ...(roomTypeId && { roomTypeId: parseInt(roomTypeId, 10) }),
    };

    const rules = await prisma.bufferRule.findMany({
      where: filters,
      orderBy: [{ propertyId: 'asc' }, { roomTypeId: 'asc' }, { startDate: 'asc' }],
    });

    res.json({ success: true, rules });
  } catch (error) {
    console.error('Error fetching buffer rules:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch buffer rules' });
  }
});

router.post('/', async (req, res) => {
  const {
    propertyId,
    roomTypeId,
    startDate,
    endDate,
    percent,
    daysOfWeek,
    notes,
    isActive = true,
  } = req.body;

  if (!propertyId || !startDate || !endDate || percent === undefined) {
    return res.status(400).json({ success: false, error: 'propertyId, startDate, endDate, and percent are required' });
  }

  try {
    const rule = await prisma.bufferRule.create({
      data: {
        propertyId: parseInt(propertyId, 10),
        roomTypeId: roomTypeId ? parseInt(roomTypeId, 10) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        percent: parseInt(percent, 10),
        daysOfWeek: daysOfWeek || null,
        notes: notes || null,
        isActive,
      },
    });

    res.status(201).json({ success: true, rule });
  } catch (error) {
    console.error('Error creating buffer rule:', error);
    res.status(500).json({ success: false, error: 'Failed to create buffer rule' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    startDate,
    endDate,
    percent,
    daysOfWeek,
    notes,
    isActive,
  } = req.body;

  try {
    const rule = await prisma.bufferRule.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(percent !== undefined && { percent: parseInt(percent, 10) }),
        ...(daysOfWeek !== undefined && { daysOfWeek }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, rule });
  } catch (error) {
    console.error('Error updating buffer rule:', error);
    res.status(500).json({ success: false, error: 'Failed to update buffer rule' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.bufferRule.delete({
      where: { id: parseInt(id, 10) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting buffer rule:', error);
    res.status(500).json({ success: false, error: 'Failed to delete buffer rule' });
  }
});

module.exports = router;

