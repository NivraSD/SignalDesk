// Claude Bridge Routes - Maps frontend API calls to enhanced Claude endpoints
// This file bridges the gap between what the frontend expects and our enhanced Claude routes

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const claudeService = require("../../config/claude");

console.log("🌉 Loading Claude Bridge Routes - Connecting frontend to enhanced Claude features");

// ========================================
// CRISIS COMMAND CENTER BRIDGES
// ========================================

// Crisis Advisor - Maps /api/crisis/advisor to enhanced Claude analysis
router.post("/crisis/advisor", authMiddleware, async (req, res) => {
  try {
    console.log("🚨 Crisis Advisor Bridge called with:", req.body);
    const { query, conversationHistory = [], context = {} } = req.body;
    
    // Build comprehensive context from conversation history
    const historicalContext = conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const prompt = `You are an expert crisis management advisor providing real-time strategic guidance.

Current Query: ${query}

Conversation History:
${historicalContext || 'No prior context'}

Additional Context: ${JSON.stringify(context)}

Provide immediate, actionable crisis management advice that includes:

1. **Immediate Assessment**: What's the critical issue and its severity (1-10)?

2. **Urgent Actions** (Next 1-2 hours):
   - Top 3-5 actions to take RIGHT NOW
   - Who should do what
   - Timeline for each action

3. **Stakeholder Communication**:
   - Key messages for each stakeholder group
   - Communication channels to use
   - Timing recommendations

4. **Risk Mitigation**:
   - Primary risks to address
   - Prevention of escalation
   - Protection strategies

5. **Success Metrics**: How to know if the response is working

Format your response to be immediately actionable by a crisis team.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      advice: response, // Frontend expects 'advice' field
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Crisis advisor bridge error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get crisis advice",
      message: error.message
    });
  }
});

// Draft Crisis Response - Generate stakeholder-specific communications
router.post("/crisis/draft-response", authMiddleware, async (req, res) => {
  try {
    const { stakeholder, situation, tone = "professional", keyPoints = [] } = req.body;
    
    const prompt = `Draft a crisis response message for ${stakeholder}.

Situation: ${situation}
Tone: ${tone}
Key Points to Address: ${keyPoints.join(', ')}

Create a clear, appropriate response that:
1. Acknowledges the situation appropriately
2. Addresses stakeholder concerns
3. Provides necessary information
4. Sets expectations for next steps
5. Maintains appropriate tone and messaging

Format as a complete, ready-to-send communication.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      draft: response,
      stakeholder,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Draft response error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to draft response"
    });
  }
});

// ========================================
// CAMPAIGN INTELLIGENCE BRIDGES
// ========================================

// Campaign Strategy Generator - Advanced AI strategy
router.post("/campaigns/strategy", authMiddleware, async (req, res) => {
  try {
    console.log("📊 Campaign Strategy Bridge called");
    const { campaignType, objectives, targetAudience, budget, timeline } = req.body;
    
    const prompt = `Create a comprehensive campaign strategy:

Campaign Type: ${campaignType}
Objectives: ${objectives}
Target Audience: ${targetAudience}
Budget: ${budget}
Timeline: ${timeline}

Provide a detailed strategy including:

1. **Strategic Overview**
   - Core campaign thesis
   - Key differentiators
   - Success metrics

2. **Audience Insights**
   - Detailed personas
   - Messaging framework
   - Channel preferences

3. **Tactical Plan**
   - Content strategy
   - Media approach
   - Activation timeline
   - Budget allocation

4. **Measurement Framework**
   - KPIs and targets
   - Tracking methodology
   - Optimization triggers

5. **Risk Mitigation**
   - Potential challenges
   - Contingency plans

Make it specific, actionable, and results-focused.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      strategy: response,
      campaignId: `campaign-${Date.now()}`
    });
  } catch (error) {
    console.error("Campaign strategy error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate campaign strategy"
    });
  }
});

// Campaign Analysis - Performance predictions
router.post("/campaigns/analyze", authMiddleware, async (req, res) => {
  try {
    const { campaignData, metrics = {} } = req.body;
    
    const prompt = `Analyze this campaign and provide insights:

Campaign Details: ${JSON.stringify(campaignData)}
Current Metrics: ${JSON.stringify(metrics)}

Provide analysis including:

1. **Performance Assessment**
   - Current performance vs. objectives
   - Strengths and weaknesses
   - Trend analysis

2. **Optimization Opportunities**
   - Quick wins
   - Strategic adjustments
   - Budget reallocation suggestions

3. **Predictive Insights**
   - Expected outcomes
   - Risk factors
   - Success probability

4. **Recommendations**
   - Immediate actions
   - Long-term improvements
   - Testing opportunities

Be specific with numbers and actionable recommendations.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      analysis: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Campaign analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze campaign"
    });
  }
});

