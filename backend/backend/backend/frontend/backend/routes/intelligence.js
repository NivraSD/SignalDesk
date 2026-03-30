const express = require('express');
const router = express.Router();
const IntelligenceController = require('../controllers/intelligenceController');

// Intelligence pipeline endpoints
router.post('/analyze', IntelligenceController.analyzeRequest);
router.post('/clarify', IntelligenceController.clarifyQuery);
router.get('/projects/:projectId', IntelligenceController.getProject);
router.get('/organizations/:orgId/projects', IntelligenceController.getOrganizationProjects);

// Target management
router.post('/targets', IntelligenceController.createTarget);
router.get('/targets/:targetId', IntelligenceController.getTarget);
router.put('/targets/:targetId', IntelligenceController.updateTarget);
router.delete('/targets/:targetId', IntelligenceController.deleteTarget);
router.get('/organizations/:orgId/targets', IntelligenceController.getOrganizationTargets);

// Findings
router.get('/findings', IntelligenceController.getFindings);
router.get('/findings/:findingId', IntelligenceController.getFinding);
router.post('/findings', IntelligenceController.createFinding);

// Real-time monitoring
router.post('/monitor/start', IntelligenceController.startMonitoring);
router.post('/monitor/stop', IntelligenceController.stopMonitoring);
router.get('/monitor/status/:orgId', IntelligenceController.getMonitoringStatus);

module.exports = router;