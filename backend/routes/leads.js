const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

// Create lead
router.post('/', leadController.createLead);

// Get all leads
router.get('/', leadController.getAllLeads);

// Get lead by ID
router.get('/:id', leadController.getLeadById);

// Update lead status
router.put('/:id/status', leadController.updateLeadStatus);

// Delete lead
router.delete('/:id', leadController.deleteLead);

module.exports = router;
