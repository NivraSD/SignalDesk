import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY');

// Try both API key names like NIV does
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');

/**
 * Generate embedding using Voyage AI voyage-3-large
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!VOYAGE_API_KEY) {
    console.warn('⚠️ VOYAGE_API_KEY not set, skipping embedding generation');
    return null;
  }

  try {
    const maxChars = 8000;
    const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text;

    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'voyage-3-large',
        input: truncatedText,
        input_type: 'document'
      })
    });

    if (!response.ok) {
      console.error('❌ Voyage API error:', await response.text());
      return null;
    }

    const data = await response.json();
    console.log(`✅ Generated embedding (${data.data[0].embedding.length}D)`);
    return data.data[0].embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    return null;
  }
}

if (!ANTHROPIC_API_KEY) {
  console.error('❌ No API key found - checked ANTHROPIC_API_KEY and CLAUDE_API_KEY');
}

// Executive Synthesis MCP - Synthesizes pre-analyzed intelligence
const TOOLS = [
  {
    name: "synthesize_executive_intelligence",
    description: "Synthesize pre-analyzed data into executive insights",
  }
];

/**
 * PRESERVE the structured intelligence from enrichment - DON'T FLATTEN IT
 */
function prepareSynthesisContext(enrichedData: any) {
  // Keep the structure intact
  const { enriched_articles, knowledge_graph, executive_summary, profile,
          organized_intelligence, extracted_data } = enrichedData;

  // Use organized_intelligence as primary source (it's the processed/refined version)
  // FIXED: Actually use the data from organized_intelligence
  const organizedData = organized_intelligence || {};
  const extractedData = extracted_data || {};

  // Log what we actually have
  console.log('📊 prepareSynthesisContext - Data Available:', {
    organized_events: organizedData.events?.length || 0,
    extracted_events: extractedData.events?.length || 0,
    organized_entities: organizedData.entities?.length || 0,
    extracted_entities: extractedData.entities?.length || 0
  });

  // Use organized first, fall back to extracted - ACTUALLY GET THE DATA
  const events = (organizedData.events && organizedData.events.length > 0) ? organizedData.events : (extractedData.events || []);
  const entities = (organizedData.entities && organizedData.entities.length > 0) ? organizedData.entities : (extractedData.entities || []);
  const quotes = (organizedData.quotes && organizedData.quotes.length > 0) ? organizedData.quotes : (extractedData.quotes || []);
  const metrics = (organizedData.metrics && organizedData.metrics.length > 0) ? organizedData.metrics : (extractedData.metrics || []);

  // BUILD A STRUCTURED CONTEXT that preserves relationships
  const structuredContext = {
    // 1. EVENTS BY TYPE (not a flat list)
    events_by_category: {
      crisis: events.filter(e => e.type === 'crisis' || e.category === 'crisis'),
      partnerships: events.filter(e => e.type === 'partnership' || e.category === 'partnership'),
      product: events.filter(e => e.type === 'product' || e.category === 'product'),
      funding: events.filter(e => e.type === 'funding' || e.category === 'funding'),
      workforce: events.filter(e => e.type === 'workforce' || e.category === 'workforce'),
      regulatory: events.filter(e => e.type === 'regulatory' || e.category === 'regulatory'),
      other: events.filter(e => !['crisis','partnership','product','funding','workforce','regulatory'].includes(e.type))
    },
    
    // 2. ENTITY RELATIONSHIPS (from knowledge graph)
    entity_network: {
      key_companies: knowledge_graph?.entities?.companies || [],
      key_people: knowledge_graph?.entities?.people || [],
      relationships: knowledge_graph?.relationships || [],
      clusters: knowledge_graph?.clusters || []
    },
    
    // 3. PRIORITIZED INSIGHTS (from executive summary)
    priorities: {
      immediate_actions: executive_summary?.immediate_actions || [],
      opportunities: executive_summary?.strategic_opportunities || [],
      threats: executive_summary?.competitive_threats || [],
      market_trends: executive_summary?.market_trends || []
    },
    
    // 4. SUPPORTING EVIDENCE
    evidence: {
      quotes: organized_intelligence?.quotes || extracted_data?.quotes || [],
      metrics: organized_intelligence?.metrics || extracted_data?.metrics || [],
      topic_clusters: organized_intelligence?.topic_clusters || []
    },
    
    // 5. METADATA - Use actual counts from the variables we have
    metadata: {
      total_events: events.length,
      total_entities: entities.length,
      deep_analyzed: enriched_articles?.filter(a => a.deep_analysis)?.length || 0,
      articles_processed: enriched_articles?.length || 0
    }
  };
  
  console.log(`📊 Structured Context Prepared:`);
  console.log(`   Events by type:`, Object.entries(structuredContext.events_by_category).map(([k,v]) => `${k}:${v.length}`).join(', '));
  console.log(`   Entity network:`, structuredContext.entity_network.key_companies.length, 'companies,', structuredContext.entity_network.relationships.length, 'relationships');
  console.log(`   Priorities:`, structuredContext.priorities.immediate_actions.length, 'immediate,', structuredContext.priorities.opportunities.length, 'opportunities');
  
  // Add discovery targets to help Claude understand what to look for
  const discoveryTargets = {
    competitors: profile?.key_competitors || [],
    stakeholders: profile?.key_stakeholders || [],
    topics: profile?.key_topics || []
  };
  
  // Log final check before returning
  console.log('✅ FINAL prepareSynthesisContext CHECK:', {
    events_count: events.length,
    quotes_count: quotes.length,
    entities_count: entities.length,
    first_event: events[0]?.description?.substring(0, 100) || 'no events'
  });

  // Return the STRUCTURED context with all the data the prompt expects
  return {
    structuredContext,
    discoveryTargets,
    totalArticlesAnalyzed: enriched_articles?.length || 0,
    deepAnalysisCount: enriched_articles?.filter(a => a.deep_analysis)?.length || 0,
    // FIXED: Use the events/quotes/metrics variables we already extracted above
    strategicInsights: {
      events: events,  // Use the variable we created that has the actual data
      quotes: quotes,  // Use the variable we created that has the actual data
      metrics: metrics, // Use the variable we created that has the actual data
      immediate: executive_summary?.immediate_actions || [],
      opportunities: executive_summary?.strategic_opportunities || [],
      threats: executive_summary?.competitive_threats || [],
      trends: executive_summary?.market_trends || []
    },
    keyMetrics: extracted_data?.metrics?.map(m => m.value) || [],
    keyEntities: {
      companies: extracted_data?.entities?.filter(e => e.type === 'company') || []
    },
    categoryBreakdown: extracted_data?.stats?.category_distribution || [],
    analyzedInsights: enriched_articles?.slice(0, 10).map(a => ({
      title: a.title,
      time_sensitivity: a.deep_analysis?.time_sensitivity || 'medium',
      implications: a.deep_analysis?.strategic_implications || 'Analysis pending'
    })) || []
  };
}

// Helper function to find discovery target matches in events
function getDiscoveryMatches(events: any[], targets: string[]): string {
  try {
    if (!events || !targets || targets.length === 0) return 'None found';
    
    const matches = new Set();
    events.forEach(event => {
      if (event?.entity) {
        targets.forEach(target => {
          if (target && event.entity.toLowerCase().includes(target.toLowerCase())) {
            matches.add(event.entity);
          }
        });
      }
    });
    
    return matches.size > 0 ? Array.from(matches).join(', ') : 'None found';
  } catch (e) {
    console.error('Error matching discovery targets:', e);
    return 'Error processing';
  }
}

