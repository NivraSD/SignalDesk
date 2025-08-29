/**
 * Source Index Routes
 * API endpoints for intelligent source indexing
 */

const express = require('express');
const router = express.Router();
const sourceIndexController = require('../controllers/sourceIndexController');

// Index a single entity
router.post('/index', sourceIndexController.indexEntity);

// Bulk index multiple entities
router.post('/bulk-index', sourceIndexController.bulkIndex);

// Search indexed sources
router.get('/search', sourceIndexController.searchIndexes);

// Get detailed index with all sources
router.get('/index/:indexId', sourceIndexController.getIndex);

// Get overall statistics
router.get('/statistics', sourceIndexController.getStatistics);

// Start continuous indexing
router.post('/continuous', sourceIndexController.startContinuousIndexing);

// Get job status
router.get('/job/:jobId', sourceIndexController.getJobStatus);

// Quick source discovery (preview without full indexing)
router.post('/discover', sourceIndexController.discoverSources);

// Get pre-built industry index
router.get('/industry/:industry', sourceIndexController.getIndustryIndex);

module.exports = router;