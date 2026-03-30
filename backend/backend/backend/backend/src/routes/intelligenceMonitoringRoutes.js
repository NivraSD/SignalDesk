const express = require('express');
const router = express.Router();
const intelligenceMonitoringController = require('../controllers/intelligenceMonitoringController');

// Monitoring status and control
router.get('/monitor/status/:organizationId', intelligenceMonitoringController.getMonitoringStatus);
router.post('/monitor/start', intelligenceMonitoringController.startMonitoring);
router.post('/monitor/stop/:organizationId', intelligenceMonitoringController.stopMonitoring);

// Targets management
router.get('/organizations/:organizationId/targets', intelligenceMonitoringController.getOrganizationTargets);
router.post('/targets', intelligenceMonitoringController.createTarget);

// Findings and insights
router.get('/findings', intelligenceMonitoringController.getIntelligenceFindings);

// Metrics
router.get('/metrics/:organizationId', intelligenceMonitoringController.getMonitoringMetrics);

module.exports = router;