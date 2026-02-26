import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

/**
 * Campaign Research Gatherer - Autonomous Claude with MCP Tools
 *
 * Takes a research plan and uses Claude with tool use to autonomously
 * gather the data needed. Like niv-orchestrator-robust but without user conversation.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    console.log('🔍 Campaign Research Gatherer - Claude autonomous research');
    const { researchPlan, campaignGoal, organizationContext } = await req.json();

    if (!researchPlan) {
      return new Response(JSON.stringify({
        success: false,
        error: 'researchPlan is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const startTime = Date.now();

    // Let Claude autonomously gather the research using MCP tools
    const gatheringResult = await runClaudeResearchGathering(
      researchPlan,
      campaignGoal,
      organizationContext
    );

    console.log(`✅ Stakeholder data: ${gatheringResult.stakeholder.length} results`);
    console.log(`✅ Narrative data: ${gatheringResult.narrative.length} results`);
    console.log(`✅ Channel data: ${gatheringResult.channel.length} results`);
    console.log(`✅ Historical data: ${gatheringResult.historical.length} results`);

    const gatheringTime = Date.now() - startTime;
    console.log(`🔬 Data gathering complete in ${gatheringTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      gatheredData: gatheringResult,
      gatheringTime,
      toolCallsMade: gatheringResult.toolCallsMade,
      totalResults: Object.values(gatheringResult).reduce((sum: number, arr: any) =>
        sum + (Array.isArray(arr) ? arr.length : 0), 0),
      service: 'Campaign Research Gatherer (Claude Autonomous)',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Research gathering error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Research gathering failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// MCP Tools available to Claude
const mcpTools = [
  {
    name: 'mcp_discovery',
    description: 'Get comprehensive organization profile including competitors, stakeholders, industry context',
    input_schema: {
      type: 'object',
      properties: {
        organization: { type: 'string', description: 'Organization name' },
        industry_hint: { type: 'string', description: 'Industry sector' }
      },
      required: ['organization']
    }
  },
  {
    name: 'org_story_context',
    description: 'Get recent news coverage and stories about the organization itself. Returns sentiment analysis, crisis alerts, and recent headlines.',
    input_schema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        days_back: { type: 'number', description: 'Number of days to look back (default 7)' }
      },
      required: ['organization_id']
    }
  },
  {
    name: 'niv_fireplexity',
    description: 'Search recent web content with time filtering (24h, 48h, 7d)',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        timeWindow: { type: 'string', enum: ['24h', '48h', '7d'], description: 'Time window' },
        maxResults: { type: 'number', description: 'Maximum results (default 10)' }
      },
      required: ['query', 'timeWindow']
    }
  },
  {
    name: 'journalist_registry',
    description: 'Find tier-1 journalists and media contacts by industry',
    input_schema: {
      type: 'object',
      properties: {
        industry: { type: 'string', description: 'Industry sector' },
        tier: { type: 'string', enum: ['tier1', 'tier2'], description: 'Journalist tier' },
        count: { type: 'number', description: 'Number of journalists (default 20)' }
      },
      required: ['industry']
    }
  },
  {
    name: 'master_source_registry',
    description: 'Get industry-specific news sources, publications, and outlets',
    input_schema: {
      type: 'object',
      properties: {
        industry: { type: 'string', description: 'Industry sector' },
        type: { type: 'string', description: 'Source type (default "news")' }
      },
      required: ['industry']
    }
  },
  {
    name: 'knowledge_library_registry',
    description: 'Search case studies, academic research, and proven methodologies',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        research_area: { type: 'string', description: 'Area like "case_studies", "methodologies"' },
        limit: { type: 'number', description: 'Maximum results (default 10)' }
      },
      required: ['query']
    }
  }
];

// Run Claude autonomous research gathering
async function runClaudeResearchGathering(
  researchPlan: any,
  campaignGoal: string,
  organizationContext: any
) {
  const systemPrompt = `You are a research assistant gathering data for a VECTOR campaign.

You have been given a research plan. Your job is to use the available MCP tools to gather all the data specified in the plan.

Research Plan:
${JSON.stringify(researchPlan, null, 2)}

Use the MCP tools strategically to gather data for each category. When you have gathered sufficient data for all 4 categories (stakeholder, narrative, channel, historical), return a JSON object summarizing what you found.

Return format:
{
  "stakeholder": [list of findings with source],
  "narrative": [list of findings with source],
  "channel": [list of findings with source],
  "historical": [list of findings with source],
  "complete": true
}`;

  const userPrompt = `Campaign Goal: ${campaignGoal}
Organization: ${organizationContext.name}
Industry: ${organizationContext.industry}

Gather research data according to the plan. Use MCP tools to collect data for all 4 categories.`;

  const messages = [{ role: 'user', content: userPrompt }];
  let toolCallsMade = 0;
  const maxIterations = 15; // Allow Claude up to 15 tool calls
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages,
        tools: mcpTools
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const claudeResponse = await response.json();

    messages.push({
      role: 'assistant',
      content: claudeResponse.content
    });

    if (claudeResponse.stop_reason === 'end_turn') {
      // Claude is done - parse the final response
      const textContent = claudeResponse.content.find((c: any) => c.type === 'text');
      if (textContent) {
        try {
          const jsonMatch = textContent.text.match(/```json\n([\s\S]*?)\n```/);
          const result = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(textContent.text);
          result.toolCallsMade = toolCallsMade;
          return result;
        } catch (e) {
          console.error('Failed to parse Claude result:', textContent.text);
          // Return empty structure if parsing fails
          return {
            stakeholder: [],
            narrative: [],
            channel: [],
            historical: [],
            toolCallsMade,
            parseError: true
          };
        }
      }
      break;
    }

    if (claudeResponse.stop_reason === 'tool_use') {
      // Claude wants to use tools
      const toolUses = claudeResponse.content.filter((c: any) => c.type === 'tool_use');
      const toolResults = [];

      for (const toolUse of toolUses) {
        toolCallsMade++;
        console.log(`  🔧 Tool ${toolCallsMade}: ${toolUse.name}`);

        let result;
        try {
          result = await callMCPTool(toolUse.name, toolUse.input);
        } catch (error: any) {
          result = { error: error.message };
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        });
      }

      messages.push({
        role: 'user',
        content: toolResults
      });

      continue;
    }

    break;
  }

  // If we exit the loop without a result, return empty
  return {
    stakeholder: [],
    narrative: [],
    channel: [],
    historical: [],
    toolCallsMade,
    timeout: true
  };
}

// Call MCP tool via Edge Function
async function callMCPTool(toolName: string, input: any) {
  // Handle org_story_context directly via Supabase RPC
  if (toolName === 'org_story_context') {
    return await fetchOrgStoryContext(input.organization_id, input.days_back || 7);
  }

  const toolMap: Record<string, string> = {
    'mcp_discovery': 'mcp-discovery',
    'niv_fireplexity': 'niv-fireplexity',
    'journalist_registry': 'journalist-registry',
    'master_source_registry': 'master-source-registry',
    'knowledge_library_registry': 'knowledge-library-registry'
  };

  const functionName = toolMap[toolName];
  if (!functionName) {
    console.warn(`Unknown tool: ${toolName}`);
    return { error: `Unknown tool: ${toolName}` };
  }

  // Use the input from Claude directly
  const payload = input;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${functionName} returned ${response.status}: ${errorText}`);
      return { error: `${functionName} returned ${response.status}` };
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    return { error: `Error calling ${functionName}: ${error.message}` };
  }
}

/**
 * Fetch organization story context directly from database
 * Returns recent coverage, sentiment analysis, and crisis alerts
 */