async function synthesizeExecutiveIntelligence(args: any) {
  const { enriched_data, organization, organization_id, analysis_depth = 'comprehensive', synthesis_focus = null } = args;

  // Extract discovery profile and intelligence context for target alignment
  const profile = enriched_data?.profile || {};
  const intelligenceContext = profile?.intelligence_context || enriched_data?.intelligence_context;

  let discoveryTargets = {
    competitors: [],
    stakeholders: [],
    topics: []
  };
  let synthesisMetadata = null; // Declare at function scope to avoid reference error
  let companyProfile = {}; // Declare at function scope

  try {
    // CRITICAL FIX: Load targets from intelligence_targets table instead of old profile
    // This ensures we see stakeholders like Donald Trump who are marked high priority
    if (organization_id) {
      console.log(`🎯 Loading intelligence targets from database for org: ${organization_id}`);
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: intelligenceTargets } = await supabase
        .from('intelligence_targets')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('active', true);

      if (intelligenceTargets && intelligenceTargets.length > 0) {
        discoveryTargets = {
          competitors: intelligenceTargets.filter(t => t.type === 'competitor').map(t => t.name),
          stakeholders: intelligenceTargets.filter(t => t.type === 'stakeholder' || t.type === 'influencer').map(t => t.name),
          topics: intelligenceTargets.filter(t => t.type === 'topic' || t.type === 'keyword').map(t => t.name)
        };
        console.log('✅ Loaded from intelligence_targets:', {
          competitors: discoveryTargets.competitors.length,
          stakeholders: discoveryTargets.stakeholders.length,
          topics: discoveryTargets.topics.length,
          stakeholder_names: discoveryTargets.stakeholders
        });
      } else {
        console.log('⚠️ No intelligence_targets found, falling back to profile');
        console.log('🔍 Profile structure:', {
          has_competition: !!profile?.competition,
          has_stakeholders: !!profile?.stakeholders,
          direct_competitors: profile?.competition?.direct_competitors?.length || 0,
          regulators: profile?.stakeholders?.regulators?.length || 0
        });
        // Fallback to profile format if no targets in database
        discoveryTargets = {
          competitors: [
            ...(profile?.competition?.direct_competitors || []),
            ...(profile?.competition?.indirect_competitors || []),
            ...(profile?.competition?.emerging_threats || [])
          ].filter(Boolean),
          stakeholders: [
            ...(profile?.stakeholders?.regulators || []),
            ...(profile?.stakeholders?.key_analysts || []),  // NEW field
            ...(profile?.stakeholders?.activists || []),     // NEW field
            ...(profile?.stakeholders?.major_investors || []),
            ...(profile?.stakeholders?.major_customers || [])
          ].filter(Boolean),
          topics: [
            ...(profile?.trending?.hot_topics || []),
            ...(profile?.trending?.emerging_technologies || []),
            ...(profile?.keywords || []),
            ...(profile?.monitoring_config?.keywords || [])
          ].filter(Boolean) || []
        };
        console.log('📋 Loaded from profile fallback:', {
          competitors: discoveryTargets.competitors.length,
          stakeholders: discoveryTargets.stakeholders.length,
          topics: discoveryTargets.topics.length
        });
      }

      // CRITICAL: Use company_profile from enriched_data (comes from discovery via enrichment)
      companyProfile = profile?.company_profile || {};

      if (companyProfile && Object.keys(companyProfile).length > 0) {
        console.log('✅ Using company profile from discovery:', {
          has_business_model: !!companyProfile.business_model,
          product_lines: companyProfile.product_lines?.length || 0,
          key_markets: companyProfile.key_markets?.length || 0,
          strategic_goals: companyProfile.strategic_goals?.length || 0
        });
      } else {
        console.log('⚠️ No company profile in enriched data - using fallback from profile');
        companyProfile = {
          business_model: profile?.description || 'Not specified',
          product_lines: profile?.service_lines || [],
          key_markets: profile?.market?.key_markets || [],
          strategic_goals: profile?.strategic_context?.strategic_priorities || []
        };
      }

      // Store company profile for use in synthesis prompt
      synthesisMetadata = { companyProfile };
    } else {
      // No org_id provided, use profile fallback
      discoveryTargets = {
        competitors: [
          ...(profile?.competition?.direct_competitors || []),
          ...(profile?.competition?.indirect_competitors || []),
          ...(profile?.competition?.emerging_threats || [])
        ].filter(Boolean),
        stakeholders: [
          ...(profile?.stakeholders?.regulators || []),
          ...(profile?.stakeholders?.key_analysts || []),  // NEW field
          ...(profile?.stakeholders?.activists || []),     // NEW field
          ...(profile?.stakeholders?.major_investors || []),
          ...(profile?.stakeholders?.major_customers || [])
        ].filter(Boolean),
        topics: [
          ...(profile?.trending?.hot_topics || []),
          ...(profile?.trending?.emerging_technologies || []),
          ...(profile?.keywords || []),
          ...(profile?.monitoring_config?.keywords || [])
        ].filter(Boolean) || []
      };

      // Also set companyProfile in fallback path
      companyProfile = profile?.company_profile || {
        business_model: profile?.description || 'Not specified',
        product_lines: profile?.service_lines || [],
        key_markets: profile?.market?.key_markets || [],
        strategic_goals: profile?.strategic_context?.strategic_priorities || []
      };
    }

    console.log('🎯 Final Discovery Targets to Track:', {
      competitors: discoveryTargets.competitors.length,
      stakeholders: discoveryTargets.stakeholders.length,
      topics: discoveryTargets.topics.length,
      sampleCompetitors: discoveryTargets.competitors.slice(0, 5),
      sampleStakeholders: discoveryTargets.stakeholders.slice(0, 5),
      sampleTopics: discoveryTargets.topics.slice(0, 5)
    });
  } catch (e) {
    console.error('Error extracting discovery targets:', e);
    // Continue with empty targets rather than failing
  }
  
  // Debug what's actually in enriched_data
  console.log('🔍 SYNTHESIS RECEIVED DATA STRUCTURE:', {
    topLevelKeys: enriched_data ? Object.keys(enriched_data) : [],
    hasExtractedData: !!enriched_data?.extracted_data,
    extractedEventsCount: enriched_data?.extracted_data?.events?.length || 0,
    firstEvent: enriched_data?.extracted_data?.events?.[0] || 'no events',
    hasOrganizedIntelligence: !!enriched_data?.organized_intelligence,
    organizedIntelligenceKeys: enriched_data?.organized_intelligence ? Object.keys(enriched_data.organized_intelligence) : [],
    organizedEvents: enriched_data?.organized_intelligence?.events?.length || 0,
    organizedQuotes: enriched_data?.organized_intelligence?.quotes?.length || 0,
    organizedMetrics: enriched_data?.organized_intelligence?.metrics?.length || 0,
    extractedDataEvents: enriched_data?.extracted_data?.events?.length || 0,
    extractedDataQuotes: enriched_data?.extracted_data?.quotes?.length || 0,
    extractedDataMetrics: enriched_data?.extracted_data?.metrics?.length || 0
  });

  // CRITICAL: Log the actual events to see what entities they have
  console.log('🚨🚨🚨 ACTUAL EVENTS RECEIVED BY SYNTHESIS:');
  if (enriched_data?.extracted_data?.events) {
    const events = enriched_data.extracted_data.events;
    console.log(`Total events: ${events.length}`);

    // Group events by entity to see what we're actually getting
    const entityCounts = {};
    events.forEach(event => {
      const entity = event.entity || 'UNKNOWN';
      entityCounts[entity] = (entityCounts[entity] || 0) + 1;
    });

    console.log('ENTITY FREQUENCY IN EVENTS:');
    Object.entries(entityCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([entity, count]) => {
        console.log(`  ${entity}: ${count} events`);
      });

    // Show first 5 events in detail
    console.log('\nFIRST 5 EVENTS IN DETAIL:');
    events.slice(0, 5).forEach((event, i) => {
      console.log(`Event ${i+1}:`);
      console.log(`  Type: ${event.type}`);
      console.log(`  Entity: ${event.entity}`);
      console.log(`  Description: ${event.description?.substring(0, 100)}...`);
    });
  }
  
  console.log('🎯 Executive Synthesis Starting:', {
    timestamp: new Date().toISOString(),
    version: 'v3.0-synthesis-only',
    hasOrg: !!organization,
    hasEnrichedData: !!enriched_data,
    articlesAnalyzed: enriched_data?.enriched_articles?.length || 0,
    deepAnalysisCount: enriched_data?.enriched_articles?.filter(a => a.deep_analysis).length || 0,
    hasKnowledgeGraph: !!enriched_data?.knowledge_graph,
    hasExecutiveSummary: !!enriched_data?.executive_summary,
    hasIntelligenceContext: !!intelligenceContext,
    analysisDepth: analysis_depth,
    synthesisFocus: synthesis_focus
  });

  // Log if we have intelligence context
  if (intelligenceContext) {
    console.log('🎯 Using Intelligence Context from Discovery:', {
      hasMonitoringPrompt: !!intelligenceContext.monitoring_prompt,
      hasKeyQuestions: intelligenceContext.synthesis_guidance?.key_questions?.length || 0,
      analysisPerspective: intelligenceContext.synthesis_guidance?.analysis_perspective,
      extractionFocus: intelligenceContext.extraction_focus?.length || 0
    });
  }
  
  // Prepare synthesis context from pre-analyzed data
  const context = prepareSynthesisContext(enriched_data);

  // Log what enrichment data we're actually using
  console.log('🔍 ENRICHMENT DATA USAGE CHECK:', {
    enriched_articles_count: enriched_data?.enriched_articles?.length || 0,
    organized_intelligence_exists: !!enriched_data?.organized_intelligence,
    extracted_data_exists: !!enriched_data?.extracted_data,
    knowledge_graph_exists: !!enriched_data?.knowledge_graph,
    executive_summary_exists: !!enriched_data?.executive_summary,
    article_summaries_in_context: context.analyzedInsights?.length || 0,
    deep_analysis_count: enriched_data?.enriched_articles?.filter(a => a.deep_analysis)?.length || 0
  });

  console.log('📊 Synthesis Context Prepared:', {
    totalEvents: context.structuredContext.metadata.total_events,
    eventsByType: Object.entries(context.structuredContext.events_by_category).map(([k,v]) => `${k}:${v.length}`).join(', '),
    companies: context.structuredContext.entity_network.key_companies.length,
    relationships: context.structuredContext.entity_network.relationships.length,
    immediateActions: context.structuredContext.priorities.immediate_actions.length,
    opportunities: context.structuredContext.priorities.opportunities.length,
    threats: context.structuredContext.priorities.threats.length,
    quotes: context.structuredContext.evidence.quotes.length,
    metrics: context.structuredContext.evidence.metrics.length
  });

  // 🎯 CRITICAL: Check if enrichment provided pre-analyzed executive intelligence summary
  const executiveIntelligence = enriched_data?.extracted_data?.executive_intelligence || enriched_data?.executive_intelligence;

  if (executiveIntelligence) {
    console.log('\n✨✨✨ EXECUTIVE INTELLIGENCE SUMMARY AVAILABLE FROM ENRICHMENT ✨✨✨');
    console.log('Using pre-analyzed intelligence brief instead of raw events processing');
    console.log({
      competitor_moves: executiveIntelligence.top_competitor_moves?.length || 0,
      regulatory_developments: executiveIntelligence.regulatory_developments?.length || 0,
      market_trends: executiveIntelligence.market_trends?.length || 0,
      stakeholder_activity: executiveIntelligence.stakeholder_activity?.length || 0,
      key_insights: executiveIntelligence.key_insights?.length || 0,
      coverage: `${executiveIntelligence.coverage_summary?.competitors_mentioned || 0}/${executiveIntelligence.coverage_summary?.total_competitors_tracked || 0} competitors, ${executiveIntelligence.coverage_summary?.stakeholders_mentioned || 0}/${executiveIntelligence.coverage_summary?.total_stakeholders_tracked || 0} stakeholders`
    });
  } else {
    console.log('⚠️ No executive intelligence summary from enrichment - falling back to raw events processing');
  }

  // Create synthesis prompt with STRUCTURED DATA
  let prompt;

  // 🎯 NEW PATH: If enrichment provided executive intelligence summary, use it directly
  if (executiveIntelligence && executiveIntelligence.top_competitor_moves) {
    console.log('📝 Using executive intelligence summary path for synthesis');

    // Format the pre-analyzed intelligence for Claude to write up
    const competitorMoves = executiveIntelligence.top_competitor_moves || [];
    const regulatoryDev = executiveIntelligence.regulatory_developments || [];
    const marketTrends = executiveIntelligence.market_trends || [];
    const stakeholderActivity = executiveIntelligence.stakeholder_activity || [];
    const keyInsights = executiveIntelligence.key_insights || [];
    const coverage = executiveIntelligence.coverage_summary || {};

    prompt = `You are writing a DAILY COMPETITIVE INTELLIGENCE BRIEF FOR ${organization?.name}.

🎯 CRITICAL: UNDERSTAND YOUR ROLE
${organization?.name} is YOUR CLIENT. You are writing TO them, not ABOUT them.
${organization?.name} is a ${companyProfile?.business_model || 'company'} operating in ${companyProfile?.key_markets?.join(', ') || 'their markets'}.

YOUR JOB: Tell ${organization?.name} what their COMPETITORS and STAKEHOLDERS are doing.

DO NOT write about ${organization?.name} - they know their own news.
DO NOT say "limited intelligence for ${organization?.name}" - you're writing TO them, not monitoring them.
DO NOT treat ${organization?.name} as a monitoring subject - they are the RECIPIENT of this brief.

═══════════════════════════════════════════════════════════
🎯 PRE-ANALYZED INTELLIGENCE FROM ENRICHMENT
═══════════════════════════════════════════════════════════

The hard analysis work has already been done. Format it clearly for ${organization?.name}'s executives.

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

COVERAGE SUMMARY:
- Competitors mentioned: ${coverage.competitors_mentioned || 0}/${coverage.total_competitors_tracked || 0}
- Stakeholders mentioned: ${coverage.stakeholders_mentioned || 0}/${coverage.total_stakeholders_tracked || 0}
- Events today: ${coverage.recency_breakdown?.today || 0}
- Events this week: ${coverage.recency_breakdown?.this_week || 0}
- Older events: ${coverage.recency_breakdown?.older || 0}

TOP COMPETITOR MOVES (${competitorMoves.length}):
${competitorMoves.map((move, i) => `${i+1}. [${move.date}] ${move.competitor}: ${move.action}
   Significance: ${move.significance}
   Implications: ${move.implications}`).join('\n\n')}

REGULATORY DEVELOPMENTS (${regulatoryDev.length}):
${regulatoryDev.map((dev, i) => `${i+1}. [${dev.date}] ${dev.regulator}: ${dev.development}
   Impact: ${dev.impact}`).join('\n\n')}

MARKET TRENDS (${marketTrends.length}):
${marketTrends.map((trend, i) => `${i+1}. ${trend.trend}
   Evidence: ${trend.evidence}
   Relevance: ${trend.relevance}`).join('\n\n')}

STAKEHOLDER ACTIVITY (${stakeholderActivity.length}):
${stakeholderActivity.map((activity, i) => `${i+1}. [${activity.date}] ${activity.stakeholder}: ${activity.activity}
   Significance: ${activity.significance}`).join('\n\n')}

KEY INSIGHTS FOR EXECUTIVES:
${keyInsights.map((insight, i) => `${i+1}. ${insight}`).join('\n')}

═══════════════════════════════════════════════════════════
YOUR TASK: FORMAT THIS INTO EXECUTIVE BRIEF
═══════════════════════════════════════════════════════════

Write a professional daily brief using the pre-analyzed intelligence above.

STRUCTURE YOUR BRIEF:
1. Executive Summary (3-5 bullet points of top takeaways)
2. Competitive Landscape (report ALL competitor moves listed above)
3. Regulatory & Policy Developments (if any regulatory developments listed)
4. Market Dynamics (if any trends listed)
5. Stakeholder Activity (if any stakeholder activity listed)
6. Strategic Implications (key insights for ${organization?.name})

CRITICAL RULES:
- REPORT ON EVERY COMPETITOR LISTED ABOVE - don't cherry-pick
- PRIORITIZE RECENT (TODAY > THIS WEEK > OLDER)
- BE SPECIFIC - use exact details from the intelligence above
- NO EXCUSES - if the coverage summary shows limited data, acknowledge it briefly but report what WE DO HAVE

Return ONLY valid JSON in this format:
{
  "executive_summary": "2-3 paragraph narrative overview of key developments [with source citations]",
  "key_developments": [
    {
      "category": "competitor_move|stakeholder_action|market_trend|regulatory_change",
      "event": "What happened (be specific)",
      "impact": "Why this matters to ${organization?.name}",
      "source": "Article title",
      "url": "Article URL",
      "recency": "today|this_week|older",
      "entity": "Primary company/entity involved"
    }
  ],
  "strategic_implications": "What ${organization?.name} should do based on these developments",
  "watching_closely": ["Entities, trends, or topics to monitor based on the intelligence"]
}

CRITICAL:
- key_developments should include ALL significant events from the data (aim for 15-25 entries)
- Each development MUST have source attribution (source + url fields)
- Sort by recency (today first, then this week, then older)
- Be specific in "event" field - include names, numbers, details from the actual events`;

  } else if (synthesis_focus === 'all_consolidated') {
    // Extract the structured data properly
    const { structuredContext } = context;
    // discoveryTargets is already declared at function scope (line 215)

    // Get ALL events but PRIORITIZE non-org events
    // NOTE: With simplified enrichment, events may be empty - synthesis will work from articles instead
    let allEvents = context.strategicInsights.events || [];

    // 🔗 ENRICH EVENTS WITH ARTICLE URLs
    // Events don't have URLs by default - we need to match them to their source articles
    const enrichedArticles = enriched_data?.enriched_articles || [];
    const articleUrlMap = new Map();
    const articleIdMap = new Map(); // Map by article_id if available

    // Build maps of article identifiers -> URL
    enrichedArticles.forEach(article => {
      if (article.url) {
        // Map by article_id (most reliable)
        if (article.id) {
          articleIdMap.set(article.id, article.url);
        }

        // Create lookup keys from title and source
        const titleKey = article.title?.toLowerCase().trim();
        const sourceKey = article.source?.toLowerCase().trim();

        if (titleKey) articleUrlMap.set(titleKey, article.url);
        if (sourceKey) articleUrlMap.set(sourceKey, article.url);
        if (titleKey && sourceKey) {
          articleUrlMap.set(`${sourceKey}:${titleKey}`, article.url);
        }
      }
    });

    console.log('📊 Article URL mapping:', {
      total_articles: enrichedArticles.length,
      articles_with_urls: enrichedArticles.filter(a => a.url).length,
      articles_with_id: enrichedArticles.filter(a => a.id).length,
      sample_urls: enrichedArticles.slice(0, 3).map(a => ({ title: a.title?.substring(0, 50), url: a.url }))
    });

    // Enrich events with URLs by matching their source/article_title to articles
    let enrichedCount = 0;
    allEvents = allEvents.map(event => {
      if (!event.url || event.url === 'N/A') {
        let foundUrl = null;

        // FIRST: Check if event has articles array with URL (from enrichment)
        if (event.articles && event.articles.length > 0 && event.articles[0].url) {
          foundUrl = event.articles[0].url;
        }

        // Try article_id (most reliable for events with article_id field)
        if (!foundUrl && event.article_id) {
          foundUrl = articleIdMap.get(event.article_id);
        }

        // Fall back to title/source matching
        if (!foundUrl) {
          const titleKey = event.article_title?.toLowerCase().trim();
          const sourceKey = event.source?.toLowerCase().trim();

          if (titleKey && sourceKey) {
            foundUrl = articleUrlMap.get(`${sourceKey}:${titleKey}`);
          }
          if (!foundUrl && titleKey) {
            foundUrl = articleUrlMap.get(titleKey);
          }
          if (!foundUrl && sourceKey) {
            foundUrl = articleUrlMap.get(sourceKey);
          }
        }

        if (foundUrl) {
          enrichedCount++;
          return { ...event, url: foundUrl };
        }
      }
      return event;
    });

    console.log('🔗 Event URL enrichment results:', {
      events_before_urls: allEvents.filter(e => !e.url || e.url === 'N/A').length,
      events_enriched: enrichedCount
    });

    console.log('🔗 Event URL enrichment:', {
      total_events: allEvents.length,
      events_with_urls: allEvents.filter(e => e.url && e.url !== 'N/A').length,
      articles_in_map: articleUrlMap.size
    });

    // CATEGORIZE events by type for balanced coverage
    const orgName = organization?.name?.toLowerCase() || '';

    // Separate events into meaningful categories
    const eventsAboutOrg = allEvents.filter(e => {
      const entityLower = e.entity?.toLowerCase() || '';
      return entityLower.includes(orgName) ||
             entityLower === orgName ||
             (orgName === 'openai' && entityLower.includes('openai')) ||
             (orgName === 'tesla' && entityLower.includes('tesla'));
    });

    // Get intelligence targets to properly categorize non-org events
    // discoveryTargets arrays contain strings (names), not objects
    const competitorNames = discoveryTargets.competitors?.map(c => c.toLowerCase()) || [];
    const stakeholderNames = discoveryTargets.stakeholders?.map(s => s.toLowerCase()) || [];

    const eventsAboutCompetitors = allEvents.filter(e => {
      const entityLower = e.entity?.toLowerCase() || '';
      return competitorNames.some(comp => entityLower.includes(comp));
    });

    const eventsAboutStakeholders = allEvents.filter(e => {
      const entityLower = e.entity?.toLowerCase() || '';
      return stakeholderNames.some(stake => entityLower.includes(stake));
    });

    // Industry/regulatory/other events (not org, not direct competitors, not stakeholders)
    const eventsOther = allEvents.filter(e => {
      const entityLower = e.entity?.toLowerCase() || '';
      const isOrg = entityLower.includes(orgName);
      const isCompetitor = competitorNames.some(comp => entityLower.includes(comp));
      const isStakeholder = stakeholderNames.some(stake => entityLower.includes(stake));
      return !isOrg && !isCompetitor && !isStakeholder;
    });

    console.log('🚨🚨🚨 BALANCED EVENT ANALYSIS:');
    console.log(`Total events from enrichment: ${allEvents.length}`);
    console.log(`Events about ${organization?.name}: ${eventsAboutOrg.length}`);
    console.log(`Events about direct competitors: ${eventsAboutCompetitors.length}`);
    console.log(`Events about stakeholders (regulators/investors/analysts): ${eventsAboutStakeholders.length}`);
    console.log(`Industry/regulatory/other events: ${eventsOther.length}`);

    // Show distribution across categories
    const competitorEventCounts = {};
    eventsAboutCompetitors.forEach(e => {
      const entity = e.entity || 'Unknown';
      competitorEventCounts[entity] = (competitorEventCounts[entity] || 0) + 1;
    });
    console.log('Top competitor events:', Object.entries(competitorEventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([entity, count]) => `${entity}:${count}`)
      .join(', '));

    // COMPREHENSIVE SELECTION - use ALL quality events, don't artificially limit
    // The enrichment/relevance stages already filtered - we should use what they gave us
    const maxEvents = 100; // Increased from 50 - if enrichment found them relevant, include them

    // Allocate slots generously - prefer MORE coverage over artificial balance
    const orgSlots = Math.min(eventsAboutOrg.length, 20);  // All org events up to 20
    const competitorSlots = Math.min(eventsAboutCompetitors.length, 40); // Prioritize competitor coverage
    const stakeholderSlots = Math.min(eventsAboutStakeholders.length, 20); // All stakeholder events up to 20
    const otherSlots = Math.min(eventsOther.length, 40); // Industry/regulatory events are important too

    const topEvents = [
      ...eventsAboutOrg.slice(0, orgSlots),
      ...eventsAboutCompetitors.slice(0, competitorSlots),
      ...eventsAboutStakeholders.slice(0, stakeholderSlots),
      ...eventsOther.slice(0, otherSlots)
    ].slice(0, maxEvents);

    console.log(`🎯 Selected ${topEvents.length} events for synthesis (BALANCED APPROACH):`);
    console.log(`  - ${orgSlots} org events (${eventsAboutOrg.length} available)`);
    console.log(`  - ${competitorSlots} competitor events (${eventsAboutCompetitors.length} available)`);
    console.log(`  - ${stakeholderSlots} stakeholder events (${eventsAboutStakeholders.length} available)`);
    console.log(`  - ${otherSlots} industry/regulatory/other events (${eventsOther.length} available)`);

    // Log first few events to verify
    topEvents.slice(0, 5).forEach((event, i) => {
      console.log(`Event ${i+1}: [${event.type}] ${event.entity} - ${event.description?.substring(0, 100)}`);
    });

    // Get more quotes and metrics too
    const keyQuotes = context.strategicInsights.quotes?.slice(0, 15) || [];
    const metrics = context.strategicInsights.metrics?.slice(0, 10) || [];

    // Get enriched articles with their deep analysis - already declared above at line 580
    // const enrichedArticles = enriched_data?.enriched_articles || [];

    // Log what we're getting from enriched articles
    console.log('📰 ENRICHED ARTICLES ANALYSIS:', {
      total_articles: enrichedArticles.length,
      with_deep_analysis: enrichedArticles.filter(a => a.deep_analysis).length,
      with_pr_category: enrichedArticles.filter(a => a.pr_category).length,
      with_entities: enrichedArticles.filter(a => a.entities && a.entities.length > 0).length,
      sample_categories: enrichedArticles.slice(0, 5).map(a => a.pr_category || a.category || 'uncategorized'),
      sample_relevance_scores: enrichedArticles.slice(0, 5).map(a => a.pr_relevance_score || a.relevance_score || 0)
    });

    const articleSummaries = enrichedArticles.slice(0, 40).map((article, i) => ({
      headline: article.title,
      url: article.url,  // Include URL for article-only mode
      source: article.source || article.source_name || 'Unknown',
      published_at: article.published_at,
      category: article.pr_category || article.category,
      relevance: article.pr_relevance_score || article.relevance_score,
      sentiment: article.deep_analysis?.sentiment || 'neutral',
      key_insight: article.deep_analysis?.key_takeaway || article.summary?.substring(0, 200) || article.description?.substring(0, 200),
      entities_mentioned: article.entities?.slice(0, 3) || [],
      competitive_relevance: article.deep_analysis?.competitive_relevance || 'medium',
      has_full_content: article.has_full_content || false,
      content_quality: article.content_quality || 'enhanced_summary',
      is_trade_source: article.is_trade_source || false
    }));

    console.log('📊 Article summaries prepared:', articleSummaries.length);

    // Check if we're in "article-only" mode (no pre-extracted events)
    const articleOnlyMode = topEvents.length === 0 && enrichedArticles.length > 0;
    if (articleOnlyMode) {
      console.log('📰 ARTICLE-ONLY MODE: No pre-extracted events, synthesis will work directly from articles');
    }

    // Extract all unique entities from events for clarity
    const allEntities = [...new Set(topEvents.map(e => e.entity).filter(Boolean))];
    const competitorEntities = allEntities.filter(e =>
      context.discoveryTargets.competitors.some(c =>
        e.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(e.toLowerCase())
      )
    );
    const otherEntities = allEntities.filter(e => !competitorEntities.includes(e));

    // Helper function to format dates for display
    const formatEventDate = (dateStr: string | undefined) => {
      if (!dateStr) return 'Unknown date';

      // Handle relative dates from enrichment
      if (dateStr.includes('ago')) return dateStr; // Already formatted: "5 months ago"
      if (dateStr.toLowerCase().includes('today')) return 'Today';
      if (dateStr.toLowerCase().includes('yesterday')) return 'Yesterday';

      // Try to parse as date
      try {
        const eventDate = new Date(dateStr);
        const today = new Date();
        const diffMs = today.getTime() - eventDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
      } catch (e) {
        return dateStr; // Return as-is if can't parse
      }
    };

    prompt = `═══════════════════════════════════════════════════════════
🎯 YOUR ROLE: DATA-TO-CONTEXT ALIGNMENT SPECIALIST
═══════════════════════════════════════════════════════════

YOU ARE A SYNTHESIS ENGINE - NOT A CONTENT GENERATOR
Your ONLY job is to align the enriched article data you receive with the company's intelligence context.

WHAT THIS MEANS:
✅ You ANALYZE the provided article data through the lens of the company's profile
✅ You CONNECT events in the data to the company's competitors, stakeholders, and strategic interests
✅ You IDENTIFY patterns and themes that emerge from the ACTUAL articles provided
✅ You TRANSLATE article data into actionable intelligence for the company

❌ You DO NOT add information that isn't in the articles
❌ You DO NOT speculate about events not mentioned in the data
❌ You DO NOT use general industry knowledge outside the provided articles
❌ You DO NOT make assumptions - if the data doesn't say it, you don't say it

VERIFICATION RULE:
Every single statement in your synthesis must be traceable to a specific article or event in the data below.
If you can't point to where it came from in the provided data, DO NOT include it.

═══════════════════════════════════════════════════════════
📊 COMPANY INTELLIGENCE CONTEXT (Your Alignment Framework)
═══════════════════════════════════════════════════════════

${organization?.name} is YOUR CLIENT. You are writing TO them, not ABOUT them.

ABOUT YOUR CLIENT:
- Company: ${organization?.name}
- Business: ${companyProfile?.business_model || profile?.description || 'Not specified'}
- Markets: ${companyProfile?.key_markets?.join(', ') || 'Not specified'}
- Industry: ${profile?.industry || organization?.industry || 'Unknown'}

YOUR JOB: Tell ${organization?.name} what their COMPETITORS and STAKEHOLDERS are doing.

DO NOT write about ${organization?.name} - they know their own news.
DO NOT say "limited intelligence for ${organization?.name}" - you're writing TO them, not monitoring them.

COMPETITORS TO REPORT ON (companies ${organization?.name} competes with):
${discoveryTargets.competitors.slice(0, 10).join(', ')}

STAKEHOLDERS TO REPORT ON (entities that impact ${organization?.name}'s business):
${discoveryTargets.stakeholders.slice(0, 10).join(', ')}

⚠️ CRITICAL:
- Report on what COMPETITORS are doing (launches, deals, expansions)
- Report on what STAKEHOLDERS are doing (regulations, policy changes)
- DO NOT report on what ${organization?.name} is doing - that's not intelligence, that's their own activity

**TODAY'S DATE:** ${new Date().toISOString().split('T')[0]}

PRE-ANALYZED ARTICLES (${enrichedArticles.length} articles processed${articleOnlyMode ? ' - USE THESE FOR key_developments' : ''}):
${articleSummaries.map((article, i) => {
  const contentQuality = article.has_full_content ? '✓ FULL' : '◆ SUMMARY';
  const tradeFlag = article.is_trade_source ? ' [TRADE]' : '';
  return `
${i+1}. [${contentQuality}]${tradeFlag} ${article.headline}
   Source: ${article.source} | URL: ${article.url}
   Published: ${article.published_at} | Relevance: ${article.relevance}/100
   Summary: ${article.key_insight}`;
}).join('') || 'No enriched articles available'}

⚠️ Content Quality Legend:
- [✓ FULL] = Complete scraped article text (high-priority articles)
- [◆ SUMMARY] = Enhanced summary from title + description + source (most articles)
  Summary articles provide headlines and context but not full article text.
  Use these to identify trends and cross-reference events across multiple sources.

${articleOnlyMode ? `
⚠️ **ARTICLE-ONLY MODE**
No pre-extracted events available. Synthesize intelligence directly from the ${enrichedArticles.length} articles above.

YOUR TASK:
1. Read each article title and summary
2. Identify which articles relate to competitors: ${discoveryTargets.competitors.slice(0, 10).join(', ')}
3. Identify which articles relate to stakeholders: ${discoveryTargets.stakeholders.slice(0, 10).join(', ')}
4. Synthesize the key developments, competitor moves, and market trends from the articles
5. Create key_developments entries directly from the articles

IMPORTANT: Each article IS a potential development. Use the article title as the "event" and the source/URL from the article.
` : `
PRE-EXTRACTED EVENTS (These ${topEvents.length} events include ${orgSlots} org, ${competitorSlots} competitor, ${stakeholderSlots} stakeholder, ${otherSlots} industry/regulatory - **SORTED BY RECENCY**):
${topEvents.map((e, i) =>
  `${i+1}. [${e.type?.toUpperCase()}] ${e.entity}: ${e.description} (${formatEventDate(e.date)})
   Source: ${e.source || 'Unknown'} | URL: ${e.url || 'N/A'} | Article: "${e.article_title || 'N/A'}"`
).join('\n\n')}
`}

⚠️ **CRITICAL RECENCY RULES:**
- PRIORITIZE events from last 7 days (Today, Yesterday, X days ago) in your executive_summary
- DE-EMPHASIZE events older than 2 weeks (X weeks ago, X months ago) unless they have ongoing strategic impact
- If an event is >1 month old (X months ago), ONLY include in executive_summary if it represents a major strategic shift
- The executive_summary should FOCUS on what's happening NOW, not historical context

${articleOnlyMode ? 'THE ARTICLES ABOVE ARE YOUR ONLY SOURCE OF TRUTH.' : 'THE ABOVE EVENTS ARE YOUR ONLY SOURCE OF TRUTH - They represent real news from today\'s monitoring.'}

${keyQuotes.length > 0 ? `KEY QUOTES:\n${keyQuotes.map(q =>
  `"${q.text}" - ${q.source || 'Unknown'}`
).join('\n')}` : ''}

${metrics.length > 0 ? `METRICS:\n${metrics.map(m =>
  `${m.type}: ${m.value}`
).join('\n')}` : ''}

SYNTHESIS REQUIREMENTS:

🚨 PRIORITY #0: CITE YOUR SOURCES (MANDATORY)
Every claim in your synthesis MUST reference the source article:
- When mentioning an event, include: [Source: {source name}, "{article title}"]
- Example: "Account mobility accelerated with Weber Shandwick securing Carhartt [Source: PRWeek, "Weber Shandwick Wins Carhartt Account"]"
- The source information is provided with each event above (Source, URL, Article fields)
- If you cannot cite a source for a claim, DO NOT include that claim
- Synthesis without citations will be rejected

🚨 PRIORITY #1: COMPREHENSIVE COVERAGE (USE ALL THE INTELLIGENCE)
${articleOnlyMode ? `You have ${enrichedArticles.length} articles to synthesize into a coherent narrative:
- Each article passed relevance filtering and is worth including
- DO NOT cherry-pick 2-3 "big stories" and ignore the rest
- SYNTHESIZE means: identify patterns, group similar developments, surface the narrative
- Create key_developments entries from articles - use article title as "event", article source as "source", article URL as "url"
- Your executive_summary should reflect the VOLUME of intelligence: ${enrichedArticles.length} articles is significant activity` : `You have ${topEvents.length} events from enrichment. Your job is to SYNTHESIZE ALL OF THEM into a coherent narrative:
- Enrichment already filtered for relevance - these ${topEvents.length} events ALL passed quality checks
- DO NOT cherry-pick 2-3 "big stories" and ignore the rest
- SYNTHESIZE means: identify patterns, group similar developments, surface the narrative
- Example: Instead of "Weber Shandwick won Carhartt" (1 event), write "Account mobility accelerated this week, with Weber Shandwick securing Carhartt [Source: PRWeek, "Agency Wins"], FleishmanHillard winning Bay Area Host Committee [Source: PR Daily, "Host Committee News"], and Zeno Group losing a 5-year relationship [Source: AdAge, "Account Review"]" (synthesizing 3+ events WITH CITATIONS)
- Your executive_summary should reflect the VOLUME of intelligence: ${topEvents.length} events is significant activity`}
- Competitors to watch: ${discoveryTargets.competitors.slice(0, 15).join(', ')}

⚠️ PRIORITY #2: RECENCY (TODAY > THIS WEEK > OLD NEWS)
- Events from TODAY or THIS WEEK go in executive_summary
- Events from 1-2 weeks ago = brief mention only if strategic
- Events from 2+ weeks ago = ignore unless ongoing strategic impact
- NEVER lead with "5 days ago" when today's data exists
- Check EVERY event date before writing

⚠️ PRIORITY #3: BUSINESS RELEVANCE
- ${organization?.name} is a ${synthesisMetadata?.companyProfile?.business_model || 'company'}
- Focus on: ${synthesisMetadata?.companyProfile?.key_markets?.join(', ') || 'their markets'}
- IGNORE: Stories that don't affect ${organization?.name}'s business
- Think: "Would their CEO care about this in TODAY's 9am meeting?"

⚠️ PRIORITY #4: EXECUTIVE FORMAT (SCANNABLE, ACTIONABLE)
- Lead with the competitive landscape summary in 2-3 sentences
- Then: Recent competitor moves (mention EACH one)
- Then: Regulatory/stakeholder developments
- Then: Opportunities and threats
- NO academic language, NO generic trends, NO excuses for "quiet periods"

STANDARD REQUIREMENTS:
${articleOnlyMode ? `1. Your executive_summary should COMPREHENSIVELY synthesize the ${enrichedArticles.length} articles:
   - Identify articles about competitors and what they reveal
   - Identify articles about stakeholders and regulatory changes
   - Identify industry trends and market developments
2. SYNTHESIZE don't summarize: Group related articles, identify patterns, surface themes
3. Each key_development should come from an article - use article.title as "event", article.source as "source", article.url as "url"
4. Reference articles by describing them, not by number
5. Every claim must come from the articles above - no external knowledge` : `1. Your executive_summary should COMPREHENSIVELY synthesize the ${topEvents.length} events:
   - Organization news (${orgSlots} events provided)
   - Competitor developments (${competitorSlots} events provided) ← CRITICAL CATEGORY
   - Stakeholder/regulatory news (${stakeholderSlots} events provided)
   - Industry trends (${otherSlots} events provided)
2. SYNTHESIZE don't summarize: Group related events, identify patterns, surface themes
3. Coverage should be PROPORTIONAL to event volume: if ${otherSlots} industry events, that category should be substantive
4. Reference events by describing them, not by number
5. Every claim must come from the events above - no external knowledge`}

⚠️ CRITICAL SYNTHESIS RULES:
- "competitive_moves" = Actions by ${organization?.name}'s INDUSTRY COMPETITORS (other ${organization?.industry} companies)
- "stakeholder_dynamics" = News about regulators/investors/analysts we're monitoring (may be outside our industry)
- DO NOT put regulatory news in "competitive_moves" unless it directly affects ${organization?.industry} competition
- Example: For a PR firm, SEC enforcement on broker-dealers goes in "stakeholder_dynamics", NOT "competitive_moves"
- Example: For a PR firm, Edelman winning a client is a "competitive_move", SEC updating disclosure rules is "stakeholder_dynamics"

Generate comprehensive intelligence synthesis as valid JSON:

{
  "synthesis": {
    "executive_summary": "A 2-3 paragraph narrative overview that synthesizes the key patterns and themes from today's ${topEvents.length} events. Focus on what matters most to ${organization?.name}. Include source citations like [Source: Article Title]. Group related developments rather than listing individual events. Use \\n\\n to separate paragraphs.",

    "key_developments": [
      {
        "category": "competitor_move",
        "event": "Specific action taken (include names, numbers, details)",
        "impact": "Why this matters to ${organization?.name}",
        "source": "Article title",
        "url": "Article URL",
        "recency": "today",
        "entity": "Company/entity name"
      }
    ],

    "strategic_implications": "What ${organization?.name} should know and do based on these developments. Be specific and actionable.",

    "watching_closely": ["Entity names, topics, or trends to monitor based on the intelligence"]
  }
}

CRITICAL INSTRUCTIONS FOR key_developments:
${articleOnlyMode ? `- Include 15-25 entries from the ${enrichedArticles.length} articles provided
- Use article.title as "event", article.source as "source", article.url as "url"
- Sort by relevance_score (highest first) and recency` : `- Include 15-25 entries covering ALL significant events from the ${topEvents.length} provided`}
- Sort by recency: "today" first, then "this_week", then "older"
- Each entry MUST have source attribution (source + url fields)
- category options: competitor_move, stakeholder_action, market_trend, regulatory_change
- Be specific in "event" - use actual names, numbers, quotes from the ${articleOnlyMode ? 'articles' : 'events'}
- "impact" should explain WHY ${organization?.name} cares about this specific ${articleOnlyMode ? 'article' : 'event'}

═══════════════════════════════════════════════════════════
🚨 FINAL VERIFICATION CHECKLIST (Review Before Responding)
═══════════════════════════════════════════════════════════

Before you generate your synthesis, verify:

✅ GROUNDING CHECK: Can you point to the specific article/event for EVERY claim?
   - If YES: Include it in your synthesis
   - If NO: Remove it - you're speculating

✅ CONTEXT ALIGNMENT: Does each insight relate to the company's:
   - Competitors listed above?
   - Stakeholders listed above?
   - Strategic interests in their profile?
   - If NOT: It's not relevant intelligence for them

✅ DATA FIDELITY: Are you:
   - Synthesizing what the articles actually say?
   - Or adding your own interpretation/assumptions?
   - ONLY the articles' content should inform your synthesis

REMEMBER: You are aligning DATA (the articles) with CONTEXT (the company profile).
Your value is in making connections the company might miss - NOT in adding information they don't have.

If the articles don't provide enough information about a topic, say "Limited intelligence on X in current monitoring data" rather than filling gaps with assumptions.`;
    
  } else {
    // Standard synthesis of pre-analyzed data
    prompt = `Synthesize the following pre-analyzed intelligence for ${organization?.name}:

IMMEDIATE PRIORITIES:
${context.strategicInsights.immediate.map(a => `• ${a.title}: ${a.implication}`).join('\n')}

KEY OPPORTUNITIES:
${context.strategicInsights.opportunities.slice(0, 5).map(o => `• ${o.opportunity}`).join('\n')}

CRITICAL THREATS:
${context.strategicInsights.threats.slice(0, 5).map(t => `• ${t.threat}`).join('\n')}

MARKET DYNAMICS:
${context.strategicInsights.trends.slice(0, 5).join('\n• ')}

Provide a concise executive synthesis focusing on:
1. What matters most right now
2. Strategic implications
3. Recommended actions`;
  }
  
  // Limit prompt size to prevent token overflow (roughly 4 chars per token, max ~30k tokens = 120k chars)
  const MAX_PROMPT_LENGTH = 100000; // Conservative limit
  if (prompt.length > MAX_PROMPT_LENGTH) {
    console.warn(`⚠️ Prompt too large (${prompt.length} chars), truncating to ${MAX_PROMPT_LENGTH}`);
    prompt = prompt.substring(0, MAX_PROMPT_LENGTH) + '\n\n[TRUNCATED DUE TO SIZE LIMITS - Please synthesize based on the data provided above]';
  }
  
  console.log('🚀 Calling Claude for synthesis...');
  console.log('Prompt length:', prompt.length, 'characters');
  
  // DEBUG: Check if real data is in the prompt
  const promptSample = prompt.substring(0, 2000);
  console.log('📝 PROMPT SAMPLE (first 2000 chars):', promptSample);

  // Check for real data in the prompt - look for actual entities and event types
  const contextEvents = context.strategicInsights?.events || [];
  const entities = [...new Set(contextEvents.map(e => e.entity).filter(Boolean))];
  const hasRealCompanies = entities.length > 0;
  const hasRealEvents = contextEvents.length > 0;
  const eventTypes = [...new Set(contextEvents.map(e => e.type).filter(Boolean))];

  console.log('🔍 PROMPT CONTAINS REAL DATA:', {
    hasRealCompanies,
    hasRealEvents,
    eventCount: contextEvents.length,
    uniqueEntities: entities.length,
    sampleEntities: entities.slice(0, 10),
    eventTypes: eventTypes
  });
  
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
        model: 'claude-sonnet-4-20250514',  // Back to Sonnet 4 - was working before
        max_tokens: 4000,
        temperature: 0.3,  // Lower temperature for more focused, strategic output
        system: `You are writing a DAILY INDUSTRY INTELLIGENCE BRIEF for ${organization?.name}'s executive team.

MISSION: Report on the ${organization?.industry || 'industry'} landscape TODAY - market trends, competitor moves, regulatory shifts, thought leadership, and strategic opportunities.

ABSOLUTE RULES:
1. FOCUS ON INDUSTRY INTELLIGENCE - trends, events, regulatory changes, market shifts, thought leadership
2. Competitor-specific news is ONE component, not the only component
3. RECENT NEWS FIRST - Today > This week > Old (ignore 2+ weeks unless critical)
4. BE SUBSTANTIVE - Report actual industry developments, not "limited intelligence detected"
5. VALUE ALL SIGNALS - Industry news without specific competitor mentions is still valuable intelligence

${synthesisMetadata?.companyProfile ? `
═══════════════════════════════════════════════════════════
ORGANIZATIONAL CONTEXT - WHO YOU'RE WORKING FOR
═══════════════════════════════════════════════════════════
Company: ${organization?.name}
Business Model: ${synthesisMetadata.companyProfile.business_model || 'Not specified'}
Product Lines: ${synthesisMetadata.companyProfile.product_lines?.join(', ') || 'Not specified'}
Key Markets: ${synthesisMetadata.companyProfile.key_markets?.join(', ') || 'Not specified'}
Strategic Goals: ${synthesisMetadata.companyProfile.strategic_goals?.map(g => `${g.goal} (${g.timeframe})`).join('; ') || 'Not specified'}

