const express = require('express');
const router = express.Router();
const intelligenceIndexController = require('../controllers/intelligenceIndexController');
const authMiddleware = require('../middleware/authMiddleware');

// Public endpoints (no auth required for browsing)
router.get('/industries', intelligenceIndexController.getIndustries);
router.get('/industries/:industryId', intelligenceIndexController.getIndustryProfile);
router.get('/industries/:industryId/companies', intelligenceIndexController.getCompaniesByIndustry);
router.get('/industries/:industryId/topics', intelligenceIndexController.getTopicsByIndustry);
router.get('/industries/:industryId/sources', intelligenceIndexController.getSourcesByIndustry);
router.get('/companies/search', intelligenceIndexController.searchCompanies);
router.get('/topics/trending', intelligenceIndexController.getTrendingTopics);
router.get('/suggestions', intelligenceIndexController.getIntelligenceSuggestions);

// Protected endpoints (require authentication)
router.post('/auto-configure', authMiddleware, intelligenceIndexController.autoConfigureSources);

module.exports = router;