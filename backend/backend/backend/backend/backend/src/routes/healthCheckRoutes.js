// Comprehensive Health Check and Monitoring Routes
// This file provides detailed diagnostics for production debugging

const express = require("express");
const router = express.Router();
const db = require("../../config/database");

// Import Claude service safely
let claudeService;
let claudeStatus = { loaded: false, error: null };
try {
  claudeService = require("../../config/claude");
  claudeStatus.loaded = true;
} catch (error) {
  claudeStatus.error = error.message;
}

// Main health check endpoint - PUBLIC (no auth required for monitoring)
router.get('/health/detailed', async (req, res) => {
  console.log("🔍 Detailed health check requested");
  
  const health = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {}
  };

  // 1. Check Claude Service
  health.services.claude = {
    serviceLoaded: claudeStatus.loaded,
    loadError: claudeStatus.error,
    apiKeys: {
      ANTHROPIC_API_KEY: {
        exists: !!process.env.ANTHROPIC_API_KEY,
        length: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0,
        prefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 7) + '...' : null,
        isPlaceholder: process.env.ANTHROPIC_API_KEY === 'YOUR_NEW_CLAUDE_API_KEY_HERE'
      },
      CLAUDE_API_KEY: {
        exists: !!process.env.CLAUDE_API_KEY,
        length: process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.length : 0
      },
      CLAUDE_KEY: {
        exists: !!process.env.CLAUDE_KEY,
        length: process.env.CLAUDE_KEY ? process.env.CLAUDE_KEY.length : 0
      }
    },
    clientInitialized: false,
    testResult: null
  };

  // Test Claude API if service is loaded
  if (claudeService && claudeService.sendMessage) {
    health.services.claude.clientInitialized = !!claudeService.client;
    
    try {
      const testStart = Date.now();
      const response = await claudeService.sendMessage("Respond with exactly: 'CLAUDE_OK'");
      const responseTime = Date.now() - testStart;
      
      health.services.claude.testResult = {
        success: true,
        responseTime: responseTime + 'ms',
        response: response.substring(0, 100),
        isRealClaude: response.includes('CLAUDE_OK'),
        isMockResponse: response.includes('mock') || response.includes('fallback')
      };
    } catch (error) {
      health.services.claude.testResult = {
        success: false,
        error: error.message,
        errorType: error.constructor.name,
        status: error.status,
        isApiKeyError: error.message.includes('API key') || error.message.includes('authentication')
      };
    }
  }

  // 2. Check Database Connection
  health.services.database = {
    connected: false,
    error: null,
    responseTime: null
  };

  try {
    const dbStart = Date.now();
    const result = await db.query('SELECT NOW() as time, version() as version');
    health.services.database = {
      connected: true,
      responseTime: (Date.now() - dbStart) + 'ms',
      serverTime: result.rows[0].time,
      version: result.rows[0].version,
      error: null
    };
  } catch (error) {
    health.services.database.error = error.message;
    health.services.database.connected = false;
  }

  // 3. Check Critical Environment Variables
  health.configuration = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: !!process.env.DATABASE_URL,
    jwtSecret: !!process.env.JWT_SECRET,
    claudeModel: process.env.CLAUDE_MODEL || 'not-set',
    railwayEnvironment: {
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID ? 'set' : 'not-set',
      RAILWAY_SERVICE_ID: process.env.RAILWAY_SERVICE_ID ? 'set' : 'not-set'
    }
  };

  // 4. Check Routes Registration
  health.routes = {
    registeredCount: router.stack ? router.stack.length : 0,
    criticalRoutes: {
      '/api/crisis/analyze': checkRouteExists('/api/crisis/analyze'),
      '/api/content/ai-generate': checkRouteExists('/api/content/ai-generate'),
      '/api/media/search-reporters': checkRouteExists('/api/media/search-reporters'),
      '/api/campaigns/analyze': checkRouteExists('/api/campaigns/analyze'),
      '/api/claude-test': checkRouteExists('/api/claude-test')
    }
  };

  // 5. Overall Status
  const claudeWorking = health.services.claude.testResult?.success && 
                        health.services.claude.testResult?.isRealClaude;
  const dbWorking = health.services.database.connected;
  
  health.status = {
    overall: claudeWorking && dbWorking ? 'HEALTHY' : 'DEGRADED',
    claude: claudeWorking ? 'WORKING' : 'FAILING',
    database: dbWorking ? 'CONNECTED' : 'DISCONNECTED',
    criticalIssues: []
  };

  // Identify critical issues
  if (!claudeWorking) {
    if (!process.env.ANTHROPIC_API_KEY) {
      health.status.criticalIssues.push('ANTHROPIC_API_KEY not set in environment variables');
    } else if (process.env.ANTHROPIC_API_KEY === 'YOUR_NEW_CLAUDE_API_KEY_HERE') {
      health.status.criticalIssues.push('ANTHROPIC_API_KEY is still placeholder value');
    } else if (health.services.claude.testResult?.isApiKeyError) {
      health.status.criticalIssues.push('ANTHROPIC_API_KEY is invalid or expired');
    } else if (health.services.claude.testResult?.isMockResponse) {
      health.status.criticalIssues.push('Claude returning mock responses instead of real AI');
    }
  }

  if (!dbWorking) {
    health.status.criticalIssues.push('Database connection failed');
  }

  // Add recommendations
  health.recommendations = [];
  if (!claudeWorking) {
    health.recommendations.push('1. Go to Railway Dashboard > Variables');
    health.recommendations.push('2. Add ANTHROPIC_API_KEY with your actual API key from https://console.anthropic.com/');
    health.recommendations.push('3. Redeploy the service after adding the key');
  }

  res.json(health);
});

