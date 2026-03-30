/**
 * OPPORTUNITY ORCHESTRATOR ROUTES
 * API endpoints for the optimized research orchestration system
 */

const express = require('express');
const router = express.Router();
const orchestratorController = require('../controllers/opportunityOrchestratorController');

// Main opportunity discovery with optimization
router.post('/discover', orchestratorController.discoverOpportunitiesOptimized);

// Analyze agent performance
router.get('/performance/:organizationId', orchestratorController.analyzeAgentPerformance);

// Optimize workflow for specific needs
router.post('/optimize-workflow', orchestratorController.optimizeWorkflow);

// Test workflow with sample data
router.post('/test-workflow', orchestratorController.testWorkflow);

// Get real-time optimization suggestions
router.post('/suggestions', orchestratorController.getOptimizationSuggestions);

module.exports = router;