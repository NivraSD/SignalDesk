import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
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
