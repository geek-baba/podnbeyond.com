const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cancellationPolicyService = require('../services/cancellationPolicyService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../lib/rbac');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all cancellation policy routes
router.use(authenticate);

/**
 * GET /api/cancellation-policies
 * List cancellation policies
 * RBAC: bookings:read:scoped (for property-scoped), bookings:read (admin)
 */
router.get('/cancellation-policies', requirePermission('bookings:read:scoped'), async (req, res) => {
  try {
    const { propertyId, isActive } = req.query;

    const filters = {};

    // Property filter
    if (propertyId) {
      filters.propertyId = propertyId === 'null' ? null : parseInt(propertyId, 10);
    } else {
      // If no propertyId specified, get global policies (propertyId = null)
      filters.propertyId = null;
    }

    // Active filter
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true' || isActive === true;
    }

    // Get policies
    const policies = await cancellationPolicyService.getPolicies(filters);

    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    console.error('Error fetching cancellation policies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cancellation policies',
      message: error.message
    });
  }
});

/**
 * GET /api/cancellation-policies/:id
 * Get policy details
 * RBAC: bookings:read:scoped, bookings:read (admin)
 */
router.get('/cancellation-policies/:id', requirePermission('bookings:read:scoped'), async (req, res) => {
  try {
    const policyId = parseInt(req.params.id, 10);

    if (isNaN(policyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid policy ID'
      });
    }

    const policy = await cancellationPolicyService.getPolicy(policyId);

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Cancellation policy not found'
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error fetching cancellation policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cancellation policy',
      message: error.message
    });
  }
});

/**
 * POST /api/cancellation-policies
 * Create policy
 * RBAC: bookings:*:scoped (manager, admin)
 */
router.post('/cancellation-policies', requirePermission('bookings:*:scoped'), async (req, res) => {
  try {
    const {
      name,
      description,
      rules,
      humanReadable,
      isActive = true,
      propertyId = null
    } = req.body;

    // Validate required fields
    if (!name || !rules) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, rules'
      });
    }

    // Validate rules structure
    if (!rules.type) {
      return res.status(400).json({
        success: false,
        error: 'rules.type is required'
      });
    }

    // Create policy
    const policy = await cancellationPolicyService.createPolicy({
      name,
      description,
      rules,
      humanReadable,
      isActive,
      propertyId: propertyId ? parseInt(propertyId, 10) : null
    });

    res.status(201).json({
      success: true,
      message: 'Cancellation policy created successfully',
      data: policy
    });
  } catch (error) {
    console.error('Error creating cancellation policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cancellation policy',
      message: error.message
    });
  }
});

/**
 * PUT /api/cancellation-policies/:id
 * Update policy
 * RBAC: bookings:*:scoped (manager, admin)
 */
router.put('/cancellation-policies/:id', requirePermission('bookings:*:scoped'), async (req, res) => {
  try {
    const policyId = parseInt(req.params.id, 10);

    if (isNaN(policyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid policy ID'
      });
    }

    const {
      name,
      description,
      rules,
      humanReadable,
      isActive,
      propertyId
    } = req.body;

    // Get existing policy
    const existingPolicy = await cancellationPolicyService.getPolicy(policyId);

    if (!existingPolicy) {
      return res.status(404).json({
        success: false,
        error: 'Cancellation policy not found'
      });
    }

    // Update policy
    const policy = await cancellationPolicyService.updatePolicy(policyId, {
      name,
      description,
      rules,
      humanReadable,
      isActive,
      propertyId: propertyId !== undefined ? (propertyId ? parseInt(propertyId, 10) : null) : undefined
    });

    res.json({
      success: true,
      message: 'Cancellation policy updated successfully',
      data: policy
    });
  } catch (error) {
    console.error('Error updating cancellation policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cancellation policy',
      message: error.message
    });
  }
});

/**
 * DELETE /api/cancellation-policies/:id
 * Delete policy
 * RBAC: bookings:*:scoped (manager, admin)
 */
router.delete('/cancellation-policies/:id', requirePermission('bookings:*:scoped'), async (req, res) => {
  try {
    const policyId = parseInt(req.params.id, 10);

    if (isNaN(policyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid policy ID'
      });
    }

    // Delete policy
    await cancellationPolicyService.deletePolicy(policyId);

    res.json({
      success: true,
      message: 'Cancellation policy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cancellation policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete cancellation policy',
      message: error.message
    });
  }
});

module.exports = router;