// Quick status endpoint for uptime monitoring
router.get('/health/status', async (req, res) => {
  let claudeOk = false;
  let dbOk = false;

  // Quick Claude check
  if (claudeService && claudeService.client) {
    claudeOk = true;
  }

  // Quick DB check
  try {
    await db.query('SELECT 1');
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const status = claudeOk && dbOk ? 'ok' : 'degraded';
  const httpStatus = status === 'ok' ? 200 : 503;

  res.status(httpStatus).json({
    status,
    services: {
      claude: claudeOk ? 'ok' : 'failing',
      database: dbOk ? 'ok' : 'failing'
    },
    timestamp: new Date().toISOString()
  });
});

// Test individual features
router.post('/health/test-feature', async (req, res) => {
  const { feature } = req.body;
  const results = {
    feature,
    timestamp: new Date().toISOString(),
    tests: []
  };

  switch(feature) {
    case 'crisis':
      results.tests.push(await testCrisisFeature());
      break;
    case 'content':
      results.tests.push(await testContentFeature());
      break;
    case 'media':
      results.tests.push(await testMediaFeature());
      break;
    case 'campaign':
      results.tests.push(await testCampaignFeature());
      break;
    default:
      results.error = 'Unknown feature. Use: crisis, content, media, or campaign';
  }

  res.json(results);
});

// Helper function to check if route exists
function checkRouteExists(path) {
  // This is a simplified check - in production you'd check the actual Express app
  return 'unknown';
}

// Test functions for each feature
async function testCrisisFeature() {
  const test = {
    name: 'Crisis Management',
    endpoint: '/api/crisis/analyze',
    result: 'untested'
  };

  if (!claudeService || !claudeService.sendMessage) {
    test.result = 'failed';
    test.error = 'Claude service not available';
    return test;
  }

  try {
    const response = await claudeService.sendMessage(
      'Generate a one-sentence crisis response for: data breach'
    );
    test.result = 'success';
    test.response = response.substring(0, 100);
    test.isRealResponse = !response.includes('mock') && !response.includes('fallback');
  } catch (error) {
    test.result = 'failed';
    test.error = error.message;
  }

  return test;
}

async function testContentFeature() {
  const test = {
    name: 'Content Generation',
    endpoint: '/api/content/ai-generate',
    result: 'untested'
  };

  if (!claudeService || !claudeService.sendMessage) {
    test.result = 'failed';
    test.error = 'Claude service not available';
    return test;
  }

  try {
    const response = await claudeService.sendMessage(
      'Write a one-sentence tagline for a PR platform'
    );
    test.result = 'success';
    test.response = response.substring(0, 100);
    test.isRealResponse = !response.includes('mock') && !response.includes('fallback');
  } catch (error) {
    test.result = 'failed';
    test.error = error.message;
  }

  return test;
}

async function testMediaFeature() {
  const test = {
    name: 'Media List Builder',
    endpoint: '/api/media/search-reporters',
    result: 'untested'
  };

  if (!claudeService || !claudeService.sendMessage) {
    test.result = 'failed';
    test.error = 'Claude service not available';
    return test;
  }

  try {
    const response = await claudeService.sendMessage(
      'Name one tech journalist (just the name, nothing else)'
    );
    test.result = 'success';
    test.response = response.substring(0, 100);
    test.isRealResponse = !response.includes('mock') && !response.includes('fallback');
  } catch (error) {
    test.result = 'failed';
    test.error = error.message;
  }

  return test;
}

async function testCampaignFeature() {
  const test = {
    name: 'Campaign Intelligence',
    endpoint: '/api/campaigns/analyze',
    result: 'untested'
  };

  if (!claudeService || !claudeService.sendMessage) {
    test.result = 'failed';
    test.error = 'Claude service not available';
    return test;
  }

  try {
    const response = await claudeService.sendMessage(
      'Name one PR campaign metric (just the metric name)'
    );
    test.result = 'success';
    test.response = response.substring(0, 100);
    test.isRealResponse = !response.includes('mock') && !response.includes('fallback');
  } catch (error) {
    test.result = 'failed';
    test.error = error.message;
  }

  return test;
}

module.exports = router;