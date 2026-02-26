const express = require('express');
const router = express.Router();
const intelligenceMonitoringController = require('../src/controllers/intelligenceMonitoringController');

// Get opportunities for an organization
router.get('/organization/:organizationId', intelligenceMonitoringController.getOpportunities);

module.exports = router;