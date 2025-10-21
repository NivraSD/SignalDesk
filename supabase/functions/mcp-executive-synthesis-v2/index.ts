import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is not set');
}

// New Simplified Executive Synthesis - Aligned with Discovery Structure
const TOOLS = [
  {
    name: "synthesize_executive_intelligence",
    description: "Create focused executive intelligence report (competitive, topics, stakeholders)",
  }
];

/**
 * Prepare intelligence context for synthesis
 */
function prepareIntelligenceContext(enrichedData: any) {
  const { extracted_data } = enrichedData;
  
  // Get key competitor events (limit to prevent timeout)
  const competitorEvents = [];
  const MAX_EVENTS_PER_TYPE = 3;
  
  if (extracted_data?.events) {
    Object.entries(extracted_data.events).forEach(([eventType, events]: [string, any[]]) => {
      events.slice(0, MAX_EVENTS_PER_TYPE).forEach(event => {
        if (event.title) {
          competitorEvents.push({
            type: eventType,
            title: event.title,
            description: event.description || '',
            companies: event.companies || []
          });
        }
      });
    });
  }
  
  // Get entities (competitors, stakeholders)
  const entities = {
    companies: extracted_data?.entities?.companies || [],
    executives: extracted_data?.entities?.executives || [],
    regulators: extracted_data?.entities?.regulators || [],
    investors: extracted_data?.entities?.investors || []
  };
  
  // Get trending topics
  const trendingTopics = extracted_data?.topics?.trending || [];
  
  return { competitorEvents, entities, trendingTopics };
}

/**
 * Generate synthesis prompt for new format
 */
function createSynthesisPrompt(organization: any, context: any) {
  return `Generate executive intelligence report for ${organization?.name || 'the organization'}.

STRICT ANALYSIS RULES:
- ONLY analyze information explicitly present in the provided data
- Every insight MUST reference specific events or data points 
- DO NOT invent or speculate - only use provided facts
- Focus on actionable intelligence for strategic decision-making

ORGANIZATION: ${organization?.name || 'Unknown'}
INDUSTRY: ${organization?.industry || 'Unknown'}

DATA SOURCES:
Events (${context.competitorEvents.length}):
${context.competitorEvents.slice(0, 10).map((e, i) => 
  `${i+1}. [${e.type}] ${e.title}`).join('\n')}

Key Companies: ${context.entities.companies.slice(0, 8).join(', ')}
Key Executives: ${context.entities.executives.slice(0, 6).join(', ')}
Trending Topics: ${context.trendingTopics.slice(0, 5).map(t => t.topic || t).join(', ')}

Generate ONLY valid JSON (no markdown, no text outside JSON):

{
  "competitive_dynamics": {
    "key_competitor_moves": [
      {
        "company": "Competitor name from events",
        "action": "Specific action taken",
        "strategic_impact": "Why this matters strategically"
      }
    ],
    "market_positioning": ["Key positioning changes observed"],
    "competitive_threats": ["Direct threats to monitor"]
  },
  
  "trending_narratives": {
    "dominant_themes": [
      {
        "topic": "Topic name from data",
        "momentum": "high/medium/low",
        "strategic_relevance": "Why this topic matters"
      }
    ],
    "narrative_shifts": ["Important story/perception changes"],
    "topic_opportunities": ["Topics to leverage strategically"]
  },
  
  "stakeholder_intelligence": {
    "key_stakeholder_moves": [
      {
        "stakeholder": "Name from data",
        "action": "What they did",
        "implication": "What this means for us"
      }
    ],
    "power_dynamics": ["Important influence/power changes"],
    "stakeholder_sentiment": ["Key sentiment shifts to monitor"]
  },
  
  "critical_threats": [
    {
      "threat": "Specific threat identified",
      "source": "Where threat comes from",
      "urgency": "Immediate/Near-term/Long-term",
      "impact": "Potential strategic impact"
    }
  ],
  
  "executive_synthesis": "2-3 sentence strategic summary. What are the most critical competitive moves, trending topics, and stakeholder actions that require executive attention? Focus on actionable insights."
}`;
}

/**
 * Call Claude API for synthesis
 */
async function generateSynthesis(prompt: string): Promise<any> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  console.log('🤖 Calling Claude API for synthesis...');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Claude API error:', response.status, errorText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const result = await response.json();
  return result.content[0].text;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body = await req.json();
    console.log('🎯 New Executive Synthesis V2 called');
    
    const { tool, arguments: args } = body;
    
    if (tool !== 'synthesize_executive_intelligence') {
      return new Response(JSON.stringify({ 
        error: `Unknown tool: ${tool}` 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { enriched_data, organization } = args;
    
    if (!enriched_data?.extracted_data) {
      return new Response(JSON.stringify({ 
        error: 'No enriched data provided' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare context
    const context = prepareIntelligenceContext(enriched_data);
    console.log('📊 Context prepared:', {
      events: context.competitorEvents.length,
      companies: context.entities.companies.length,
      topics: context.trendingTopics.length
    });

    // Generate synthesis
    const prompt = createSynthesisPrompt(organization, context);
    const synthesisText = await generateSynthesis(prompt);
    
    // Parse JSON response
    let synthesis;
    try {
      const jsonMatch = synthesisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        synthesis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse synthesis JSON:', parseError);
      console.error('Raw response:', synthesisText);
      throw new Error('Failed to parse synthesis response');
    }

    console.log('✅ New synthesis format generated:', {
      hasCompetitive: !!synthesis.competitive_dynamics,
      hasTopics: !!synthesis.trending_narratives, 
      hasStakeholders: !!synthesis.stakeholder_intelligence,
      hasThreats: !!synthesis.critical_threats,
      hasSummary: !!synthesis.executive_synthesis
    });

    return new Response(JSON.stringify({
      success: true,
      content: [synthesis],
      metadata: {
        format_version: "v2_simplified",
        timestamp: new Date().toISOString(),
        data_sources: {
          events: context.competitorEvents.length,
          companies: context.entities.companies.length,
          topics: context.trendingTopics.length
        }
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('❌ Synthesis error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});