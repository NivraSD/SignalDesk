import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const TOOLS = [
  {
    name: "generate_media_list",
    description: "Intelligently generate a targeted media list based on topic, industry, or coverage area. Returns journalists from database with option to enrich with web research.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The topic, industry, or coverage area to find journalists for (e.g., 'PR technology', 'AI in healthcare', 'climate tech')"
        },
        count: {
          type: "number",
          description: "Number of journalists to return (default 15)",
          default: 15
        },
        tier: {
          type: "string",
          description: "Publication tier preference: tier1 (top outlets), tier2 (mid-tier), or all",
          enum: ["tier1", "tier2", "all"],
          default: "tier1"
        },
        enrich_with_web: {
          type: "boolean",
          description: "Whether to supplement database results with web research if needed",
          default: false
        }
      },
      required: ["topic"]
    }
  }
];

/**
 * Intelligently analyze a topic and determine WHO would actually care about this story
 */
async function analyzeTopicForJournalists(topic: string): Promise<{
  primary_target: {
    industry: string;
    reasoning: string;
    outlet_examples: string[];
  };
  secondary_targets: Array<{
    industry: string;
    reasoning: string;
    outlet_examples: string[];
  }>;
  beat_filters: string[];
  overall_strategy: string;
}> {
  const prompt = `You are a PR strategist building a targeted media list. Your job is to identify which journalists would ACTUALLY be interested in writing about this topic.

TOPIC: "${topic}"

AVAILABLE JOURNALIST DATABASE:
- Industries: public_relations, technology, healthcare, fintech, advertising, climate, cryptocurrency, etc.
- We have journalists from outlets like: PRWeek, PR News, Ragan, TechCrunch, NYT, WSJ, Bloomberg, etc.
- Each journalist has beats/coverage areas

YOUR TASK: Think like a publicist. Who would CARE about this story?

CRITICAL THINKING:
1. What is the PRIMARY audience for this topic? (Who covers this beat directly?)
2. What are SECONDARY audiences? (Who might cover this tangentially?)
3. Should we prioritize trade publications or mainstream media?
4. Are there specific beats within industries we should filter for?

EXAMPLE THOUGHT PROCESS:
"PR technology" →
- PRIMARY: PR trade journalists (PRWeek, PR News, Ragan) - they cover PR industry trends including tech
- SECONDARY: Martech/adtech journalists who cover PR platforms
- TERTIARY: Enterprise tech journalists who write about SaaS/communications tools
- Beat filters: Look for "technology", "PR tech", "martech" in beats
- Strategy: Start with PR trades (guaranteed interest), supplement with tech if needed

Return JSON:
{
  "primary_target": {
    "industry": "public_relations",
    "reasoning": "PR trade journalists cover PR industry developments including technology",
    "outlet_examples": ["PRWeek", "PR News", "Ragan"]
  },
  "secondary_targets": [
    {
      "industry": "advertising",
      "reasoning": "Martech journalists often cover PR/comms tools",
      "outlet_examples": ["Marketing Dive", "Digiday"]
    },
    {
      "industry": "technology",
      "reasoning": "Enterprise SaaS journalists might cover PR tech platforms",
      "outlet_examples": ["TechCrunch", "VentureBeat"]
    }
  ],
  "beat_filters": ["technology", "PR tech", "martech", "enterprise software"],
  "overall_strategy": "Prioritize PR trade publications (core audience), supplement with martech/enterprise tech journalists if needed to reach count"
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0.2,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      console.log('✅ Media targeting strategy:', analysis);
      return analysis;
    }

    throw new Error('No JSON in response');
  } catch (error) {
    console.error('❌ Topic analysis failed:', error);
    // Fallback to basic targeting
    return {
      primary_target: {
        industry: topic.toLowerCase().includes('pr') ? 'public_relations' : 'technology',
        reasoning: 'Fallback analysis',
        outlet_examples: []
      },
      secondary_targets: [],
      beat_filters: [topic],
      overall_strategy: 'Fallback to primary industry only'
    };
  }
}

/**
 * Build media list using PR strategist approach
 * PRIMARY targets first, then SUPPLEMENT with secondary/tertiary
 */
async function buildTargetedMediaList(params: {
  strategy: {
    primary_target: { industry: string; reasoning: string; outlet_examples: string[] };
    secondary_targets: Array<{ industry: string; reasoning: string; outlet_examples: string[] }>;
    beat_filters: string[];
    overall_strategy: string;
  };
  tier: string;
  count: number;
}): Promise<any[]> {
  const allJournalists: any[] = [];

  // STEP 1: Get PRIMARY targets (the journalists who DEFINITELY care)
  console.log(`🎯 PRIMARY TARGET: ${params.strategy.primary_target.industry}`);
  console.log(`   Reasoning: ${params.strategy.primary_target.reasoning}`);

  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/journalist-lookup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        industry: params.strategy.primary_target.industry,
        tier: params.tier,
        count: params.count
      })
    });

    const data = await response.json();
    if (data.journalists) {
      console.log(`✅ PRIMARY: Found ${data.journalists.length} core journalists`);
      allJournalists.push(...data.journalists.map((j: any) => ({
        ...j,
        target_priority: 'primary',
        relevance_reasoning: params.strategy.primary_target.reasoning
      })));
    }
  } catch (error) {
    console.error(`❌ Error querying primary target:`, error);
  }

  // STEP 2: SUPPLEMENT with secondary targets if needed
  if (allJournalists.length < params.count && params.strategy.secondary_targets.length > 0) {
    const remainingCount = params.count - allJournalists.length;
    console.log(`📊 Need ${remainingCount} more - querying SECONDARY targets...`);

    for (const target of params.strategy.secondary_targets) {
      console.log(`   🔹 ${target.industry}: ${target.reasoning}`);

      try {
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/journalist-lookup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            industry: target.industry,
            tier: params.tier,
            count: remainingCount
          })
        });

        const data = await response.json();
        if (data.journalists) {
          console.log(`   ✅ SECONDARY: Found ${data.journalists.length} supplementary journalists`);
          allJournalists.push(...data.journalists.map((j: any) => ({
            ...j,
            target_priority: 'secondary',
            relevance_reasoning: target.reasoning
          })));
        }
      } catch (error) {
        console.error(`❌ Error querying secondary target ${target.industry}:`, error);
      }

      if (allJournalists.length >= params.count) break;
    }
  }

  console.log(`📊 Total journalists before dedup: ${allJournalists.length}`);
  console.log(`   Sample IDs:`, allJournalists.slice(0, 3).map(j => ({ id: j.id, name: j.name })));

  // Remove duplicates, keeping primary targets over secondary
  // Use composite key of id OR name+outlet to handle journalists without IDs
  const uniqueJournalists = Array.from(
    new Map(allJournalists.map(j => [j.id || `${j.name}_${j.outlet}`, j])).values()
  );

  console.log(`📊 Unique journalists after dedup: ${uniqueJournalists.length}`);

  return uniqueJournalists.slice(0, params.count);
}

/**
 * Main function: Generate intelligent media list
 */
async function generateMediaList(args: any) {
  const { topic, count = 15, tier = 'tier1', enrich_with_web = false } = args;

  console.log(`📋 Generating media list for topic: "${topic}"`);
  console.log(`🎯 Parameters: count=${count}, tier=${tier}, enrich_with_web=${enrich_with_web}`);

  try {
    // Step 1: Analyze topic with PR strategist mindset
    const strategy = await analyzeTopicForJournalists(topic);
    console.log(`🧠 Media targeting strategy complete`);
    console.log(`📋 Strategy: ${strategy.overall_strategy}`);

    // Step 2: Build targeted media list (primary first, then supplement)
    const journalists = await buildTargetedMediaList({
      strategy,
      tier,
      count
    });

    console.log(`✅ Built targeted list: ${journalists.length} journalists`);

    // Step 3: Format response with priority indicators
    const formattedJournalists = journalists.map((j, i) => ({
      name: j.name,
      outlet: j.outlet,
      beat: j.beat || j.coverage_area,
      tier: j.tier,
      email: j.email,
      twitter: j.twitter_handle || j.twitter,
      linkedin: j.linkedin_url,
      priority: j.target_priority,
      why_relevant: j.relevance_reasoning
    }));

    return {
      content: [{
        type: "media_list",
        journalists: formattedJournalists,
        metadata: {
          topic,
          count: journalists.length,
          requested_count: count,
          primary_industry: strategy.primary_target.industry,
          secondary_industries: strategy.secondary_targets.map(t => t.industry),
          strategy: strategy.overall_strategy,
          tier,
          source: 'database'
        }
      }],
      success: true
    };

  } catch (error: any) {
    console.error('❌ Media list generation failed:', error);
    return {
      content: [{
        type: "error",
        message: error.message || 'Failed to generate media list',
        metadata: { error: true, topic }
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
      case 'generate_media_list':
        result = await generateMediaList(args);
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
