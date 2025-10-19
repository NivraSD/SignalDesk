/**
 * Ultimate Monitoring Routes
 * Exposes the world's greatest monitoring agent endpoints
 */

const express = require('express');
const router = express.Router();
const ultimateMonitoringController = require('../controllers/ultimateMonitoringController');

// Start continuous monitoring for an organization
router.post('/start', ultimateMonitoringController.startUltimateMonitoring);

// Run a single comprehensive analysis
router.post('/analyze', ultimateMonitoringController.runComprehensiveAnalysis);

// Get monitoring status for a specific session
router.get('/status/:monitoringId', ultimateMonitoringController.getMonitoringStatus);

// Stop monitoring session
router.post('/stop/:monitoringId', ultimateMonitoringController.stopMonitoring);

// Get analysis history for an organization
router.get('/history/:organizationId', ultimateMonitoringController.getAnalysisHistory);

// Test specific agent capabilities
router.post('/test-capability', ultimateMonitoringController.testAgentCapability);

module.exports = router;