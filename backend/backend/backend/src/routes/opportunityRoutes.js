const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const opportunityController = require('../controllers/opportunityController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Analyze organization position with creative opportunities
router.post('/analyze-position', opportunityController.analyzePosition);

// Generate execution plan for selected opportunity
router.post('/generate-execution', opportunityController.generateExecutionPlan);

// Save opportunity analysis
router.post('/save-analysis', opportunityController.saveAnalysis);

// Get saved analyses
router.get('/organization/:organizationId', opportunityController.getAnalyses);

module.exports = router;