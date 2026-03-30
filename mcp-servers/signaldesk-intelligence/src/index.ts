// #/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "pg";

// API Keys for external data sources
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const REDDIT_API_KEY = process.env.REDDIT_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const TOOLS: Tool[] = [
  {
    name: "analyze_competition_with_personality",
    description: "Analyze competitive landscape with sharp PR strategist insights",
    inputSchema: {
      type: "object",
      properties: {
        findings: { 
          type: "array", 
          description: "News and monitoring findings" 
        },
        organization: { 
          type: "object", 
          description: "Target organization" 
        },
        analysis_depth: { 
          type: "string", 
          enum: ["quick", "standard", "deep"],
          description: "Analysis depth (affects timeout)"
        }
      },
      required: ["findings", "organization"]
    }
  },
  {
    name: "competitor_move_detection",
    description: "Detect competitor moves including new hires, products, and campaigns",
    inputSchema: {
      type: "object",
      properties: {
        competitors: {
          type: "array",
          items: { type: "string" },
          description: "List of competitor company names to monitor"
        },
        timeframe: {
          type: "string",
          enum: ["24h", "week", "month"],
          description: "Timeframe for detection (default: week)"
        },
        move_types: {
          type: "array",
          items: { type: "string", enum: ["hiring", "product", "campaign", "partnership", "funding"] },
          description: "Types of moves to detect"
        }
      },
      required: ["competitors"]
    }
  },
  {
    name: "market_narrative_tracking",
    description: "Track how industries and markets are being discussed in media",
    inputSchema: {
      type: "object",
      properties: {
        industry: {
          type: "string",
          description: "Industry to track (e.g., 'AI', 'fintech', 'healthcare')"
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Specific keywords to track within the industry"
        },
        sentiment_analysis: {
          type: "boolean",
          description: "Include sentiment analysis of the narratives"
        }
      },
      required: ["industry"]
    }
  },
  {
    name: "emerging_topic_identification",
    description: "Identify emerging topics and trends before they become mainstream",
    inputSchema: {
      type: "object",
      properties: {
        industry_focus: {
          type: "string",
          description: "Industry to focus on for emerging topics"
        },
        confidence_threshold: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "Minimum confidence score for topic emergence (default: 70)"
        },
        sources: {
          type: "array",
          items: { type: "string" },
          description: "Specific sources to monitor (e.g., 'reddit', 'twitter', 'academic')"
        }
      }
    }
  },
  {
    name: "regulatory_change_monitoring",
    description: "Monitor regulatory changes and compliance alerts",
    inputSchema: {
      type: "object",
      properties: {
        jurisdiction: {
          type: "string",
          description: "Geographic jurisdiction (e.g., 'US', 'EU', 'global')"
        },
        regulatory_areas: {
          type: "array",
          items: { type: "string" },
          description: "Specific regulatory areas to monitor"
        },
        urgency_filter: {
          type: "string",
          enum: ["critical", "important", "all"],
          description: "Filter by urgency level"
        }
      },
      required: ["jurisdiction"]
    }
  },
  {
    name: "executive_movement_tracking",
    description: "Track executive and key personnel movements across the industry",
    inputSchema: {
      type: "object",
      properties: {
        industries: {
          type: "array",
          items: { type: "string" },
          description: "Industries to monitor for executive movements"
        },
        executive_levels: {
          type: "array",
          items: { type: "string", enum: ["C-suite", "VP", "Director", "Senior"] },
          description: "Executive levels to track"
        },
        company_size: {
          type: "string",
          enum: ["startup", "mid-market", "enterprise", "all"],
          description: "Company size filter"
        }
      }
    }
  },
  {
    name: "partnership_opportunity_detection",
    description: "Detect potential partnership and strategic alliance opportunities",
    inputSchema: {
      type: "object",
      properties: {
        company_profile: {
          type: "string",
          description: "Brief description of your company's capabilities"
        },
        partnership_types: {
          type: "array",
          items: { type: "string", enum: ["technology", "distribution", "marketing", "strategic"] },
          description: "Types of partnerships to identify"
        },
        target_company_size: {
          type: "string",
          enum: ["similar", "larger", "smaller", "any"],
          description: "Preferred target company size"
        }
      },
      required: ["company_profile"]
    }
  },
  {
    name: "whitespace_analysis",
    description: "Find uncovered angles and untapped story opportunities",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Topic or industry to analyze for whitespace"
        },
        coverage_period: {
          type: "string",
          enum: ["week", "month", "quarter"],
          description: "Period to analyze for coverage gaps"
        },
        publication_types: {
          type: "array",
          items: { type: "string" },
          description: "Types of publications to analyze"
        }
      },
      required: ["topic"]
    }
  }
];

