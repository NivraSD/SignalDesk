// Claude Diagnostics Routes
const express = require('express');
const router = express.Router();
const claudeDiagnosticsController = require('../controllers/claudeDiagnosticsController');

// Public diagnostic endpoints (no auth required for testing)
router.get('/test', claudeDiagnosticsController.testConnection);
router.get('/test-all', claudeDiagnosticsController.testAllFeatures);
router.get('/test/:feature', claudeDiagnosticsController.testFeature);
router.get('/config', claudeDiagnosticsController.getConfig);

module.exports = router;