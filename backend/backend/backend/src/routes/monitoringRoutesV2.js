const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoringControllerV2');
const authMiddleware = require('../middleware/auth');

// Opportunity detection routes
router.post('/start-monitoring', authMiddleware, monitoringController.startOpportunityMonitoring);
router.post('/scan-opportunities', authMiddleware, monitoringController.scanForOpportunities);
router.get('/opportunities', authMiddleware, monitoringController.getOpportunities);
router.put('/opportunities/:opportunityId', authMiddleware, monitoringController.updateOpportunityStatus);

// Intelligence summary route (real RSS data)
router.get('/intelligence-summary/:organizationId', authMiddleware, monitoringController.getIntelligenceSummary);

// Original monitoring routes (backward compatibility)
router.post('/fetch-mentions', authMiddleware, monitoringController.fetchMentions);
router.post('/analyze', authMiddleware, monitoringController.analyzeWithAgent);
router.post('/save-config', authMiddleware, monitoringController.saveConfig);
router.get('/config', authMiddleware, monitoringController.getConfig);

module.exports = router;