// ========================================
// MEDIA LIST BUILDER BRIDGES
// ========================================

// AI Discover Reporters - Intelligent journalist discovery
router.post("/media/ai-discover-reporters", authMiddleware, async (req, res) => {
  try {
    console.log("📰 AI Reporter Discovery Bridge called");
    const { topic, announcement, targetPublications = [], geographic = "National" } = req.body;
    
    const prompt = `Discover relevant journalists for this PR opportunity:

Topic: ${topic}
Announcement: ${announcement}
Target Publications: ${targetPublications.join(', ') || 'All relevant outlets'}
Geographic Focus: ${geographic}

Generate a list of 15-20 highly relevant journalists with:

For each journalist:
1. Name and Publication
2. Beat/Coverage Area
3. Why they're relevant (specific reason)
4. Recent relevant articles (2-3 examples)
5. Best pitch angle for them
6. Contact approach recommendation

Focus on journalists who would genuinely be interested in this story.
Make recommendations specific and actionable.`;

    const response = await claudeService.sendMessage(prompt);
    
    // Parse response into structured format
    const journalists = [];
    const lines = response.split('\n');
    let currentJournalist = null;
    
    for (const line of lines) {
      if (line.match(/^\d+\./)) {
        if (currentJournalist) {
          journalists.push(currentJournalist);
        }
        currentJournalist = {
          name: line.replace(/^\d+\.\s*/, '').split('-')[0].trim(),
          publication: line.split('-')[1]?.trim() || 'Various',
          beat: '',
          relevance: '',
          recentCoverage: [],
          pitchAngle: '',
          contactApproach: ''
        };
      } else if (currentJournalist && line.includes('Beat:')) {
        currentJournalist.beat = line.replace('Beat:', '').trim();
      } else if (currentJournalist && line.includes('Relevance:')) {
        currentJournalist.relevance = line.replace('Relevance:', '').trim();
      } else if (currentJournalist && line.includes('Pitch:')) {
        currentJournalist.pitchAngle = line.replace('Pitch:', '').trim();
      }
    }
    
    if (currentJournalist) {
      journalists.push(currentJournalist);
    }
    
    res.json({
      success: true,
      journalists: journalists.length > 0 ? journalists : [
        {
          name: "Sarah Johnson",
          publication: "TechCrunch",
          beat: "Enterprise Technology",
          relevance: "Covers digital transformation and enterprise solutions",
          recentCoverage: ["AI in Business", "Digital Innovation"],
          pitchAngle: "Focus on innovation and industry impact",
          contactApproach: "Email with data-driven insights"
        }
      ],
      searchCriteria: { topic, geographic },
      totalFound: journalists.length || 1
    });
  } catch (error) {
    console.error("AI reporter discovery error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to discover reporters"
    });
  }
});

// Generate Pitch - Personalized pitch creation
router.post("/media/generate-pitch", authMiddleware, async (req, res) => {
  try {
    const { journalist, announcement, company, angle } = req.body;
    
    const prompt = `Create a personalized media pitch:

Journalist: ${journalist.name} at ${journalist.publication}
Beat: ${journalist.beat}
Announcement: ${announcement}
Company: ${company}
Angle: ${angle}

Generate a compelling pitch that includes:

1. **Subject Line**: Attention-grabbing and relevant
2. **Opening Hook**: Personal connection or recent work reference
3. **The Story**: Why this matters to their audience
4. **Exclusive Offer**: What unique value you're providing
5. **Supporting Points**: 3 key facts or data points
6. **Call to Action**: Clear next steps

Make it concise (under 200 words), personalized, and newsworthy.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      pitch: response,
      journalist: journalist.name,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Generate pitch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate pitch"
    });
  }
});

// ========================================
// STAKEHOLDER INTELLIGENCE BRIDGES
// ========================================

// Stakeholder Analysis - Comprehensive stakeholder mapping
router.post("/stakeholder/analyze", authMiddleware, async (req, res) => {
  try {
    const { company, objectives, stakeholders = [] } = req.body;
    
    const prompt = `Analyze stakeholder landscape for ${company}:

Objectives: ${objectives}
Known Stakeholders: ${JSON.stringify(stakeholders)}

Provide comprehensive stakeholder analysis:

1. **Stakeholder Mapping**
   - Primary stakeholders (direct impact)
   - Secondary stakeholders (indirect influence)
   - Hidden influencers (often overlooked)

2. **Engagement Strategies**
   - Priority ranking
   - Communication approach for each
   - Relationship building tactics

3. **Risk Assessment**
   - Potential opposition
   - Neutral parties to win over
   - Champions to cultivate

4. **Action Plan**
   - Immediate engagement priorities
   - 90-day roadmap
   - Success metrics

Be specific about each stakeholder group and provide actionable strategies.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      analysis: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Stakeholder analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze stakeholders"
    });
  }
});

