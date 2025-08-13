// TEST ENDPOINT - Verify deployment
const express = require('express');
const router = express.Router();

router.get('/test-deployment', (req, res) => {
  res.json({
    message: 'Working Claude Fix is deployed!',
    timestamp: new Date().toISOString(),
    version: 'simplified-working-version'
  });
});

module.exports = router;