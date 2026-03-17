import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const GEMINI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

/**
 * Campaign Research Orchestrator - Sequential Collection Pattern
 *
 * Collects research in 4 sequential stages (like niv-strategic-framework):
 * 1. Stakeholder Intelligence (psychology, information diet, decision triggers)
 * 2. Narrative Landscape (dominant narratives, vacuums, competitive positioning)
 * 3. Channel Intelligence (where stakeholders consume info, trust levels)
 * 4. Historical Patterns (successful campaigns, pattern recommendations)
 *
 * Then passes ALL collected research to niv-campaign-research-synthesis for final synthesis.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    console.log('🚀 Campaign Research Orchestrator - Sequential Collection Pattern');
    const requestData = await req.json();

    const {
      campaignGoal,
      organizationId,
      organizationContext,
      refinementRequest
    } = requestData;

    if (!campaignGoal || !organizationContext) {
      return new Response(JSON.stringify({
        success: false,
        error: 'campaignGoal and organizationContext are required',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const orgName = organizationContext.name || 'Unknown';
    const industry = organizationContext.industry || 'General';

    console.log(`🎯 Campaign Goal: ${campaignGoal}`);
    console.log(`🏢 Organization: ${orgName} (${industry})`);
    if (refinementRequest) {
      console.log(`🔄 Refinement: ${refinementRequest}`);
    }

    const startTime = Date.now();

    // STAGE 1: Stakeholder Intelligence Research
    console.log('📊 Stage 1: Researching Stakeholder Intelligence...');
    const stakeholderResearch = await researchStakeholders({
      campaignGoal,
      orgName,
      industry,
      refinementRequest
    });
    console.log(`✅ Stakeholder research complete (${stakeholderResearch.toolCalls} tool calls)`);

    // STAGE 2: Narrative Landscape Research
    console.log('📰 Stage 2: Researching Narrative Landscape...');
    const narrativeResearch = await researchNarratives({
      campaignGoal,
      orgName,
      industry,
      stakeholderContext: stakeholderResearch.findings
    });
    console.log(`✅ Narrative research complete (${narrativeResearch.toolCalls} tool calls)`);

    // STAGE 3: Channel Intelligence Research
    console.log('📡 Stage 3: Researching Channel Intelligence...');
    const channelResearch = await researchChannels({
      campaignGoal,
      orgName,
      industry,
      stakeholderGroups: stakeholderResearch.findings?.stakeholderGroups || []
    });
    console.log(`✅ Channel research complete (${channelResearch.toolCalls} tool calls)`);

    // STAGE 4: Historical Patterns Research
    console.log('📚 Stage 4: Researching Historical Patterns...');
    const historicalResearch = await researchHistoricalPatterns({
      campaignGoal,
      orgName,
      industry,
      campaignType: narrativeResearch.findings?.campaignType
    });
    console.log(`✅ Historical research complete (${historicalResearch.toolCalls} tool calls)`);

    const researchTime = Date.now() - startTime;
    const totalToolCalls =
      stakeholderResearch.toolCalls +
      narrativeResearch.toolCalls +
      channelResearch.toolCalls +
      historicalResearch.toolCalls;

    console.log(`🔬 Research collection complete: ${totalToolCalls} total tool calls in ${researchTime}ms`);

    // BUILD INTELLIGENCE BRIEF: Merge all research into VECTOR spec structure
    console.log('🧪 Building CampaignIntelligenceBrief from collected research...');

    const campaignIntelligenceBrief = {
      stakeholders: stakeholderResearch.findings?.stakeholderProfiles || [],
      narrativeLandscape: {
        dominantNarratives: narrativeResearch.findings?.dominantNarratives || [],
        narrativeVacuums: narrativeResearch.findings?.narrativeVacuums || [],
        competitivePositioning: narrativeResearch.findings?.competitivePositioning || [],
        culturalContext: narrativeResearch.findings?.culturalContext || ''
      },
      channelIntelligence: {
        byStakeholder: channelResearch.findings?.channelsByStakeholder || [],
        journalists: channelResearch.findings?.journalists || [],
        publications: channelResearch.findings?.publications || []
      },
      historicalInsights: {
        successfulCampaigns: historicalResearch.findings?.successfulCampaigns || [],
        successFactors: historicalResearch.findings?.successFactors || [],
        patternRecommendations: historicalResearch.findings?.patternRecommendations || [],
        riskFactors: historicalResearch.findings?.riskFactors || []
      },
      keyInsights: [
        ...(stakeholderResearch.findings?.keyInsights || []),
        ...(narrativeResearch.findings?.keyInsights || []),
        ...(channelResearch.findings?.keyInsights || []),
        ...(historicalResearch.findings?.keyInsights || [])
      ],
      metadata: {
        campaignGoal,
        organizationContext,
        researchTime,
        totalToolCalls,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`✅ Complete research pipeline finished in ${Date.now() - startTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      campaignIntelligenceBrief,
      processingTime: Date.now() - startTime,
      researchStages: {
        stakeholders: { toolCalls: stakeholderResearch.toolCalls },
        narratives: { toolCalls: narrativeResearch.toolCalls },
        channels: { toolCalls: channelResearch.toolCalls },
        historical: { toolCalls: historicalResearch.toolCalls }
      },
      service: 'Campaign Research Orchestrator (Sequential Collection)',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Research orchestration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Research orchestration failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Define MCP tools - Claude format
const claudeTools = [
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

// Gemini format tools
const geminiTools = [{
  functionDeclarations: claudeTools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.input_schema
  }))
}];

// STAGE 1: Research Stakeholder Intelligence
async function researchStakeholders(params: any) {
  const { campaignGoal, orgName, industry } = params;

  const systemPrompt = `You are researching STAKEHOLDER INTELLIGENCE for a VECTOR campaign.

Your goal: Identify 3-5 key stakeholder groups and understand their deep psychology.

For EACH stakeholder group, research:
- Psychology: values, fears, aspirations, cognitive biases, identity triggers
- Information ecosystem: primary sources, trusted voices, consumption patterns
- Current state: awareness level, current perception, existing beliefs, objections
- Decision journey: triggers, validation needs, social proof requirements
- Influence pathways: direct influencers, peer networks, authority figures

Use MCP tools strategically:
- mcp_discovery: Get stakeholder profiles from organization analysis
- niv_fireplexity: Search recent stakeholder activity, discourse, sentiment
- knowledge_library_registry: Find stakeholder behavior patterns

Return your findings as JSON with stakeholderGroups array and stakeholderProfiles array.`;

  const userPrompt = `Campaign Goal: ${campaignGoal}
Organization: ${orgName}
Industry: ${industry}

Research stakeholder intelligence. Identify key groups and their psychological profiles.`;

  return await runAIResearch(systemPrompt, userPrompt);
}

// STAGE 2: Research Narrative Landscape
async function researchNarratives(params: any) {
  const { campaignGoal, orgName, industry, stakeholderContext } = params;

  const systemPrompt = `You are researching NARRATIVE LANDSCAPE for a VECTOR campaign.

Your goal: Map the narrative terrain and identify positioning opportunities.

Research:
- Dominant narratives: What stories are being told? By whom? What's resonating?
- Narrative vacuums: What's NOT being said? What angles are unclaimed?
- Competitive positioning: How are competitors framing their messages?
- Cultural context: What cultural/social movements affect this space?

Use MCP tools:
- niv_fireplexity: Search current discourse, trending narratives, competitor messaging
- mcp_discovery: Get competitor positioning from org analysis
- knowledge_library_registry: Find successful narrative patterns

Return JSON with dominantNarratives, narrativeVacuums, competitivePositioning, and culturalContext.`;

  const userPrompt = `Campaign Goal: ${campaignGoal}
Organization: ${orgName}
Industry: ${industry}
Stakeholder Context: ${JSON.stringify(stakeholderContext?.stakeholderGroups || [])}

Research the narrative landscape. Find opportunities for differentiated positioning.`;

  return await runAIResearch(systemPrompt, userPrompt);
}

// STAGE 3: Research Channel Intelligence
async function researchChannels(params: any) {
  const { orgName, industry, stakeholderGroups } = params;

  const systemPrompt = `You are researching CHANNEL INTELLIGENCE for a VECTOR campaign.

Your goal: Map where each stakeholder group consumes information and their trust levels.

For EACH stakeholder group, research:
- Primary channels: Where do they get information?
- Trust levels: Which sources do they trust? Why?
- Consumption patterns: When/how do they consume? What formats work?
- Amplification opportunities: Which channels drive cross-channel spread?

Use MCP tools:
- journalist_registry: Find tier-1 journalists for media channels
- master_source_registry: Get industry publications and outlets
- niv_fireplexity: Search for channel effectiveness data

Return JSON with channelsByStakeholder array mapping groups to channels/trust.`;

  const userPrompt = `Organization: ${orgName}
Industry: ${industry}
Stakeholder Groups: ${JSON.stringify(stakeholderGroups)}

Research channel intelligence. Map information consumption for each stakeholder group.`;

  return await runAIResearch(systemPrompt, userPrompt);
}

// STAGE 4: Research Historical Patterns
async function researchHistoricalPatterns(params: any) {
  const { campaignGoal, industry, campaignType } = params;

  const systemPrompt = `You are researching HISTORICAL PATTERNS for a VECTOR campaign.

Your goal: Find what has worked (and why) in similar campaigns.

Research:
- Successful campaigns: What campaigns succeeded in similar contexts?
- Success factors: WHY did they work? What patterns emerged?
- Pattern recommendations: What principles should guide this campaign?
- Risk factors: What approaches failed? What should be avoided?

IMPORTANT: You MUST use MCP tools to gather historical data. DO NOT rely solely on your training data.

Use MCP tools strategically:
1. ALWAYS START with knowledge_library_registry: Search for case studies, historical campaigns, and PR/marketing patterns
   - Query for: "{industry} successful campaigns", "campaign case studies {campaignType}", "PR patterns {industry}"
   - This tool contains curated historical campaign data and case studies
2. niv_fireplexity: Find recent successful campaign examples (use 7d time window for current examples)
   - Search for: "successful {campaignType} campaigns {industry}", "campaign results {year}"

You MUST call at least 2-3 tools to gather comprehensive historical patterns. Return JSON with:
{
  "successfulCampaigns": [{"campaign": "name", "organization": "org", "approach": "what they did", "results": "outcome", "keyLessons": ["lesson 1", "lesson 2"]}],
  "successFactors": ["factor 1", "factor 2"],
  "patternRecommendations": [{"pattern": "recommendation", "implementation": "how to apply it", "expectedImpact": "why it works"}],
  "riskFactors": ["risk 1", "risk 2"]
}`;


  const userPrompt = `Campaign Goal: ${campaignGoal}
Industry: ${industry}
Campaign Type: ${campaignType || 'General'}

Research historical patterns. Find successful campaigns and extractable principles.`;

  return await runAIResearch(systemPrompt, userPrompt);
}

// Execute a tool call by name
async function executeTool(name: string, input: any): Promise<any> {
  switch (name) {
    case 'mcp_discovery': return await callMCPDiscovery(input);
    case 'niv_fireplexity': return await callNIVFireplexity(input);
    case 'journalist_registry': return await callJournalistRegistry(input);
    case 'master_source_registry': return await callMasterSourceRegistry(input);
    case 'knowledge_library_registry': return await callKnowledgeLibrary(input);
    default: return { error: `Unknown tool: ${name}` };
  }
}

// Parse findings from AI text response
function parseFindings(text: string): any {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]);
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // Try bracket extraction
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(text.substring(start, end + 1)); } catch {}
    }
    return { rawResponse: text, parseError: true };
  }
}

// Gemini research runner with function calling
async function runGeminiResearch(systemPrompt: string, userPrompt: string) {
  const contents: any[] = [{ role: 'user', parts: [{ text: userPrompt }] }];
  let toolCalls = 0;
  let maxIterations = 10;

  while (maxIterations > 0) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          tools: geminiTools,
          generationConfig: { maxOutputTokens: 4000 }
        })
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate?.content) break;

    contents.push(candidate.content);

    const functionCalls = candidate.content.parts?.filter((p: any) => p.functionCall) || [];

    if (functionCalls.length === 0) {
      // No more tool calls — extract text response
      const textPart = candidate.content.parts?.find((p: any) => p.text);
      if (textPart) {
        return { findings: parseFindings(textPart.text), toolCalls };
      }
      break;
    }

    // Execute function calls
    const functionResponses: any[] = [];
    for (const fc of functionCalls) {
      toolCalls++;
      console.log(`  🔧 Tool: ${fc.functionCall.name}`);
      let result;
      try {
        result = await executeTool(fc.functionCall.name, fc.functionCall.args);
      } catch (error: any) {
        result = { error: error.message };
      }
      functionResponses.push({
        functionResponse: {
          name: fc.functionCall.name,
          response: result
        }
      });
    }

    contents.push({ role: 'user', parts: functionResponses });
    maxIterations--;
  }

  return { findings: { error: 'Research did not complete' }, toolCalls };
}

// Claude research runner with tool use
async function runClaudeResearch(systemPrompt: string, userPrompt: string) {
  const messages: any[] = [{ role: 'user', content: userPrompt }];
  let toolCalls = 0;
  let maxIterations = 10;

  while (maxIterations > 0) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages,
        tools: claudeTools
      })
    });

    if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
    const claudeResponse = await response.json();

    messages.push({ role: 'assistant', content: claudeResponse.content });

    if (claudeResponse.stop_reason === 'end_turn') {
      const textContent = claudeResponse.content.find((c: any) => c.type === 'text');
      if (textContent) {
        return { findings: parseFindings(textContent.text), toolCalls };
      }
      break;
    }

    if (claudeResponse.stop_reason === 'tool_use') {
      const toolUses = claudeResponse.content.filter((c: any) => c.type === 'tool_use');
      const toolResults = [];

      for (const toolUse of toolUses) {
        toolCalls++;
        console.log(`  🔧 Tool: ${toolUse.name}`);
        let result;
        try {
          result = await executeTool(toolUse.name, toolUse.input);
        } catch (error: any) {
          result = { error: error.message };
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        });
      }

      messages.push({ role: 'user', content: toolResults });
      maxIterations--;
      continue;
    }

    break;
  }

  return { findings: { error: 'Research did not complete' }, toolCalls };
}

// Generic research runner - uses Gemini (primary) with Claude fallback
async function runAIResearch(systemPrompt: string, userPrompt: string) {
  if (GEMINI_API_KEY) {
    try {
      return await runGeminiResearch(systemPrompt, userPrompt);
    } catch (err: any) {
      console.error('Gemini research failed, trying Claude fallback:', err.message);
      if (ANTHROPIC_API_KEY) {
        return await runAIResearch(systemPrompt, userPrompt);
      }
      throw err;
    }
  }
  if (ANTHROPIC_API_KEY) {
    return await runAIResearch(systemPrompt, userPrompt);
  }
  throw new Error('No AI API key configured');
}

// Tool execution functions
async function callMCPDiscovery(input: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-discovery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`MCP Discovery failed: ${response.status}`);
  }

  return await response.json();
}

async function callNIVFireplexity(input: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`NIV Fireplexity failed: ${response.status}`);
  }

  return await response.json();
}

async function callJournalistRegistry(input: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/journalist-registry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Journalist Registry failed: ${response.status}`);
  }

  return await response.json();
}

async function callMasterSourceRegistry(input: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/master-source-registry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Master Source Registry failed: ${response.status}`);
  }

  return await response.json();
}

async function callKnowledgeLibrary(input: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/knowledge-library-registry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Knowledge Library failed: ${response.status}`);
  }

  return await response.json();
}