async function fetchOrgStoryContext(organizationId: string, daysBack: number = 7) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY!);

    // Get story stats
    const { data: stats, error: statsError } = await supabase
      .rpc('get_org_story_stats', {
        org_id: organizationId,
        days_back: daysBack
      });

    // Get recent stories
    const { data: recentStories, error: storiesError } = await supabase
      .rpc('get_org_recent_stories', {
        org_id: organizationId,
        days_back: daysBack,
        limit_count: 15
      });

    if (statsError || storiesError) {
      console.log(`Error fetching story context: ${statsError?.message || storiesError?.message}`);
      return {
        error: 'Failed to fetch story context',
        stats: null,
        stories: []
      };
    }

    const statsRow = stats?.[0] || {
      total_stories: 0,
      positive_count: 0,
      negative_count: 0,
      neutral_count: 0,
      crisis_count: 0,
      opportunity_count: 0,
      avg_sentiment: 0,
      top_sources: []
    };

    return {
      success: true,
      organization_id: organizationId,
      period_days: daysBack,
      stats: {
        total_stories: Number(statsRow.total_stories) || 0,
        positive_count: Number(statsRow.positive_count) || 0,
        negative_count: Number(statsRow.negative_count) || 0,
        neutral_count: Number(statsRow.neutral_count) || 0,
        crisis_count: Number(statsRow.crisis_count) || 0,
        opportunity_count: Number(statsRow.opportunity_count) || 0,
        avg_sentiment: Number(statsRow.avg_sentiment) || 0,
        sentiment_label: getSentimentLabel(Number(statsRow.avg_sentiment) || 0),
        top_sources: statsRow.top_sources || []
      },
      recent_stories: (recentStories || []).map((s: any) => ({
        title: s.article_title,
        source: s.article_source,
        url: s.article_url,
        published_at: s.published_at,
        coverage_type: s.coverage_type,
        sentiment: s.sentiment_toward_org,
        sentiment_score: s.sentiment_score,
        is_crisis: s.is_crisis_related,
        crisis_severity: s.crisis_severity,
        is_opportunity: s.is_opportunity,
        executives_mentioned: s.executives_mentioned || []
      })),
      summary: formatStorySummary(statsRow, recentStories || [])
    };
  } catch (error: any) {
    console.error('Error in fetchOrgStoryContext:', error);
    return {
      error: error.message || 'Unknown error',
      stats: null,
      stories: []
    };
  }
}

function getSentimentLabel(score: number): string {
  if (score > 0.3) return 'positive';
  if (score < -0.3) return 'negative';
  return 'neutral';
}

function formatStorySummary(stats: any, stories: any[]): string {
  const total = Number(stats.total_stories) || 0;
  if (total === 0) {
    return 'No recent news coverage found for this organization.';
  }

  const parts: string[] = [];
  parts.push(`${total} stories in the last 7 days.`);

  const positive = Number(stats.positive_count) || 0;
  const negative = Number(stats.negative_count) || 0;
  const crisis = Number(stats.crisis_count) || 0;

  if (positive > negative) {
    parts.push(`Coverage is mostly positive (${positive} positive vs ${negative} negative).`);
  } else if (negative > positive) {
    parts.push(`Coverage is mostly negative (${negative} negative vs ${positive} positive).`);
  } else {
    parts.push('Coverage is balanced between positive and negative.');
  }

  if (crisis > 0) {
    parts.push(`⚠️ ${crisis} stories flagged as potentially crisis-related.`);
  }

  const topStories = stories.slice(0, 3);
  if (topStories.length > 0) {
    parts.push('Top headlines: ' + topStories.map(s => `"${s.article_title}" (${s.article_source})`).join('; '));
  }

  return parts.join(' ');
}
