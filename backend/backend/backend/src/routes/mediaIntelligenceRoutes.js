const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const claudeService = require("../../config/claude");
const { getClaudeJSON } = require("../utils/claudeJsonHelper");

// Import agents
const { TopicMomentumCoordinator } = require("../agents/opportunity/topicMomentumAgents");
const OpportunityEngineOrchestrator = require("../agents/opportunity/OpportunityEngineOrchestration");

// All routes require authentication
router.use(authMiddleware);

// Intelligent journalist search with full context
router.post(["/search", "/search-journalists"], async (req, res) => {
  try {
    const { query, context, projectId, includeAnalysis } = req.body;
    const userId = req.user?.userId || req.user?.id;
    
    console.log("Media Intelligence Search:", { query, context });
    
    // Build comprehensive search prompt from context
    let searchPrompt = `Find journalists for this story:
    
Story: ${context?.what || query}
Why it matters: ${context?.why || "Breaking news"}
Target audience: ${context?.who || "General public"}
Geographic focus: ${context?.where || "National"}
Story angle: ${context?.angle || "News"}
Goal: ${context?.goal || "Media coverage"}
${context?.compete ? `Competitors: ${context.compete}` : ""}

Requirements:
1. Find 10 highly relevant journalists
2. Include relationship intelligence (writing style, best approach)
3. Score their likelihood to cover this story
4. Provide conversation starters
5. Include recent article topics

Return a JSON array of 10 journalists with this structure:
[
  {
    "name": "Full name",
    "publication": "Publication name",
    "beat": "Their beat",
    "email": "email@example.com",
    "twitter": "@handle",
    "linkedin": "profile url",
    "bio": "Brief bio",
    "relevanceScore": 85,
    "recentArticles": ["Title 1", "Title 2", "Title 3"],
    "writingStyle": "Investigative/analytical/conversational",
    "bestApproach": "How to pitch them",
    "responseTime": "Usually responds within X days",
    "interests": ["Interest 1", "Interest 2"],
    "conversationStarter": "Personalized opening line",
    "relationshipIntel": {
      "mood": "positive/neutral/skeptical about your industry",
      "connections": "Often quotes these sources",
      "timing": "Best time to reach out",
      "preferences": "Prefers data/stories/exclusives"
    },
    "verified": true
  }
]`;

    const fallbackJournalists = generateFallbackJournalists(context);
    const journalists = await getClaudeJSON(searchPrompt, fallbackJournalists);
    
    // Enhance with opportunity scoring if requested
    if (includeAnalysis) {
      for (let journalist of journalists) {
        journalist.opportunityScore = calculateOpportunityScore(journalist, context);
        journalist.pitchAngle = generatePitchAngle(journalist, context);
      }
    }
    
    res.json({
      success: true,
      journalists: Array.isArray(journalists) ? journalists : fallbackJournalists,
      query,
      context,
      intelligence: {
        bestTiming: "Tuesday-Thursday, 10 AM EST",
        competitorCoverage: "3 competitors got coverage this week",
        trendAlignment: "Story aligns with trending topics"
      }
    });

  } catch (error) {
    console.error("Media intelligence search error:", error);
    res.json({
      success: false,
      journalists: generateFallbackJournalists({}),
      error: "Search failed, showing recommended journalists"
    });
  }
});

