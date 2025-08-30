// backend/config/claude.js - Enhanced version
const Anthropic = require("@anthropic-ai/sdk");

class ClaudeService {
  constructor() {
    // Check all possible environment variable names
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.CLAUDE_KEY;
    
    console.log('🔧 Initializing Claude service...');
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔑 Checking for API key in environment variables:');
    console.log('  - ANTHROPIC_API_KEY:', !!process.env.ANTHROPIC_API_KEY);
    console.log('  - CLAUDE_API_KEY:', !!process.env.CLAUDE_API_KEY);
    console.log('  - CLAUDE_KEY:', !!process.env.CLAUDE_KEY);
    console.log('✅ API Key found:', !!apiKey);
    console.log('📏 API Key length:', apiKey ? apiKey.length : 0);
    
    // Show first few chars of key for debugging (safely)
    if (apiKey && apiKey.length > 10) {
      console.log('🔐 API Key prefix:', apiKey.substring(0, 7) + '...');
    }
    
    // Check for placeholder values
    if (!apiKey || apiKey === 'YOUR_NEW_CLAUDE_API_KEY_HERE' || apiKey === 'YOUR_API_KEY_HERE') {
      console.error('⚠️ CLAUDE_API_KEY not properly configured!');
      console.error('Please add your API key to Railway Environment Variables:');
      console.error('Variable name should be: ANTHROPIC_API_KEY');
      console.error('Get your key from: https://console.anthropic.com/');
      
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 PRODUCTION ERROR: Claude API key is REQUIRED!');
        console.error('Set ANTHROPIC_API_KEY in Railway dashboard NOW.');
        // Don't throw error - use fallback instead to keep app running
        this.client = null;
        this.model = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
        return;
      } else {
        console.log('Running in development mode - API calls will fail without a valid key');
        this.client = null;
        this.model = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
        return;
      }
    }
    
    this.client = new Anthropic({
      apiKey: apiKey,
    });
    this.model = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
    console.log('Claude service initialized with model:', this.model);
  }

  async sendMessage(prompt, conversationHistory = [], options = {}) {
    try {
      console.log("Claude sendMessage called");
      console.log("Prompt length:", prompt.length);
      console.log("Conversation history length:", conversationHistory.length);
      
      // Check if client is initialized
      if (!this.client) {
        console.error('Claude client not initialized - API key missing or invalid');
        throw new Error('Claude API key not configured. Please check Railway environment variables.');
      }

      // Build messages array
      const messages =
        conversationHistory.length > 0
          ? conversationHistory
          : [
              {
                role: "user",
                content: prompt,
              },
            ];

      console.log("Sending to Claude:", messages.length, "messages");
      console.log("Using model:", this.model);

      // Use custom system prompt if provided, otherwise use default
      const systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt();

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
      });

      if (!response || !response.content || !response.content[0]) {
        throw new Error('Invalid Claude response structure');
      }

      console.log(
        "Claude response received, length:",
        response.content[0].text.length
      );
      return response.content[0].text;
    } catch (error) {
      console.error("Claude API Error:", error.message);
      console.error("Error type:", error.constructor.name);
      console.error("Error details:", {
        status: error.status,
        headers: error.headers,
        error: error.error
      });
      throw error;
    }
  }

  async sendConversation(messages, options = {}) {
    try {
      console.log("sendConversation: Received", messages.length, "messages");

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        system: options.systemPrompt || this.getDefaultSystemPrompt(),
        messages: messages,
      });

      return response.content[0].text;
    } catch (error) {
      console.error("Claude API Error in sendConversation:", error);
      throw error;
    }
  }

  async generateLongContent(prompt, maxTokens = 4096) {
    try {
      console.log("generateLongContent called with maxTokens:", maxTokens);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        system: this.getDefaultSystemPrompt(),
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return response.content[0].text;
    } catch (error) {
      console.error("Claude API Error in generateLongContent:", error);
      throw error;
    }
  }

  getDefaultSystemPrompt() {
    return "You are SignalDesk AI, an intelligent PR assistant. You help users with PR strategy, content creation, and media relations. Provide comprehensive, professional, and actionable advice.";
  }

  getMediaStrategySystemPrompt() {
    return `You are SignalDesk AI, specializing in strategic media relations and journalist discovery. 
    You help PR professionals:
    1. Develop targeted media strategies based on campaign objectives
    2. Identify the most relevant journalists for their stories
    3. Score journalist-campaign fit using data-driven insights
    4. Create effective search queries for finding media contacts
    5. Analyze media list quality and provide actionable improvements
    
    Always provide specific, actionable recommendations backed by PR best practices.`;
  }
}

