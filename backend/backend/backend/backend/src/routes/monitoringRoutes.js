const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoringController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Configuration endpoints
router.post('/config', monitoringController.saveConfig);
router.get('/config', monitoringController.getConfig);

// Test endpoints
router.get('/test-claude', monitoringController.testClaude);
router.get('/test-sentiment', monitoringController.testSentiment);
router.post('/test-sentiment-context', monitoringController.testSentimentWithContext);
router.get('/test-simple', monitoringController.testSimple);
router.post('/test-analysis-simple', monitoringController.testAnalysisSimple);
router.post('/test-sentiment-service', monitoringController.testSentimentService);
router.post('/test-direct-analysis', monitoringController.testDirectAnalysis);

// Analysis endpoints
router.post('/analyze-sentiment', monitoringController.analyzeSentiment);
router.post('/analyze-batch', monitoringController.analyzeBatch);

// RSS feed endpoint
router.post('/fetch-rss', monitoringController.fetchRSSFeeds);


// Analytics routes
const analyticsController = require('../controllers/analyticsController');
router.get('/analytics', authMiddleware, analyticsController.getAnalytics);
router.post('/analytics/export', authMiddleware, analyticsController.exportAnalytics);

// V2 Routes - Simplified agent-based monitoring
const monitoringControllerV2 = require('../controllers/monitoringControllerV2');
router.post('/fetch-mentions', authMiddleware, monitoringControllerV2.fetchMentions);
router.post('/analyze-with-agent', authMiddleware, monitoringControllerV2.analyzeWithAgent);

// AI Monitoring Advisor Routes
const aiMonitoringController = require('../controllers/aiMonitoringController');
router.post('/save-strategy', authMiddleware, aiMonitoringController.saveStrategy);
router.post('/fetch-enhanced', authMiddleware, aiMonitoringController.fetchEnhanced);
router.get('/metrics', authMiddleware, aiMonitoringController.getMetrics);
router.post('/chat-analyze', authMiddleware, aiMonitoringController.chatAnalyze);

// Intelligence monitoring metrics endpoint
const intelligenceMonitoringController = require('../controllers/intelligenceMonitoringController');
router.get('/metrics/:organizationId', authMiddleware, intelligenceMonitoringController.getMonitoringMetrics);

module.exports = router;
