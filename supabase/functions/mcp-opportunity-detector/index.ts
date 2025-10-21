import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
// Temporarily disable creative enhancer import to fix timeout
// import { creativeEnhancer } from './opportunity-creative.ts';
import { detectSocialOpportunities, type SocialSignal } from './social-patterns.ts';

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
function extractIntelligenceData(enrichedData: any, organizationName: string) {
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

  // Get discovery targets from profile
  const discoveryTargets = {
    competitors: [
      ...(profile?.competition?.direct_competitors || []),
      ...(profile?.competition?.indirect_competitors || []),
      ...(profile?.competition?.emerging_threats || [])
    ].filter(Boolean),
    stakeholders: [
      ...(profile?.stakeholders?.regulators || []),
      ...(profile?.stakeholders?.major_investors || []),
      ...(profile?.stakeholders?.executives || [])
    ].filter(Boolean),
    topics: [
      ...(profile?.trending?.hot_topics || []),
      ...(profile?.keywords || []),
      ...(profile?.monitoring_config?.keywords || [])
    ].filter(Boolean)
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
  console.log('Using model:', 'claude-haiku-4-5-20251001');
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
        "platforms": ["LinkedIn", "Twitter", "Industry publications"]
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

CRITICAL: Return ONLY a valid JSON array starting with [ and ending with ].
Do not include any markdown formatting, explanations, or text outside the JSON.
Ensure all JSON strings are properly escaped - use \\" for quotes inside strings.
Do not include any comments in the JSON (no // or /* */ comments).
Ensure proper comma placement - no trailing commas.
Example format: [{"title": "...", "description": "...", ...}]`;

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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 6000,
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
      // Clean the response first
      let cleanContent = content.trim();

      // Remove markdown if present
      if (cleanContent.includes('```json')) {
        const match = cleanContent.match(/```json\s*([\s\S]*?)```/);
        if (match) cleanContent = match[1].trim();
      } else if (cleanContent.includes('```')) {
        const match = cleanContent.match(/```\s*([\s\S]*?)```/);
        if (match) cleanContent = match[1].trim();
      }

      // Now try to parse
      opportunities = JSON.parse(cleanContent);
      console.log('✅ Parsed opportunities:', opportunities.length);

    } catch (e) {
      console.error('Parse failed:', e.message);
      console.error('Attempting fallback extraction...');

      // Try to extract array
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          opportunities = JSON.parse(match[0]);
          console.log('✅ Extracted array:', opportunities.length);
        } catch (e2) {
          console.error('Fallback also failed:', e2.message);
          opportunities = [];
        }
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
    const {
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
    const extractedData = extractIntelligenceData(enriched_data, organization_name);

    // Call Claude to detect opportunities
    let opportunities = await detectOpportunitiesWithClaude(
      extractedData,
      organization_name,
      organization_id
    );

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

    // Apply filtering based on config
    const minScore = detection_config.min_score || 60;
    opportunities = opportunities.filter(opp => opp.score >= minScore);

    const maxOpps = detection_config.max_opportunities || 20;
    opportunities = opportunities.slice(0, maxOpps);

    console.log(`✅ Final opportunities: ${opportunities.length} (filtered by score >= ${minScore})`);

    // Store opportunities in database
    if (opportunities.length > 0) {
      console.log('📦 Storing opportunities in database...');
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Clear existing opportunities for this organization
      console.log(`🗑️ Clearing existing opportunities for organization_id: "${organization_id}"`);

      // First, let's see what opportunities exist
      const { data: existingOpps } = await supabase
        .from('opportunities')
        .select('id, organization_id, title')
        .eq('organization_id', organization_id);

      console.log(`Found ${existingOpps?.length || 0} existing opportunities to clear for org_id "${organization_id}"`);

      const { error: deleteError } = await supabase
        .from('opportunities')
        .delete()
        .eq('organization_id', organization_id);

      if (deleteError) {
        console.error('Error clearing old opportunities:', deleteError);
      }

      // Insert new opportunities
      for (const opportunity of opportunities) {
        const insertData = {
          organization_id,
          title: opportunity.title,
          description: opportunity.description,
          score: opportunity.score,
          urgency: opportunity.urgency,
          time_window: opportunity.time_window,
          category: opportunity.category,
          data: {
            trigger_event: opportunity.trigger_event,
            pr_angle: opportunity.pr_angle,
            pattern_matched: opportunity.pattern_matched,
            confidence_factors: opportunity.confidence_factors,
            recommended_action: opportunity.recommended_action,
            context: opportunity.context,
            // UI-expected fields
            execution_type: opportunity.score >= 85 ? 'assisted' : 'manual',
            playbook: {
              template_id: opportunity.category?.toLowerCase(),
              key_messages: opportunity.key_messages || [
                `${organization_name} ${opportunity.pr_angle}`,
                opportunity.recommended_action?.what?.primary_action
              ].filter(Boolean),
              target_audience: 'Media and stakeholders',
              channels: opportunity.recommended_action?.where?.channels || ['Press', 'Social'],
              assets_needed: opportunity.recommended_action?.what?.deliverables || []
            },
            action_items: opportunity.recommended_action?.what?.specific_tasks?.map((task: string, i: number) => ({
              step: i + 1,
              action: task,
              owner: opportunity.recommended_action?.who?.owner || 'PR Team',
              deadline: opportunity.recommended_action?.when?.ideal_launch || 'Within 3 days'
            })) || [],
            success_metrics: [
              'Media coverage achieved',
              'Message penetration',
              'Competitive positioning improved'
            ],
            expected_impact: opportunity.score >= 85 ? 'High visibility and competitive advantage' : 'Moderate visibility improvement',
            confidence: opportunity.score,
            organization_name
          },
          status: 'active',
          expires_at: calculateExpiryDate(opportunity.time_window)
        };

        const { error } = await supabase
          .from('opportunities')
          .insert(insertData);

        if (error) {
          console.error(`Error inserting opportunity "${opportunity.title}":`, error);
        }
      }

      console.log(`✅ Stored ${opportunities.length} opportunities for org_id "${organization_id}" in database`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        opportunities: opportunities,
        metadata: {
          total_detected: opportunities.length,
          detection_method: 'claude-haiku-4-5-20251001',
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in opportunity detection:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        opportunities: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});