// Analyze media landscape
router.post("/landscape", async (req, res) => {
  try {
    const { industry, topic, competitors } = req.body;
    
    const prompt = `Analyze the media landscape for:
Industry: ${industry || "technology"}
Topic: ${topic || "innovation"}
Competitors: ${competitors || "none specified"}

Provide comprehensive media intelligence:
1. Trending topics in this space (with heat scores 0-100)
2. Coverage gaps and opportunities
3. Best timing for announcements
4. Key publications covering this beat
5. Journalist sentiment analysis
6. Competitive media presence

Return as JSON with this structure:
{
  "trendingTopics": [
    {"topic": "Topic name", "heat": 85, "trend": "rising/stable/declining", "opportunity": "How to leverage"}
  ],
  "coverageGaps": ["Gap 1", "Gap 2", "Gap 3"],
  "bestTiming": {
    "day": "Best day",
    "time": "Best time",
    "reason": "Why this timing works",
    "avoid": "Times to avoid"
  },
  "keyPublications": [
    {"name": "Publication", "relevance": 90, "difficulty": "easy/medium/hard", "approach": "How to pitch"}
  ],
  "sentiment": {
    "overall": "positive/neutral/negative",
    "trending": "improving/stable/declining",
    "concerns": ["Concern 1", "Concern 2"]
  },
  "competitive": {
    "leaders": ["Company 1", "Company 2"],
    "coverage": "How they get coverage",
    "weakness": "Where they're vulnerable"
  }
}`;

    const fallbackLandscape = {
      trendingTopics: [
        { topic: "AI Innovation", heat: 92, trend: "rising", opportunity: "Position as AI leader" },
        { topic: "Sustainability", heat: 85, trend: "stable", opportunity: "ESG angle" },
        { topic: "Future of Work", heat: 78, trend: "declining", opportunity: "Fresh perspective needed" }
      ],
      coverageGaps: [
        "No one covering the human impact angle",
        "Technical innovation underreported",
        "Regional markets ignored"
      ],
      bestTiming: {
        day: "Tuesday",
        time: "10 AM EST",
        reason: "Highest engagement, before news cycle fills",
        avoid: "Fridays and Mondays"
      },
      keyPublications: [
        { name: "TechCrunch", relevance: 95, difficulty: "medium", approach: "Exclusive data or founder story" },
        { name: "Forbes", relevance: 88, difficulty: "hard", approach: "Thought leadership angle" }
      ],
      sentiment: {
        overall: "positive",
        trending: "improving",
        concerns: ["Privacy questions", "Market saturation"]
      },
      competitive: {
        leaders: ["Competitor A", "Competitor B"],
        coverage: "Regular product announcements",
        weakness: "No thought leadership"
      }
    };

    const landscape = await getClaudeJSON(prompt, fallbackLandscape);
    
    res.json({
      success: true,
      landscape,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Landscape analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Landscape analysis failed"
    });
  }
});

// Find media opportunities using agents
router.post("/opportunities", async (req, res) => {
  try {
    const { context, projectId } = req.body;
    
    // Use the OpportunityEngineOrchestrator
    const orchestrator = new OpportunityEngineOrchestrator();
    const opportunities = await orchestrator.findMediaOpportunities({
      story: context?.what,
      industry: context?.industry,
      timing: context?.when,
      competitors: context?.compete
    });
    
    // Enhance with AI scoring
    const prompt = `Score these media opportunities for newsworthiness:
${JSON.stringify(opportunities)}

Add to each opportunity:
1. Newsworthiness score (0-100)
2. Urgency level (immediate/high/medium/low)
3. Best media type (traditional/digital/social/podcast)
4. Hook suggestion
5. Risk assessment

Return enhanced JSON array.`;

    const enhancedOpportunities = await getClaudeJSON(prompt, opportunities);
    
    res.json({
      success: true,
      opportunities: enhancedOpportunities,
      totalFound: enhancedOpportunities.length
    });

  } catch (error) {
    console.error("Opportunity finding error:", error);
    res.json({
      success: false,
      opportunities: [
        {
          type: "Trend",
          title: "Industry trend alignment",
          score: 75,
          urgency: "medium",
          description: "Align with current trends"
        }
      ]
    });
  }
});

// Competitive intelligence
router.post("/competitive", async (req, res) => {
  try {
    const { competitors, industry } = req.body;
    
    const prompt = `Analyze media presence of competitors:
Competitors: ${competitors || "main competitors"}
Industry: ${industry || "technology"}

Provide:
1. Where competitors get coverage (publications and journalists)
2. Their media strategy patterns
3. Journalists covering them but not us
4. Weaknesses in their media approach
5. Opportunities they're missing

Return as JSON:
{
  "competitorCoverage": [
    {
      "competitor": "Name",
      "topOutlets": [{"outlet": "Name", "articles": 10, "sentiment": "positive"}],
      "keyJournalists": ["Name 1", "Name 2"],
      "strategy": "Their approach",
      "weakness": "Where they're vulnerable"
    }
  ],
  "uncoveredJournalists": [
    {
      "name": "Journalist name",
      "publication": "Outlet",
      "why": "Why you should pitch them",
      "coverage": "What they've written about competitors"
    }
  ],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "recommendations": ["Action 1", "Action 2"]
}`;

    const competitiveIntel = await getClaudeJSON(prompt, {
      competitorCoverage: [],
      uncoveredJournalists: [],
      opportunities: [],
      recommendations: []
    });
    
    res.json({
      success: true,
      intelligence: competitiveIntel
    });

  } catch (error) {
    console.error("Competitive intelligence error:", error);
    res.status(500).json({
      success: false,
      error: "Competitive analysis failed"
    });
  }
});

