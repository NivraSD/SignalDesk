const express = require('express');
const router = express.Router();
const intelligenceMonitoringController = require('../controllers/intelligenceMonitoringController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Opportunities endpoints
router.get('/organization/:organizationId', intelligenceMonitoringController.getOpportunities);
router.post('/identify', intelligenceMonitoringController.identifyOpportunities);
router.patch('/:opportunityId/status', intelligenceMonitoringController.updateOpportunityStatus);

module.exports = router;