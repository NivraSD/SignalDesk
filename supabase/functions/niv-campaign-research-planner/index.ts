import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

/**
 * Campaign Research Planner - Lightweight Edge Function
 *
 * Analyzes campaign goal and determines what research is needed.
 * Returns a research plan for the gatherer to execute.
 *
 * Pattern: Like Intelligence Orchestrator V2, this doesn't DO research,
 * it just decides WHAT research to do.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    console.log('📋 Campaign Research Planner - Analyzing research needs');
    const { campaignGoal, organizationContext } = await req.json();

    if (!campaignGoal) {
      return new Response(JSON.stringify({
        success: false,
        error: 'campaignGoal is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const orgName = organizationContext?.name || 'Unknown';
    const industry = organizationContext?.industry || 'General';

    console.log(`🎯 Campaign: ${campaignGoal}`);
    console.log(`🏢 Organization: ${orgName} (${industry})`);

    // Use Claude to analyze what research is needed
    const systemPrompt = `You are a campaign research strategist planning research for a VECTOR campaign.

Analyze the campaign goal and determine what research is needed across 4 categories.

IMPORTANT: Keep the research plan MINIMAL and TARGETED. Maximum 1-2 queries per category.

1. **Stakeholder Intelligence**: ONE most critical stakeholder group query
2. **Narrative Landscape**: ONE most important narrative/trend query
3. **Channel Intelligence**: Which channels are essential?
4. **Historical Patterns**: ONE relevant historical pattern query

Return a JSON research plan with MINIMAL, highly targeted queries.

Output format:
{
  "stakeholderResearch": {
    "focus": "string describing focus",
    "queries": ["ONE specific query"],
    "toolsNeeded": ["mcp_discovery"]
  },
  "narrativeResearch": {
    "focus": "string",
    "queries": ["ONE specific query"],
    "toolsNeeded": ["niv_fireplexity"]
  },
  "channelResearch": {
    "focus": "string",
    "queries": ["industry name"],
    "toolsNeeded": ["journalist_registry"]
  },
  "historicalResearch": {
    "focus": "string",
    "queries": ["ONE specific query"],
    "toolsNeeded": ["knowledge_library_registry"]
  },
  "researchRationale": "Why this minimal plan covers the essentials"
}`;

    const userPrompt = `Campaign Goal: ${campaignGoal}
Organization: ${orgName}
Industry: ${industry}

Create a research plan. Be specific about what queries to run and which tools to use.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const claudeResponse = await response.json();
    const textContent = claudeResponse.content.find((c: any) => c.type === 'text');

    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    // Parse research plan
    let researchPlan;
    try {
      const jsonMatch = textContent.text.match(/```json\n([\s\S]*?)\n```/);
      researchPlan = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(textContent.text);
    } catch (e) {
      console.error('Failed to parse research plan:', textContent.text.substring(0, 500));
      throw new Error('Failed to parse research plan');
    }

    console.log('✅ Research plan created');
    console.log(`📊 Stakeholder queries: ${researchPlan.stakeholderResearch?.queries?.length || 0}`);
    console.log(`📰 Narrative queries: ${researchPlan.narrativeResearch?.queries?.length || 0}`);
    console.log(`📡 Channel queries: ${researchPlan.channelResearch?.queries?.length || 0}`);
    console.log(`📚 Historical queries: ${researchPlan.historicalResearch?.queries?.length || 0}`);

    return new Response(JSON.stringify({
      success: true,
      researchPlan,
      campaignGoal,
      organizationContext,
      service: 'Campaign Research Planner',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Research planning error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Research planning failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
