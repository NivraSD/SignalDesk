// TEST ENDPOINT - Verify deployment
const express = require('express');
const router = express.Router();

router.get('/test-deployment', (req, res) => {
  res.json({
    message: 'COMPLETE_CLAUDE_FIX is deployed!',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/test-deployment (this endpoint)',
      '/api/media/search-journalists',
      '/api/crisis/generate-plan',
      '/api/content/analyze',
      '/api/campaigns/analyze'
    ]
  });
});

module.exports = router;