// Organization Routes - Handles ANY organization dynamically
const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Organization management
router.post('/create', organizationController.createOrganization);
router.get('/:id', organizationController.getOrganization);
router.get('/', organizationController.listOrganizations);

// Intelligence targets management  
router.post('/targets', organizationController.createIntelligenceTarget);
router.get('/:organizationId/targets', organizationController.getOrganizationTargets);

module.exports = router;