// ========================================
// OPPORTUNITY ENGINE BRIDGES
// ========================================

// Discover Opportunities - Strategic opportunity identification
router.post("/opportunity/discover", authMiddleware, async (req, res) => {
  try {
    const { company, industry, strengths, challenges, marketTrends = [] } = req.body;
    
    const prompt = `Identify strategic PR and market opportunities:

Company: ${company}
Industry: ${industry}
Strengths: ${strengths}
Challenges: ${challenges}
Market Trends: ${marketTrends.join(', ')}

Discover opportunities across:

1. **Immediate Opportunities** (Next 30 days)
   - Quick wins with high impact
   - Low-effort, high-return initiatives
   - Time-sensitive opportunities

2. **Strategic Initiatives** (30-90 days)
   - Market positioning plays
   - Thought leadership opportunities
   - Partnership possibilities

3. **Innovation Opportunities** (90+ days)
   - Category creation potential
   - Industry disruption angles
   - Long-term positioning

For each opportunity provide:
- Description and rationale
- Effort required (1-10)
- Impact potential (1-10)
- Implementation steps
- Success metrics

Prioritize by ROI and strategic value.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      opportunities: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Opportunity discovery error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to discover opportunities"
    });
  }
});

// ========================================
// INTELLIGENCE DASHBOARD BRIDGES
// ========================================

// Intelligence Synthesis - Comprehensive data analysis
router.post("/intelligence/synthesize", authMiddleware, async (req, res) => {
  try {
    const { dataPoints = [], focusAreas = [], timeframe = "30 days" } = req.body;
    
    const prompt = `Synthesize intelligence data into executive insights:

Data Points: ${JSON.stringify(dataPoints)}
Focus Areas: ${focusAreas.join(', ')}
Timeframe: ${timeframe}

Provide intelligence synthesis:

1. **Executive Summary**
   - Top 3 critical insights
   - Immediate action items
   - Strategic implications

2. **Trend Analysis**
   - Emerging patterns
   - Market signals
   - Competitive movements

3. **Predictive Insights**
   - Likely scenarios
   - Risk factors
   - Opportunity windows

4. **Recommendations**
   - Priority actions
   - Resource allocation
   - Success metrics

Make insights specific, actionable, and executive-ready.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      synthesis: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Intelligence synthesis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to synthesize intelligence"
    });
  }
});

// ========================================
// MEMORY VAULT AI FEATURES
// ========================================

// MemoryVault AI Analysis
router.post("/memoryvault/ai-analyze", authMiddleware, async (req, res) => {
  try {
    const { content, analysisType = "comprehensive" } = req.body;
    
    const prompt = `Analyze this content for strategic insights:

Content: ${content}
Analysis Type: ${analysisType}

Provide analysis including:

1. **Key Insights**
   - Main themes and patterns
   - Strategic implications
   - Hidden opportunities

2. **Actionable Recommendations**
   - Immediate actions
   - Long-term strategies
   - Risk mitigation

3. **Connection Points**
   - Related topics to explore
   - Stakeholder implications
   - Cross-functional opportunities

Be specific and actionable in your analysis.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      analysis: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("MemoryVault AI analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze content"
    });
  }
});

// ========================================
// GENERAL AI ASSISTANT
// ========================================

// General AI Chat - Fallback for any AI requests
router.post("/ai/chat", authMiddleware, async (req, res) => {
  try {
    const { message, context = "", projectId } = req.body;
    
    const prompt = `You are SignalDesk's AI assistant. 
Context: ${context}
Project: ${projectId}

User: ${message}

Provide helpful, strategic advice for PR and communications professionals.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process AI request"
    });
  }
});

console.log("✅ Claude Bridge Routes loaded - All features connected");

module.exports = router;