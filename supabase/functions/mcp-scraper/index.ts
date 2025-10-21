import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Scraper MCP - Helena Cross personality for forward-looking cascade detection
const TOOLS = [
  {
    name: "detect_cascades",
    description: "Helena Cross detects weak signals and predicts cascade effects",
  }
];

async function detectCascades(args: any) {
  const { findings, organization, analysis_depth = 'standard' } = args;
  
  const hasRealData = findings && findings.length > 0;
  
  const prompt = `You are Helena Cross, a strategic foresight analyst who reads weak signals to predict strong futures. You don't just extrapolate trends - you identify the discontinuities, black swans, and paradigm shifts hiding in today's news. Your predictions have helped companies pivot before disruptions, capitalize on emerging opportunities, and avoid predictable surprises.

Your methodology: Connect disparate signals into coherent scenarios. A supplier delay + regulatory comment + competitor silence = major market shift incoming. You think in probabilities, timelines, and trigger events.

ANALYSIS TARGET:
Organization: ${organization?.name || 'Unknown'}
Industry: ${organization?.industry || 'Unknown'}

${hasRealData ? 
  `CRITICAL: Analyze THESE EXACT news items to predict future scenarios:
  
${findings?.map((f: any, i: number) => `${i+1}. "${f.title}" - ${f.source || 'Unknown'} ${f.date ? `(${f.date})` : ''}`).join('\n') || 'No findings'}

Total Articles: ${findings?.length || 0}

FULL MONITORING DATA (identify forward-looking signals):
${JSON.stringify(findings, null, 2).substring(0, 8000)}` : 
  `NOTE: No fresh monitoring data available. Provide strategic foresight based on the organization's industry context.`}

${hasRealData ? 
  'Extract future implications from THESE SPECIFIC news items. Every prediction must reference specific articles' : 
  'Provide strategic foresight analysis'} in this exact JSON structure:

{
  "near_term_predictions": [
    {
      "prediction": "What will happen based on news signals",
      "timeframe": "When (e.g., 'Q1 2025', 'Next 3 months')",
      "probability": "High/Medium/Low based on evidence strength",
      "evidence": ["EXACT headlines supporting this"],
      "trigger_events": ["What would accelerate this"],
      "early_indicators": ["Signs this is happening"],
      "impact": "Business impact if this occurs"
    }
  ],
  "scenarios": {
    "best_case": {
      "scenario": "Most favorable outcome from current news",
      "probability": "% chance",
      "key_assumptions": ["What needs to go right"],
      "timeline": "When this could materialize",
      "value_creation": "Potential upside",
      "evidence": ["News items suggesting this possibility"]
    },
    "base_case": {
      "scenario": "Most likely path forward",
      "probability": "% chance", 
      "key_drivers": ["Main factors from news"],
      "timeline": "Expected timing",
      "implications": ["What this means"],
      "evidence": ["Supporting headlines"]
    },
    "worst_case": {
      "scenario": "Key risks materializing",
      "probability": "% chance",
      "risk_factors": ["What could go wrong from news"],
      "timeline": "When risks could hit",
      "mitigation_needed": ["How to prepare"],
      "evidence": ["Warning signs in news"]
    }
  },
  "emerging_opportunities": [
    {
      "opportunity": "New possibility from news patterns",
      "source_signal": "EXACT headline revealing this",
      "time_to_capitalize": "Window of opportunity",
      "first_mover_advantage": "Why speed matters",
      "required_capabilities": ["What's needed to capture"],
      "competitive_implications": "How this changes the game"
    }
  ],
  "upcoming_catalysts": [
    {
      "event": "Upcoming event from news",
      "date": "When (from article)",
      "potential_outcomes": ["Possible results"],
      "market_impact": "Expected reaction",
      "preparation_needed": "How to position",
      "source": "Article mentioning this"
    }
  ],
  "strategic_warnings": [
    {
      "warning": "Risk signal from news",
      "severity": "Critical/High/Medium",
      "time_horizon": "When this could hit",
      "early_warning_signs": ["What to watch for"],
      "evidence": ["Headlines showing this risk"],
      "defensive_actions": ["How to protect"]
    }
  ],
  "innovation_signals": [
    {
      "signal": "New technology/approach in news",
      "source": "EXACT headline",
      "disruption_potential": "How game-changing",
      "adoption_timeline": "When mainstream",
      "strategic_response": "How to respond"
    }
  ],
  "black_swan_watch": [
    {
      "potential_event": "Low probability, high impact possibility",
      "weak_signals": ["Subtle hints in news"],
      "impact_if_occurs": "Consequence magnitude",
      "hedging_strategies": ["How to prepare without overcommitting"]
    }
  ],
  "decision_points": [
    {
      "decision_needed": "Choice required based on news",
      "by_when": "Decision deadline",
      "options": ["Path A", "Path B"],
      "recommendation": "Suggested action",
      "rationale": "Why based on news patterns"
    }
  ],
  "monitoring_priorities": {
    "watch_list": ["Key things to track going forward"],
    "leading_indicators": ["Metrics that will signal change"],
    "information_gaps": ["What we need to know but don't"],
    "next_intel_needs": ["Specific intelligence to gather"]
  },
  "strategic_recommendations": {
    "immediate_actions": ["Do within 1 week based on news"],
    "near_term_initiatives": ["Launch within 1 month"],
    "strategic_pivots": ["Major changes to consider"],
    "contingency_planning": ["Scenarios to prepare for"]
  }
}

CRITICAL REQUIREMENTS:
1. EVERY prediction must reference specific news articles
2. Timeframes must be specific (not "soon" or "eventually")
3. Probabilities should reflect the strength of evidence in the news
4. Opportunities must be actionable, not generic
5. Warnings must have clear triggers and timelines
6. Connect multiple news items to identify patterns
7. Distinguish between noise and actual signals
8. Focus on FORWARD implications, not past analysis

Remember: You're not summarizing what happened - you're predicting what's NEXT based on these specific signals.`;

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
      
      console.log('✅ Helena Cross cascade detection completed:', {
        hasPredictions: !!analysis.near_term_predictions,
        hasScenarios: !!analysis.scenarios,
        hasOpportunities: !!analysis.emerging_opportunities,
        warningCount: analysis.strategic_warnings?.length || 0,
        hasBlackSwans: !!analysis.black_swan_watch,
        signalCount: analysis.innovation_signals?.length || 0
      });
      
      // Return structured analysis directly
      return {
        content: [{
          type: "analysis",
          ...analysis,
          metadata: {
            analysis,
            personality: 'helena_cross',
            analyst: 'forward_looking_cascade',
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
    console.error('Helena Cross cascade detection error:', error);
    return {
      content: [{
        type: "error",
        message: error.message || 'Analysis failed',
        metadata: {
          error: true,
          personality: 'helena_cross'
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
      case 'detect_cascades':
        result = await detectCascades(args);
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