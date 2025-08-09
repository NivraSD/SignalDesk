// Claude Integration Test Route
// This file provides a simple endpoint to test if Claude API is working

const express = require("express");
const router = express.Router();

// Import Claude service
let claudeService;
try {
  claudeService = require("../../config/claude");
} catch (error) {
  console.error("Failed to load Claude service:", error);
  claudeService = null;
}

// Test endpoint - no auth required for easy testing
router.get('/claude-test', async (req, res) => {
  console.log("🧪 Claude test endpoint called");
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    claudeServiceLoaded: !!claudeService,
    apiKeyStatus: {
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      CLAUDE_API_KEY: !!process.env.CLAUDE_API_KEY,
      CLAUDE_KEY: !!process.env.CLAUDE_KEY
    }
  };
  
  // Try to make a simple Claude API call
  if (claudeService && claudeService.sendMessage) {
    try {
      console.log("Attempting Claude API call...");
      const testPrompt = "Say 'Claude is working!' in exactly 5 words.";
      const response = await claudeService.sendMessage(testPrompt);
      
      diagnostics.claudeApiTest = {
        success: true,
        response: response,
        responseLength: response.length,
        isRealClaude: !response.includes("fallback") && !response.includes("mock")
      };
      
      console.log("Claude API call successful!");
    } catch (error) {
      console.error("Claude API call failed:", error);
      diagnostics.claudeApiTest = {
        success: false,
        error: error.message,
        errorType: error.constructor.name,
        status: error.status || 'unknown'
      };
    }
  } else {
    diagnostics.claudeApiTest = {
      success: false,
      error: "Claude service not initialized",
      reason: "Missing API key or service failed to load"
    };
  }
  
  // Determine overall status
  const isWorking = diagnostics.claudeApiTest && diagnostics.claudeApiTest.success && diagnostics.claudeApiTest.isRealClaude;
  
  res.json({
    success: true,
    claudeIntegrationWorking: isWorking,
    message: isWorking 
      ? "✅ Claude AI integration is WORKING! Real AI responses are being generated."
      : "❌ Claude AI integration is NOT working. Check API key configuration.",
    diagnostics,
    nextSteps: isWorking ? [] : [
      "1. Verify ANTHROPIC_API_KEY is set in Railway environment variables",
      "2. Ensure the API key is valid and has credits",
      "3. Check Railway logs for any error messages",
      "4. Redeploy after setting the environment variable"
    ]
  });
});

// Test specific endpoints
router.post('/claude-test/crisis', async (req, res) => {
  console.log("🧪 Testing Crisis endpoint with Claude");
  
  if (!claudeService || !claudeService.sendMessage) {
    return res.json({
      success: false,
      message: "Claude service not available",
      usingFallback: true,
      response: "This would be mock crisis advice since Claude is not configured."
    });
  }
  
  try {
    const prompt = `Generate a brief crisis response plan for: "Product recall due to safety concerns"
    
    Provide 3 immediate actions and 2 communication priorities in a concise format.`;
    
    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      message: "Claude Crisis test successful",
      usingClaude: true,
      response,
      isRealResponse: !response.includes("mock") && !response.includes("fallback")
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Claude API call failed",
      error: error.message,
      usingFallback: true
    });
  }
});

router.post('/claude-test/content', async (req, res) => {
  console.log("🧪 Testing Content endpoint with Claude");
  
  if (!claudeService || !claudeService.sendMessage) {
    return res.json({
      success: false,
      message: "Claude service not available",
      usingFallback: true,
      response: "This would be mock content since Claude is not configured."
    });
  }
  
  try {
    const prompt = "Write a 2-sentence press release headline about launching an AI-powered PR platform.";
    
    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      message: "Claude Content test successful",
      usingClaude: true,
      response,
      isRealResponse: !response.includes("mock") && !response.includes("fallback")
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Claude API call failed",
      error: error.message,
      usingFallback: true
    });
  }
});

router.post('/claude-test/media', async (req, res) => {
  console.log("🧪 Testing Media endpoint with Claude");
  
  if (!claudeService || !claudeService.sendMessage) {
    return res.json({
      success: false,
      message: "Claude service not available",
      usingFallback: true,
      response: "This would be mock journalist data since Claude is not configured."
    });
  }
  
  try {
    const prompt = `Create ONE fictional journalist profile for tech reporting. Include:
    - Name
    - Publication  
    - Beat
    - Email
    - Brief bio (1 sentence)
    
    Format as JSON.`;
    
    const response = await claudeService.sendMessage(prompt);
    
    let journalist;
    try {
      journalist = JSON.parse(response);
    } catch {
      journalist = { raw: response };
    }
    
    res.json({
      success: true,
      message: "Claude Media test successful",
      usingClaude: true,
      response: journalist,
      isRealResponse: !response.includes("mock") && !response.includes("fallback")
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Claude API call failed",
      error: error.message,
      usingFallback: true
    });
  }
});

module.exports = router;