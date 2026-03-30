/**
 * SIMPLIFIED MONITORING ROUTES
 * Clean, direct API without executive summary complexity
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/simplifiedMonitoringController');

// Main intelligence endpoint - just the data, no fluff
router.get('/intelligence/:organizationId', controller.getIntelligence);

// System health check
router.get('/diagnostic/:organizationId', controller.runDiagnostic);

// Auto-fix issues
router.post('/auto-fix/:organizationId', controller.autoFix);

// Test with sample data
router.get('/test', controller.test);

module.exports = router;