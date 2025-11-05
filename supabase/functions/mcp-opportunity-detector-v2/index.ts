import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
// Temporarily disable creative enhancer import to fix timeout
// import { creativeEnhancer } from './opportunity-creative.ts';
import { detectSocialOpportunities, type SocialSignal } from './social-patterns.ts';
import type { OpportunityV2, ContentItem } from './types-v2.ts';
import { buildOpportunityDetectionPromptV2, OPPORTUNITY_SYSTEM_PROMPT_V2 } from './prompt-v2.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Try both API key names like NIV does
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');

console.log('🔑 Environment check:', {
  has_url: !!SUPABASE_URL,
  has_service_key: !!SUPABASE_SERVICE_KEY,
  has_anthropic: !!ANTHROPIC_API_KEY,
  key_length: SUPABASE_SERVICE_KEY?.length || 0
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpportunityDetectionRequest {
  organization_id: string;
  organization_name: string;
  enriched_data: any;
  executive_synthesis?: any;
  profile?: any;
  detection_config?: {
    min_score?: number;
    max_opportunities?: number;
    focus_areas?: string[];
  };
}

interface DetectedOpportunity {
  title: string;
  description: string;
  score: number;
  urgency: 'high' | 'medium' | 'low';
  time_window: string;
  category: string;
  trigger_event: string;
  pattern_matched: string;
  pr_angle: string;
  confidence_factors: string[];
  context: any;
  recommended_action: {
    what: {
      primary_action: string;
      specific_tasks: string[];
      deliverables: string[];
    };
    who: {
      owner: string;
      team: string[];
    };
    when: {
      start_immediately: boolean;
      ideal_launch: string;
      duration: string;
    };
    where: {
      channels: string[];
      platforms: string[];
    };
  };
}

/**
 * Extract and structure data from enriched_data for Claude
 * Similar to prepareSynthesisContext in mcp-executive-synthesis
 */
async function extractIntelligenceData(enrichedData: any, organizationName: string, organizationId: string) {
  // Use organized_intelligence as primary source, fall back to extracted_data
  const organizedData = enrichedData?.organized_intelligence || {};
  const extractedData = enrichedData?.extracted_data || {};
  const profile = enrichedData?.profile || {};
  const executiveSummary = enrichedData?.executive_summary || {};

  // Extract events, entities, topics, quotes
  const events = (organizedData.events?.length > 0 ? organizedData.events : extractedData.events) || [];
  const entities = (organizedData.entities?.length > 0 ? organizedData.entities : extractedData.entities) || [];
  const topics = (organizedData.topic_clusters?.length > 0 ? organizedData.topic_clusters : extractedData.topic_clusters) || [];
  const quotes = (organizedData.quotes?.length > 0 ? organizedData.quotes : extractedData.quotes) || [];
  const metrics = (organizedData.metrics?.length > 0 ? organizedData.metrics : extractedData.metrics) || [];

  // Separate events about the org vs competitors/market
  const orgNameLower = organizationName?.toLowerCase() || '';
  const eventsAboutOrg = events.filter(e => {
    const entityLower = e.entity?.toLowerCase() || '';
    return entityLower.includes(orgNameLower) || entityLower === orgNameLower;
  });

  const eventsAboutOthers = events.filter(e => {
    const entityLower = e.entity?.toLowerCase() || '';
    return !entityLower.includes(orgNameLower) && entityLower !== orgNameLower;
  });

  // Get discovery targets from intelligence_targets table (new schema)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: intelligenceTargets } = await supabase
    .from('intelligence_targets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('active', true);

  const discoveryTargets = {
    competitors: intelligenceTargets?.filter(t => t.type === 'competitor').map(t => t.name) || [],
    stakeholders: intelligenceTargets?.filter(t => t.type === 'stakeholder' || t.type === 'influencer').map(t => t.name) || [],
    topics: intelligenceTargets?.filter(t => t.type === 'topic' || t.type === 'keyword').map(t => t.name) || []
  };

  console.log('📊 Intelligence Data Extraction:', {
    totalEvents: events.length,
    eventsAboutOrg: eventsAboutOrg.length,
    eventsAboutCompetitors: eventsAboutOthers.length,
    entities: entities.length,
    topics: topics.length,
    quotes: quotes.length,
    competitors: discoveryTargets.competitors.length
  });

  // Structure data for Claude
  return {
    events: {
      competitive: eventsAboutOthers,
      organizational: eventsAboutOrg,
      all: events
    },
    entities: entities,
    topics: topics,
    quotes: quotes,
    metrics: metrics,
    discoveryTargets: discoveryTargets,
    executivePriorities: {
      immediate: executiveSummary?.immediate_actions || [],
      opportunities: executiveSummary?.strategic_opportunities || [],
      threats: executiveSummary?.competitive_threats || [],
      trends: executiveSummary?.market_trends || []
    },
    organizationProfile: {
      strengths: profile?.strengths || [],
      weaknesses: profile?.weaknesses || [],
      industry: profile?.industry || '',
      competitors: discoveryTargets.competitors
    }
  };
}

/**
 * Call Claude to detect PR opportunities from enriched intelligence
 */
async function detectOpportunitiesWithClaude(
  extractedData: any,
  organizationName: string,
  organizationId: string
): Promise<DetectedOpportunity[]> {

  const { events, entities, topics, quotes, metrics, discoveryTargets, executivePriorities, organizationProfile } = extractedData;

  // Prioritize competitor/market events (80/20 rule)
  const competitorEvents = events.competitive.slice(0, 30);
  const orgEvents = events.organizational.slice(0, 10);
  const topEvents = [...competitorEvents, ...orgEvents];

  console.log(`🤖 Calling Claude with ${topEvents.length} events for opportunity detection`);
  console.log('Using model:', 'claude-sonnet-4-20250514');
  console.log('API Key present:', !!ANTHROPIC_API_KEY);
  console.log('API Key length:', ANTHROPIC_API_KEY?.length || 0);
  console.log('API Key prefix:', ANTHROPIC_API_KEY?.substring(0, 10) || 'N/A');

  const prompt = `MONITORING DATE: ${new Date().toISOString().split('T')[0]}

INTELLIGENCE DATA FROM TODAY'S MONITORING:

EVENTS DETECTED (${topEvents.length} total):
${topEvents.map((e, i) =>
  `${i+1}. [${e.type?.toUpperCase()}] ${e.entity}: ${e.description}`
).join('\n')}

TRENDING TOPICS (${topics.length} clusters):
${topics.slice(0, 10).map(t =>
  `• ${t.theme || t.topic}: ${t.article_count || t.count} mentions`
).join('\n')}

KEY QUOTES:
${quotes.slice(0, 10).map(q =>
  `"${q.text}" - ${q.source || 'Unknown'}`
).join('\n')}

TOP ENTITIES MENTIONED:
${entities.slice(0, 15).map(e =>
  `• ${e.name} (${e.type}): ${e.total_mentions || 1} mentions`
).join('\n')}

ORGANIZATION STRENGTHS: ${organizationProfile.strengths.join(', ')}

Analyze the intelligence above and identify 8-10 HIGH-VALUE PR opportunities based on the patterns I know.
Each opportunity must:
- Be based on SPECIFIC events from the data above
- Be actionable within a defined time window
- Include a clear PR angle and messaging strategy
- Have a confidence score based on signal strength

Return as valid JSON array with this EXACT structure:

[
  {
    "title": "Brief, action-oriented title (e.g., 'Counter competitor's product delay with stability message')",
    "description": "2-3 sentence description of the opportunity and why it matters",
    "score": 85,
    "urgency": "high",
    "time_window": "24-48 hours",
    "category": "COMPETITIVE",
    "trigger_event": "Reference the specific event(s) from the data that created this opportunity",
    "pattern_matched": "Which opportunity pattern this represents",
    "pr_angle": "The specific narrative/message we should push",
    "confidence_factors": [
      "Multiple confirming signals detected",
      "Competitor vulnerability confirmed",
      "Media interest high on topic"
    ],
    "recommended_action": {
      "what": {
        "primary_action": "The main PR action to take",
        "specific_tasks": [
          "Draft press release on our stability",
          "Pitch exclusive to key journalist",
          "Activate executive on social media"
        ],
        "deliverables": [
          "Press release",
          "Media pitch",
          "Social content"
        ]
      },
      "who": {
        "owner": "CMO",
        "team": ["PR Team", "Content Team", "Executive Comms"]
      },
      "when": {
        "start_immediately": true,
        "ideal_launch": "Within 24 hours",
        "duration": "3-5 days"
      },
      "where": {
        "channels": ["Press", "Social", "Direct outreach"],
        "platforms": ["LinkedIn", "Twitter", "Instagram", "TikTok", "Industry publications"]
      }
    }
  }
]

Categories: COMPETITIVE, STRATEGIC, VIRAL, THOUGHT_LEADERSHIP, DEFENSIVE, TALENT, STAKEHOLDER
Urgency: high (act now), medium (this week), low (strategic)

IMPORTANT REQUIREMENTS:
1. Every opportunity must reference specific events/entities from the data
2. Focus heavily on competitor actions and market movements (80% external, 20% internal)
3. Be aggressive in finding opportunities - look for subtle signals
4. Consider cascade effects - how one event creates multiple opportunities
5. Prioritize opportunities where ${organizationName}'s strengths align with competitor weaknesses
6. Include defensive opportunities to protect against emerging threats
7. Score based on: impact potential (40%), time sensitivity (30%), feasibility (30%)

PLATFORM SELECTION STRATEGY:
- LinkedIn: B2B thought leadership, executive positioning, professional announcements, partnerships
- Twitter: Real-time commentary, breaking news, quick responses, industry conversations
- Instagram: Visual storytelling, brand personality, behind-the-scenes, customer stories (if consumer-facing)
- TikTok: Educational content through entertainment, trend participation, authentic connection (if targeting younger demographics or consumer brand awareness)
- Industry publications: Credibility, expert positioning, long-form thought leadership
ALWAYS consider Instagram/TikTok for consumer-facing opportunities, brand awareness, or visual content

CRITICAL JSON FORMATTING RULES:
1. Return ONLY a valid JSON array starting with [ and ending with ]
2. NO markdown, NO explanations, NO text outside the JSON
3. Escape ALL quotes inside strings using \\"
4. NO trailing commas
5. NO line breaks inside string values - use spaces instead
6. **Limit to TOP 3 opportunities ONLY** - quality over quantity
7. Keep execution plans CONCISE - 2-3 stakeholders max per opportunity
8. Each content item brief should be 1-2 sentences max
9. If approaching token limit, STOP EARLY with fewer complete opportunities

The response MUST be parseable JSON. Test: can you copy-paste your output into JSON.parse()? If no, simplify.

Start your response with [ and end with ] - nothing else.`;

  try {
    // Remove timeout for now to debug
    // const controller = new AbortController();
    // const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout (leaving 10s buffer)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      // signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,  // Reduced from 6000 to prevent truncation/malformed JSON
        temperature: 0.7,
        system: `You are a PR opportunity detection system analyzing real-time intelligence data.
Your job is to identify ACTIONABLE PR opportunities from today's monitoring data.

ORGANIZATION: ${organizationName}
INDUSTRY: ${organizationProfile.industry}
KEY COMPETITORS: ${discoveryTargets.competitors.slice(0, 10).join(', ')}

PR OPPORTUNITY PATTERNS TO DETECT:
1. COMPETITOR VULNERABILITY: Competitors facing challenges we can capitalize on
2. NARRATIVE VACUUM: Important topics lacking expert voices we could fill
3. CASCADE OPPORTUNITY: Primary events creating downstream effects we can leverage
4. VIRAL MOMENT: Trending topics we can authentically join
5. THOUGHT LEADERSHIP: Emerging issues where we can establish authority
6. TALENT ACQUISITION: Workforce disruptions creating hiring opportunities
7. STAKEHOLDER ENGAGEMENT: Key influencer movements to leverage
8. DEFENSIVE POSITIONING: Threats requiring proactive PR response

Return opportunities as a valid JSON array with proper structure.`,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    // clearTimeout(timeoutId); // Clear the timeout if response comes back
    console.log('✅ Claude API responded');
    console.log('Claude API Response status:', response.status);

    if (!response.ok) {
      console.error('Claude API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    console.log('✅ Claude response received, length:', content.length);
    console.log('🔍 First 500 chars:', content.substring(0, 500));

    // Don't log the full response - it's too large
    // console.log('RAW CLAUDE RESPONSE:', content);

    // Parse response - check what we're actually getting
    let opportunities: DetectedOpportunity[] = [];

    console.log('🔍 Response type check:', {
      starts_with_bracket: content.startsWith('['),
      starts_with_brace: content.startsWith('{'),
      includes_json_fence: content.includes('```json'),
      includes_fence: content.includes('```'),
      first_100_chars: content.substring(0, 100)
    });

    try {
      // Clean the response first - handle various markdown fence formats
      let cleanContent = content.trim();

      // Remove ALL types of code fences (handles malformed like `` `json` too)
      // First, try standard fences
      if (cleanContent.includes('```json')) {
        const match = cleanContent.match(/```json\s*([\s\S]*?)```/);
        if (match) cleanContent = match[1].trim();
      } else if (cleanContent.includes('```')) {
        const match = cleanContent.match(/```\s*([\s\S]*?)```/);
        if (match) cleanContent = match[1].trim();
      }

      // Handle malformed fences like `` `json` or any backtick combinations
      if (cleanContent.includes('`')) {
        // Remove any backtick sequences at start/end
        cleanContent = cleanContent.replace(/^`+\s*(?:json)?\s*\n?/, '').replace(/`+\s*$/, '').trim();
      }

      // Now try to parse
      opportunities = JSON.parse(cleanContent);
      console.log('✅ Parsed opportunities:', opportunities.length);

    } catch (e) {
      console.error('Parse failed:', e.message);
      console.error('Attempting fallback extraction...');

      // Try to extract the outermost JSON array bracket-to-bracket
      const firstBracket = content.indexOf('[');
      const lastBracket = content.lastIndexOf(']');

      if (firstBracket >= 0 && lastBracket > firstBracket) {
        const extracted = content.substring(firstBracket, lastBracket + 1);
        try {
          opportunities = JSON.parse(extracted);
          console.log('✅ Extracted array from positions', firstBracket, 'to', lastBracket, ':', opportunities.length);
        } catch (e2) {
          console.error('Fallback also failed:', e2.message);
          console.error('Tried to parse:', extracted.substring(0, 500));
          opportunities = [];
        }
      } else {
        console.error('Could not find valid JSON array boundaries');
        opportunities = [];
      }
    }

      // Validate it's an array
    if (!Array.isArray(opportunities)) {
      console.error('Response is not an array, got:', typeof opportunities);
      opportunities = [];
    }

    console.log(`✅ Claude detected ${opportunities.length} opportunities`);

    // Add context to each opportunity (keep ALL the detail Claude provided)
    opportunities = opportunities.map(opp => ({
      ...opp,
      context: {
        events: topEvents.filter(e =>
          opp.trigger_event?.includes(e.entity) ||
          opp.trigger_event?.includes(e.description?.substring(0, 50))
        ),
        organization_id: organizationId,
        organization_name: organizationName,
        detection_timestamp: new Date().toISOString()
      }
    }));

    return opportunities;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('❌ Claude API request timed out after 50 seconds');
    } else {
      console.error('❌ Error calling Claude:', error);
    }
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      anthropicKey: ANTHROPIC_API_KEY ? 'Set' : 'Missing',
      keyLength: ANTHROPIC_API_KEY?.length || 0
    });
    // Fall back to empty array if Claude fails
    console.log('⚠️ RETURNING EMPTY ARRAY - Claude call failed');
    return [];
  }
}

/**
 * V2: Detect opportunities with complete execution plans
 */
async function detectOpportunitiesV2(
  extractedData: any,
  organizationName: string,
  organizationId: string
): Promise<OpportunityV2[]> {

  console.log('🚀 V2 Opportunity Detection - Building execution-ready opportunities...')

  const prompt = buildOpportunityDetectionPromptV2({
    organizationName,
    events: extractedData.events.all.slice(0, 25), // Reduced from 40 to prevent timeout
    topics: extractedData.topics.slice(0, 8), // Limit topics
    quotes: extractedData.quotes.slice(0, 8), // Limit quotes
    entities: extractedData.entities.slice(0, 12), // Limit entities
    discoveryTargets: extractedData.discoveryTargets,
    organizationProfile: extractedData.organizationProfile
  })

  console.log('Calling Claude Sonnet 4 for V2 opportunity generation...')
  console.log('Prompt length:', prompt.length, 'characters')

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 20000, // Reduced from 32k to prevent timeout - still plenty for execution plans
        temperature: 0.7,
        system: OPPORTUNITY_SYSTEM_PROMPT_V2,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      console.error('Claude API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''

    console.log('✅ Claude V2 response received, length:', content.length)

    // Parse V2 opportunities
    let opportunities: OpportunityV2[] = []

    try {
      let cleanContent = content.trim()

      // Remove markdown code fences
      if (cleanContent.includes('```json')) {
        const match = cleanContent.match(/```json\s*([\s\S]*?)```/)
        if (match) cleanContent = match[1].trim()
      } else if (cleanContent.includes('```')) {
        const match = cleanContent.match(/```\s*([\s\S]*?)```/)
        if (match) cleanContent = match[1].trim()
      }

      // Remove any stray backticks
      cleanContent = cleanContent.replace(/^`+\s*(?:json)?\s*\n?/, '').replace(/`+\s*$/, '').trim()

      opportunities = JSON.parse(cleanContent)
      console.log('✅ Parsed V2 opportunities:', opportunities.length)

    } catch (e) {
      console.error('Parse failed:', e.message)

      // Fallback: extract JSON array
      const firstBracket = content.indexOf('[')
      const lastBracket = content.lastIndexOf(']')

      if (firstBracket >= 0 && lastBracket > firstBracket) {
        const extracted = content.substring(firstBracket, lastBracket + 1)
        try {
          opportunities = JSON.parse(extracted)
          console.log('✅ Extracted V2 opportunities:', opportunities.length)
        } catch (e2) {
          console.error('Fallback parse failed:', e2.message)
          return []
        }
      } else {
        console.error('Could not find JSON array in response')
        return []
      }
    }

    // Validate V2 format
    const validOpportunities = opportunities.filter(opp => {
      const hasRequiredFields =
        opp.title &&
        opp.strategic_context &&
        opp.execution_plan &&
        opp.execution_plan.stakeholder_campaigns?.length > 0

      if (!hasRequiredFields) {
        console.warn(`⚠️ Filtering out invalid V2 opportunity: "${opp.title}"`)
      }

      return hasRequiredFields
    })

    console.log(`✅ Validated ${validOpportunities.length}/${opportunities.length} V2 opportunities`)

    // Count total content items
    validOpportunities.forEach(opp => {
      const totalItems = opp.execution_plan.stakeholder_campaigns
        .reduce((sum, campaign) => sum + campaign.content_items.length, 0)
      console.log(`  - "${opp.title}": ${totalItems} content items across ${opp.execution_plan.stakeholder_campaigns.length} stakeholder campaigns`)
    })

    return validOpportunities

  } catch (error: any) {
    console.error('❌ Error in V2 opportunity detection:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    })
    return []
  }
}

/**
 * Normalize urgency value to valid database constraint
 * Converts time-based urgency (e.g. "24-48 hours") to categorical ("high"/"medium"/"low")
 */
function normalizeUrgency(urgency: any): 'high' | 'medium' | 'low' {
  if (!urgency) return 'medium';

  const urgencyStr = String(urgency).toLowerCase();

  // Already valid
  if (urgencyStr === 'high' || urgencyStr === 'medium' || urgencyStr === 'low') {
    return urgencyStr as 'high' | 'medium' | 'low';
  }

  // Map time-based urgency to categorical
  // Patterns like "24-48 hours", "immediate", "this week", "critical", etc.
  if (urgencyStr.includes('immediate') || urgencyStr.includes('critical') ||
      urgencyStr.includes('24') || urgencyStr.includes('48') ||
      urgencyStr.includes('hour') || urgencyStr.includes('asap') ||
      urgencyStr.includes('now') || urgencyStr.includes('urgent')) {
    return 'high';
  }

  if (urgencyStr.includes('week') || urgencyStr.includes('7 day') ||
      urgencyStr.includes('soon') || urgencyStr.includes('moderate')) {
    return 'medium';
  }

  // Default to medium if we can't determine
  return 'medium';
}

/**
 * Calculate expiry date based on time window
 */
function calculateExpiryDate(timeWindow: string): string {
  const now = new Date();
  let hours = 48; // default

  if (timeWindow?.includes('24')) hours = 24;
  else if (timeWindow?.includes('48')) hours = 48;
  else if (timeWindow?.includes('72')) hours = 72;
  else if (timeWindow?.includes('week')) hours = 168;
  else if (timeWindow?.includes('days')) {
    const days = parseInt(timeWindow.match(/\d+/)?.[0] || '3');
    hours = days * 24;
  }

  now.setHours(now.getHours() + hours);
  return now.toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let {
      organization_id,
      organization_name,
      enriched_data,
      search_results, // NEW: Accept search_results from real-time-alert-router
      executive_synthesis,
      profile,
      detection_config = {},
      social_signals // NEW: Accept social signals
    }: OpportunityDetectionRequest & {
      search_results?: any[];
      social_signals?: SocialSignal[]
    } = await req.json();

    console.log(`🎯 PR Opportunity Detection for ${organization_name}`);
    console.log('📊 Input data check:', {
      has_enriched_data: !!enriched_data,
      has_search_results: !!search_results,
      search_results_count: search_results?.length || 0,
      organized_events: enriched_data?.organized_intelligence?.events?.length || 0,
      extracted_data_events: enriched_data?.extracted_data?.events?.length || 0,
      has_executive_synthesis: !!executive_synthesis,
      social_signals_count: social_signals?.length || 0,
      has_profile: !!profile,
      enriched_articles: enriched_data?.enriched_articles?.length || 0,
      knowledge_graph_entities: enriched_data?.knowledge_graph?.entities?.length || 0
    });

    // If we have search_results (from real-time-alert-router), convert them to enriched_data format
    if (search_results && search_results.length > 0 && !enriched_data) {
      console.log(`📰 Converting ${search_results.length} search results to enriched data format...`);

      // Convert search results to simple events
      const events = search_results.map(article => ({
        type: 'NEWS',
        entity: article.source || 'News',
        description: `${article.title}: ${article.content?.substring(0, 200) || ''}`,
        date: article.published_at || new Date().toISOString(),
        url: article.url,
        relevance_score: article.relevance_score || 75
      }));

      // Create enriched_data structure
      enriched_data = {
        extracted_data: {
          events: events,
          entities: [],
          topics: [],
          quotes: []
        },
        profile: profile || {}
      };

      console.log(`✅ Converted search results to ${events.length} events`);
      events.slice(0, 3).forEach((e, i) => {
        console.log(`  ${i+1}. [${e.type}] ${e.entity}: ${e.description?.substring(0, 100)}`);
      });
    }

    // Log sample events to verify real data
    if (enriched_data?.organized_intelligence?.events?.length > 0) {
      console.log('📌 Sample events from enriched data:');
      enriched_data.organized_intelligence.events.slice(0, 3).forEach((e, i) => {
        console.log(`  ${i+1}. [${e.type}] ${e.entity}: ${e.description?.substring(0, 100)}`);
      });
    } else if (enriched_data?.extracted_data?.events?.length > 0) {
      console.log('📌 Sample events from extracted data:');
      enriched_data.extracted_data.events.slice(0, 3).forEach((e, i) => {
        console.log(`  ${i+1}. [${e.type}] ${e.entity}: ${e.description?.substring(0, 100)}`);
      });
    } else {
      console.log('⚠️ NO EVENTS FOUND IN ENRICHED DATA');
    }

    // Extract intelligence data
    const extractedData = await extractIntelligenceData(enriched_data, organization_name, organization_id);

    // V2: Detect opportunities with execution plans
    console.log('🎯 Using V2 Opportunity Detection Engine...')
    let opportunitiesV2 = await detectOpportunitiesV2(
      extractedData,
      organization_name,
      organization_id
    )

    console.log(`✅ V2 Detection Complete: Found ${opportunitiesV2.length} execution-ready opportunities`);

    // Skip V1 detection to prevent timeouts - V2 is now the primary engine
    console.log('⏭️ Skipping V1 detection (using V2 only)')
    let opportunities: DetectedOpportunity[] = [];

    // Enhance opportunities with creative angles
    console.log('🎨 Enhancing opportunities with creative angles...');
    const creativeContext = {
      organizationName: organization_name,
      strengths: profile?.strengths || [],
      competitorGaps: profile?.competition?.gaps || [],
      industryContext: profile?.industry || '',
      events: extractedData.events.all.slice(0, 10)
    };

    // Skip creative enhancement for now - causing timeouts
    // TODO: Optimize this to work without timeouts
    console.log('⏭️ Skipping creative enhancement to prevent timeout');

    // Comment out for now to prevent timeouts
    /*
    opportunities = await creativeEnhancer.enhanceWithCreativeAngles(
      opportunities,
      creativeContext,
      ANTHROPIC_API_KEY
    );

    // Also generate some pure creative opportunities
    const pureCreativeOpps = await creativeEnhancer.generatePureCreativeOpportunities(
      creativeContext,
      ANTHROPIC_API_KEY
    );

    // Combine both types
    opportunities = [...opportunities, ...pureCreativeOpps];
    */

    console.log(`📊 Total opportunities after creative enhancement: ${opportunities.length}`);

    // SOCIAL OPPORTUNITY DETECTION
    if (social_signals && social_signals.length > 0) {
      console.log(`🔍 Detecting social opportunities from ${social_signals.length} signals`);

      const socialOpportunities = detectSocialOpportunities(social_signals, organization_name);

      console.log(`✅ Detected ${socialOpportunities.length} social opportunities`);

      // Convert to standard opportunity format
      const formattedSocialOpps = socialOpportunities.map((socialOpp, idx) => ({
        ...socialOpp,
        source: 'social_media',
        context: {
          social_signals: socialOpp.signals,
          source_platforms: [...new Set(socialOpp.signals.map(s => s.platform))],
          detection_time: new Date().toISOString()
        }
      }));

      opportunities = [...opportunities, ...formattedSocialOpps];

      console.log(`📊 Total opportunities including social: ${opportunities.length}`);
    }

    // Apply smart filtering: keep all if <= 5, otherwise rank and take top 5
    const targetCount = 5;

    if (opportunities.length <= targetCount) {
      // Keep all opportunities when we have 5 or fewer
      console.log(`✅ Final opportunities: ${opportunities.length} (keeping all - below threshold of ${targetCount})`);
    } else {
      // More than 5: rank by score and take top 5
      opportunities = opportunities
        .sort((a, b) => b.score - a.score) // Sort descending by score
        .slice(0, targetCount);
      console.log(`✅ Final opportunities: ${opportunities.length} (ranked by score, kept top ${targetCount})`);
    }

    // Store opportunities in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Clear existing opportunities for this organization
    console.log(`🗑️ Clearing existing opportunities for organization_id: "${organization_id}"`);
    const { data: existingOpps } = await supabase
      .from('opportunities')
      .select('id, organization_id, title, version')
      .eq('organization_id', organization_id);

    console.log(`Found ${existingOpps?.length || 0} existing opportunities (${existingOpps?.filter(o => o.version === 2).length || 0} V2) to clear`);

    const { error: deleteError } = await supabase
      .from('opportunities')
      .delete()
      .eq('organization_id', organization_id);

    if (deleteError) {
      console.error('Error clearing old opportunities:', deleteError);
    }

    // Generate embeddings for all opportunities in parallel
    const allOpportunities = [...opportunitiesV2, ...opportunities];
    if (allOpportunities.length > 0) {
      console.log(`🔍 Generating embeddings for ${allOpportunities.length} opportunities...`);
      const embeddingPromises = allOpportunities.map(async (opp) => {
        const textForEmbedding = `${opp.title}\n\n${opp.description.substring(0, 8000)}`;
        const { data, error } = await supabase.functions.invoke('generate-embeddings', {
          body: { text: textForEmbedding }
        });
        if (error || !data || !data.embedding) {
          console.error(`❌ Embedding generation failed for opportunity "${opp.title}"`);
          return null;
        }
        return data.embedding;
      });

      const embeddings = await Promise.all(embeddingPromises);
      console.log(`✅ Generated ${embeddings.filter(e => e).length}/${allOpportunities.length} embeddings`);

      // Store embeddings in separate arrays for V2 and V1
      const v2Embeddings = embeddings.slice(0, opportunitiesV2.length);
      const v1Embeddings = embeddings.slice(opportunitiesV2.length);

      // Save V2 opportunities with full execution plans
      const savedOpportunityIds: string[] = []

      if (opportunitiesV2.length > 0) {
        console.log(`📦 Storing ${opportunitiesV2.length} V2 opportunities with execution plans...`);

        for (let i = 0; i < opportunitiesV2.length; i++) {
          const opp = opportunitiesV2[i];
        const insertData = {
          organization_id,
          title: opp.title,
          description: opp.description,
          score: opp.score,
          urgency: normalizeUrgency(opp.urgency), // Normalize to valid values
          category: opp.category,

          // V2 fields
          strategic_context: opp.strategic_context,
          execution_plan: opp.execution_plan,
          time_window: opp.strategic_context?.time_window || opp.time_window,
          expected_impact: opp.strategic_context?.expected_impact || '',
          auto_executable: opp.auto_executable !== false, // Default true for V2
          executed: false,
          version: 2,

          // Legacy data field for backward compatibility
          data: {
            confidence_factors: opp.confidence_factors,
            pattern_matched: opp.detection_metadata?.pattern_matched || opp.category,
            trigger_event: opp.strategic_context?.trigger_events?.join('; ') || '',
            detection_metadata: opp.detection_metadata,
            // Count for UI
            total_content_items: opp.execution_plan?.stakeholder_campaigns
              ?.reduce((sum, c) => sum + c.content_items.length, 0) || 0,
            stakeholder_count: opp.execution_plan?.stakeholder_campaigns?.length || 0
          },

          status: 'active',
          expires_at: calculateExpiryDate(opp.strategic_context?.time_window || '3 days'),

          // Semantic search fields
          embedding: v2Embeddings[i],
          embedding_model: 'voyage-3-large',
          embedding_updated_at: new Date().toISOString()
        };

        const { data: savedOpp, error } = await supabase
          .from('opportunities')
          .insert(insertData)
          .select('id')
          .single();

        if (error) {
          console.error(`Error inserting V2 opportunity "${opp.title}":`, error);
        } else if (savedOpp) {
          const itemCount = opp.execution_plan.stakeholder_campaigns
            .reduce((sum, c) => sum + c.content_items.length, 0);
          console.log(`  ✅ Saved: "${opp.title}" (${itemCount} content items)`);
          savedOpportunityIds.push(savedOpp.id);
        }
      }

      console.log(`✅ Stored ${opportunitiesV2.length} V2 opportunities`);
      console.log(`💡 Tip: Use generate-opportunity-presentation edge function to create Gamma presentations on-demand`);
    }

    // Also save V1 opportunities for comparison/fallback
    if (opportunities.length > 0) {
      console.log(`📦 Storing ${opportunities.length} V1 opportunities (legacy format)...`);

      for (let i = 0; i < opportunities.length; i++) {
        const opportunity = opportunities[i];
        const insertData = {
          organization_id,
          title: opportunity.title,
          description: opportunity.description,
          score: opportunity.score,
          urgency: opportunity.urgency,
          time_window: opportunity.time_window,
          category: opportunity.category,
          version: 1, // Mark as V1
          data: {
            trigger_event: opportunity.trigger_event,
            pr_angle: opportunity.pr_angle,
            pattern_matched: opportunity.pattern_matched,
            confidence_factors: opportunity.confidence_factors,
            recommended_action: opportunity.recommended_action,
            context: opportunity.context,
            execution_type: opportunity.score >= 85 ? 'assisted' : 'manual',
            organization_name
          },
          status: 'active',
          expires_at: calculateExpiryDate(opportunity.time_window),

          // Semantic search fields
          embedding: v1Embeddings[i],
          embedding_model: 'voyage-3-large',
          embedding_updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('opportunities')
          .insert(insertData);

        if (error) {
          console.error(`Error inserting V1 opportunity "${opportunity.title}":`, error);
        }
      }

      console.log(`✅ Stored ${opportunities.length} V1 opportunities`);
    }
    } // End of embedding generation block

    return new Response(
      JSON.stringify({
        success: true,
        opportunities: opportunities, // V1 for backward compatibility
        opportunitiesV2: opportunitiesV2, // V2 with execution plans
        metadata: {
          total_v1: opportunities.length,
          total_v2: opportunitiesV2.length,
          total_content_items: opportunitiesV2.reduce((sum, opp) =>
            sum + opp.execution_plan.stakeholder_campaigns
              .reduce((s, c) => s + c.content_items.length, 0), 0
          ),
          detection_method: 'claude-sonnet-4-20250514',
          detection_version: '2.0',
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error in opportunity detection:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        opportunities: [],
        opportunitiesV2: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});