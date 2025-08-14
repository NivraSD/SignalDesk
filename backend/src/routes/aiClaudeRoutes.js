// AI Claude Routes - Main Claude API endpoints for frontend integration
const express = require("express");
const router = express.Router();

// Import Claude service
let claudeService;
try {
  claudeService = require("../../config/claude");
  console.log("✅ Claude service loaded successfully for AI routes");
} catch (error) {
  console.error("❌ Claude service not available:", error.message);
  claudeService = null;
}

// Main Claude message endpoint - used by frontend claudeService.js
router.post("/ai/claude/message", async (req, res) => {
  try {
    const { prompt, model, maxTokens, temperature, ...options } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required"
      });
    }

    console.log("📨 Claude message request received");
    console.log("  Prompt length:", prompt.length);
    console.log("  Model:", model || "default");

    // Check if Claude service is available
    if (!claudeService || !claudeService.sendMessage) {
      console.warn("⚠️ Claude service not available, using fallback response");
      
      // Intelligent fallback based on prompt content
      let fallbackResponse;
      
      if (prompt.toLowerCase().includes('opportunity concepts') || prompt.toLowerCase().includes('nvs')) {
        fallbackResponse = [
          {
            id: 1,
            name: "AI Ethics Leadership Position",
            type: "thought_leadership",
            nvsScore: 85,
            timeSensitivity: "immediate",
            resourceRequirement: "medium",
            riskLevel: "moderate",
            targetAudience: "Technology journalists and policy makers",
            coreMessage: "Position as the ethical AI leader while competitors focus on capabilities",
            description: "Capitalize on the narrative vacuum around AI ethics.",
            executionPreview: "Thought leadership article + Congressional testimony + Media interviews"
          },
          {
            id: 2,
            name: "Privacy-First Cloud Alternative",
            type: "differentiation",
            nvsScore: 78,
            timeSensitivity: "this_week",
            resourceRequirement: "high",
            riskLevel: "bold",
            targetAudience: "Enterprise technology buyers and analysts",
            coreMessage: "Challenge big tech on privacy while competitors avoid the topic",
            description: "Launch privacy-focused cloud positioning.",
            executionPreview: "Product announcement + Analyst briefings + Trade media campaign"
          }
        ];
      } else if (prompt.toLowerCase().includes('execution plan')) {
        fallbackResponse = `COMPREHENSIVE EXECUTION PLAN

**Content Strategy:**
1. Primary Content: Thought leadership article, Executive interview talking points, Social media calendar
2. Supporting Materials: Press release, FAQ document, Visual assets

**Media Strategy:**
- Tier 1 Targets: Wall Street Journal, New York Times, Reuters
- Tier 2 Targets: TechCrunch, Wired, Fast Company
- Tier 3 Targets: Industry trade publications

**Timeline:**
- Week 1: Content creation and internal approval
- Week 2: Media outreach and journalist briefings
- Week 3: Publication and amplification
- Week 4: Follow-up and opportunity assessment

**Success Metrics:**
- Media impressions: 50M+ target
- Tier 1 placements: 3+ secured
- Social engagement: 10K+ interactions`;
      } else {
        fallbackResponse = "Claude API is currently unavailable. Please check your API configuration.";
      }

      return res.json({
        success: true,
        message: fallbackResponse,
        content: fallbackResponse,
        fallback: true
      });
    }

    // Call Claude service
    const response = await claudeService.sendMessage(prompt, [], {
      maxTokens: maxTokens || 4096,
      temperature: temperature || 0.7,
      ...options
    });

    console.log("✅ Claude response received, length:", response.length);

    // Return response in expected format
    res.json({
      success: true,
      message: response,
      content: response,
      usage: {
        prompt_tokens: Math.ceil(prompt.length / 4),
        completion_tokens: Math.ceil(response.length / 4),
        total_tokens: Math.ceil((prompt.length + response.length) / 4)
      }
    });

  } catch (error) {
    console.error("❌ Claude API error:", error);
    
    // Return error with fallback suggestion
    res.status(500).json({
      success: false,
      error: error.message,
      suggestion: "Claude API is temporarily unavailable. Please check your ANTHROPIC_API_KEY configuration.",
      fallback: true
    });
  }
});

// Health check endpoint for Claude
router.get("/ai/claude/health", async (req, res) => {
  const isConfigured = claudeService && claudeService.sendMessage;
  const hasApiKey = process.env.ANTHROPIC_API_KEY && 
                    process.env.ANTHROPIC_API_KEY !== 'sk-ant-api03-placeholder-key-for-testing';

  res.json({
    success: true,
    service: "Claude AI",
    status: isConfigured && hasApiKey ? "operational" : "degraded",
    configured: isConfigured,
    hasValidApiKey: hasApiKey,
    model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022",
    message: isConfigured && hasApiKey 
      ? "Claude service is operational" 
      : "Claude service needs configuration - set ANTHROPIC_API_KEY"
  });
});

// Analyze opportunity endpoint
router.post("/ai/claude/analyze-opportunity", async (req, res) => {
  try {
    const { opportunityData } = req.body;

    if (!opportunityData) {
      return res.status(400).json({
        success: false,
        error: "Opportunity data is required"
      });
    }

    const prompt = `Analyze this PR opportunity using the Narrative Vacuum Score (NVS) framework:

${JSON.stringify(opportunityData, null, 2)}

Provide:
1. NVS Score (1-100)
2. Key opportunity elements
3. Execution recommendations
4. Risk assessment`;

    if (!claudeService || !claudeService.sendMessage) {
      // Return mock analysis
      return res.json({
        success: true,
        analysis: {
          nvsScore: 75,
          elements: ["High media interest", "Low competitor activity", "Strong narrative potential"],
          recommendations: ["Move quickly", "Focus on exclusive angles", "Prepare supporting data"],
          riskLevel: "moderate"
        },
        fallback: true
      });
    }

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      analysis: response
    });

  } catch (error) {
    console.error("Opportunity analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate execution plan endpoint
router.post("/ai/claude/execution-plan", async (req, res) => {
  try {
    const { concept, organizationContext } = req.body;

    if (!concept) {
      return res.status(400).json({
        success: false,
        error: "Concept is required"
      });
    }

    const prompt = `Create detailed execution plan for this opportunity concept:

Concept: ${JSON.stringify(concept, null, 2)}
Organization: ${organizationContext || 'General organization'}

Include:
1. Content strategy and materials needed
2. Media targeting approach
3. Timeline and milestones
4. SignalDesk platform integration points
5. Success metrics and KPIs`;

    if (!claudeService || !claudeService.sendMessage) {
      // Return mock execution plan
      return res.json({
        success: true,
        plan: {
          contentStrategy: "Create thought leadership content, press releases, and social media posts",
          mediaTargeting: "Focus on tier 1 tech publications and industry analysts",
          timeline: "4-week campaign with weekly milestones",
          integration: "Use SignalDesk for monitoring, content generation, and campaign tracking",
          metrics: "Track media impressions, engagement rates, and lead generation"
        },
        fallback: true
      });
    }

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      plan: response
    });

  } catch (error) {
    console.error("Execution plan error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;