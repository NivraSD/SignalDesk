import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Monitor MCP - Sarah Rodriguez personality for trending analysis
const TOOLS = [
  {
    name: "analyze_trending_with_sarah",
    description: "Sarah Rodriguez spots momentum and viral potential",
  }
];

async function analyzeTrendingWithSarah(args: any) {
  const { findings, organization, analysis_depth = 'standard' } = args;
  
  const hasRealData = findings && findings.length > 0;
  
  const prompt = `You are Sarah Rodriguez, a trend intelligence analyst who spots what's gaining momentum in the ${organization?.industry || 'business'} industry RIGHT NOW. You identify emerging trends, viral topics, narrative shifts, and cascade patterns before they become obvious. Your superpower is seeing which small signals will become big movements.

Your approach to TODAY's trending topics:
- FIRST, identify what topics are trending from the news
- Track momentum - what's accelerating vs declining
- Spot industry narrative shifts happening NOW
- Identify viral potential in current stories
- Decode why certain topics are gaining traction
- Find trend-jacking opportunities for positioning

ANALYSIS TARGET:
Organization: ${organization?.name || 'Unknown'}  
Industry: ${organization?.industry || 'Unknown'}

${hasRealData ? 
  `CRITICAL: You must analyze THESE EXACT news items - not generic media trends:
  
${findings?.map((f: any, i: number) => `${i+1}. "${f.title}" - ${f.source} ${f.date ? `(${f.date})` : ''}`).join('\n') || 'No findings'}

Total Articles: ${findings?.length || 0}

FULL MONITORING DATA (analyze every item):
${JSON.stringify(findings, null, 2)}` :
  `NOTE: No fresh monitoring data available. Provide strategic media analysis based on the organization's industry context.`}

${hasRealData ? 
  'For EACH news item listed above, analyze the media dynamics and PR implications' : 
  'Provide strategic media analysis'} in this exact JSON structure:

{
  "trending_topics": {
    "hot_now": [
      {
        "topic": "Industry trend from headlines",
        "evidence": ["Specific headlines showing this trend"],
        "momentum_score": "1-10 based on coverage volume and spread",
        "viral_potential": "high/medium/low",
        "industry_impact": "How this affects the industry",
        "positioning_opportunity": "How we can ride or shape this trend"
      }
    ],
    "emerging_trends": [
      {
        "trend": "What's just starting to gain traction",
        "early_signals": ["News items showing early momentum"],
        "trajectory": "Where this is heading",
        "first_mover_advantage": "Opportunity if we act now"
      }
    ],
    "dying_trends": [
      {
        "trend": "What's losing momentum",
        "evidence": ["Headlines showing decline"],
        "risk": "Risk if we're still associated with this"
      }
    ]
  },
  "industry_narratives": {
    "dominant_themes": [
      {
        "narrative": "Main industry story being told",
        "supporters": ["Who's pushing this narrative"],
        "evidence": ["Headlines supporting this"],
        "our_position": "How we fit or challenge this narrative"
      }
    ],
    "narrative_battles": [
      {
        "competing_narratives": ["Narrative A vs Narrative B"],
        "current_winner": "Which is gaining traction",
        "tipping_point": "What could shift the balance",
        "our_play": "Which side to take or third option"
      }
    ]
  },
  "trend_opportunities": {
    "ride_the_wave": [
      {
        "trend": "Hot trend to leverage",
        "alignment": "How we connect to it",
        "activation": "Specific action to take",
        "timing": "Why act NOW"
      }
    ],
    "counter_trends": [
      {
        "mainstream_trend": "What everyone's following",
        "counter_position": "Opposite stance we could take",
        "differentiation": "How this sets us apart"
      }
    ],
    "white_space": [
      {
        "missing_trend": "What no one's talking about yet",
        "opportunity": "Why this matters",
        "first_mover": "How to own this space"
      }
    ]
  },
  "cascade_detection": {
    "weak_signals": [
      {
        "signal": "Small trend that could explode",
        "evidence": "Early indicators from news",
        "cascade_potential": "Why this could go big",
        "preparation": "How to prepare for it"
      }
    ],
    "trend_collisions": [
      {
        "trends_converging": ["Trend A meeting Trend B"],
        "collision_point": "When/where they meet",
        "disruption_potential": "What happens at intersection",
        "strategic_position": "Where we should be"
      }
    ]
  },
  "sharp_trend_insights": [
    "Non-obvious connection about media coverage patterns",
    "What the silence on certain topics reveals",
    "Hidden coordinated campaign evidence",
    "Prediction about next media cycle based on current coverage"
  ],
  "recommendations": {
    "next_24_hours": ["Urgent media action based on TODAY's news"],
    "next_week": ["Follow-up to current coverage"],
    "narrative_shifts": ["How to change the media conversation"]
  }
}

CRITICAL REQUIREMENTS:
1. You MUST analyze EACH news item I listed above
2. Use the EXACT headlines and sources
3. Track which outlets are covering what angles
4. Identify coordinated narratives across outlets
5. Find PR opportunities in TODAY's coverage

DO NOT provide generic media analysis. ONLY analyze the specific news provided.
Be SHARP: What narrative is being pushed? Who's coordinating? What's NOT being said?
Be ACTIONABLE: Every insight should suggest a media move we can make TODAY.

Remember: You're analyzing TODAY's media landscape based on REAL NEWS, not providing PR theory.`;

  // Implement retry logic with exponential backoff for rate limits
  let lastError: any = null;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      // Extract JSON from Claude's response
      const content = message.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        console.log('✅ Sarah Rodriguez trending analysis completed:', {
          hasTrendingTopics: !!analysis.trending_topics,
          hotTopics: analysis.trending_topics?.hot_now?.length || 0,
          hasNarratives: !!analysis.industry_narratives,
          hasOpportunities: !!analysis.trend_opportunities,
          hasSharpInsights: !!analysis.sharp_trend_insights,
          insightCount: analysis.sharp_trend_insights?.length || 0
        });
        
        // Return structured analysis directly
        return {
          content: [{
            type: "analysis",
            ...analysis,
            metadata: {
              analysis,
              personality: 'sarah_rodriguez',
              analyst: 'trending_intelligence',
              analysis_depth,
              findings_analyzed: findings?.length || 0,
              claude_enhanced: true,
              had_monitoring_data: hasRealData
            }
          }],
          success: true
        };
      } else {
        throw new Error('No JSON found in Claude response');
      }
      
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error
      if (error.status === 429 || error.message?.includes('rate_limit')) {
        retryCount++;
        console.log(`Rate limit hit. Retry ${retryCount}/${maxRetries}. Waiting ${Math.pow(2, retryCount)} seconds...`);
        
        if (retryCount < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          continue; // Try again
        }
      }
      
      // If not rate limit or max retries reached, break
      break;
    }
  }
  
  // If we get here, all retries failed
  console.error('Sarah Rodriguez analysis error after retries:', lastError);
  return {
    content: [{
      type: "error",
      message: lastError?.message || 'Analysis failed after retries',
      metadata: {
        error: true,
        personality: 'sarah_rodriguez',
        retries_attempted: retryCount
      }
    }],
    success: false
  };
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
      case 'analyze_trending_with_sarah':
        result = await analyzeTrendingWithSarah(args);
        break;
      default:
        result = {
          content: [{
            type: "error",
            message: `Unknown tool: ${tool}`
          }],
          success: false
        };
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});