// API Utility Functions
async function callNewsAPI(endpoint: string, params: Record<string, string>) {
  if (!NEWS_API_KEY) {
    throw new Error('NewsAPI key not configured');
  }

  const url = new URL(`https://newsapi.org/v2${endpoint}`);
  url.searchParams.append('apiKey', NEWS_API_KEY);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function searchGoogle(query: string) {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key not configured');
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.append('key', GOOGLE_API_KEY);
  url.searchParams.append('cx', '017576662512468239146:omuauf_lfve'); // Custom search engine ID
  url.searchParams.append('q', query);
  url.searchParams.append('num', '10');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function searchReddit(subreddit: string, query: string) {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=hot&limit=10`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SignalDesk Intelligence Bot 1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Reddit search error:', error);
    return { data: { children: [] } };
  }
}

class IntelligenceServer {
  private server: Server;
  private db: Client | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "signaldesk-intelligence",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private async ensureDatabase() {
    if (!this.db) {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new McpError(
          ErrorCode.InternalError,
          "DATABASE_URL environment variable is not set"
        );
      }

      this.db = new Client({ connectionString: dbUrl });
      await this.db.connect();

      // Create intelligence tables
      await this.createIntelligenceTables();
    }
  }

  private async createIntelligenceTables() {
    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS competitor_moves (
        id SERIAL PRIMARY KEY,
        competitor_name VARCHAR(255) NOT NULL,
        move_type VARCHAR(50) NOT NULL,
        description TEXT,
        impact_score INTEGER DEFAULT 0,
        source_url TEXT,
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS market_narratives (
        id SERIAL PRIMARY KEY,
        industry VARCHAR(100) NOT NULL,
        narrative_text TEXT,
        sentiment_score FLOAT,
        trend_direction VARCHAR(20),
        source_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS emerging_topics (
        id SERIAL PRIMARY KEY,
        topic_name VARCHAR(255) NOT NULL,
        confidence_score INTEGER,
        industry VARCHAR(100),
        growth_rate FLOAT,
        first_detected TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sources TEXT[],
        metadata JSONB
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS regulatory_changes (
        id SERIAL PRIMARY KEY,
        jurisdiction VARCHAR(50) NOT NULL,
        regulatory_area VARCHAR(100),
        change_type VARCHAR(50),
        description TEXT,
        urgency_level VARCHAR(20),
        effective_date DATE,
        source_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS executive_movements (
        id SERIAL PRIMARY KEY,
        executive_name VARCHAR(255) NOT NULL,
        previous_company VARCHAR(255),
        new_company VARCHAR(255),
        position VARCHAR(100),
        industry VARCHAR(100),
        announcement_date DATE,
        impact_score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      await this.ensureDatabase();

      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "analyze_competition_with_personality": {
            const { findings, organization, analysis_depth = 'standard' } = args as any;
            
            console.log(`🎯 Starting personality-driven competitive analysis for ${organization?.name}`);
            
            if (!ANTHROPIC_API_KEY) {
              return {
                content: [{
                  type: "text",
                  text: "❌ ANTHROPIC_API_KEY not configured. Cannot perform personality-driven analysis."
                }]
              };
            }
            
            // Prepare the sharp PR strategist personality and prompt
            const personality = `You are Marcus Chen, a razor-sharp PR strategist and narrative decoder who spots what others miss. You read between the lines, connect dots across seemingly unrelated events, and understand the chess moves companies make through their communications.`;
            
            const prompt = `${personality}

Your approach to TODAY's developments:
- FIRST, extract every competitor mention from the monitoring data
- THEN decode why each move matters RIGHT NOW
- Connect today's news to last week's moves - what's the pattern?
- That acquisition rumor + executive departure + partnership = they're pivoting
- Competitor went quiet after bad news? They're cooking up a distraction
- Multiple competitors moving simultaneously? There's a bigger force at play

ANALYSIS TARGET:
Organization: ${organization?.name || 'Unknown'}
Industry: ${organization?.industry || 'Unknown'}

CRITICAL: You must analyze THESE EXACT news items:

${findings?.map((f: any, i: number) => `${i+1}. "${f.title}" - ${f.source} ${f.date ? `(${f.date})` : ''}`).join('\n') || 'No findings'}

For EACH news item listed above, provide analysis in this exact JSON structure:

{
  "latest_developments": {
    "competitor_moves": [
      {
        "competitor": "Name from news item only",
        "what_happened": "EXACT headline/event from monitoring data",
        "source": "EXACT source from the news item",
        "significance": "why this specific news matters",
        "hidden_meaning": "what this news really means",
        "our_angle": "how to respond to this specific news"
      }
    ],
    "emerging_patterns": [
      {
        "pattern": "trend you're seeing across multiple competitors",
        "evidence": ["specific examples from the monitoring data"],
        "implication": "what this means for the industry"
      }
    ],
    "competitive_silence": "What NO ONE is talking about that they should be"
  },
  "pr_chess_moves": {
    "recent_moves": [
      {
        "competitor": "who",
        "action": "what they did",
        "timing_significance": "why NOW is important",
        "real_motivation": "what they're actually trying to achieve",
        "our_response_window": "how long we have to respond"
      }
    ],
    "predicted_moves": [
      {
        "competitor": "who",
        "likely_action": "what they'll probably do",
        "trigger": "what will cause them to act",
        "our_preemptive_options": ["ways to get ahead of it"]
      }
    ]
  },
  "sharp_insights": [
    "Non-obvious connection or pattern others are missing",
    "Prediction that seems crazy but makes sense",
    "Hidden meaning in recent competitor actions"
  ],
  "narrative_warfare": {
    "their_story": "What competitors want the market to believe",
    "reality_check": "What's actually happening behind the PR",
    "counter_narrative": "The story we should be telling instead"
  },
  "recommendations": {
    "next_24_hours": ["Urgent actions based on TODAY's news"],
    "next_week": ["Follow-up actions"],
    "narrative_shifts": ["How to change the conversation"]
  }
}

DO NOT provide generic industry analysis. ONLY analyze the specific news items provided.`;

            try {
              // Set timeout based on analysis depth
              const timeout = analysis_depth === 'deep' ? 45000 : 
                             analysis_depth === 'quick' ? 15000 : 30000;
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), timeout);
              
              const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': ANTHROPIC_API_KEY,
                  'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                  model: 'claude-sonnet-4-20250514',
                  max_tokens: 4000,
                  temperature: 0.7, // Keep it creative for sharp insights
                  messages: [{
                    role: 'user',
                    content: prompt
                  }]
                }),
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Claude API error:', response.status, errorText);
                throw new Error(`Claude API failed: ${response.status}`);
              }
              
              const claudeData = await response.json();
              const content = claudeData.content[0].text;
              
              // Extract JSON from Claude's response
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  const analysis = JSON.parse(jsonMatch[0]);
                  console.log('✅ Claude competitive analysis completed', {
                    hasLatestDevelopments: !!analysis.latest_developments,
                    competitorMoves: analysis.latest_developments?.competitor_moves?.length || 0,
                    hasSharpInsights: !!analysis.sharp_insights,
                    insightCount: analysis.sharp_insights?.length || 0
                  });
                  
                  // Return structured analysis for stages to consume
                  return {
                    content: [{
                      type: "analysis",
                      // Return the full structured analysis directly
                      ...analysis,
                      metadata: {
                        analysis, // Keep full analysis in metadata for backward compatibility
                        personality: 'competitive_intelligence',
                        analysis_depth,
                        findings_analyzed: findings?.length || 0,
                        claude_enhanced: true
                      }
                    }],
                    success: true
                  };
                } catch (parseError) {
                  console.error('Failed to parse Claude JSON:', parseError);
                  throw new Error('Failed to parse analysis response');
                }
              } else {
                throw new Error('No JSON found in Claude response');
              }
              
            } catch (error) {
              console.error('Personality-driven analysis error:', error);
              return {
                content: [{
                  type: "text",
                  text: `❌ Error in personality-driven analysis: ${error instanceof Error ? error.message : 'Unknown error'}
                  
This may be due to API limits or timeout. Try with 'quick' analysis_depth for faster results.`
                }]
              };
            }
          }
          
          case "competitor_move_detection": {
            const { competitors, timeframe = 'week', move_types = ['hiring', 'product', 'campaign'] } = args as any;
            
            const moves = [];
            
            try {
              // Search for each competitor across multiple sources
              for (const competitor of competitors) {
                console.log(`🔍 Searching for moves by ${competitor}`);
                
                // Search NewsAPI for recent announcements
                const newsSearchTerms = [
                  `"${competitor}" AND (announces OR launches OR hires OR partnership OR funding)`,
                  `"${competitor}" AND (CEO OR executive OR appointment OR departure)`,
                  `"${competitor}" AND (product OR feature OR service OR expansion)`
                ];
                
                for (const searchTerm of newsSearchTerms) {
                  try {
                    const newsResponse = await callNewsAPI('/everything', {
                      'q': searchTerm,
                      'language': 'en',
                      'sortBy': 'publishedAt',
                      'pageSize': '10',
                      'from': this.getTimeframeDate(timeframe)
                    });

                    for (const article of newsResponse.articles || []) {
                      const moveType = this.detectMoveType(article, move_types);
                      if (moveType) {
                        moves.push({
                          competitor_name: competitor,
                          move_type: moveType,
                          description: article.title,
                          detailed_description: article.description,
                          impact_score: this.calculateImpactScore(article, competitor),
                          source_url: article.url,
                          source_name: article.source?.name || 'News',
                          detected_at: article.publishedAt,
                          author: article.author
                        });
                      }
                    }
                  } catch (error) {
                    console.error(`NewsAPI search error for ${competitor}:`, error);
                  }
                }

                // Search Google for additional company information
                try {
                  const googleQuery = `"${competitor}" AND (press release OR announcement OR news) site:businesswire.com OR site:prnewswire.com`;
                  const googleResponse = await searchGoogle(googleQuery);
                  
                  for (const item of googleResponse.items || []) {
                    const moveType = this.detectMoveTypeFromText(item.title + ' ' + item.snippet, move_types);
                    if (moveType) {
                      moves.push({
                        competitor_name: competitor,
                        move_type: moveType,
                        description: item.title,
                        detailed_description: item.snippet,
                        impact_score: this.calculateImpactFromText(item.title + ' ' + item.snippet),
                        source_url: item.link,
                        source_name: 'Press Release',
                        detected_at: new Date().toISOString(),
                        author: 'PR Wire'
                      });
                    }
                  }
                } catch (error) {
                  console.error(`Google search error for ${competitor}:`, error);
                }

                // Search Reddit for discussion and sentiment
                try {
                  const subreddits = ['business', 'technology', 'startups', 'investing'];
                  for (const subreddit of subreddits) {
                    const redditResponse = await searchReddit(subreddit, competitor);
                    
                    for (const post of redditResponse.data?.children || []) {
                      const postData = post.data;
                      if (postData.title && postData.created_utc > this.getTimeframeTimestamp(timeframe)) {
                        const moveType = this.detectMoveTypeFromText(postData.title + ' ' + postData.selftext, move_types);
                        if (moveType) {
                          moves.push({
                            competitor_name: competitor,
                            move_type: moveType,
                            description: postData.title,
                            detailed_description: postData.selftext || 'Reddit discussion',
                            impact_score: Math.min(postData.score || 0, 100),
                            source_url: `https://reddit.com${postData.permalink}`,
                            source_name: `Reddit r/${subreddit}`,
                            detected_at: new Date(postData.created_utc * 1000).toISOString(),
                            author: postData.author
                          });
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error(`Reddit search error for ${competitor}:`, error);
                }
              }

              // Store moves in database
              for (const move of moves) {
                await this.storeCompetitorMove(move);
              }

              // Sort by impact score and recency
              moves.sort((a, b) => {
                const scoreA = a.impact_score * (new Date(a.detected_at).getTime() / 1000000000);
                const scoreB = b.impact_score * (new Date(b.detected_at).getTime() / 1000000000);
                return scoreB - scoreA;
              });

              const topMoves = moves.slice(0, 20); // Return top 20 moves

              return {
                content: [{
                  type: "text",
                  text: `🎯 Competitor Intelligence Report (${timeframe})\n` +
                        `Found ${topMoves.length} significant moves across ${competitors.length} competitors:\n\n` +
                        topMoves.map(move => 
                          `🏢 ${move.competitor_name} - ${move.move_type.toUpperCase()}\n` +
                          `📰 ${move.description}\n` +
                          `💡 ${move.detailed_description}\n` +
                          `📊 Impact Score: ${move.impact_score}/100\n` +
                          `📅 ${new Date(move.detected_at).toLocaleDateString()}\n` +
                          `🔗 Source: ${move.source_name}\n` +
                          `${move.source_url}\n`
                        ).join('\n---\n') +
                        `\n\n📈 Recommended Actions:\n` +
                        `• Monitor high-impact moves (80+ score) for strategic response\n` +
                        `• Track hiring patterns for talent acquisition intelligence\n` +
                        `• Analyze product launches for competitive positioning\n` +
                        `• Set up alerts for breaking news about these competitors`
                }]
              };

            } catch (error) {
              console.error('Competitor intelligence error:', error);
              return {
                content: [{
                  type: "text",
                  text: `❌ Error gathering competitor intelligence: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
                        `This may be due to API rate limits or connectivity issues. ` +
                        `Try again in a few minutes or check your API key configuration.`
                }]
              };
            }
          }

          case "market_narrative_tracking": {
            const { industry, keywords = [], sentiment_analysis = true } = args as any;
            
            const narratives = [];
            
            try {
              console.log(`📊 Tracking market narratives for ${industry}`);
              
              // Build search terms for the industry
              const searchTerms = [
                `"${industry}" AND (trend OR growth OR market OR future)`,
                `"${industry}" AND (regulation OR policy OR government)`,
                `"${industry}" AND (innovation OR disruption OR technology)`,
                ...keywords.map((keyword: string) => `"${industry}" AND "${keyword}"`)
              ];
              
              // Search NewsAPI for industry narratives
              for (const searchTerm of searchTerms) {
                try {
                  const newsResponse = await callNewsAPI('/everything', {
                    'q': searchTerm,
                    'language': 'en',
                    'sortBy': 'publishedAt',
                    'pageSize': '15',
                    'from': new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 2 weeks
                  });

                  for (const article of newsResponse.articles || []) {
                    const narrative = this.extractNarrative(article, industry);
                    if (narrative) {
                      narratives.push({
                        industry,
                        narrative_text: narrative.text,
                        sentiment_score: sentiment_analysis ? this.calculateSentiment(article) : null,
                        trend_direction: this.detectTrend(article),
                        source_count: 1,
                        source_name: article.source?.name || 'News',
                        source_url: article.url,
                        article_title: article.title,
                        published_at: article.publishedAt,
                        author: article.author,
                        themes: narrative.themes
                      });
                    }
                  }
                } catch (error) {
                  console.error(`NewsAPI error for ${searchTerm}:`, error);
                }
              }

              // Search Google for industry analysis and reports
              try {
                const googleQuery = `"${industry} market" OR "${industry} trends" OR "${industry} outlook" site:mckinsey.com OR site:bcg.com OR site:deloitte.com`;
                const googleResponse = await searchGoogle(googleQuery);
                
                for (const item of googleResponse.items || []) {
                  const narrative = this.extractNarrativeFromText(item.title, item.snippet, industry);
                  if (narrative) {
                    narratives.push({
                      industry,
                      narrative_text: narrative.text,
                      sentiment_score: sentiment_analysis ? this.calculateSentimentFromText(item.title + ' ' + item.snippet) : null,
                      trend_direction: this.detectTrendFromText(item.title + ' ' + item.snippet),
                      source_count: 1,
                      source_name: 'Industry Report',
                      source_url: item.link,
                      article_title: item.title,
                      published_at: new Date().toISOString(),
                      author: 'Consulting Firm',
                      themes: narrative.themes
                    });
                  }
                }
              } catch (error) {
                console.error(`Google search error for ${industry}:`, error);
              }

              // Search Reddit for market discussions
              try {
                const businessSubreddits = ['business', 'investing', 'entrepreneur', 'technology', 'futurology'];
                for (const subreddit of businessSubreddits) {
                  const redditResponse = await searchReddit(subreddit, industry);
                  
                  for (const post of redditResponse.data?.children || []) {
                    const postData = post.data;
                    if (postData.title && postData.created_utc > (Date.now() / 1000) - (14 * 24 * 60 * 60)) {
                      const narrative = this.extractNarrativeFromText(postData.title, postData.selftext, industry);
                      if (narrative && postData.score > 10) { // Only high-engagement posts
                        narratives.push({
                          industry,
                          narrative_text: narrative.text,
                          sentiment_score: sentiment_analysis ? this.calculateSentimentFromText(postData.title + ' ' + postData.selftext) : null,
                          trend_direction: this.detectTrendFromText(postData.title + ' ' + postData.selftext),
                          source_count: 1,
                          source_name: `Reddit r/${subreddit}`,
                          source_url: `https://reddit.com${postData.permalink}`,
                          article_title: postData.title,
                          published_at: new Date(postData.created_utc * 1000).toISOString(),
                          author: postData.author,
                          themes: narrative.themes,
                          engagement_score: postData.score
                        });
                      }
                    }
                  }
                }
              } catch (error) {
                console.error(`Reddit search error for ${industry}:`, error);
              }

              // Aggregate similar narratives and calculate trends
              const aggregatedNarratives = this.aggregateNarratives(narratives);
              
              // Store narratives in database
              for (const narrative of aggregatedNarratives) {
                await this.storeMarketNarrative(narrative);
              }

              return {
                content: [{
                  type: "text",
                  text: `📊 Market Narrative Analysis: ${industry}\n` +
                        `Analyzed ${narratives.length} sources across news, reports, and social media\n\n` +
                        `🔍 Key Narratives Found:\n\n` +
                        aggregatedNarratives.map((narrative: any) => 
                          `📈 ${narrative.trend_direction?.toUpperCase()} TREND\n` +
                          `🗣️ ${narrative.narrative_text}\n` +
                          `${sentiment_analysis ? `😊 Sentiment: ${narrative.sentiment_score}/10\n` : ''}` +
                          `📰 Sources: ${narrative.source_count} mentions\n` +
                          `🏷️ Themes: ${narrative.themes?.join(', ') || 'General'}\n` +
                          `🔗 Latest Source: ${narrative.source_name}\n`
                        ).join('\n---\n') +
                        `\n\n💡 Strategic Insights:\n` +
                        `• ${this.generateStrategicInsights(aggregatedNarratives, industry as string)}\n\n` +
                        `📈 Recommended Actions:\n` +
                        `• Monitor ${aggregatedNarratives.filter((n: any) => n.trend_direction === 'positive').length} positive trends for opportunity positioning\n` +
                        `• Address ${aggregatedNarratives.filter((n: any) => n.trend_direction === 'concerning').length} concerning narratives with strategic messaging\n` +
                        `• Prepare thought leadership content around emerging themes\n` +
                        `• Set up alerts for narrative shifts in this industry`
                }]
              };

            } catch (error) {
              console.error('Market narrative tracking error:', error);
              return {
                content: [{
                  type: "text",
                  text: `❌ Error tracking market narratives: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
                        `This may be due to API rate limits or connectivity issues. ` +
                        `Try again in a few minutes or check your API key configuration.`
                }]
              };
            }
          }

          case "emerging_topic_identification": {
            const { industry_focus, confidence_threshold = 70, sources = [] } = args as any;
            
            let query = `
              SELECT * FROM emerging_topics 
              WHERE confidence_score >= $1
            `;
            const queryParams = [confidence_threshold];
            
            if (industry_focus) {
              query += ` AND industry ILIKE $${queryParams.length + 1}`;
              queryParams.push(`%${industry_focus}%`);
            }
            
            query += ` ORDER BY confidence_score DESC, growth_rate DESC`;

            const result = await this.db!.query(query, queryParams);

            if (result.rows.length === 0) {
              await this.createSampleEmergingTopics();
              const retryResult = await this.db!.query(query, queryParams);
              
              return {
                content: [{
                  type: "text",
                  text: `Emerging Topics ${industry_focus ? `in ${industry_focus}` : ''}:\n\n${retryResult.rows.map((topic: any) => 
                    `${topic.topic_name}\nConfidence: ${topic.confidence_score}%\nGrowth Rate: ${topic.growth_rate}%\nIndustry: ${topic.industry}\nFirst Detected: ${topic.first_detected}\n`
                  ).join('\n---\n')}`
                }]
              };
            }

            return {
              content: [{
                type: "text",
                text: `Emerging Topics ${industry_focus ? `in ${industry_focus}` : ''}:\n\n${result.rows.map((topic: any) => 
                  `${topic.topic_name}\nConfidence: ${topic.confidence_score}%\nGrowth Rate: ${topic.growth_rate}%\nIndustry: ${topic.industry}\nFirst Detected: ${topic.first_detected}\n`
                ).join('\n---\n')}`
              }]
            };
          }

          case "regulatory_change_monitoring": {
            const { jurisdiction, regulatory_areas = [], urgency_filter = 'all' } = args as any;
            
            let query = `
              SELECT * FROM regulatory_changes 
              WHERE jurisdiction ILIKE $1
            `;
            const queryParams = [`%${jurisdiction}%`];
            
            if (urgency_filter !== 'all') {
              query += ` AND urgency_level = $${queryParams.length + 1}`;
              queryParams.push(urgency_filter);
            }
            
            query += ` ORDER BY created_at DESC`;

            const result = await this.db!.query(query, queryParams);

            if (result.rows.length === 0) {
              await this.createSampleRegulatoryChanges(jurisdiction);
              const retryResult = await this.db!.query(query, queryParams);
              
              return {
                content: [{
                  type: "text",
                  text: `Regulatory Changes in ${jurisdiction}:\n\n${retryResult.rows.map((change: any) => 
                    `${change.regulatory_area} - ${change.change_type}\nUrgency: ${change.urgency_level}\n${change.description}\nEffective Date: ${change.effective_date}\n`
                  ).join('\n---\n')}`
                }]
              };
            }

            return {
              content: [{
                type: "text",
                text: `Regulatory Changes in ${jurisdiction}:\n\n${result.rows.map((change: any) => 
                  `${change.regulatory_area} - ${change.change_type}\nUrgency: ${change.urgency_level}\n${change.description}\nEffective Date: ${change.effective_date}\n`
                ).join('\n---\n')}`
              }]
            };
          }

          case "executive_movement_tracking": {
            const { industries = [], executive_levels = [], company_size = 'all' } = args as any;
            
            const movements = [];
            
            try {
              console.log(`👔 Tracking executive movements in ${industries.join(', ') || 'all industries'}`);
              
              // Build search terms for executive movements
              const searchTerms = [
                'CEO OR "chief executive" OR "executive appointment" OR "joins as" OR "named as"',
                'CTO OR "chief technology" OR "chief technical officer"',
                'CFO OR "chief financial officer" OR "head of finance"',
                'CMO OR "chief marketing" OR "head of marketing"',
                'COO OR "chief operating" OR "head of operations"',
                '"executive departure" OR "steps down" OR "resigns" OR "leaving"'
              ];

              // If specific industries provided, add them to search
              if (industries.length > 0) {
                const industryTerms = industries.map((industry: string) => 
                  searchTerms.map(term => `(${term}) AND "${industry}"`)
                ).flat();
                searchTerms.push(...industryTerms);
              }
              
              // Search NewsAPI for executive movements
              for (const searchTerm of searchTerms) {
                try {
                  const newsResponse = await callNewsAPI('/everything', {
                    'q': searchTerm,
                    'language': 'en',
                    'sortBy': 'publishedAt',
                    'pageSize': '10',
                    'from': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 30 days
                  });

                  for (const article of newsResponse.articles || []) {
                    const movement = this.extractExecutiveMovement(article);
                    if (movement) {
                      movements.push({
                        ...movement,
                        source_url: article.url,
                        source_name: article.source?.name || 'News',
                        published_at: article.publishedAt,
                        author: article.author,
                        article_title: article.title,
                        description: article.description
                      });
                    }
                  }
                } catch (error) {
                  console.error(`NewsAPI search error for ${searchTerm}:`, error);
                }
              }

              // Search Google for press releases about executive changes
              try {
                const googleQueries = [
                  'executive appointment OR "named CEO" OR "joins as" site:businesswire.com OR site:prnewswire.com',
                  'executive departure OR "steps down" OR "resigns" site:businesswire.com OR site:prnewswire.com'
                ];

                for (const query of googleQueries) {
                  const googleResponse = await searchGoogle(query);
                  
                  for (const item of googleResponse.items || []) {
                    const movement = this.extractExecutiveMovementFromText(item.title, item.snippet);
                    if (movement) {
                      movements.push({
                        ...movement,
                        source_url: item.link,
                        source_name: 'Press Release',
                        published_at: new Date().toISOString(),
                        author: 'PR Wire',
                        article_title: item.title,
                        description: item.snippet
                      });
                    }
                  }
                }
              } catch (error) {
                console.error(`Google search error for executive movements:`, error);
              }

              // Search Reddit for executive movement discussions
              try {
                const businessSubreddits = ['business', 'investing', 'technology', 'startups'];
                for (const subreddit of businessSubreddits) {
                  const redditResponse = await searchReddit(subreddit, 'CEO OR executive OR appointment OR resignation');
                  
                  for (const post of redditResponse.data?.children || []) {
                    const postData = post.data;
                    if (postData.title && postData.created_utc > (Date.now() / 1000) - (30 * 24 * 60 * 60)) {
                      const movement = this.extractExecutiveMovementFromText(postData.title, postData.selftext);
                      if (movement && postData.score > 20) { // Only high-engagement posts
                        movements.push({
                          ...movement,
                          source_url: `https://reddit.com${postData.permalink}`,
                          source_name: `Reddit r/${subreddit}`,
                          published_at: new Date(postData.created_utc * 1000).toISOString(),
                          author: postData.author,
                          article_title: postData.title,
                          description: postData.selftext || '',
                          engagement_score: postData.score
                        });
                      }
                    }
                  }
                }
              } catch (error) {
                console.error(`Reddit search error for executive movements:`, error);
              }

              // Filter by executive levels if specified
              let filteredMovements = movements;
              if (executive_levels.length > 0) {
                filteredMovements = movements.filter(movement => 
                  executive_levels.some((level: any) => 
                    movement.position?.toLowerCase().includes(level.toLowerCase()) ||
                    movement.executive_level === level
                  )
                );
              }

              // Store movements in database
              for (const movement of filteredMovements) {
                await this.storeExecutiveMovement(movement);
              }

              // Sort by impact score and recency
              filteredMovements.sort((a, b) => {
                const scoreA = a.impact_score * (new Date(a.published_at).getTime() / 1000000000);
                const scoreB = b.impact_score * (new Date(b.published_at).getTime() / 1000000000);
                return scoreB - scoreA;
              });

              const topMovements = filteredMovements.slice(0, 25); // Return top 25 movements

              return {
                content: [{
                  type: "text",
                  text: `👔 Executive Movement Intelligence Report\n` +
                        `Found ${topMovements.length} significant executive movements in the last 30 days\n\n` +
                        `${executive_levels.length > 0 ? `Filtered for: ${executive_levels.join(', ')}\n` : ''}` +
                        `${industries.length > 0 ? `Industries: ${industries.join(', ')}\n` : ''}\n` +
                        topMovements.map(movement => 
                          `👤 ${movement.executive_name || 'Executive'}\n` +
                          `🏢 ${movement.movement_type === 'departure' ? 
                            `Leaving ${movement.previous_company || movement.company}` : 
                            `${movement.previous_company ? `${movement.previous_company} → ` : ''}${movement.new_company || movement.company}`}\n` +
                          `💼 Position: ${movement.position}\n` +
                          `🏭 Industry: ${movement.industry}\n` +
                          `📊 Impact Score: ${movement.impact_score}/100\n` +
                          `📅 ${new Date(movement.published_at).toLocaleDateString()}\n` +
                          `🔗 Source: ${movement.source_name}\n` +
                          `${movement.source_url}\n`
                        ).join('\n---\n') +
                        `\n\n📈 Insights:\n` +
                        `• ${topMovements.filter(m => m.movement_type === 'appointment').length} new appointments detected\n` +
                        `• ${topMovements.filter(m => m.movement_type === 'departure').length} executive departures identified\n` +
                        `• ${topMovements.filter(m => m.impact_score >= 80).length} high-impact movements (80+ score)\n` +
                        `• Most active industries: ${this.getTopIndustries(topMovements)}\n\n` +
                        `🎯 Recommended Actions:\n` +
                        `• Monitor high-impact appointments for partnership opportunities\n` +
                        `• Track departures for potential talent acquisition\n` +
                        `• Prepare executive briefings for industry shifts\n` +
                        `• Set up alerts for C-suite changes in target companies`
                }]
              };

            } catch (error) {
              console.error('Executive movement tracking error:', error);
              return {
                content: [{
                  type: "text",
                  text: `❌ Error tracking executive movements: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
                        `This may be due to API rate limits or connectivity issues. ` +
                        `Try again in a few minutes or check your API key configuration.`
                }]
              };
            }
          }

          case "partnership_opportunity_detection": {
            const { company_profile, partnership_types = [], target_company_size = 'any' } = args as any;
            
            // This would integrate with external APIs and databases in production
            // For now, return strategic recommendations based on the profile
            
            return {
              content: [{
                type: "text",
                text: `Partnership Opportunities for: ${company_profile}

Recommended Partnership Types: ${partnership_types.join(', ') || 'technology, strategic, distribution'}

Strategic Recommendations:
1. Technology partnerships with complementary service providers
2. Distribution partnerships with companies serving similar markets
3. Strategic alliances with industry leaders for credibility
4. Marketing partnerships for co-branded initiatives

Next Steps:
- Research potential partners in your industry vertical
- Analyze partnership announcements from competitors
- Identify companies with complementary capabilities
- Prepare partnership proposal templates

Target Company Size: ${target_company_size}
Recommended Approach: Start with companies of similar size for mutual benefit`
              }]
            };
          }

          case "whitespace_analysis": {
            const { topic, coverage_period = 'month', publication_types = [] } = args as any;
            
            // This would analyze media coverage patterns in production
            // For now, provide strategic whitespace analysis
            
            return {
              content: [{
                type: "text",
                text: `Whitespace Analysis for: ${topic}

Coverage Period: ${coverage_period}

Identified Gaps:
1. Underrepresented perspectives on ${topic}
2. Technical deep-dives lacking in current coverage
3. International angles missing from US-focused stories
4. Small business impact stories underreported
5. Future implications and predictions sparse

Opportunity Areas:
- Expert commentary on technical aspects
- Case studies from different industries
- International market perspectives
- SMB/enterprise contrast stories
- Prediction and trend analysis

Recommended Actions:
1. Position as thought leader in identified gaps
2. Develop content addressing underreported angles
3. Prepare expert commentary for breaking news
4. Create original research to fill data gaps

Publication Types to Target: ${publication_types.join(', ') || 'trade publications, major newspapers, industry blogs'}`
              }]
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        console.error(`Error executing tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error}`
        );
      }
    });
  }

  private getTimeframeDate(timeframe: string): string {
    const now = new Date();
    switch (timeframe) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
  }

  private getTimeframeTimestamp(timeframe: string): number {
    const now = Date.now() / 1000; // Unix timestamp
    switch (timeframe) {
      case '24h':
        return now - (24 * 60 * 60);
      case 'week':
        return now - (7 * 24 * 60 * 60);
      case 'month':
        return now - (30 * 24 * 60 * 60);
      default:
        return now - (7 * 24 * 60 * 60);
    }
  }

  private detectMoveType(article: any, allowedTypes: string[]): string | null {
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    // Check for hiring moves
    if (allowedTypes.includes('hiring') && 
        (text.includes('hire') || text.includes('appointment') || text.includes('joins') || 
         text.includes('ceo') || text.includes('cto') || text.includes('executive'))) {
      return 'hiring';
    }
    
    // Check for product moves
    if (allowedTypes.includes('product') && 
        (text.includes('launch') || text.includes('release') || text.includes('product') || 
         text.includes('feature') || text.includes('service'))) {
      return 'product';
    }
    
    // Check for campaign moves
    if (allowedTypes.includes('campaign') && 
        (text.includes('campaign') || text.includes('marketing') || text.includes('announce'))) {
      return 'campaign';
    }
    
    // Check for partnership moves
    if (allowedTypes.includes('partnership') && 
        (text.includes('partner') || text.includes('collaboration') || text.includes('alliance'))) {
      return 'partnership';
    }
    
    // Check for funding moves
    if (allowedTypes.includes('funding') && 
        (text.includes('funding') || text.includes('investment') || text.includes('funding round') || 
         text.includes('series') || text.includes('venture'))) {
      return 'funding';
    }
    
    return null;
  }

  private detectMoveTypeFromText(text: string, allowedTypes: string[]): string | null {
    const lowerText = text.toLowerCase();
    
    // Similar logic but for plain text
    if (allowedTypes.includes('hiring') && 
        (lowerText.includes('hire') || lowerText.includes('appointment') || lowerText.includes('joins') || 
         lowerText.includes('ceo') || lowerText.includes('cto') || lowerText.includes('executive'))) {
      return 'hiring';
    }
    
    if (allowedTypes.includes('product') && 
        (lowerText.includes('launch') || lowerText.includes('release') || lowerText.includes('product') || 
         lowerText.includes('feature') || lowerText.includes('service'))) {
      return 'product';
    }
    
    if (allowedTypes.includes('campaign') && 
        (lowerText.includes('campaign') || lowerText.includes('marketing') || lowerText.includes('announce'))) {
      return 'campaign';
    }
    
    if (allowedTypes.includes('partnership') && 
        (lowerText.includes('partner') || lowerText.includes('collaboration') || lowerText.includes('alliance'))) {
      return 'partnership';
    }
    
    if (allowedTypes.includes('funding') && 
        (lowerText.includes('funding') || lowerText.includes('investment') || lowerText.includes('funding round') || 
         lowerText.includes('series') || lowerText.includes('venture'))) {
      return 'funding';
    }
    
    return null;
  }

  private calculateImpactScore(article: any, competitor: string): number {
    let score = 50; // Base score
    
    const text = `${article.title} ${article.description}`.toLowerCase();
    const companyInTitle = article.title?.toLowerCase().includes(competitor.toLowerCase());
    
    // Higher score if company is in the title
    if (companyInTitle) score += 20;
    
    // Score based on content significance
    if (text.includes('ceo') || text.includes('merger') || text.includes('acquisition')) score += 30;
    if (text.includes('funding') || text.includes('investment')) score += 25;
    if (text.includes('launch') || text.includes('product')) score += 15;
    if (text.includes('partnership') || text.includes('alliance')) score += 10;
    
    // Score based on source credibility
    const source = article.source?.name?.toLowerCase() || '';
    if (source.includes('reuters') || source.includes('bloomberg') || source.includes('wsj')) score += 15;
    if (source.includes('techcrunch') || source.includes('verge')) score += 10;
    
    return Math.min(score, 100);
  }

  private calculateImpactFromText(text: string): number {
    let score = 40; // Base score for text-only
    
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('ceo') || lowerText.includes('merger') || lowerText.includes('acquisition')) score += 30;
    if (lowerText.includes('funding') || lowerText.includes('investment')) score += 25;
    if (lowerText.includes('launch') || lowerText.includes('product')) score += 15;
    if (lowerText.includes('partnership') || lowerText.includes('alliance')) score += 10;
    
    return Math.min(score, 100);
  }

  private async storeCompetitorMove(move: any) {
    try {
      await this.db!.query(
        `INSERT INTO competitor_moves (competitor_name, move_type, description, impact_score, source_url, detected_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (competitor_name, description, detected_at) DO NOTHING`,
        [
          move.competitor_name,
          move.move_type,
          move.description,
          move.impact_score,
          move.source_url,
          move.detected_at,
          JSON.stringify({
            detailed_description: move.detailed_description,
            source_name: move.source_name,
            author: move.author
          })
        ]
      );
    } catch (error) {
      console.error('Error storing competitor move:', error);
    }
  }

  private extractNarrative(article: any, industry: string): { text: string; themes: string[] } | null {
    const title = article.title || '';
    const description = article.description || '';
    const text = `${title} ${description}`.toLowerCase();
    
    // Check if article is relevant to industry
    if (!text.includes(industry.toLowerCase())) {
      return null;
    }
    
    // Extract key themes
    const themes = [];
    if (text.includes('growth') || text.includes('expand')) themes.push('Growth');
    if (text.includes('regulation') || text.includes('policy')) themes.push('Regulation');
    if (text.includes('innovation') || text.includes('technology')) themes.push('Innovation');
    if (text.includes('investment') || text.includes('funding')) themes.push('Investment');
    if (text.includes('competition') || text.includes('market share')) themes.push('Competition');
    if (text.includes('customer') || text.includes('consumer')) themes.push('Customer Behavior');
    
    return {
      text: title,
      themes: themes.length > 0 ? themes : ['General']
    };
  }

  private extractNarrativeFromText(title: string, snippet: string, industry: string): { text: string; themes: string[] } | null {
    const text = `${title} ${snippet}`.toLowerCase();
    
    // Check if content is relevant to industry
    if (!text.includes(industry.toLowerCase())) {
      return null;
    }
    
    // Extract key themes
    const themes = [];
    if (text.includes('growth') || text.includes('expand')) themes.push('Growth');
    if (text.includes('regulation') || text.includes('policy')) themes.push('Regulation');
    if (text.includes('innovation') || text.includes('technology')) themes.push('Innovation');
    if (text.includes('investment') || text.includes('funding')) themes.push('Investment');
    if (text.includes('competition') || text.includes('market share')) themes.push('Competition');
    if (text.includes('customer') || text.includes('consumer')) themes.push('Customer Behavior');
    
    return {
      text: title,
      themes: themes.length > 0 ? themes : ['General']
    };
  }

  private calculateSentiment(article: any): number {
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    let score = 5; // Neutral baseline
    
    // Positive indicators
    if (text.includes('growth') || text.includes('success') || text.includes('breakthrough')) score += 2;
    if (text.includes('launch') || text.includes('expand') || text.includes('opportunity')) score += 1;
    if (text.includes('innovation') || text.includes('advancement')) score += 1;
    
    // Negative indicators
    if (text.includes('crisis') || text.includes('decline') || text.includes('fail')) score -= 2;
    if (text.includes('concern') || text.includes('challenge') || text.includes('problem')) score -= 1;
    if (text.includes('regulation') || text.includes('restriction')) score -= 1;
    
    return Math.max(1, Math.min(10, score));
  }

  private calculateSentimentFromText(text: string): number {
    const lowerText = text.toLowerCase();
    
    let score = 5; // Neutral baseline
    
    // Positive indicators
    if (lowerText.includes('growth') || lowerText.includes('success') || lowerText.includes('breakthrough')) score += 2;
    if (lowerText.includes('launch') || lowerText.includes('expand') || lowerText.includes('opportunity')) score += 1;
    if (lowerText.includes('innovation') || lowerText.includes('advancement')) score += 1;
    
    // Negative indicators
    if (lowerText.includes('crisis') || lowerText.includes('decline') || lowerText.includes('fail')) score -= 2;
    if (lowerText.includes('concern') || lowerText.includes('challenge') || lowerText.includes('problem')) score -= 1;
    if (lowerText.includes('regulation') || lowerText.includes('restriction')) score -= 1;
    
    return Math.max(1, Math.min(10, score));
  }

  private detectTrend(article: any): string {
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    if (text.includes('growth') || text.includes('increase') || text.includes('rise') || text.includes('boom')) {
      return 'positive';
    }
    if (text.includes('decline') || text.includes('fall') || text.includes('crisis') || text.includes('concern')) {
      return 'concerning';
    }
    if (text.includes('stable') || text.includes('maintain') || text.includes('steady')) {
      return 'stable';
    }
    
    return 'neutral';
  }

  private detectTrendFromText(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('growth') || lowerText.includes('increase') || lowerText.includes('rise') || lowerText.includes('boom')) {
      return 'positive';
    }
    if (lowerText.includes('decline') || lowerText.includes('fall') || lowerText.includes('crisis') || lowerText.includes('concern')) {
      return 'concerning';
    }
    if (lowerText.includes('stable') || lowerText.includes('maintain') || lowerText.includes('steady')) {
      return 'stable';
    }
    
    return 'neutral';
  }

  private aggregateNarratives(narratives: any[]): any[] {
    // Group by similar themes and sentiment
    const grouped = new Map();
    
    for (const narrative of narratives) {
      const key = `${narrative.trend_direction}_${narrative.themes?.[0] || 'General'}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          ...narrative,
          source_count: 1,
          sources: [narrative.source_name]
        });
      } else {
        const existing = grouped.get(key);
        existing.source_count += 1;
        existing.sources.push(narrative.source_name);
        // Update sentiment with running average
        if (narrative.sentiment_score && existing.sentiment_score) {
          existing.sentiment_score = (existing.sentiment_score + narrative.sentiment_score) / 2;
        }
      }
    }
    
    return Array.from(grouped.values()).sort((a, b) => b.source_count - a.source_count);
  }

  private generateStrategicInsights(narratives: any[], industry: any): string {
    const totalNarratives = narratives.length;
    const positiveCount = narratives.filter(n => n.trend_direction === 'positive').length;
    const concerningCount = narratives.filter(n => n.trend_direction === 'concerning').length;
    
    if (positiveCount > concerningCount) {
      return `The ${industry} sector shows predominantly positive momentum (${positiveCount}/${totalNarratives} positive narratives). Consider aggressive market positioning and thought leadership.`;
    } else if (concerningCount > positiveCount) {
      return `The ${industry} sector faces significant challenges (${concerningCount}/${totalNarratives} concerning narratives). Focus on defensive communications and crisis preparedness.`;
    } else {
      return `The ${industry} sector shows mixed signals. Balanced approach needed with both opportunity capture and risk mitigation strategies.`;
    }
  }

  private async storeMarketNarrative(narrative: any) {
    try {
      await this.db!.query(
        `INSERT INTO market_narratives (industry, narrative_text, sentiment_score, trend_direction, source_count, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (industry, narrative_text) DO UPDATE SET
         source_count = market_narratives.source_count + 1,
         metadata = $6`,
        [
          narrative.industry,
          narrative.narrative_text,
          narrative.sentiment_score,
          narrative.trend_direction,
          narrative.source_count,
          JSON.stringify({
            themes: narrative.themes,
            source_name: narrative.source_name,
            source_url: narrative.source_url,
            author: narrative.author
          })
        ]
      );
    } catch (error) {
      console.error('Error storing market narrative:', error);
    }
  }

  private extractExecutiveMovement(article: any): any | null {
    const title = article.title || '';
    const description = article.description || '';
    const text = `${title} ${description}`.toLowerCase();
    
    // Check if it's an executive movement
    const executiveTerms = ['ceo', 'cto', 'cfo', 'cmo', 'coo', 'chief', 'executive', 'president', 'director'];
    const movementTerms = ['appoint', 'join', 'hire', 'name', 'resign', 'depart', 'leave', 'step down'];
    
    const hasExecutive = executiveTerms.some(term => text.includes(term));
    const hasMovement = movementTerms.some(term => text.includes(term));
    
    if (!hasExecutive || !hasMovement) {
      return null;
    }
    
    // Extract executive details
    const movement = {
      executive_name: this.extractExecutiveName(title, description),
      position: this.extractPosition(title, description),
      company: this.extractCompany(title, description),
      new_company: null as string | null,
      previous_company: null as string | null,
      industry: this.inferIndustry(title, description),
      movement_type: this.detectMovementType(text),
      impact_score: this.calculateExecutiveImpactScore(title, description),
      executive_level: this.determineExecutiveLevel(title, description)
    };
    
    // Try to extract company transitions
    const transition = this.extractCompanyTransition(title, description);
    if (transition) {
      movement.previous_company = transition.from;
      movement.new_company = transition.to;
    }
    
    return movement;
  }

  private extractExecutiveMovementFromText(title: string, snippet: string): any | null {
    const text = `${title} ${snippet}`.toLowerCase();
    
    // Check if it's an executive movement
    const executiveTerms = ['ceo', 'cto', 'cfo', 'cmo', 'coo', 'chief', 'executive', 'president', 'director'];
    const movementTerms = ['appoint', 'join', 'hire', 'name', 'resign', 'depart', 'leave', 'step down'];
    
    const hasExecutive = executiveTerms.some(term => text.includes(term));
    const hasMovement = movementTerms.some(term => text.includes(term));
    
    if (!hasExecutive || !hasMovement) {
      return null;
    }
    
    return {
      executive_name: this.extractExecutiveName(title, snippet),
      position: this.extractPosition(title, snippet),
      company: this.extractCompany(title, snippet),
      new_company: null as string | null,
      previous_company: null as string | null,
      industry: this.inferIndustry(title, snippet),
      movement_type: this.detectMovementType(text),
      impact_score: this.calculateExecutiveImpactScore(title, snippet),
      executive_level: this.determineExecutiveLevel(title, snippet)
    };
  }

  private extractExecutiveName(title: string, description: string): string {
    // Simple name extraction - looks for capitalized words near executive terms
    const text = title + ' ' + description;
    const namePattern = /([A-Z][a-z]+ [A-Z][a-z]+)/g;
    const names = text.match(namePattern);
    
    if (names && names.length > 0) {
      // Return the first name found (usually the executive)
      return names[0];
    }
    
    return 'Executive Name Not Extracted';
  }

  private extractPosition(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    const positions = [
      'chief executive officer', 'ceo',
      'chief technology officer', 'cto',
      'chief financial officer', 'cfo',
      'chief marketing officer', 'cmo',
      'chief operating officer', 'coo',
      'president', 'vice president', 'vp',
      'head of', 'director of', 'senior director'
    ];
    
    for (const position of positions) {
      if (text.includes(position)) {
        return position.toUpperCase();
      }
    }
    
    return 'Executive Position';
  }

  private extractCompany(title: string, description: string): string {
    // Simple company extraction - looks for capitalized words or known patterns
    const text = title + ' ' + description;
    
    // Look for patterns like "at Company" or "Company announces"
    const companyPatterns = [
      /at ([A-Z][a-zA-Z\s]+)(?=\s|$|,|\.)/g,
      /([A-Z][a-zA-Z\s]+) announces/gi,
      /([A-Z][a-zA-Z\s]+) appoints/gi,
      /([A-Z][a-zA-Z\s]+) names/gi
    ];
    
    for (const pattern of companyPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0].replace(/^(at|announces|appoints|names)\s*/gi, '').trim();
      }
    }
    
    return 'Company Name Not Extracted';
  }

  private extractCompanyTransition(title: string, description: string): { from: string; to: string } | null {
    const text = `${title} ${description}`;
    
    // Look for transition patterns like "from X to Y" or "leaves X for Y"
    const transitionPatterns = [
      /from\s+([^to]+?)\s+to\s+([^\.]+)/gi,
      /leaves?\s+([^for]+?)\s+for\s+([^\.]+)/gi,
      /([^to]+?)\s+to\s+([^\.]+)/gi
    ];
    
    for (const pattern of transitionPatterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          from: match[1]?.trim() || '',
          to: match[2]?.trim() || ''
        };
      }
    }
    
    return null;
  }

  private inferIndustry(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    const industries = {
      'technology': ['tech', 'software', 'ai', 'digital', 'data', 'cloud', 'cyber'],
      'finance': ['bank', 'financial', 'investment', 'capital', 'fund', 'insurance'],
      'healthcare': ['health', 'medical', 'pharma', 'biotech', 'hospital', 'drug'],
      'retail': ['retail', 'commerce', 'shopping', 'consumer', 'brand'],
      'energy': ['energy', 'oil', 'renewable', 'solar', 'gas', 'utility'],
      'automotive': ['auto', 'car', 'vehicle', 'transport', 'mobility'],
      'media': ['media', 'entertainment', 'news', 'television', 'streaming']
    };
    
    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry.charAt(0).toUpperCase() + industry.slice(1);
      }
    }
    
    return 'General';
  }

  private detectMovementType(text: string): string {
    const departureTerms = ['resign', 'depart', 'leave', 'step down', 'exit'];
    const appointmentTerms = ['appoint', 'join', 'hire', 'name', 'promote'];
    
    if (departureTerms.some(term => text.includes(term))) {
      return 'departure';
    }
    if (appointmentTerms.some(term => text.includes(term))) {
      return 'appointment';
    }
    
    return 'movement';
  }

  private calculateExecutiveImpactScore(title: string, description: string): number {
    let score = 40; // Base score
    
    const text = `${title} ${description}`.toLowerCase();
    
    // High-impact positions
    if (text.includes('ceo') || text.includes('chief executive')) score += 30;
    if (text.includes('cto') || text.includes('chief technology')) score += 25;
    if (text.includes('cfo') || text.includes('chief financial')) score += 25;
    if (text.includes('president')) score += 20;
    
    // Company size indicators
    if (text.includes('fortune') || text.includes('unicorn') || text.includes('billion')) score += 20;
    if (text.includes('startup') || text.includes('series')) score += 10;
    
    // Industry significance
    if (text.includes('first') || text.includes('inaugural') || text.includes('historic')) score += 15;
    
    return Math.min(score, 100);
  }

  private determineExecutiveLevel(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('ceo') || text.includes('chief executive') || text.includes('president')) {
      return 'C-suite';
    }
    if (text.includes('cto') || text.includes('cfo') || text.includes('cmo') || text.includes('coo')) {
      return 'C-suite';
    }
    if (text.includes('vp') || text.includes('vice president')) {
      return 'VP';
    }
    if (text.includes('director') || text.includes('head of')) {
      return 'Director';
    }
    
    return 'Senior';
  }

  private getTopIndustries(movements: any[]): string {
    const industryCount = new Map();
    
    for (const movement of movements) {
      const industry = movement.industry || 'Unknown';
      industryCount.set(industry, (industryCount.get(industry) || 0) + 1);
    }
    
    const sorted = Array.from(industryCount.entries()).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 3).map(([industry, count]) => `${industry} (${count})`).join(', ');
  }

  private async storeExecutiveMovement(movement: any) {
    try {
      await this.db!.query(
        `INSERT INTO executive_movements (executive_name, previous_company, new_company, position, industry, announcement_date, impact_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (executive_name, position, announcement_date) DO NOTHING`,
        [
          movement.executive_name,
          movement.previous_company,
          movement.new_company || movement.company,
          movement.position,
          movement.industry,
          movement.published_at ? new Date(movement.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          movement.impact_score
        ]
      );
    } catch (error) {
      console.error('Error storing executive movement:', error);
    }
  }

  private async createSampleCompetitorMoves(competitors: string[]) {
    const sampleMoves = [
      {
        competitor: competitors[0] || 'TechCorp',
        type: 'hiring',
        description: 'Hired former Google AI researcher as Chief Technology Officer',
        impact: 85
      },
      {
        competitor: competitors[0] || 'TechCorp',
        type: 'product',
        description: 'Launched new enterprise AI platform targeting financial services',
        impact: 90
      }
    ];

    for (const move of sampleMoves) {
      await this.db!.query(
        `INSERT INTO competitor_moves (competitor_name, move_type, description, impact_score)
         VALUES ($1, $2, $3, $4)`,
        [move.competitor, move.type, move.description, move.impact]
      );
    }
  }

  private async createSampleMarketNarratives(industry: string) {
    const narratives = [
      {
        narrative: `${industry} sector showing increased investment in automation and efficiency`,
        sentiment: 7.5,
        trend: 'positive',
        sources: 15
      },
      {
        narrative: `Regulatory scrutiny increasing for ${industry} companies regarding data privacy`,
        sentiment: 4.2,
        trend: 'concerning',
        sources: 8
      }
    ];

    for (const narrative of narratives) {
      await this.db!.query(
        `INSERT INTO market_narratives (industry, narrative_text, sentiment_score, trend_direction, source_count)
         VALUES ($1, $2, $3, $4, $5)`,
        [industry, narrative.narrative, narrative.sentiment, narrative.trend, narrative.sources]
      );
    }
  }

  private async createSampleEmergingTopics() {
    const topics = [
      {
        name: 'Quantum-resistant cryptography',
        confidence: 85,
        industry: 'Technology',
        growth: 45.2
      },
      {
        name: 'Decentralized autonomous organizations (DAOs)',
        confidence: 78,
        industry: 'Finance',
        growth: 67.8
      }
    ];

    for (const topic of topics) {
      await this.db!.query(
        `INSERT INTO emerging_topics (topic_name, confidence_score, industry, growth_rate)
         VALUES ($1, $2, $3, $4)`,
        [topic.name, topic.confidence, topic.industry, topic.growth]
      );
    }
  }

  private async createSampleRegulatoryChanges(jurisdiction: string) {
    const changes = [
      {
        area: 'Data Privacy',
        type: 'New Regulation',
        description: 'Enhanced consumer data protection requirements',
        urgency: 'important',
        date: '2025-06-01'
      },
      {
        area: 'AI Governance',
        type: 'Policy Update',
        description: 'New guidelines for AI system transparency',
        urgency: 'critical',
        date: '2025-04-15'
      }
    ];

    for (const change of changes) {
      await this.db!.query(
        `INSERT INTO regulatory_changes (jurisdiction, regulatory_area, change_type, description, urgency_level, effective_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [jurisdiction, change.area, change.type, change.description, change.urgency, change.date]
      );
    }
  }

  private async createSampleExecutiveMovements() {
    const movements = [
      {
        name: 'Sarah Chen',
        previous: 'Microsoft',
        new: 'OpenAI',
        position: 'Chief Strategy Officer',
        industry: 'Technology',
        date: '2025-01-15',
        impact: 92
      },
      {
        name: 'Michael Rodriguez',
        previous: 'Goldman Sachs',
        new: 'Coinbase',
        position: 'Head of Institutional Sales',
        industry: 'Finance',
        date: '2025-01-20',
        impact: 78
      }
    ];

    for (const movement of movements) {
      await this.db!.query(
        `INSERT INTO executive_movements (executive_name, previous_company, new_company, position, industry, announcement_date, impact_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [movement.name, movement.previous, movement.new, movement.position, movement.industry, movement.date, movement.impact]
      );
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("SignalDesk Intelligence MCP server running");
  }
}

const server = new IntelligenceServer();
server.run().catch(console.error);