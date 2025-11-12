const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

const { renderTemplate, getAvailableVariables, extractVariables } = require('../services/template-engine');

/**
 * GET /api/templates
 * Get all templates with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { type, channel, propertyId, isActive } = req.query;
    
    const where = {};
    if (type) where.type = type;
    if (channel) where.channel = channel;
    if (propertyId) {
      where.propertyId = propertyId === 'null' ? null : parseInt(propertyId);
    } else if (propertyId === undefined) {
      // If propertyId not specified, show both global and property-specific
      // (no filter)
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const templates = await getPrisma().messageTemplate.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { channel: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/templates/variables
 * Get available template variables
 */
router.get('/variables', async (req, res) => {
  try {
    const variables = getAvailableVariables();
    res.json({
      success: true,
      variables,
    });
  } catch (error) {
    console.error('Error fetching variables:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch variables' });
  }
});

/**
 * GET /api/templates/:id
 * Get a specific template
 */
router.get('/:id', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    
    const template = await getPrisma().messageTemplate.findUnique({
      where: { id: templateId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template' });
  }
});

/**
 * POST /api/templates
 * Create a new template
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      channel,
      subject,
      body,
      propertyId,
      description,
      isActive = true,
      createdBy,
    } = req.body;

    // Validate required fields
    if (!name || !type || !channel || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, channel, body',
      });
    }

    // Extract variables from template
    const variables = extractVariables(body);
    if (subject) {
      variables.push(...extractVariables(subject));
    }
    const uniqueVariables = [...new Set(variables)];

    const template = await getPrisma().messageTemplate.create({
      data: {
        name,
        type,
        channel,
        subject: subject || null,
        body,
        variables: uniqueVariables,
        propertyId: propertyId ? parseInt(propertyId) : null,
        description: description || null,
        isActive,
        createdBy: createdBy || null,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

/**
 * PUT /api/templates/:id
 * Update a template
 */
router.put('/:id', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const {
      name,
      type,
      channel,
      subject,
      body,
      propertyId,
      description,
      isActive,
      updatedBy,
    } = req.body;

    // Check if template exists
    const existing = await getPrisma().messageTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    // Extract variables from template
    const variables = extractVariables(body);
    if (subject) {
      variables.push(...extractVariables(subject));
    }
    const uniqueVariables = [...new Set(variables)];

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (channel !== undefined) updateData.channel = channel;
    if (subject !== undefined) updateData.subject = subject || null;
    if (body !== undefined) {
      updateData.body = body;
      updateData.variables = uniqueVariables;
    }
    if (propertyId !== undefined) {
      updateData.propertyId = propertyId ? parseInt(propertyId) : null;
    }
    if (description !== undefined) updateData.description = description || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (updatedBy !== undefined) updateData.updatedBy = updatedBy;

    const template = await getPrisma().messageTemplate.update({
      where: { id: templateId },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

/**
 * DELETE /api/templates/:id
 * Delete a template
 */
router.delete('/:id', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);

    const existing = await getPrisma().messageTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    await getPrisma().messageTemplate.delete({
      where: { id: templateId },
    });

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

/**
 * POST /api/templates/:id/preview
 * Preview a template with sample booking data
 */
router.post('/:id/preview', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'bookingId is required for preview',
      });
    }

    const template = await getPrisma().messageTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const rendered = await renderTemplate(template.body, template.subject, bookingId);

    res.json({
      success: true,
      preview: rendered,
    });
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to preview template',
    });
  }
});

module.exports = router;

