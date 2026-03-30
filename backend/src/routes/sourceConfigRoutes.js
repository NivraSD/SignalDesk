// Source Configuration Routes - For dynamically configuring sources for ANY organization
const express = require('express');
const router = express.Router();
const sourceConfigController = require('../controllers/sourceConfigController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware
router.use(authMiddleware);

// Configure sources for an organization
router.post('/configure-sources', sourceConfigController.configureSources);

// Get configured sources for an organization
router.get('/sources/:organizationId', sourceConfigController.getOrganizationSources);

// Trigger immediate monitoring
router.post('/trigger', sourceConfigController.triggerMonitoring);

module.exports = router;