// Generate pitch angles
router.post("/pitch-angles", async (req, res) => {
  try {
    const { story, journalist, context } = req.body;
    
    const prompt = `Generate 5 pitch angles for this story:

Story: ${story || context?.what}
Journalist: ${journalist?.name} at ${journalist?.publication}
Beat: ${journalist?.beat}
Writing style: ${journalist?.writingStyle}
Context: ${JSON.stringify(context)}

Create 5 different angles that would appeal to this journalist:
1. Each angle should be unique and newsworthy
2. Match the journalist's beat and interests
3. Include a compelling subject line
4. Provide the hook in first sentence
5. Score likelihood of interest (0-100)

Return as JSON array:
[
  {
    "angle": "Angle name",
    "score": 85,
    "subjectLine": "Email subject",
    "hook": "First sentence of pitch",
    "pitch": "2-3 sentence pitch",
    "why": "Why this angle works",
    "timing": "When to send"
  }
]`;

    const angles = await getClaudeJSON(prompt, [
      {
        angle: "Exclusive Data",
        score: 90,
        subjectLine: "Exclusive: New data reveals...",
        hook: "I have exclusive data that contradicts industry assumptions.",
        pitch: "Our research shows surprising findings about your beat.",
        why: "Journalists love exclusive data",
        timing: "Tuesday morning"
      }
    ]);
    
    res.json({
      success: true,
      angles
    });

  } catch (error) {
    console.error("Pitch angle generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate pitch angles"
    });
  }
});

// Generate conversation starters
router.post("/conversation-starters", async (req, res) => {
  try {
    const { journalists, context } = req.body;
    
    const prompt = `Generate personalized conversation starters for relationship building:

Journalists: ${JSON.stringify(journalists?.slice(0, 5))}
Context: ${JSON.stringify(context)}

For each journalist, create:
1. A non-pitchy conversation starter
2. Platform recommendation (Twitter/LinkedIn/Email)
3. Best timing
4. Follow-up suggestion

Return as JSON array:
[
  {
    "journalist": "Name",
    "starter": "Conversational opening",
    "platform": "Twitter/LinkedIn/Email",
    "timing": "When to reach out",
    "followUp": "How to continue conversation",
    "topics": ["Safe topics to discuss"]
  }
]`;

    const starters = await getClaudeJSON(prompt, []);
    
    res.json({
      success: true,
      starters
    });

  } catch (error) {
    console.error("Conversation starter error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate conversation starters"
    });
  }
});

// Helper functions
function generateFallbackJournalists(context) {
  return [
    {
      name: "Sarah Chen",
      publication: "TechCrunch",
      beat: "Enterprise & AI",
      email: "sarah@techcrunch.com",
      twitter: "@sarahchen",
      bio: "Covers enterprise technology and AI innovation",
      relevanceScore: 92,
      recentArticles: ["AI in Enterprise", "Future of Work", "Tech Trends 2024"],
      writingStyle: "Analytical",
      bestApproach: "Data-driven pitches with exclusive insights",
      responseTime: "2-3 days",
      interests: ["AI", "Innovation", "Startups"],
      conversationStarter: "Loved your piece on AI adoption - have you seen...",
      verified: true
    },
    {
      name: "Michael Roberts",
      publication: "Forbes",
      beat: "Business & Innovation",
      email: "mroberts@forbes.com",
      twitter: "@mroberts",
      bio: "Senior contributor covering business transformation",
      relevanceScore: 85,
      recentArticles: ["Digital Transformation", "Leadership", "Market Trends"],
      writingStyle: "Thought leadership",
      bestApproach: "Executive insights and industry perspective",
      responseTime: "1 week",
      interests: ["Leadership", "Strategy", "Innovation"],
      conversationStarter: "Your analysis of market trends was spot-on...",
      verified: true
    }
  ];
}

function calculateOpportunityScore(journalist, context) {
  // Simple scoring based on relevance
  let score = journalist.relevanceScore || 70;
  
  if (context?.why?.includes("exclusive")) score += 10;
  if (context?.why?.includes("first")) score += 10;
  if (journalist.beat?.toLowerCase().includes(context?.what?.toLowerCase())) score += 15;
  
  return Math.min(100, score);
}

function generatePitchAngle(journalist, context) {
  const angles = [
    "Exclusive data reveals surprising trend",
    "How this changes everything about the industry",
    "The untold story behind the innovation",
    "Why experts are wrong about this trend",
    "First look at game-changing technology"
  ];
  
  return angles[Math.floor(Math.random() * angles.length)];
}

module.exports = router;