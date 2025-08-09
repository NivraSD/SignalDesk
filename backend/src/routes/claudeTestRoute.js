// Claude Test Route - Direct test endpoint for verifying Claude integration
const express = require('express');
const router = express.Router();

// Import Claude service
let claudeService;
try {
  claudeService = require('../../config/claude');
} catch (error) {
  console.error('Claude service import failed:', error);
}

// Public test endpoint - no auth required for testing
router.get('/claude-test', async (req, res) => {
  console.log('🧪 Claude test endpoint called');
  
  const testResult = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    claudeServiceLoaded: !!claudeService,
    apiKeyStatus: {
      ANTHROPIC_API_KEY: {
        present: !!process.env.ANTHROPIC_API_KEY,
        length: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0,
        isPlaceholder: process.env.ANTHROPIC_API_KEY === 'YOUR_NEW_CLAUDE_API_KEY_HERE',
        prefix: process.env.ANTHROPIC_API_KEY ? 
                process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...' : 
                'NOT SET'
      }
    },
    test: null
  };
  
  // Only test if service is available and API key is set
  if (claudeService && claudeService.sendMessage && 
      process.env.ANTHROPIC_API_KEY && 
      process.env.ANTHROPIC_API_KEY !== 'YOUR_NEW_CLAUDE_API_KEY_HERE') {
    
    try {
      console.log('Testing Claude with simple prompt...');
      const startTime = Date.now();
      
      const response = await claudeService.sendMessage(
        'Respond with exactly this text: "Claude is working correctly on SignalDesk"'
      );
      
      const endTime = Date.now();
      
      testResult.test = {
        success: true,
        responseTime: `${endTime - startTime}ms`,
        response: response.substring(0, 200),
        isWorkingCorrectly: response.includes('Claude is working correctly'),
        isMockData: response.includes('mock') || response.includes('fallback')
      };
      
      console.log('✅ Claude test successful');
    } catch (error) {
      console.error('❌ Claude test failed:', error.message);
      testResult.test = {
        success: false,
        error: error.message,
        errorType: error.constructor.name,
        statusCode: error.status || null,
        isAuthError: error.message.includes('API key') || 
                     error.message.includes('authentication') ||
                     error.message.includes('401')
      };
    }
  } else {
    testResult.test = {
      success: false,
      error: 'Claude service not available or API key not configured',
      serviceLoaded: !!claudeService,
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
      keyIsPlaceholder: process.env.ANTHROPIC_API_KEY === 'YOUR_NEW_CLAUDE_API_KEY_HERE'
    };
  }
  
  // Determine overall status
  if (testResult.test?.success && testResult.test?.isWorkingCorrectly) {
    testResult.status = '✅ CLAUDE IS WORKING';
    testResult.message = 'Claude AI is properly configured and responding with real AI-generated content.';
  } else if (testResult.test?.success && testResult.test?.isMockData) {
    testResult.status = '⚠️ MOCK DATA DETECTED';
    testResult.message = 'Claude is responding but returning mock/fallback data instead of real AI responses.';
  } else if (testResult.test?.isAuthError) {
    testResult.status = '❌ AUTHENTICATION ERROR';
    testResult.message = 'Claude API key is invalid or expired. Please check your ANTHROPIC_API_KEY.';
  } else if (!testResult.apiKeyStatus.ANTHROPIC_API_KEY.present) {
    testResult.status = '❌ API KEY MISSING';
    testResult.message = 'ANTHROPIC_API_KEY is not set. Add it in Railway Dashboard > Variables.';
  } else if (testResult.apiKeyStatus.ANTHROPIC_API_KEY.isPlaceholder) {
    testResult.status = '❌ PLACEHOLDER KEY';
    testResult.message = 'ANTHROPIC_API_KEY is still the placeholder value. Set the real key in Railway.';
  } else {
    testResult.status = '❌ CLAUDE NOT WORKING';
    testResult.message = 'Claude service is not functioning. Check logs for details.';
  }
  
  res.json(testResult);
});

// Test with custom prompt
router.post('/claude-test', async (req, res) => {
  const { prompt = 'Say hello' } = req.body;
  
  if (!claudeService || !claudeService.sendMessage) {
    return res.status(503).json({
      success: false,
      error: 'Claude service not available',
      message: 'Check ANTHROPIC_API_KEY configuration'
    });
  }
  
  try {
    const response = await claudeService.sendMessage(prompt);
    res.json({
      success: true,
      prompt,
      response,
      isMockData: response.includes('mock') || response.includes('fallback'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      prompt,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;