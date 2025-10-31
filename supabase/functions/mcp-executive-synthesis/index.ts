import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Try both API key names like NIV does
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');

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
        // Fallback to old profile format if no targets in database
        discoveryTargets = {
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
            ...(profile?.trending?.emerging_technologies || []),
            ...(profile?.keywords || []),
            ...(profile?.monitoring_config?.keywords || [])
          ].filter(Boolean) || []
        };
      }
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
          ...(profile?.stakeholders?.major_investors || []),
          ...(profile?.stakeholders?.executives || [])
        ].filter(Boolean),
        topics: [
          ...(profile?.trending?.hot_topics || []),
          ...(profile?.trending?.emerging_technologies || []),
          ...(profile?.keywords || []),
          ...(profile?.monitoring_config?.keywords || [])
        ].filter(Boolean) || []
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
  
  // Create synthesis prompt with STRUCTURED DATA
  let prompt;
  
  if (synthesis_focus === 'all_consolidated') {
    // Extract the structured data properly
    const { structuredContext, discoveryTargets } = context;

    // Get ALL events but PRIORITIZE non-org events
    const allEvents = context.strategicInsights.events || [];

    // CRITICAL: Separate org vs market events
    const orgName = organization?.name?.toLowerCase() || '';
    const eventsAboutOrg = allEvents.filter(e => {
      const entityLower = e.entity?.toLowerCase() || '';
      return entityLower.includes(orgName) ||
             entityLower === orgName ||
             (orgName === 'openai' && entityLower.includes('openai')) ||
             (orgName === 'tesla' && entityLower.includes('tesla'));
    });
    const eventsAboutOthers = allEvents.filter(e => {
      const entityLower = e.entity?.toLowerCase() || '';
      return !entityLower.includes(orgName) &&
             !(orgName === 'openai' && entityLower.includes('openai')) &&
             !(orgName === 'tesla' && entityLower.includes('tesla'));
    });

    console.log('🚨🚨🚨 CRITICAL EVENT ANALYSIS:');
    console.log(`Total events from enrichment: ${allEvents.length}`);
    console.log(`Events about ${organization?.name}: ${eventsAboutOrg.length}`);
    console.log(`Events about competitors/market: ${eventsAboutOthers.length}`);

    // Show distribution of competitor events
    const competitorEventCounts = {};
    eventsAboutOthers.forEach(e => {
      const entity = e.entity || 'Unknown';
      competitorEventCounts[entity] = (competitorEventCounts[entity] || 0) + 1;
    });
    console.log('Competitor event distribution:', Object.entries(competitorEventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([entity, count]) => `${entity}:${count}`)
      .join(', '));

    // PRIORITIZE competitor/market events HEAVILY - 80/20 rule
    const maxEvents = 50; // Increase to get more context
    const competitorEventCount = Math.min(40, eventsAboutOthers.length); // Up to 40 competitor events
    const orgEventCount = Math.min(10, eventsAboutOrg.length); // Max 10 org events

    const topEvents = [
      ...eventsAboutOthers.slice(0, competitorEventCount),
      ...eventsAboutOrg.slice(0, orgEventCount)
    ];

    console.log(`🎯 Selected ${topEvents.length} events for synthesis:`);
    console.log(`  - ${competitorEventCount} competitor/market events`);
    console.log(`  - ${orgEventCount} org context events`);

    // Log first few events to verify
    topEvents.slice(0, 5).forEach((event, i) => {
      console.log(`Event ${i+1}: [${event.type}] ${event.entity} - ${event.description?.substring(0, 100)}`);
    });

    // Get more quotes and metrics too
    const keyQuotes = context.strategicInsights.quotes?.slice(0, 15) || [];
    const metrics = context.strategicInsights.metrics?.slice(0, 10) || [];

    // Get enriched articles with their deep analysis - from the enriched_data parameter
    const enrichedArticles = enriched_data?.enriched_articles || [];

    // Log what we're getting from enriched articles
    console.log('📰 ENRICHED ARTICLES ANALYSIS:', {
      total_articles: enrichedArticles.length,
      with_deep_analysis: enrichedArticles.filter(a => a.deep_analysis).length,
      with_pr_category: enrichedArticles.filter(a => a.pr_category).length,
      with_entities: enrichedArticles.filter(a => a.entities && a.entities.length > 0).length,
      sample_categories: enrichedArticles.slice(0, 5).map(a => a.pr_category || a.category || 'uncategorized'),
      sample_relevance_scores: enrichedArticles.slice(0, 5).map(a => a.pr_relevance_score || a.relevance_score || 0)
    });

    const articleSummaries = enrichedArticles.slice(0, 20).map((article, i) => ({
      headline: article.title,
      category: article.pr_category || article.category,
      relevance: article.pr_relevance_score || article.relevance_score,
      sentiment: article.deep_analysis?.sentiment || 'neutral',
      key_insight: article.deep_analysis?.key_takeaway || article.summary?.substring(0, 150),
      entities_mentioned: article.entities?.slice(0, 3) || [],
      competitive_relevance: article.deep_analysis?.competitive_relevance || 'medium'
    }));

    console.log('📊 Article summaries prepared:', articleSummaries.length);

    // Extract all unique entities from events for clarity
    const allEntities = [...new Set(topEvents.map(e => e.entity).filter(Boolean))];
    const competitorEntities = allEntities.filter(e =>
      context.discoveryTargets.competitors.some(c =>
        e.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(e.toLowerCase())
      )
    );
    const otherEntities = allEntities.filter(e => !competitorEntities.includes(e));

    prompt = `YOU ARE RECEIVING ENRICHED INTELLIGENCE DATA
This is the complete output from our monitoring and enrichment pipeline.
The events below are ALL from TODAY'S news monitoring - they are NOT hypothetical.

═══════════════════════════════════════════════════════════
🎯 CRITICAL: UNDERSTAND THE MONITORING CONTEXT
═══════════════════════════════════════════════════════════

ORGANIZATION CONTEXT:
- Organization: ${organization?.name}
- Industry: ${organization?.industry || 'Unknown'}
- What ${organization?.name} Does: ${organization?.description || 'Strategic communications and PR services'}

${organization?.name}'s DIRECT COMPETITORS (companies in the SAME industry):
${discoveryTargets.competitors.slice(0, 10).join(', ')}

MONITORING TARGETS (entities we're tracking - may be outside our industry):
- Competitors: ${discoveryTargets.competitors.slice(0, 5).join(', ')}
- Stakeholders: ${discoveryTargets.stakeholders.slice(0, 5).join(', ')}

⚠️ CRITICAL DISTINCTION:
- When analyzing "competitive moves", focus on ${organization?.name}'s INDUSTRY COMPETITORS
- When analyzing "stakeholder dynamics", that's about the monitoring targets
- DO NOT confuse stakeholder/regulatory news with competitive moves unless it directly impacts ${organization?.industry}

MONITORING DATE: ${new Date().toISOString().split('T')[0]}

PRE-ANALYZED ARTICLES (${context.totalArticlesAnalyzed} articles processed by our AI):
${articleSummaries.map((article, i) => `
${i+1}. ${article.headline}
   Category: ${article.category} | Relevance: ${article.relevance}/100 | Sentiment: ${article.sentiment}
   Key Insight: ${article.key_insight}
   Entities: ${article.entities_mentioned.join(', ') || 'None identified'}
`).join('') || 'No enriched articles available'}

PRE-EXTRACTED EVENTS (These ${topEvents.length} events are what our AI found in today's news):
${topEvents.map((e, i) =>
  `${i+1}. [${e.type?.toUpperCase()}] ${e.entity}: ${e.description}`
).join('\n')}

THE ABOVE EVENTS ARE YOUR ONLY SOURCE OF TRUTH - They represent real news from today's monitoring.

${keyQuotes.length > 0 ? `KEY QUOTES:\n${keyQuotes.map(q =>
  `"${q.text}" - ${q.source || 'Unknown'}`
).join('\n')}` : ''}

${metrics.length > 0 ? `METRICS:\n${metrics.map(m =>
  `${m.type}: ${m.value}`
).join('\n')}` : ''}

SYNTHESIS REQUIREMENTS:
1. Your executive_summary MUST mention at least 10 different companies/entities from the events above
2. Reference events by describing them, not by number
3. Every claim must come from the events above - no external knowledge
4. Focus on the VARIETY of developments across different competitors
5. If major competitors are missing from the events, note this as an intelligence gap

⚠️ CRITICAL SYNTHESIS RULES:
- "competitive_moves" = Actions by ${organization?.name}'s INDUSTRY COMPETITORS (other ${organization?.industry} companies)
- "stakeholder_dynamics" = News about regulators/investors/analysts we're monitoring (may be outside our industry)
- DO NOT put regulatory news in "competitive_moves" unless it directly affects ${organization?.industry} competition
- Example: For a PR firm, SEC enforcement on broker-dealers goes in "stakeholder_dynamics", NOT "competitive_moves"
- Example: For a PR firm, Edelman winning a client is a "competitive_move", SEC updating disclosure rules is "stakeholder_dynamics"

Generate comprehensive PR intelligence synthesis as valid JSON:

{
  "synthesis": {
    "executive_summary": "A single string containing 2-3 paragraphs summarizing ONLY what we found in today's monitoring. Focus on ${organization?.industry} industry dynamics and what matters for ${organization?.name}'s strategic positioning. Use \\n\\n to separate paragraphs.",

    "competitive_moves": {
      "immediate_threats": ["Actions by OTHER ${organization?.industry} COMPANIES that threaten ${organization?.name}'s position - NOT regulatory news"],
      "opportunities": ["Weaknesses or gaps in OTHER ${organization?.industry} COMPANIES' positioning that ${organization?.name} can exploit"],
      "narrative_gaps": ["Stories in the ${organization?.industry} industry that competitors aren't telling but ${organization?.name} could own"]
    },

    "stakeholder_dynamics": {
      "key_movements": ["Actions by regulators, analysts, investors, or other monitoring targets - NOT direct competitors"],
      "influence_shifts": ["Changes in stakeholder influence that affect ${organization?.industry} landscape"],
      "engagement_opportunities": ["Specific monitoring targets (regulators, analysts, etc.) to engage and why"]
    },

    "media_landscape": {
      "trending_narratives": ["What stories are gaining traction in the media"],
      "sentiment_shifts": ["How coverage tone is changing for key players"],
      "journalist_interests": ["What reporters care about based on recent coverage"]
    },

    "pr_actions": {
      "immediate": ["Do this in next 24-48 hours"],
      "this_week": ["Actions for this week"],
      "strategic": ["Longer-term positioning plays"]
    },

    "risk_alerts": {
      "crisis_signals": ["Early warning signs of potential PR crises"],
      "reputation_threats": ["Emerging threats to ${organization?.name}'s reputation"],
      "mitigation_steps": ["Specific steps to prevent or prepare for risks"]
    }
  }
}

CRITICAL: Base your analysis ONLY on the articles and events listed above. Reference specific companies, quotes, and events from the monitoring data.
Every insight should be traceable back to a specific article or event we collected.
If you're not sure about something from the articles, say so rather than speculating.`;
    
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
        system: `You are a senior PR strategist receiving ENRICHED INTELLIGENCE DATA for ${organization?.name || 'a major corporation'}.

WHAT YOU ARE RECEIVING:
This is NOT raw data. You are receiving the OUTPUT of our intelligence pipeline:
1. We monitored hundreds of news sources today
2. Our AI filtered them for PR relevance
3. Our enrichment AI extracted and categorized events, entities, quotes, and metrics
4. This enriched data is YOUR ONLY SOURCE - it contains everything we found today

THE ENRICHED DATA STRUCTURE:
- EVENTS: Pre-extracted, categorized developments from today's articles (crisis, product, partnership, etc.)
- ENTITIES: Companies, people, and organizations mentioned
- QUOTES: Key statements from executives, analysts, and media
- METRICS: Financial figures, percentages, and data points
- ARTICLE SUMMARIES: Pre-analyzed articles with categories and relevance scores

YOUR TASK:
You are the FINAL SYNTHESIS stage. Your job is to:
1. Synthesize the pre-analyzed events into a coherent PR strategy
2. Connect the dots between different events to find patterns
3. Identify which events matter most for ${organization?.name}'s PR strategy
4. Generate actionable PR recommendations based on THIS SPECIFIC DATA

CRITICAL RULES:
- The events list IS your news - don't look for articles elsewhere
- Every event represents something that happened in today's news
- If an event says "Google announced X" - that's from a real article today
- You MUST base your entire analysis on these events
- Do NOT add outside knowledge - if it's not in the events, it didn't happen today
- Reference specific events to show your analysis is grounded in today's monitoring

Remember: You're not gathering intelligence - you're SYNTHESIZING already-gathered, already-enriched intelligence.`,
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