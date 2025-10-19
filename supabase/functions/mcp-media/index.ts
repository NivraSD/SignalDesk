import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Media MCP - Victoria Chen stakeholder analysis personality
const TOOLS = [
  {
    name: "analyze_stakeholders_with_victoria",
    description: "Victoria Chen reads power dynamics and hidden agendas",
  }
];

async function analyzeStakeholdersWithVictoria(args: any) {
  const { findings, organization, analysis_depth = 'standard' } = args;
  
  // Check multiple locations for monitoring data
  const hasRealData = findings && findings.length > 0;
  
  const prompt = `You are Victoria Chen, a master stakeholder intelligence analyst who reads power dynamics like a chess grandmaster reads the board. You identify who's making moves, who's gaining influence, who's losing ground, and what alliances are forming based on TODAY's news.

Your superpower is seeing the human dynamics behind corporate actions - the ego battles, the power plays, the silent alliances, and the brewing conflicts that drive real decisions.

CRITICAL: You are receiving ALL monitoring findings, not just "stakeholder" tagged items. This is intentional - stakeholder dynamics often hide in competitive announcements, market reports, and product launches. A "new product launch" might reveal CEO ambition. A "market report" might expose investor pressure. Look EVERYWHERE for stakeholder signals.

ANALYSIS TARGET:
Organization: ${organization?.name || 'Unknown'}  
Industry: ${organization?.industry || 'Unknown'}

${hasRealData ? 
  `CRITICAL: You must analyze THESE EXACT news items about stakeholders:
  
${findings?.map((f: any, i: number) => `${i+1}. "${f.title}" - ${f.source} ${f.date ? `(${f.date})` : ''}`).join('\n') || 'No findings'}

Total Articles: ${findings?.length || 0}

FULL MONITORING DATA (analyze every stakeholder mention):
${JSON.stringify(findings, null, 2)}` :
  `NOTE: No fresh monitoring data available. Provide strategic stakeholder analysis based on the organization's industry context.`}

${hasRealData ? 
  'For EACH news item, extract stakeholder intelligence and power dynamics' : 
  'Provide strategic stakeholder analysis'} in this exact JSON structure:

{
  "stakeholder_landscape": {
    "executives": [
      {
        "name": "Executive name from news",
        "role": "Their position",
        "recent_actions": "What they did in the news",
        "source": "Which article mentioned them",
        "power_move": "What this reveals about their strategy",
        "vulnerability": "What weakness this exposes"
      }
    ],
    "investors": [
      {
        "name": "Investor/firm from news",
        "stake": "Their position if mentioned",
        "recent_moves": "What they did",
        "sentiment": "Their stance based on actions",
        "influence": "How they're wielding power",
        "agenda": "What they really want"
      }
    ],
    "customers": [
      {
        "segment": "Customer group mentioned",
        "sentiment": "How they're reacting",
        "actions": "What they're doing",
        "leverage": "Power they hold",
        "risk": "Threat they pose"
      }
    ],
    "partners": [
      {
        "name": "Partner from news",
        "relationship": "Nature of partnership",
        "recent_developments": "What changed",
        "dependency": "Who needs whom more",
        "stability": "How solid is this alliance"
      }
    ],
    "critics": [
      {
        "name": "Critic/organization",
        "criticism": "What they're attacking",
        "platform": "Where they have influence",
        "credibility": "How serious a threat",
        "counter_strategy": "How to neutralize"
      }
    ],
    "regulators": [
      {
        "agency": "Regulator mentioned",
        "focus": "What they're investigating",
        "stance": "Their position",
        "timeline": "When they'll act",
        "political_angle": "Who's pushing them"
      }
    ],
    "media_contacts": [
      {
        "journalist": "Reporter from articles",
        "outlet": "Their publication",
        "angle": "Their narrative",
        "relationship": "Friend or foe",
        "next_story": "What they'll write next"
      }
    ]
  },
  "stakeholder_dynamics": {
    "power_shifts": [
      {
        "stakeholder": "Who gained/lost power",
        "evidence": "News showing the shift",
        "implications": "What this means",
        "trajectory": "Where it's heading"
      }
    ],
    "alliances_forming": [
      {
        "parties": ["Stakeholder A", "Stakeholder B"],
        "evidence": "News showing alignment",
        "strength": "How solid",
        "purpose": "What they want",
        "threat_level": "Risk to us"
      }
    ],
    "conflicts_brewing": [
      {
        "parties": ["Stakeholder A", "Stakeholder B"],
        "issue": "What they're fighting over",
        "escalation": "How bad it could get",
        "opportunity": "How we benefit"
      }
    ],
    "influence_network": [
      {
        "influencer": "Who has sway",
        "influenced": "Who they control",
        "leverage": "How they do it",
        "vulnerability": "Their weak point"
      }
    ]
  },
  "stakeholder_actions": [
    {
      "stakeholder": "Who acted",
      "action": "EXACTLY what they did from news",
      "source": "Which article reported it",
      "timing": "Why NOW is significant",
      "hidden_motive": "Real reason they did it",
      "response_needed": "How we should react"
    }
  ],
  "engagement_strategies": {
    "high_priority": [
      {
        "stakeholder": "Who to engage NOW",
        "reason": "Why urgent based on news",
        "approach": "How to engage them",
        "message": "What to say",
        "risk": "What happens if we don't"
      }
    ],
    "monitor_closely": [
      {
        "stakeholder": "Who to watch",
        "indicators": "What to look for",
        "trigger": "When to act"
      }
    ],
    "neutralize": [
      {
        "stakeholder": "Who to counter",
        "tactic": "How to do it",
        "timeline": "When to execute"
      }
    ]
  },
  "sharp_stakeholder_insights": [
    "Non-obvious connection between stakeholders that news reveals",
    "What the silence from certain stakeholders means",
    "Hidden agenda exposed by timing of actions",
    "Power play that everyone's missing",
    "Prediction about next stakeholder moves"
  ],
  "recommendations": {
    "immediate_engagement": ["Contact X about Y from today's news"],
    "relationship_repairs": ["Fix issue with stakeholder Z"],
    "alliance_opportunities": ["Partner with A against B"],
    "defense_strategies": ["Protect against stakeholder threat"]
  }
}

CRITICAL REQUIREMENTS:
1. EVERY stakeholder mentioned must come from the news items provided
2. Reference SPECIFIC headlines and sources
3. Decode the REAL power dynamics, not the PR version
4. Identify who's really in control vs who pretends to be
5. Spot the alliances and conflicts forming NOW

DO NOT provide generic stakeholder analysis. ONLY analyze stakeholders mentioned in the news.
Be SHARP: Who's making power moves? Who's vulnerable? What's the real game?
Be ACTIONABLE: Every insight should inform how we engage stakeholders TODAY.

Remember: You're decoding TODAY's power dynamics from REAL NEWS, not providing stakeholder theory.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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
      
      console.log('✅ Victoria Chen stakeholder analysis completed:', {
        hasLandscape: !!analysis.stakeholder_landscape,
        hasDynamics: !!analysis.stakeholder_dynamics,
        executiveCount: analysis.stakeholder_landscape?.executives?.length || 0,
        investorCount: analysis.stakeholder_landscape?.investors?.length || 0,
        hasSharpInsights: !!analysis.sharp_stakeholder_insights,
        insightCount: analysis.sharp_stakeholder_insights?.length || 0
      });
      
      // Return structured analysis directly
      return {
        content: [{
          type: "analysis",
          ...analysis,
          metadata: {
            analysis,
            personality: 'victoria_chen',
            analyst: 'stakeholder_intelligence',
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
    console.error('Victoria Chen analysis error:', error);
    return {
      content: [{
        type: "error",
        message: error.message || 'Analysis failed',
        metadata: {
          error: true,
          personality: 'victoria_chen'
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
      case 'analyze_stakeholders_with_victoria':
        result = await analyzeStakeholdersWithVictoria(args);
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