// Deployment monitoring and diagnostics
const express = require('express');
const router = express.Router();

// Real-time monitoring endpoint
router.get('/monitor/live', async (req, res) => {
  let claudeService;
  try {
    claudeService = require('../../config/claude');
  } catch (error) {
    // Service not available
  }
  
  const monitor = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY: !!process.env.RAILWAY_ENVIRONMENT,
      DEPLOYED_AT: process.env.RAILWAY_DEPLOYMENT_ID
    },
    claude: {
      keyPresent: !!process.env.ANTHROPIC_API_KEY,
      keyValid: process.env.ANTHROPIC_API_KEY && 
                process.env.ANTHROPIC_API_KEY !== 'YOUR_NEW_CLAUDE_API_KEY_HERE',
      serviceLoaded: !!claudeService,
      clientInitialized: !!(claudeService && claudeService.client)
    },
    activeRoutes: {
      crisis: 'ACTIVE - /api/crisis/*',
      content: 'ACTIVE - /api/content/*',
      media: 'ACTIVE - /api/media/*',
      campaigns: 'ACTIVE - /api/campaigns/*'
    },
    lastRequests: global.lastRequests || []
  };
  
  // Test Claude live
  if (claudeService && claudeService.sendMessage) {
    try {
      const start = Date.now();
      const response = await claudeService.sendMessage('Say "WORKING"');
      monitor.claude.liveTest = {
        success: true,
        responseTime: Date.now() - start,
        isReal: response.includes('WORKING')
      };
    } catch (error) {
      monitor.claude.liveTest = {
        success: false,
        error: error.message
      };
    }
  }
  
  res.json(monitor);
});

// Request logging middleware
router.use((req, res, next) => {
  if (!global.lastRequests) {
    global.lastRequests = [];
  }
  
  global.lastRequests.unshift({
    time: new Date().toISOString(),
    method: req.method,
    path: req.path,
    hasAuth: !!req.headers.authorization
  });
  
  // Keep only last 20 requests
  if (global.lastRequests.length > 20) {
    global.lastRequests.pop();
  }
  
  next();
});

module.exports = router;