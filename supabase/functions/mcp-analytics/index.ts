import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Analytics MCP - Marcus Sterling personality for market intelligence
const TOOLS = [
  {
    name: "analyze_market",
    description: "Marcus Sterling analyzes market dynamics and opportunities",
  }
];

async function analyzeMarket(args: any) {
  const { findings, organization, analysis_depth = 'standard' } = args;
  
  const hasRealData = findings && findings.length > 0;
  
  const prompt = `You are Marcus Sterling, a razor-sharp market intelligence analyst who reads market signals like a quant reads trading patterns. You spot market shifts before they show up in quarterly reports, decode what analyst commentary really means, and identify the catalysts that will move markets based on TODAY's news.

Your superpower is connecting micro-events to macro-impacts - seeing how a single product delay signals supply chain issues, how an executive departure hints at strategy shifts, or how a regulatory comment previews market restructuring.

ANALYSIS TARGET:
Organization: ${organization?.name || 'Unknown'}
Industry: ${organization?.industry || 'Unknown'}

${hasRealData ? 
  `CRITICAL: You must analyze THESE EXACT news items for market intelligence:
  
${findings?.map((f: any, i: number) => `${i+1}. "${f.title}" - ${f.source} ${f.date ? `(${f.date})` : ''}`).join('\n') || 'No findings'}

Total Articles: ${findings?.length || 0}

FULL MONITORING DATA (extract every market signal):
${JSON.stringify(findings, null, 2)}` : 
  `NOTE: No fresh monitoring data available. Provide strategic market analysis based on the organization's industry context.`}

${hasRealData ? 
  'Extract ONLY information explicitly stated in the news articles. For any field without data in the news, write "Not mentioned in news" or leave the array empty []' : 
  'Provide strategic market analysis'} in this exact JSON structure:

{
  "market_position": {
    "current_position": "ONLY if ranking/position stated in news, else 'Not mentioned'",
    "market_share": "ONLY exact % if stated in news, else 'Not mentioned'",
    "competitive_standing": "ONLY if comparison made in news, else 'Not mentioned'",
    "momentum": "ONLY if trend explicitly stated, else 'Not mentioned'",
    "evidence": ["List EXACT headlines mentioning position, or empty []"],
    "key_metrics": [
      {
        "metric": "Name of metric (e.g., 'deliveries', 'revenue')",
        "value": "EXACT number from article",
        "trend": "up/down/flat ONLY if stated",
        "source": "EXACT article title"
      }
    ]
  },
  "market_dynamics": {
    "growth_drivers": [
      {
        "driver": "ONLY factors explicitly mentioned as driving growth",
        "evidence": "EXACT headline stating this",
        "strength": "ONLY if quantified, else 'Not quantified'",
        "duration": "ONLY if timeline given, else 'Not specified'"
      }
    ],
    "headwinds": [
      {
        "challenge": "ONLY challenges explicitly mentioned",
        "evidence": "EXACT headline stating this",
        "severity": "ONLY if quantified, else 'Not quantified'",
        "mitigation": "ONLY if response mentioned, else 'Not mentioned'"
      }
    ],
    "market_shifts": []
  },
  "upcoming_events": [
    {
      "event": "EXACT event name from news",
      "date": "EXACT date from news",
      "importance": "Assess: critical/high/medium based on coverage",
      "market_impact": "ONLY if discussed in article",
      "preparation_needed": "Not mentioned in news",
      "likely_outcome": "ONLY if predicted in article"
    }
  ],
  "analyst_perspectives": [
    {
      "analyst": "EXACT name/firm from news",
      "view": "EXACT quote or paraphrase",
      "source": "EXACT article title",
      "credibility": "Not assessed",
      "hidden_agenda": "Analysis of their position",
      "counter_narrative": "How to respond"
    }
  ],
  "growth_opportunities": [
    {
      "opportunity": "ONLY if opportunity explicitly mentioned",
      "evidence": "EXACT headline",
      "potential": "ONLY if quantified, else 'Not quantified'",
      "timeline": "ONLY if stated, else 'Not specified'",
      "requirements": "Not mentioned in news",
      "competition": "ONLY competitors named in article"
    }
  ],
  "market_risks": [
    {
      "risk": "ONLY risks explicitly mentioned",
      "evidence": "EXACT headline",
      "probability": "Not quantified in news",
      "impact": "ONLY if severity stated",
      "timeline": "ONLY if timing given",
      "mitigation": "Not mentioned in news"
    }
  ],
  "event_calendar": {
    "earnings": [],
    "product_launches": [],
    "regulatory_deadlines": [],
    "competitive_events": []
  },
  "sharp_market_insights": [
    "ONLY insights derived from connecting multiple news items",
    "Pattern identified from the specific headlines",
    "What the timing reveals about market dynamics"
  ],
  "recommendations": {
    "immediate_actions": ["Based on specific news items"],
    "event_preparation": ["For events mentioned in news"],
    "analyst_engagement": ["Response to analyst views in articles"],
    "market_positioning": ["Based on market signals in news"]
  }
}

ULTRA-CRITICAL REQUIREMENTS:
1. If a data point is NOT in the news, write "Not mentioned in news" or leave empty
2. NEVER invent dates - only use EXACT dates from articles
3. NEVER create percentages - only use EXACT numbers from news
4. NEVER add events not explicitly mentioned
5. For arrays, leave empty [] if no relevant news items
6. Every piece of data MUST trace to a specific headline
7. When in doubt, say "Not mentioned in news"

EXAMPLES OF WHAT TO EXTRACT:
- "Tesla Q4 deliveries miss estimates by 3%" → metric: "Q4 deliveries", value: "miss by 3%"
- "Morgan Stanley maintains $400 target" → analyst: "Morgan Stanley", view: "$400 target"
- "Earnings January 25" → event: "Q4 earnings", date: "January 25"

EXAMPLES OF WHAT NOT TO DO:
- DON'T say "18% market share" unless article states exactly "18% market share"
- DON'T add "Q1 2025" unless article mentions that exact timeframe
- DON'T predict outcomes unless article contains that prediction

Remember: Extract ONLY what's written in the news. Better to leave empty than to hallucinate.`;

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
      
      console.log('✅ Marcus Sterling market analysis completed:', {
        hasPosition: !!analysis.market_position,
        hasDynamics: !!analysis.market_dynamics,
        eventCount: analysis.upcoming_events?.length || 0,
        analystCount: analysis.analyst_perspectives?.length || 0,
        hasInsights: !!analysis.sharp_market_insights,
        insightCount: analysis.sharp_market_insights?.length || 0
      });
      
      // Return structured analysis directly
      return {
        content: [{
          type: "analysis",
          ...analysis,
          metadata: {
            analysis,
            personality: 'marcus_sterling',
            analyst: 'market_intelligence',
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
    console.error('Marcus Sterling market analysis error:', error);
    return {
      content: [{
        type: "error",
        message: error.message || 'Analysis failed',
        metadata: {
          error: true,
          personality: 'marcus_sterling'
        }
      }],
      success: false
    };
  }
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
      case 'analyze_market':
        result = await analyzeMarket(args);
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