INDUSTRY FOCUS: ${organization?.industry || 'The industry'}

KEY COMPETITORS TO TRACK (when mentioned):
${discoveryTargets.competitors.slice(0, 15).join(', ') || 'None specified'}

KEY STAKEHOLDERS TO TRACK (regulators, analysts, investors):
${discoveryTargets.stakeholders.slice(0, 15).join(', ') || 'None specified'}

⚠️ CRITICAL: Your synthesis should cover:
- Industry trends and market shifts affecting ${organization?.industry || 'the industry'}
- Competitor moves when available (but don't complain if not every competitor has news today)
- Regulatory/policy changes
- Thought leadership and industry discourse
- Strategic opportunities for ${organization?.name}

Focus on what matters to a ${synthesisMetadata.companyProfile.business_model || 'company in this industry'}, not just competitor tracking.
` : ''}

WHAT YOU ARE RECEIVING:
This is NOT raw data. You are receiving the OUTPUT of our intelligence pipeline:
1. We monitored hundreds of news sources today
2. Our AI filtered them for PR relevance
3. Our enrichment AI extracted and categorized events, entities, quotes, and metrics
4. This enriched data is YOUR ONLY SOURCE - it contains everything we found today

THE ENRICHED DATA STRUCTURE:
- EVENTS: Pre-extracted, categorized developments with DATES (crisis, product, partnership, etc.)
- ENTITIES: Companies, people, and organizations mentioned
- QUOTES: Key statements from executives, analysts, and media
- METRICS: Financial figures, percentages, and data points
- ARTICLE SUMMARIES: Pre-analyzed articles with ENHANCED SUMMARIES (title + description + source)

⚠️ CRITICAL: ARTICLE CONTENT LIMITATIONS
Most articles (90%) contain ENHANCED SUMMARIES only:
- Title + Description (search snippet) + Source attribution
- These are NOT full article text - they are intelligent summaries from search results
- About 10 high-priority articles (score ≥90) have FULL SCRAPED CONTENT
- The summaries marked "has_full_content: true" have complete article text
- All other summaries are enhanced from title+description - treat them as high-quality headlines with context

How to work with summaries:
- Use them to identify trends, patterns, and themes across many articles
- Cross-reference multiple summaries to build intelligence about events
- The volume and diversity of summaries is valuable - many partial insights = comprehensive picture
- Focus on what summaries REVEAL about the news landscape, not what they lack

**CRITICAL: RECENCY PRIORITIZATION**
Each event has a date stamp. Your executive_summary MUST prioritize by recency:
1. **HIGHEST PRIORITY**: Events from today, yesterday, or within last 7 days
2. **MEDIUM PRIORITY**: Events from 1-2 weeks ago (include only if strategically significant)
3. **LOW PRIORITY**: Events older than 2 weeks (only mention if major ongoing strategic impact)
4. **EXCLUDE**: Events older than 1 month should NOT appear in executive_summary unless they represent major strategic shifts still affecting today

**Example of GOOD recency handling:**
"Today's monitoring reveals [recent events]. This builds on [quick context from older events if relevant]."

**Example of BAD recency handling:**
"Warren Buffett's investment 5 months ago dominates the analysis..." [OLD NEWS - should be de-emphasized]

YOUR TASK:
You are the FINAL SYNTHESIS stage. Your job is to:
1. Synthesize the pre-analyzed events into a coherent PR strategy PRIORITIZING RECENT EVENTS
2. Connect the dots between different events to find patterns, weighing recent events more heavily
3. Identify which RECENT events matter most for ${organization?.name}'s PR strategy
4. Generate actionable PR recommendations based on THIS SPECIFIC DATA and its RECENCY

CRITICAL RULES:
- The events list IS your news - don't look for articles elsewhere
- Every event has a date - USE IT to prioritize recent developments
- If an event says "Google announced X (Today)" - that goes in executive_summary
- If an event says "Investment closed (5 months ago)" - that should NOT dominate executive_summary
- You MUST base your entire analysis on these events AND their dates
- Do NOT add outside knowledge - if it's not in the events, it didn't happen today
- Reference specific RECENT events to show your analysis is grounded in today's monitoring

Remember: You're not gathering intelligence - you're SYNTHESIZING already-gathered, already-enriched intelligence WITH RECENCY AWARENESS.`,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    
    if (!response.ok) {
      let errorMessage = `Claude API error: ${response.status}`;
      try {
        const errorData = await response.text();
        console.error('❌ Claude API Error:', errorData);
        if (errorData.includes('Internal Server Error')) {
          errorMessage = 'Claude API internal error - retrying with smaller prompt';
          // Could implement retry logic here with smaller data
        }
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    const synthesisText = data.content?.[0]?.text || 'No synthesis generated';
    
    console.log('✅ Claude response received, length:', synthesisText.length);
    console.log('🔍 First 500 chars of Claude response:', synthesisText.substring(0, 500));
    console.log('🔍 Last 100 chars of Claude response:', synthesisText.substring(synthesisText.length - 100));
    
    // Log the ENTIRE response to see what we're getting
    console.log('📝 FULL CLAUDE RESPONSE:', synthesisText);
    
    // Check for completeness - updated for journalistic format
    const hasExecutiveSynthesis = synthesisText.includes('executive_synthesis') || synthesisText.includes('intelligence_report');
    const hasContent = synthesisText.length > 100;
    const looksLikeJSON = synthesisText.trim().startsWith('{') && synthesisText.trim().endsWith('}');
    
    console.log('🔍 Response completeness check:', {
      hasExecutiveSynthesis,
      hasContent,
      looksLikeJSON,
      responseLength: synthesisText.length
    });
    
    if (!hasContent) {
      console.error('❌ INCOMPLETE RESPONSE - Response too short');
    }
    
    // Parse the JSON response from Claude if it's in JSON format
    let synthesis;
    try {
      // Clean potential markdown formatting
      let cleanText = synthesisText.trim();

      // Remove markdown code blocks if present
      if (cleanText.includes('```json')) {
        // Extract JSON from anywhere in the response
        const jsonMatch = cleanText.match(/```json\s*([\s\S]*?)```/);
        if (jsonMatch) {
          cleanText = jsonMatch[1].trim();
        }
      } else if (cleanText.includes('```')) {
        // Extract from generic code block
        const codeMatch = cleanText.match(/```\s*([\s\S]*?)```/);
        if (codeMatch) {
          cleanText = codeMatch[1].trim();
        }
      }

      // If still not clean JSON, try to extract JSON object from the text
      if (!cleanText.startsWith('{')) {
        // Look for JSON object in the response
        const jsonObjMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonObjMatch) {
          cleanText = jsonObjMatch[0];
        }
      }

      // Remove any trailing content after the last }
      const lastBrace = cleanText.lastIndexOf('}');
      if (lastBrace !== -1 && lastBrace < cleanText.length - 1) {
        cleanText = cleanText.substring(0, lastBrace + 1);
      }

      // Fix common JSON formatting issues before parsing
      // Replace smart quotes with regular quotes
      cleanText = cleanText.replace(/[""]/g, '"').replace(/['']/g, "'");

      // Try to parse as JSON
      const parsed = JSON.parse(cleanText);
      
      // Check if we got the new C-suite report structure
      if (parsed.synthesis) {
        synthesis = parsed.synthesis;
        synthesisMetadata = parsed.metadata || {};
      } else if (parsed.perspective && !parsed.executive_synthesis) {
        console.error('❌ PARTIAL RESPONSE DETECTED - Only got one persona:', parsed.perspective);
        // Try to wrap it in the expected structure
        synthesis = {
          executive_synthesis: "Partial response received - synthesis incomplete",
          competitive_dynamics: parsed.perspective?.includes('Sarah Chen') ? parsed : {},
          narrative_intelligence: parsed.perspective?.includes('James Mitchell') ? parsed : {},
          power_dynamics: parsed.perspective?.includes('Catherine Rhodes') ? parsed : {},
          cultural_context: parsed.perspective?.includes('Marcus Park') ? parsed : {},
          contrarian_analysis: parsed.perspective?.includes('David Thornton') ? parsed : {},
          immediate_opportunities: [],
          critical_threats: [],
          metadata: {
            analysis_timestamp: new Date().toISOString(),
            error: 'Partial response - only one persona returned'
          }
        };
      } else {
        synthesis = parsed;
      }
      
      console.log('📊 Parsed structured synthesis');
      
      // Store the original structure for proper handling
      let synthesisContent = synthesis;
      // Don't redeclare synthesisMetadata - it's already declared at function scope
      
      // Check if we have the new journalistic format with nested structure
      if (synthesis.synthesis && synthesis.metadata) {
        console.log('🔍 Synthesis structure (new non-repetitive format with wrapper):', {
          hasWhatHappened: !!synthesis.synthesis.what_happened,
          hasCompetitiveMoves: !!synthesis.synthesis.competitive_moves,
          hasStakeholderReactions: !!synthesis.synthesis.stakeholder_reactions,
          hasImplications: !!synthesis.synthesis.implications,
          hasForwardIndicators: !!synthesis.synthesis.forward_indicators,
          hasDiscoveryCoverage: !!synthesis.synthesis.discovery_coverage,
          keys: Object.keys(synthesis.synthesis)
        });
        // Extract the actual synthesis content and metadata
        synthesisContent = synthesis.synthesis;
        synthesisMetadata = synthesis.metadata;
      } else if (synthesis.what_happened || synthesis.competitive_moves || synthesis.executive_summary || synthesis.breaking_developments) {
        // Handle both new and old formats
        console.log('🔍 Synthesis structure (direct format):', {
          // New format
          hasWhatHappened: !!synthesis.what_happened,
          hasCompetitiveMoves: !!synthesis.competitive_moves,
          // Old format fallback
          hasExecutiveSummary: !!synthesis.executive_summary,
          hasBreakingDevelopments: !!synthesis.breaking_developments,
          hasDiscoveryCoverage: !!synthesis.discovery_coverage,
          keys: Object.keys(synthesis)
        });
        synthesisContent = synthesis;
      } else {
        // Old format check
        console.log('🔍 Synthesis structure (legacy format):', {
          hasExecutiveSynthesis: !!synthesis.executive_synthesis,
          hasCompetitiveDynamics: !!synthesis.competitive_dynamics,
          hasNarrativeIntelligence: !!synthesis.narrative_intelligence,
          hasPowerDynamics: !!synthesis.power_dynamics,
          hasCulturalContext: !!synthesis.cultural_context,
          hasContrarianAnalysis: !!synthesis.contrarian_analysis,
          hasImmediateOpportunities: !!synthesis.immediate_opportunities,
          hasCriticalThreats: !!synthesis.critical_threats,
          keys: Object.keys(synthesis)
        });
        synthesisContent = synthesis;
      }
      
      // Use the extracted content for further processing
      synthesis = synthesisContent;
    } catch (e) {
      // Fallback to text if not JSON
      console.log('⚠️ Failed to parse as JSON:', e.message);
      console.log('🔍 Attempting to fix and extract JSON from response...');

      // Try to fix common JSON issues
      let fixedText = synthesisText.trim();

      // Extract JSON object if embedded in text
      const jsonMatch = fixedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          let jsonStr = jsonMatch[0];

          // Fix the specific issue we saw: executive_summary split into multiple strings
          // Look for patterns like: "text",\n\n"more text" within executive_summary
          jsonStr = jsonStr.replace(/"executive_summary":\s*"([^"]*)",\s*\n\s*"([^"]*)"/,
            (match, p1, p2) => `"executive_summary": "${p1}\\n\\n${p2}"`);

          // Fix any other similar issues
          jsonStr = jsonStr.replace(/"\s*,\s*\n\s*"([^:]*?)"\s*:/g, ' $1":');

          const extracted = JSON.parse(jsonStr);
          synthesis = extracted.synthesis || extracted;
          synthesisMetadata = extracted.metadata || null;
          console.log('✅ Successfully fixed and extracted JSON from response');
        } catch (extractError) {
          console.error('❌ Could not fix JSON, error:', extractError.message);

          // Last resort: Create a simplified structure from the text
          synthesis = {
            executive_summary: "Analysis generated but formatting error occurred. Raw response saved.",
            raw_response: synthesisText,
            error: "JSON parsing failed - check raw_response for content"
          };
        }
      } else {
        console.log('📝 No JSON structure found, using markdown format');
        // Claude returned markdown text (which is actually preferred for readability)
        synthesis = {
          executive_summary: synthesisText,
          format: "markdown",
          // Don't include error field - markdown is a valid format
        };
      }
    }
    
    // Structure the response based on what Claude returned
    let result;
    
    // Debug the synthesis object
    console.log('🔍 Pre-check synthesis type:', typeof synthesis);
    console.log('🔍 Pre-check synthesis keys:', synthesis && typeof synthesis === 'object' ? Object.keys(synthesis).slice(0, 10) : 'not an object');
    console.log('🔍 Pre-check competitive_dynamics exists:', !!(synthesis && synthesis.competitive_dynamics));
    console.log('🔍 Pre-check synthesis_focus was:', synthesis_focus);
    
    // Handle the structured synthesis - FIXED LOGIC
    if (typeof synthesis === 'object' && synthesis !== null && !Array.isArray(synthesis)) {
      console.log('✅ Processing structured synthesis response');
      console.log('🔑 Synthesis keys:', Object.keys(synthesis).slice(0, 10));
      
      // The synthesis is already in the correct format from parsing above
      // Just wrap it for the response
      result = { 
        synthesis: synthesis,
        metadata: synthesisMetadata || { 
          timestamp: new Date().toISOString(),
          format: 'journalistic',
          events_analyzed: context.strategicInsights.events?.length || 0,
          confidence: 'high'
        }
      };
      
      // Add discovery coverage analysis
      if (result.synthesis && discoveryTargets) {
        const coverage = analyzeDiscoveryCoverage(result.synthesis, discoveryTargets, context);
        result.discovery_alignment = coverage;
      }
      
      // Add enrichment context if not already present
      if (!result.context) {
        result.context = {
          events_provided: context.strategicInsights.events?.length || 0,
          articles_analyzed: context.totalArticlesAnalyzed,
          immediate_actions_from_enrichment: context.strategicInsights.immediate,
          opportunities_from_enrichment: context.strategicInsights.opportunities,
          threats_from_enrichment: context.strategicInsights.threats
        };
      }
      
      console.log('✅ Synthesis response structured and complete');

      // POST-PROCESSING: Enrich URLs in key_developments using original event data
      // Claude often fails to copy URLs correctly, so we match by source/title and fix them
      const contextEvents = context.strategicInsights?.events || [];
      const enrichedArticlesForUrls = enriched_data?.enriched_articles || [];
      if (result.synthesis?.key_developments && (contextEvents.length > 0 || enrichedArticlesForUrls.length > 0)) {
        console.log('🔗 Enriching URLs in key_developments...');

        // Create URL lookup maps from both events and articles
        const urlBySource: Record<string, string> = {};
        const urlByTitle: Record<string, string> = {};

        // From events
        contextEvents.forEach((e: any) => {
          if (e.source && e.url) urlBySource[e.source.toLowerCase()] = e.url;
          if (e.article_title && e.url) urlByTitle[e.article_title.toLowerCase().substring(0, 50)] = e.url;
        });

        // From enriched articles (more complete)
        enrichedArticlesForUrls.forEach((a: any) => {
          if (a.title && a.url) {
            urlByTitle[a.title.toLowerCase().substring(0, 50)] = a.url;
            urlBySource[a.title.toLowerCase().substring(0, 30)] = a.url;
          }
          if (a.source && a.url) urlBySource[a.source.toLowerCase()] = a.url;
        });

        let enrichedCount = 0;
        result.synthesis.key_developments = result.synthesis.key_developments.map((dev: any) => {
          // If URL is missing or invalid, try to find it
          if (!dev.url || dev.url === 'N/A' || dev.url === '#' || dev.url === 'Unknown' || !dev.url.startsWith('http')) {
            const sourceLower = (dev.source || '').toLowerCase();
            const titleKey = sourceLower.substring(0, 50);
            const shortKey = sourceLower.substring(0, 30);

            // Try multiple matching strategies
            const matchedUrl = urlByTitle[titleKey] || urlByTitle[shortKey] || urlBySource[sourceLower] || urlBySource[shortKey];

            if (matchedUrl) {
              enrichedCount++;
              return { ...dev, url: matchedUrl };
            }
          }
          return dev;
        });

        console.log(`🔗 Enriched ${enrichedCount} URLs in key_developments`);
      }
    } else if (typeof synthesis === 'string') {
      // Claude returned text or simple structure - wrap it
      console.log('⚠️ BRANCH 3: Falling back to text synthesis (Claude did not return proper JSON structure)');
      console.log('🔍 synthesis_focus was:', synthesis_focus);
      console.log('🔍 synthesis type:', typeof synthesis);
      console.log('🔍 synthesis keys (if object):', typeof synthesis === 'object' ? Object.keys(synthesis) : 'not an object');
      
      result = {
        synthesis: typeof synthesis === 'string' ? synthesis : (synthesis.synthesis || synthesis),
        metadata: {
          timestamp: new Date().toISOString(),
          articles_analyzed: context.totalArticlesAnalyzed,
          deep_analysis_count: context.deepAnalysisCount,
          immediate_actions: context.strategicInsights.immediate.length,
          opportunities_found: context.strategicInsights.opportunities.length,
          threats_identified: context.strategicInsights.threats.length,
          synthesis_focus: synthesis_focus || 'standard',
          model: 'claude-sonnet-4-20250514'
        },
        key_insights: {
          immediate: context.strategicInsights.immediate.slice(0, 3),
          opportunities: context.strategicInsights.opportunities.slice(0, 5),
          threats: context.strategicInsights.threats.slice(0, 5),
          trends: context.strategicInsights.trends.slice(0, 5)
        },
        sources: {
          top_articles: context.analyzedInsights.slice(0, 10).map(a => ({
            title: a.title,
            category: a.category,
            time_sensitivity: a.time_sensitivity
          })),
          key_entities: context.keyEntities.companies.slice(0, 10).map(c => c.name)
        }
      };
      console.log('📝 Using simple synthesis format');
    }

    // Save synthesis to database for persistence
    if (organization_id && organization?.name) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        console.log('💾 Saving synthesis to database...', {
          organization_id,
          organization_name: organization.name
        });

        const { data: insertData, error: insertError } = await supabase
          .from('executive_synthesis')
          .insert({
            organization_id: organization_id,
            organization_name: organization.name,
            synthesis_data: result,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Failed to save synthesis to database:', insertError);
          // Don't throw - we still want to return the synthesis even if save fails
        } else {
          console.log('✅ Synthesis saved to database with ID:', insertData?.id);

          // ALSO save to content_library for Memory Vault searchability
          try {
            const title = `Executive Synthesis - ${new Date().toLocaleDateString()}`;
            // Updated for new event-focused format
            const keyDevelopmentsSummary = result.synthesis.key_developments
              ?.slice(0, 10)
              .map((d: any) => `• ${d.category}: ${d.event}`)
              .join('\n') || 'No key developments';

            const contentForLibrary = `${result.synthesis.executive_summary}\n\nKey Developments:\n${keyDevelopmentsSummary}\n\nStrategic Implications:\n${result.synthesis.strategic_implications || 'None'}`;

            // Generate embedding for semantic search
            const textForEmbedding = `${title}\n\n${contentForLibrary}`.substring(0, 8000);
            const embedding = await generateEmbedding(textForEmbedding);

            console.log('💾 Also saving to content_library for Memory Vault...');
            const { error: libraryError } = await supabase
              .from('content_library')
              .insert({
                organization_id: organization_id,
                title: title,
                content: contentForLibrary,
                content_type: 'executive-summary',
                metadata: {
                  synthesis_id: insertData?.id,
                  competitor_moves: result.synthesis.competitor_moves,
                  opportunities: result.synthesis.opportunities,
                  threats: result.synthesis.threats
                },
                folder: 'Executive Summaries',
                status: 'active',
                embedding: embedding,
                embedding_model: 'voyage-3-large',
                embedding_updated_at: embedding ? new Date().toISOString() : null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (libraryError) {
              console.error('⚠️ Failed to save to content_library (non-blocking):', libraryError);
            } else {
              console.log('✅ Executive synthesis also saved to content_library for Memory Vault access');
            }
          } catch (libraryErr) {
            console.error('⚠️ Error saving to content_library (non-blocking):', libraryErr);
          }
        }
      } catch (dbError) {
        console.error('❌ Database save error:', dbError);
        // Don't throw - we still want to return the synthesis even if save fails
      }
    } else {
      console.log('⚠️ Skipping database save - missing organization_id or organization.name');
    }

    return result;
    
  } catch (error) {
    console.error('❌ Synthesis error:', error);
    console.error('Error stack:', error.stack);
    
    // Return a fallback structure if synthesis fails
    if (error.message?.includes('internal error') || error.message?.includes('Internal Server') || error.message?.includes('discoveryTargets')) {
      console.log('⚠️ Falling back to simplified synthesis due to API error');
      return {
        synthesis: {
          executive_summary: 'Synthesis generation failed due to API error. Key intelligence points extracted from enrichment.',
          top_insights: context.strategicInsights.immediate.slice(0, 3).map(i => i.title),
          competitor_moves: context.strategicInsights.events
            .filter(e => e.type?.includes('competitor'))
            .slice(0, 2)
            .map(e => e.description?.substring(0, 150) || 'Competitor activity detected'),
          immediate_actions: context.strategicInsights.immediate.slice(0, 2).map(a => a.title),
          opportunities: context.strategicInsights.opportunities.slice(0, 2).map(o => o.opportunity),
          threats: context.strategicInsights.threats.slice(0, 2).map(t => t.threat),
          narrative_strategy: 'Unable to generate narrative strategy due to API error.',
          positioning_recommendation: 'Unable to generate positioning recommendation due to API error.'
        },
        metadata: {
          analysis_date: new Date().toISOString(),
          events_analyzed: context.strategicInsights.events?.length || 0,
          confidence: 'low',
          error: 'API error - using fallback synthesis'
        }
      };
    }
    throw error;
  }
}

