const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligenceController');
const intelligenceMonitoringController = require('../controllers/intelligenceMonitoringController');
const intelligenceAnalysisController = require('../controllers/intelligenceAnalysisController');
const targetSourcesController = require('../controllers/targetSourcesController');
const topicMomentumController = require('../controllers/topicMomentumController');
const organizationAnalysisController = require('../controllers/organizationAnalysisController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Multi-source intelligence gathering
router.post('/gather', intelligenceController.gatherIntelligence);

// AI-powered source discovery
router.post('/discover-sources', intelligenceController.discoverSources);

// AI-powered competitor and topic discovery
router.post('/discover-competitors', intelligenceController.discoverCompetitors);
router.post('/discover-topics', intelligenceController.discoverTopics);

// ============================================
// Intelligence Monitoring Endpoints
// ============================================

// Monitoring status and control
router.get('/monitor/status/:organizationId', intelligenceMonitoringController.getMonitoringStatus);
router.post('/monitor/start', intelligenceMonitoringController.startMonitoring);
router.post('/monitor/trigger', intelligenceMonitoringController.triggerMonitoring);

// Intelligence targets
router.get('/organizations/:organizationId/targets', intelligenceMonitoringController.getOrganizationTargets);
router.post('/targets', intelligenceMonitoringController.createTarget);

// Findings
router.get('/findings', intelligenceMonitoringController.getFindings);

// Real-time connection info
router.get('/realtime/:organizationId', intelligenceMonitoringController.connectToRealtime);

// AI Analysis endpoints
router.post('/analysis/competitor', intelligenceAnalysisController.analyzeCompetitor);
router.post('/analysis/topic', intelligenceAnalysisController.analyzeTopic);
router.get('/analysis/overview/:organizationId', intelligenceAnalysisController.getOverviewAnalysis);
router.get('/analysis/unified/:organizationId', intelligenceAnalysisController.getUnifiedIntelligence);
router.get('/analysis/topic-momentum/:organizationId', topicMomentumController.getTopicMomentum);

// Organization Analysis
router.post('/analyze-organization', organizationAnalysisController.analyzeOrganization);

// Target Sources Management
router.get('/targets/:targetId/sources', targetSourcesController.getTargetSources);
router.post('/targets/:targetId/sources', targetSourcesController.addTargetSource);
router.put('/sources/:sourceId', targetSourcesController.updateTargetSource);
router.delete('/sources/:sourceId', targetSourcesController.deleteTargetSource);
router.post('/targets/:targetId/discover-sources', targetSourcesController.discoverSourcesForTarget);
router.post('/sources/test', targetSourcesController.testSource);
router.post('/targets/:targetId/sources/bulk', targetSourcesController.bulkAddSources);

module.exports = router;