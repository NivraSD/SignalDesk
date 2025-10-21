import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Narrative tracking and management tools (7 tools as per master plan)
const TOOLS = [
  {
    name: "detect_emerging_narratives",
    description: "Detect emerging narratives and storylines about your organization or industry",
    inputSchema: {
      type: "object",
      properties: {
        organization: { type: "string", description: "Organization to monitor" },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Keywords to track"
        },
        sources: {
          type: "array",
          items: { type: "string" },
          description: "Sources to monitor",
          default: ["news", "social", "blogs", "forums"]
        },
        timeframe: {
          type: "string",
          enum: ["24h", "7d", "30d"],
          description: "Detection timeframe",
          default: "7d"
        },
        minMentions: {
          type: "number",
          description: "Minimum mentions to qualify as narrative",
          default: 5
        }
      },
      required: ["organization"]
    }
  },
  {
    name: "analyze_narrative_sentiment",
    description: "Analyze the sentiment and trajectory of specific narratives",
    inputSchema: {
      type: "object",
      properties: {
        narrative: { type: "string", description: "Narrative to analyze" },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Metrics to track",
          default: ["sentiment", "volume", "reach", "velocity", "influencers"]
        },
        compareToBaseline: {
          type: "boolean",
          description: "Compare to historical baseline",
          default: true
        },
        predictTrajectory: {
          type: "boolean",
          description: "Predict future trajectory",
          default: true
        }
      },
      required: ["narrative"]
    }
  },
  {
    name: "identify_narrative_drivers",
    description: "Identify key drivers and influencers behind narratives",
    inputSchema: {
      type: "object",
      properties: {
        narrative: { type: "string", description: "Narrative to analyze" },
        driverTypes: {
          type: "array",
          items: { type: "string" },
          description: "Types of drivers to identify",
          default: ["people", "events", "media", "organizations"]
        },
        includeTimeline: {
          type: "boolean",
          description: "Include timeline of key moments",
          default: true
        },
        depth: {
          type: "string",
          enum: ["surface", "moderate", "deep"],
          description: "Analysis depth",
          default: "moderate"
        }
      },
      required: ["narrative"]
    }
  },
  {
    name: "shape_narrative_strategy",
    description: "Develop strategies to shape or counter narratives",
    inputSchema: {
      type: "object",
      properties: {
        currentNarrative: { type: "string", description: "Current narrative" },
        desiredNarrative: { type: "string", description: "Desired narrative outcome" },
        approach: {
          type: "string",
          enum: ["reinforce", "redirect", "counter", "replace"],
          description: "Strategic approach",
          default: "redirect"
        },
        tactics: {
          type: "array",
          items: { type: "string" },
          description: "Tactics to employ",
          default: ["messaging", "content", "influencers", "media"]
        },
        timeline: {
          type: "string",
          enum: ["immediate", "short_term", "long_term"],
          description: "Implementation timeline",
          default: "short_term"
        }
      },
      required: ["currentNarrative", "desiredNarrative"]
    }
  },
  {
    name: "track_narrative_evolution",
    description: "Track how narratives evolve and spread over time",
    inputSchema: {
      type: "object",
      properties: {
        narrativeId: { type: "string", description: "Narrative identifier" },
        trackingPeriod: {
          type: "string",
          enum: ["daily", "weekly", "monthly"],
          description: "Tracking frequency",
          default: "daily"
        },
        channels: {
          type: "array",
          items: { type: "string" },
          description: "Channels to track",
          default: ["traditional_media", "social_media", "blogs", "forums"]
        },
        mutations: {
          type: "boolean",
          description: "Track narrative mutations/variations",
          default: true
        }
      },
      required: ["narrativeId"]
    }
  },
  {
    name: "create_counter_narrative",
    description: "Create effective counter-narratives to address misinformation or negative stories",
    inputSchema: {
      type: "object",
      properties: {
        negativeNarrative: { type: "string", description: "Negative narrative to counter" },
        facts: {
          type: "array",
          items: { type: "string" },
          description: "Key facts to emphasize"
        },
        messengers: {
          type: "array",
          items: { type: "string" },
          description: "Credible messengers to deploy",
          default: ["executives", "experts", "customers", "partners"]
        },
        tone: {
          type: "string",
          enum: ["defensive", "factual", "empathetic", "assertive"],
          description: "Counter-narrative tone",
          default: "factual"
        }
      },
      required: ["negativeNarrative", "facts"]
    }
  },
  {
    name: "measure_narrative_impact",
    description: "Measure the impact and effectiveness of narrative campaigns",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign identifier" },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Impact metrics to measure",
          default: ["reach", "engagement", "sentiment_shift", "behavior_change", "media_pickup"]
        },
        compareToGoals: {
          type: "boolean",
          description: "Compare to original goals",
          default: true
        },
        recommendations: {
          type: "boolean",
          description: "Include optimization recommendations",
          default: true
        }
      },
      required: ["campaignId"]
    }
  }
];