// Analyze which discovery targets were found in the synthesis
function analyzeDiscoveryCoverage(synthesis: any, discoveryTargets: any, context: any) {
  const coverage = {
    competitors_found: [],
    stakeholders_found: [],
    topics_found: [],
    coverage_gaps: [],
    coverage_percentage: 0,
    entities_in_events: [],
    entities_in_synthesis: []
  };

  // Get entities from the actual events we sent
  const eventsEntities = [...new Set(context.strategicInsights?.events?.map(e => e.entity).filter(Boolean) || [])];
  coverage.entities_in_events = eventsEntities;

  // Check synthesis text for discovery targets AND event entities
  const synthesisText = JSON.stringify(synthesis).toLowerCase();
  
  // Check competitors
  discoveryTargets.competitors.forEach(competitor => {
    if (competitor && synthesisText.includes(competitor.toLowerCase())) {
      coverage.competitors_found.push(competitor);
    }
  });
  
  // Check stakeholders
  discoveryTargets.stakeholders.forEach(stakeholder => {
    if (stakeholder && synthesisText.includes(stakeholder.toLowerCase())) {
      coverage.stakeholders_found.push(stakeholder);
    }
  });
  
  // Check topics
  discoveryTargets.topics.forEach(topic => {
    if (topic && synthesisText.includes(topic.toLowerCase())) {
      coverage.topics_found.push(topic);
    }
  });
  
  // Calculate coverage gaps
  const missingCompetitors = discoveryTargets.competitors
    .filter(c => !coverage.competitors_found.includes(c))
    .slice(0, 5);
  const missingTopics = discoveryTargets.topics
    .filter(t => !coverage.topics_found.includes(t))
    .slice(0, 5);
    
  if (missingCompetitors.length > 0) {
    coverage.coverage_gaps.push(`Missing competitors: ${missingCompetitors.join(', ')}`);
  }
  if (missingTopics.length > 0) {
    coverage.coverage_gaps.push(`Missing topics: ${missingTopics.join(', ')}`);
  }
  
  // Calculate coverage percentage
  const totalTargets = discoveryTargets.competitors.length + 
                      discoveryTargets.stakeholders.length + 
                      discoveryTargets.topics.length;
  const foundTargets = coverage.competitors_found.length + 
                      coverage.stakeholders_found.length + 
                      coverage.topics_found.length;
  coverage.coverage_percentage = totalTargets > 0 ? Math.round((foundTargets / totalTargets) * 100) : 0;
  
  // Check which event entities made it to synthesis
  eventsEntities.forEach(entity => {
    if (entity && synthesisText.includes(entity.toLowerCase())) {
      coverage.entities_in_synthesis.push(entity);
    }
  });

  console.log('📊 Discovery Coverage Analysis:', {
    competitors: `${coverage.competitors_found.length}/${discoveryTargets.competitors.length}`,
    stakeholders: `${coverage.stakeholders_found.length}/${discoveryTargets.stakeholders.length}`,
    topics: `${coverage.topics_found.length}/${discoveryTargets.topics.length}`,
    percentage: `${coverage.coverage_percentage}%`,
    event_entities_used: `${coverage.entities_in_synthesis.length}/${coverage.entities_in_events.length}`,
    missing_from_synthesis: eventsEntities.filter(e => !coverage.entities_in_synthesis.includes(e)).slice(0, 10)
  });
  
  return coverage;
}