// Create a single instance
const claudeService = new ClaudeService();

// Enhanced function to generate search queries with optional campaign context
async function generateSearchQueries(userQuery, campaignContext = null) {
  try {
    let prompt;

    if (campaignContext) {
      prompt = `Given this media search query: "${userQuery}"
      
      And this campaign context:
      - Industry: ${campaignContext.industry || "Not specified"}
      - Objectives: ${campaignContext.objectives || "Not specified"}
      - Target Audiences: ${campaignContext.targetAudiences || "Not specified"}
      - Key Messages: ${campaignContext.keyMessages || "Not specified"}
      
      Generate 5 highly targeted search queries that would find journalists who:
      1. Cover topics relevant to the campaign objectives
      2. Write for publications that reach the target audiences
      3. Have recently covered similar stories or themes
      4. Are likely to be interested in the key messages
      
      Consider different search strategies:
      - Beat-specific searches (e.g., "technology reporter")
      - Publication-focused (e.g., "journalist at TechCrunch")
      - Topic + location (e.g., "AI startups San Francisco journalist")
      - Recent coverage (e.g., "covered product launches 2024")
      
      Return ONLY a JSON array of search query strings, no other text.`;
    } else {
      prompt = `Given this media search query: "${userQuery}"
      
      Generate 3-5 optimized search queries that would help find relevant journalists.
      Consider different phrasings, keywords, and angles.
      
      Include variations like:
      - Beat/topic focused queries
      - Publication-specific searches
      - Geographic variations
      - Different journalist titles (reporter, writer, correspondent, editor)
      
      Return ONLY a JSON array of strings, no other text. Example:
      ["tech journalists San Francisco", "AI reporters bay area", "startup writers California"]`;
    }

    const response = await claudeService.sendMessage(prompt);

    try {
      // Clean the response in case there's extra text
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch {
      // Fallback if AI doesn't return valid JSON
      console.log("Failed to parse AI response, using fallback queries");
      return [userQuery, `${userQuery} journalist`, `${userQuery} reporter`];
    }
  } catch (error) {
    console.error("Error generating search queries:", error);
    return [userQuery];
  }
}

// Enhanced journalist analysis with campaign scoring
async function analyzeJournalist(
  journalist,
  userQuery,
  campaignContext = null
) {
  try {
    let prompt;

    if (campaignContext) {
      prompt = `Analyze this journalist for campaign fit:
      
      Campaign Query: "${userQuery}"
      Campaign Context:
      - Industry: ${campaignContext.industry || "Not specified"}
      - Objectives: ${campaignContext.objectives || "Not specified"}
      - Target Audiences: ${campaignContext.targetAudiences || "Not specified"}
      - Key Messages: ${campaignContext.keyMessages || "Not specified"}
      
      Journalist:
      Name: ${journalist.name}
      Publication: ${journalist.publication || "Unknown"}
      Beat: ${journalist.beat || "General"}
      Bio: ${journalist.bio || "No bio available"}
      Location: ${journalist.location || "Unknown"}
      Recent Articles: ${JSON.stringify(journalist.recent_articles || [])}
      Social Media: Twitter: ${journalist.twitter || "None"}, LinkedIn: ${
        journalist.linkedin || "None"
      }
      Verified: ${journalist.verified ? "Yes" : "No"}
      
      Provide a detailed campaign fit analysis:
      
      1. campaignScore: 0-100 (how well they match the campaign needs)
         - 80-100: Excellent fit, priority target
         - 60-79: Good fit, should include
         - 40-59: Moderate fit, consider including
         - 0-39: Poor fit, probably skip
      
      2. campaignFitReasons: Array of 3-5 specific reasons they're a good/poor fit
         - Be specific about why they match the campaign objectives
         - Reference their beat, recent coverage, audience reach
      
      3. pitchAngle: The best angle to pitch this journalist based on:
         - Their recent articles and interests
         - The campaign's key messages
         - What would make them care about this story
      
      4. insights: Brief strategic insights about this journalist
      
      5. topics: Array of topics they cover that relate to the campaign
      
      6. outreachSuggestions: Array of 2-3 specific outreach tips
      
      7. concerns: Any red flags or reasons to be cautious
      
      Return ONLY valid JSON with this structure.`;
    } else {
      prompt = `Analyze this journalist for relevance to the query: "${userQuery}"
      
      Journalist:
      Name: ${journalist.name}
      Publication: ${journalist.publication || "Unknown"}
      Beat: ${journalist.beat || "General"}
      Bio: ${journalist.bio || "No bio available"}
      Recent Articles: ${JSON.stringify(journalist.recent_articles || [])}
      
      Provide:
      1. relevanceScore: 0-100
      2. insights: Brief insights on why they're relevant
      3. topics: Key coverage topics
      4. suggestions: Outreach suggestions
      
      Return ONLY valid JSON with this structure:
      {
        "relevanceScore": 75,
        "insights": "This journalist covers...",
        "topics": ["topic1", "topic2"],
        "suggestions": ["suggestion1", "suggestion2"]
      }`;
    }

    const response = await claudeService.sendMessage(prompt);

    try {
      // Clean the response in case there's extra text
      const jsonMatch = response.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch {
      return {
        relevanceScore: 50,
        campaignScore: 50,
        insights: "Analysis pending",
        topics: [],
        suggestions: [],
        campaignFitReasons: ["Matches search criteria"],
        pitchAngle: "Standard pitch approach",
      };
    }
  } catch (error) {
    console.error("Error analyzing journalist:", error);
    return {
      relevanceScore: 0,
      campaignScore: 0,
      insights: "Analysis failed",
      topics: [],
      suggestions: [],
      campaignFitReasons: [],
      pitchAngle: "",
    };
  }
}

// New function: Generate media strategy
async function generateMediaStrategy(strategyInputs) {
  const prompt = `
    Create a comprehensive media strategy for this PR campaign:
    
    Campaign Type: ${strategyInputs.campaignType}
    Objectives: ${strategyInputs.objectives}
    Target Audiences: ${strategyInputs.targetAudiences}
    Key Messages: ${strategyInputs.keyMessages}
    Timeline: ${strategyInputs.timeline}
    Budget: ${strategyInputs.budget}
    
    Provide a detailed media strategy with:
    
    1. Media Tiers (be specific with actual publication names when possible):
       - tier1: Description of dream outlets (3-5 major publications)
       - tier2: Industry-specific outlets (5-7 publications)
       - tier3: Supportive/niche outlets (7-10 publications)
    
    2. Journalist Profiles to Target:
       - journalistTypes: Array of specific journalist types/beats to target
       - publicationTypes: Types of publications that would care
       - geographicFocus: Any geographic considerations
    
    3. Pitch Angles:
       - businessAngle: For business media
       - tradeAngle: For trade publications
       - consumerAngle: For consumer media
    
    4. Search Formulas (searchFormulas array):
       - 5-7 specific search queries that would find these journalists
       - Include beat-specific, publication-specific, and topic searches
    
    5. Outreach Sequence:
       - week1: Who to target first and why
       - week2: Second wave targets
       - ongoing: Long-term targets
    
    6. Success Metrics:
       - coverageGoals: Realistic coverage expectations
       - kpis: Key performance indicators to track
    
    Return ONLY valid JSON. Be specific and actionable.
  `;

  try {
    const response = await claudeService.sendMessage(prompt, [], {
      systemPrompt: claudeService.getMediaStrategySystemPrompt(),
    });

    return JSON.parse(response);
  } catch (error) {
    console.error("Error generating media strategy:", error);
    throw error;
  }
}

// New function: Analyze media list quality
async function analyzeMediaListQuality(journalists, campaign) {
  const prompt = `
    Analyze the quality of this media list for the campaign:
    
    Campaign: ${JSON.stringify(campaign)}
    Number of journalists: ${journalists.length}
    
    Journalists summary:
    ${journalists
      .map((j) => `- ${j.name} (${j.publication}, ${j.beat})`)
      .join("\n")}
    
    Publications represented: ${[
      ...new Set(journalists.map((j) => j.publication)),
    ].join(", ")}
    Beats covered: ${[...new Set(journalists.map((j) => j.beat))].join(", ")}
    Geographic distribution: ${[
      ...new Set(journalists.map((j) => j.location)),
    ].join(", ")}
    
    Provide a comprehensive quality analysis:
    
    1. overallGrade: Letter grade (A-F) with + or -
    2. summary: One paragraph executive summary
    
    3. diversityScore:
       - publications: Assessment of publication variety
       - geographic: Geographic coverage assessment
       - beats: Topic/beat diversity
       - audienceReach: Estimated total audience reach
       - missingPerspectives: What viewpoints are missing
    
    4. strategicAlignment:
       - tier1Coverage: "X of Y dream targets included"
       - amplifiers: Number of journalists likely to amplify
       - risks: Any concerning factors
       - opportunities: Untapped opportunities
    
    5. practicalAssessment:
       - reachability: Percentage with contact info
       - timing: Any timing considerations
       - warmth: Percentage of cold vs warm contacts
       - workload: Realistic for team to manage?
    
    6. recommendations:
       - add: Specific types of journalists to add (be specific)
       - remove: Who to consider removing and why
       - prioritize: Top 5 journalists to pitch first
       - searchQueries: New search queries to find missing journalists
    
    7. competitiveAnalysis:
       - uniqueAngles: Angles competitors might miss
       - saturation: How saturated is this media space
    
    Return ONLY valid JSON.
  `;

  try {
    const response = await claudeService.sendMessage(prompt, [], {
      systemPrompt: claudeService.getMediaStrategySystemPrompt(),
    });

    return JSON.parse(response);
  } catch (error) {
    console.error("Error analyzing media list quality:", error);
    throw error;
  }
}

// New function: Generate smart search suggestions
async function generateSmartSearchSuggestions(context) {
  const prompt = `
    Generate smart search suggestions for finding journalists based on:
    ${JSON.stringify(context)}
    
    Create 10 diverse search queries that would find relevant journalists:
    
    1. Beat-specific searches
    2. Publication-targeted searches
    3. Geographic searches
    4. Topic + expertise combinations
    5. Recent coverage searches
    6. Industry event speakers
    7. Award winner searches
    8. Competitor coverage searches
    9. Trending topic searches
    10. Niche community searches
    
    Return as JSON array of objects:
    [
      {
        "query": "search query string",
        "type": "beat|publication|geographic|topic|coverage|event|award|competitor|trending|niche",
        "explanation": "why this search would be effective"
      }
    ]
  `;

  try {
    const response = await claudeService.sendMessage(prompt);
    return JSON.parse(response);
  } catch (error) {
    console.error("Error generating search suggestions:", error);
    return [];
  }
}

// Export the instance and all functions
module.exports = claudeService;
module.exports.generateSearchQueries = generateSearchQueries;
module.exports.analyzeJournalist = analyzeJournalist;
module.exports.generateMediaStrategy = generateMediaStrategy;
module.exports.analyzeMediaListQuality = analyzeMediaListQuality;
module.exports.generateSmartSearchSuggestions = generateSmartSearchSuggestions;