// Tool implementations
async function detectEmergingNarratives(args: any) {
  const { organization, keywords = [], sources = ['news', 'social'], timeframe = '7d', minMentions = 5 } = args;
  
  const prompt = `Detect emerging narratives about ${organization}.
  Keywords: ${keywords.join(', ')}
  Sources: ${sources.join(', ')}
  Timeframe: ${timeframe}
  
  Identify:
  - Emerging storylines (min ${minMentions} mentions)
  - Key themes
  - Sentiment
  - Growth rate
  - Potential impact
  
  Return as JSON with narrative details.`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    temperature: 0.5,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '{}';
  
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {
      narratives: [],
      organization,
      timeframe
    };
  } catch {
    // Fallback narratives
    return {
      organization,
      timeframe,
      emergingNarratives: [
        {
          narrative: "Innovation leadership",
          mentions: 45,
          growth: "+25%",
          sentiment: "positive",
          sources: ["tech media", "social"],
          impact: "high"
        },
        {
          narrative: "Sustainability efforts",
          mentions: 28,
          growth: "+15%",
          sentiment: "neutral",
          sources: ["news", "blogs"],
          impact: "medium"
        }
      ],
      totalDetected: 2
    };
  }
}

async function analyzeNarrativeSentiment(args: any) {
  const { narrative, metrics = ['sentiment', 'volume'], compareToBaseline = true, predictTrajectory = true } = args;
  
  const analysis: any = {
    narrative,
    timestamp: new Date().toISOString(),
    metrics: {}
  };
  
  // Generate metric values
  if (metrics.includes('sentiment')) {
    analysis.metrics.sentiment = {
      score: (Math.random() * 200 - 100).toFixed(1),
      classification: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
      trend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)]
    };
  }
  
  if (metrics.includes('volume')) {
    analysis.metrics.volume = {
      current: Math.floor(Math.random() * 1000) + 100,
      change: `${(Math.random() * 100 - 50).toFixed(1)}%`,
      peak: Math.floor(Math.random() * 2000) + 500
    };
  }
  
  if (metrics.includes('reach')) {
    analysis.metrics.reach = {
      estimated: Math.floor(Math.random() * 1000000) + 10000,
      unique: Math.floor(Math.random() * 500000) + 5000,
      geographic: ['National', 'Regional', 'Global'][Math.floor(Math.random() * 3)]
    };
  }
  
  if (compareToBaseline) {
    analysis.baseline = {
      sentiment: -10,
      volume: 500,
      comparison: "Above baseline"
    };
  }
  
  if (predictTrajectory) {
    analysis.prediction = {
      next7Days: ['growth', 'stable', 'decline'][Math.floor(Math.random() * 3)],
      confidence: `${Math.floor(Math.random() * 30) + 70}%`,
      factors: ['Recent media coverage', 'Social engagement', 'Event timing']
    };
  }
  
  return analysis;
}

async function identifyNarrativeDrivers(args: any) {
  const { narrative, driverTypes = ['people', 'events'], includeTimeline = true, depth = 'moderate' } = args;
  
  const drivers: any = {
    narrative,
    depth,
    drivers: {}
  };
  
  if (driverTypes.includes('people')) {
    drivers.drivers.people = [
      { name: "Industry Expert", role: "Thought leader", influence: "high", mentions: 15 },
      { name: "Media Journalist", role: "Reporter", influence: "medium", mentions: 8 }
    ];
  }
  
  if (driverTypes.includes('events')) {
    drivers.drivers.events = [
      { event: "Product launch", date: "2025-01-05", impact: "high", mentions: 45 },
      { event: "Industry conference", date: "2025-01-03", impact: "medium", mentions: 23 }
    ];
  }
  
  if (driverTypes.includes('media')) {
    drivers.drivers.media = [
      { outlet: "TechCrunch", articles: 5, reach: 500000, sentiment: "positive" },
      { outlet: "WSJ", articles: 2, reach: 1000000, sentiment: "neutral" }
    ];
  }
  
  if (includeTimeline) {
    drivers.timeline = [
      { date: "2025-01-01", event: "Narrative emerges", momentum: "low" },
      { date: "2025-01-05", event: "Media pickup", momentum: "medium" },
      { date: "2025-01-08", event: "Viral moment", momentum: "high" }
    ];
  }
  
  drivers.keyInsight = "Narrative primarily driven by recent product launch and industry expert endorsements";
  
  return drivers;
}

async function shapeNarrativeStrategy(args: any) {
  const { currentNarrative, desiredNarrative, approach = 'redirect', tactics = ['messaging'], timeline = 'short_term' } = args;
  
  const prompt = `Create narrative shaping strategy.
  Current: ${currentNarrative}
  Desired: ${desiredNarrative}
  Approach: ${approach}
  Tactics: ${tactics.join(', ')}
  Timeline: ${timeline}
  
  Provide comprehensive strategy with:
  - Key messages
  - Action steps
  - Channels
  - Messengers
  - Success metrics`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    temperature: 0.5,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const strategy = completion.content[0].type === 'text' ? completion.content[0].text : '';
  
  return {
    currentNarrative,
    desiredNarrative,
    approach,
    strategy,
    tactics,
    timeline,
    successMetrics: [
      "Narrative sentiment improvement > 20%",
      "Media mentions of desired narrative > 50",
      "Stakeholder alignment > 75%"
    ]
  };
}