// Handle HTTP requests
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { method, params } = await req.json();
    
    console.log('📥 MCP Request:', { 
      method, 
      hasParams: !!params,
      paramsKeys: params ? Object.keys(params) : [],
      timestamp: new Date().toISOString()
    });
    
    if (method === 'tools/list') {
      return new Response(JSON.stringify({ tools: TOOLS }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      
      console.log('🔧 Tool Call:', {
        name,
        hasArgs: !!args,
        argsKeys: args ? Object.keys(args) : [],
        enriched_data_keys: args?.enriched_data ? Object.keys(args.enriched_data).slice(0, 10) : 'no enriched_data',
        has_organized_intelligence: !!args?.enriched_data?.organized_intelligence,
        organized_events_count: args?.enriched_data?.organized_intelligence?.events?.length || 0,
        has_extracted_data: !!args?.enriched_data?.extracted_data,
        extracted_events_count: args?.enriched_data?.extracted_data?.events?.length || 0
      });

      if (name === 'synthesize_executive_intelligence') {
        const result = await synthesizeExecutiveIntelligence(args);
        
        return new Response(JSON.stringify({
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Unknown tool: ${name}`);
    }
    
    throw new Error(`Unknown method: ${method}`);
    
  } catch (error) {
    console.error('❌ MCP Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});