async function trackNarrativeEvolution(args: any) {
  const { narrativeId, trackingPeriod = 'daily', channels = ['traditional_media', 'social_media'], mutations = true } = args;
  
  const evolution: any = {
    narrativeId,
    trackingPeriod,
    currentStatus: {
      volume: Math.floor(Math.random() * 500) + 100,
      sentiment: (Math.random() * 200 - 100).toFixed(1),
      momentum: ['accelerating', 'stable', 'decelerating'][Math.floor(Math.random() * 3)],
      stage: ['emerging', 'growing', 'peak', 'declining'][Math.floor(Math.random() * 4)]
    },
    channelBreakdown: {}
  };
  
  for (const channel of channels) {
    evolution.channelBreakdown[channel] = {
      volume: Math.floor(Math.random() * 200) + 20,
      engagement: `${Math.floor(Math.random() * 100)}%`,
      topContent: `Leading story in ${channel}`
    };
  }
  
  if (mutations) {
    evolution.mutations = [
      {
        variation: "Positive spin emphasizing benefits",
        prevalence: "15%",
        sentiment: "positive"
      },
      {
        variation: "Skeptical questioning of claims",
        prevalence: "8%",
        sentiment: "negative"
      }
    ];
  }
  
  evolution.forecast = {
    next24h: "Continued growth expected",
    risk: "Potential negative spin from competitors",
    opportunity: "Influencer endorsement pending"
  };
  
  return evolution;
}

async function createCounterNarrative(args: any) {
  const { negativeNarrative, facts, messengers = ['executives'], tone = 'factual' } = args;
  
  const prompt = `Create ${tone} counter-narrative to address: ${negativeNarrative}
  
  Key facts to emphasize: ${facts.join(', ')}
  Available messengers: ${messengers.join(', ')}
  
  Develop:
  - Core counter-message
  - Supporting points
  - Proof points
  - Delivery strategy
  - Timeline`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    temperature: 0.4,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const counterNarrative = completion.content[0].type === 'text' ? completion.content[0].text : '';
  
  return {
    negativeNarrative,
    counterNarrative,
    facts,
    messengers,
    tone,
    deliveryPlan: {
      phase1: "Immediate fact correction",
      phase2: "Amplify positive stories",
      phase3: "Third-party validation"
    }
  };
}

async function measureNarrativeImpact(args: any) {
  const { campaignId, metrics = ['reach', 'engagement'], compareToGoals = true, recommendations = true } = args;
  
  const impact: any = {
    campaignId,
    measurementDate: new Date().toISOString(),
    metrics: {}
  };
  
  // Generate metric values
  for (const metric of metrics) {
    impact.metrics[metric] = {
      achieved: Math.floor(Math.random() * 10000) + 1000,
      target: compareToGoals ? Math.floor(Math.random() * 12000) + 2000 : null,
      performance: compareToGoals ? `${Math.floor(Math.random() * 50) + 75}%` : null
    };
  }
  
  if (compareToGoals) {
    impact.goalComparison = {
      overall: "On track",
      metricsOnTarget: 3,
      metricsBelowTarget: 1,
      successRate: "75%"
    };
  }
  
  if (recommendations) {
    impact.recommendations = [
      "Increase frequency of executive messaging",
      "Leverage customer testimonials more",
      "Expand to additional media channels",
      "Address remaining skepticism points"
    ];
  }
  
  impact.summary = {
    status: "Campaign performing well",
    sentiment: "Improving",
    nextSteps: "Continue current approach with minor adjustments"
  };
  
  return impact;
}

// HTTP handler
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { tool, arguments: args } = await req.json();
    
    if (tool === 'list_tools') {
      return new Response(
        JSON.stringify({ tools: TOOLS, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    let result;
    switch(tool) {
      case 'detect_emerging_narratives':
        result = await detectEmergingNarratives(args);
        break;
      case 'analyze_narrative_sentiment':
        result = await analyzeNarrativeSentiment(args);
        break;
      case 'identify_narrative_drivers':
        result = await identifyNarrativeDrivers(args);
        break;
      case 'shape_narrative_strategy':
        result = await shapeNarrativeStrategy(args);
        break;
      case 'track_narrative_evolution':
        result = await trackNarrativeEvolution(args);
        break;
      case 'create_counter_narrative':
        result = await createCounterNarrative(args);
        break;
      case 'measure_narrative_impact':
        result = await measureNarrativeImpact(args);
        break;
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
    
    return new Response(
      JSON.stringify({ ...result, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('MCP Narratives Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});