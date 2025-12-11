// Extract Target Facts
// Extracts structured intelligence facts from matched articles
// Updates accumulated_context on intelligence_targets for pattern detection

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

// Configuration
const MAX_MATCHES_PER_RUN = 50;  // Process up to 50 matches per run
const MAX_ARTICLES_PER_BATCH = 10;  // Batch this many articles per Claude call
const MIN_SIMILARITY_FOR_EXTRACTION = 0.40;  // Only extract from strong matches

interface Match {
  id: string;
  organization_id: string;
  target_id: string;
  article_id: string;
  similarity_score: number;
  intelligence_targets: {
    id: string;
    name: string;
    target_type: string;
    priority: string;
    monitoring_context: string | null;
    accumulated_context: Record<string, any> | null;
  };
  raw_articles: {
    id: string;
    title: string;
    description: string | null;
    full_content: string | null;
    source_name: string;
    published_at: string | null;
  };
}

interface ExtractedFact {
  article_index: number;
  fact_type: string;
  fact_summary: string;
  entities_mentioned: string[];
  relationships: { entity: string; type: string; confidence: number }[];
  sentiment_score: number;
  confidence_score: number;
  significance_score: number;
  geographic_region?: string;
  industry_sector?: string;
}

interface AccumulatedContext {
  total_facts: number;
  facts_last_7d: number;
  facts_last_30d: number;
  last_fact_at: string | null;
  fact_type_distribution: Record<string, number>;
  sentiment: {
    current: number;
    trend: 'improving' | 'declining' | 'stable';
    history: { period: string; score: number }[];
  };
  geographic_activity: Record<string, {
    fact_count: number;
    recent_facts: number;
    dominant_type: string;
  }>;
  relationship_map: Record<string, {
    relationship_types: string[];
    mention_count: number;
    last_mentioned: string;
    sentiment_avg: number;
  }>;
  topic_clusters: Record<string, number>;
  recent_highlights: {
    date: string;
    summary: string;
    type: string;
    significance: number;
  }[];
  insights: {
    primary_activity: string;
    activity_level: 'high' | 'medium' | 'low';
    notable_shift: string | null;
    risk_indicators: string[];
  };
  last_analyzed_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🔍 EXTRACT TARGET FACTS');
  console.log(`   Time: ${new Date().toISOString()}`);

  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id;  // Optional: filter to specific org
    const maxMatches = body.max_matches || MAX_MATCHES_PER_RUN;

    // Get unprocessed matches with good similarity
    let query = supabase
      .from('target_article_matches')
      .select(`
        id,
        organization_id,
        target_id,
        article_id,
        similarity_score,
        intelligence_targets(id, name, target_type, priority, monitoring_context, accumulated_context),
        raw_articles(id, title, description, full_content, source_name, published_at)
      `)
      .or('facts_extracted.is.null,facts_extracted.eq.false')
      .gte('similarity_score', MIN_SIMILARITY_FOR_EXTRACTION)
      .order('similarity_score', { ascending: false })
      .limit(maxMatches);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: matches, error: matchError } = await query;

    if (matchError) {
      throw new Error(`Failed to load matches: ${matchError.message}`);
    }

    if (!matches || matches.length === 0) {
      console.log('   No unprocessed matches found');
      return new Response(JSON.stringify({
        success: true,
        matches_processed: 0,
        facts_extracted: 0,
        message: 'No matches to process'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Found ${matches.length} unprocessed matches`);

    // Group matches by target for efficient batching
    const matchesByTarget = new Map<string, Match[]>();
    for (const match of matches as Match[]) {
      const targetId = match.target_id;
      if (!matchesByTarget.has(targetId)) {
        matchesByTarget.set(targetId, []);
      }
      matchesByTarget.get(targetId)!.push(match);
    }

    console.log(`   Grouped into ${matchesByTarget.size} targets`);

    let totalFactsExtracted = 0;
    let matchesProcessed = 0;
    const errors: string[] = [];

    // Process each target's matches
    for (const [targetId, targetMatches] of matchesByTarget) {
      const target = targetMatches[0].intelligence_targets;
      const orgId = targetMatches[0].organization_id;

      console.log(`\n   Processing target: ${target.name} (${targetMatches.length} matches)`);

      // Get org context
      const { data: org } = await supabase
        .from('organizations')
        .select('name, industry, company_profile')
        .eq('id', orgId)
        .single();

      const orgContext = org
        ? `Organization: ${org.name}\nIndustry: ${org.industry || 'N/A'}`
        : '';

      // Process in batches
      for (let i = 0; i < targetMatches.length; i += MAX_ARTICLES_PER_BATCH) {
        const batch = targetMatches.slice(i, i + MAX_ARTICLES_PER_BATCH);
        const articles = batch.map(m => m.raw_articles);

        try {
          // Extract facts via Claude
          const facts = await extractFactsWithClaude(target, articles, orgContext);

          console.log(`     Batch ${Math.floor(i / MAX_ARTICLES_PER_BATCH) + 1}: ${facts.length} facts extracted`);

          // Save facts to database
          for (const fact of facts) {
            const articleMatch = batch[fact.article_index - 1];
            if (!articleMatch) continue;

            const { error: insertError } = await supabase
              .from('target_intelligence_facts')
              .upsert({
                organization_id: orgId,
                target_id: targetId,
                article_id: articleMatch.article_id,
                match_id: articleMatch.id,
                fact_type: fact.fact_type,
                fact_summary: fact.fact_summary,
                entities_mentioned: fact.entities_mentioned,
                relationships_detected: fact.relationships,
                sentiment_score: fact.sentiment_score,
                confidence_score: fact.confidence_score,
                significance_score: fact.significance_score,
                geographic_region: fact.geographic_region || null,
                industry_sector: fact.industry_sector || null,
                article_title: articleMatch.raw_articles.title,
                article_source: articleMatch.raw_articles.source_name,
                article_published_at: articleMatch.raw_articles.published_at,
                extraction_model: 'claude-sonnet-4'
              }, {
                onConflict: 'target_id,article_id'
              });

            if (insertError) {
              console.error(`     Failed to save fact: ${insertError.message}`);
              errors.push(`Fact save error: ${insertError.message}`);
            } else {
              totalFactsExtracted++;
            }
          }

          // Mark matches as processed
          const matchIds = batch.map(m => m.id);
          await supabase
            .from('target_article_matches')
            .update({
              facts_extracted: true,
              facts_extracted_at: new Date().toISOString()
            })
            .in('id', matchIds);

          matchesProcessed += batch.length;

          // Update accumulated context
          if (facts.length > 0) {
            try {
              await updateAccumulatedContext(supabase, targetId, facts);
              console.log(`     Updated accumulated_context for ${target.name}`);
            } catch (ctxError: any) {
              console.error(`     Context update error: ${ctxError.message}`);
              console.error(`     Stack: ${ctxError.stack}`);
              // Don't fail the whole batch for context update errors
            }
          }

        } catch (batchError: any) {
          console.error(`     Batch error: ${batchError.message}`);
          console.error(`     Stack: ${batchError.stack}`);
          errors.push(`Batch error for ${target.name}: ${batchError.message}`);
        }
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    const summary = {
      success: true,
      matches_processed: matchesProcessed,
      facts_extracted: totalFactsExtracted,
      targets_processed: matchesByTarget.size,
      duration_seconds: duration,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`\n📊 Extraction Complete:`);
    console.log(`   Matches processed: ${matchesProcessed}`);
    console.log(`   Facts extracted: ${totalFactsExtracted}`);
    console.log(`   Duration: ${duration}s`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Extract facts error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function extractFactsWithClaude(
  target: Match['intelligence_targets'],
  articles: Match['raw_articles'][],
  orgContext: string
): Promise<ExtractedFact[]> {

  const prompt = `You are an intelligence analyst building a dossier on "${target.name}" (${target.target_type}).

ORGANIZATION CONTEXT:
${orgContext}

TARGET PROFILE:
Name: ${target.name}
Type: ${target.target_type}
Priority: ${target.priority}
Context: ${target.monitoring_context || 'N/A'}

ARTICLES TO ANALYZE:
${articles.map((a, i) => `
[${i + 1}] "${a.title}" (${a.source_name}, ${a.published_at?.split('T')[0] || 'recent'})
${a.description || ''}
${a.full_content ? a.full_content.substring(0, 800) + '...' : ''}
`).join('\n---\n')}

TASK: Extract intelligence facts about ${target.name} from these articles.

For EACH article that contains relevant information about ${target.name}, extract:
1. fact_type: One of [expansion, contraction, partnership, acquisition, product_launch, leadership_change, financial, legal_regulatory, crisis, strategy, hiring, technology, market_position, other]
2. fact_summary: One specific sentence describing what happened (include names, numbers, locations)
3. entities_mentioned: Other companies, people, or places involved
4. relationships: Relationships revealed (e.g., [{"entity": "Company X", "type": "partner", "confidence": 0.8}])
   - relationship types: partner, competitor, supplier, customer, investor, acquirer, target, regulator
5. sentiment_score: -1.0 (very negative for ${target.name}) to 1.0 (very positive)
6. confidence_score: 0-1, how confident you are this fact is accurate
7. significance_score: 0-100, how important is this for tracking ${target.name}
8. geographic_region: If applicable (Asia Pacific, Europe, North America, Latin America, Middle East, Africa)
9. industry_sector: Primary sector (Energy, Mining, Finance, Technology, Healthcare, Manufacturing, Retail, etc.)

RULES:
- Only extract facts DIRECTLY about or significantly involving ${target.name}
- If ${target.name} is only mentioned in passing with no substantive information, skip that article
- Be specific in summaries - include actual names, numbers, dates, locations when available
- Relationships should only include clearly stated or strongly implied connections
- Return an empty array if no articles contain relevant facts

Return JSON array:
[
  {
    "article_index": 1,
    "fact_type": "expansion",
    "fact_summary": "${target.name} announced plans to invest $2B in Chilean copper operations by 2026",
    "entities_mentioned": ["Chile", "Copper"],
    "relationships": [{"entity": "Codelco", "type": "potential_partner", "confidence": 0.6}],
    "sentiment_score": 0.7,
    "confidence_score": 0.9,
    "significance_score": 85,
    "geographic_region": "Latin America",
    "industry_sector": "Mining"
  }
]

Return ONLY the JSON array.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('     No facts found in response');
      return [];
    }

    const facts: ExtractedFact[] = JSON.parse(jsonMatch[0]);

    // Validate and clean facts
    return facts.filter(f => {
      // Validate required fields
      if (!f.fact_type || !f.fact_summary || typeof f.article_index !== 'number') {
        return false;
      }
      // Validate article_index is in range
      if (f.article_index < 1 || f.article_index > articles.length) {
        return false;
      }
      return true;
    }).map(f => ({
      ...f,
      // Ensure arrays
      entities_mentioned: Array.isArray(f.entities_mentioned) ? f.entities_mentioned : [],
      relationships: Array.isArray(f.relationships) ? f.relationships : [],
      // Clamp scores
      sentiment_score: Math.max(-1, Math.min(1, f.sentiment_score || 0)),
      confidence_score: Math.max(0, Math.min(1, f.confidence_score || 0.5)),
      significance_score: Math.max(0, Math.min(100, f.significance_score || 50))
    }));

  } catch (error: any) {
    console.error(`     Claude extraction error: ${error.message}`);
    return [];
  }
}

async function updateAccumulatedContext(
  supabase: ReturnType<typeof createClient>,
  targetId: string,
  newFacts: ExtractedFact[]
): Promise<void> {

  // Get current accumulated context
  const { data: target } = await supabase
    .from('intelligence_targets')
    .select('accumulated_context')
    .eq('id', targetId)
    .single();

  // Initialize or get existing context (with defensive merging)
  const defaultCtx: AccumulatedContext = {
    total_facts: 0,
    facts_last_7d: 0,
    facts_last_30d: 0,
    last_fact_at: null,
    fact_type_distribution: {},
    sentiment: {
      current: 0,
      trend: 'stable',
      history: []
    },
    geographic_activity: {},
    relationship_map: {},
    topic_clusters: {},
    recent_highlights: [],
    insights: {
      primary_activity: 'Unknown',
      activity_level: 'low',
      notable_shift: null,
      risk_indicators: []
    },
    last_analyzed_at: new Date().toISOString()
  };

  // Deep merge existing context with defaults to ensure all fields exist
  const existing = target?.accumulated_context || {};

  // Defensive: ensure nested objects exist and have correct types
  const existingSentiment = existing.sentiment && typeof existing.sentiment === 'object' ? existing.sentiment : {};
  const existingInsights = existing.insights && typeof existing.insights === 'object' ? existing.insights : {};

  const ctx: AccumulatedContext = {
    ...defaultCtx,
    ...existing,
    sentiment: {
      ...defaultCtx.sentiment,
      ...existingSentiment,
      // Ensure history is always an array
      history: Array.isArray(existingSentiment.history) ? existingSentiment.history : []
    },
    insights: {
      ...defaultCtx.insights,
      ...existingInsights,
      // Ensure risk_indicators is always an array
      risk_indicators: Array.isArray(existingInsights.risk_indicators) ? existingInsights.risk_indicators : []
    },
    fact_type_distribution: existing.fact_type_distribution && typeof existing.fact_type_distribution === 'object' ? existing.fact_type_distribution : {},
    geographic_activity: existing.geographic_activity && typeof existing.geographic_activity === 'object' ? existing.geographic_activity : {},
    relationship_map: existing.relationship_map && typeof existing.relationship_map === 'object' ? existing.relationship_map : {},
    topic_clusters: existing.topic_clusters && typeof existing.topic_clusters === 'object' ? existing.topic_clusters : {},
    recent_highlights: Array.isArray(existing.recent_highlights) ? existing.recent_highlights : []
  };

  // Update metrics
  ctx.total_facts += newFacts.length;
  ctx.facts_last_7d += newFacts.length;  // Will be recalculated on analysis
  ctx.facts_last_30d += newFacts.length;
  ctx.last_fact_at = new Date().toISOString();

  // Update fact type distribution
  for (const fact of newFacts) {
    ctx.fact_type_distribution[fact.fact_type] =
      (ctx.fact_type_distribution[fact.fact_type] || 0) + 1;

    // Update geographic activity
    if (fact.geographic_region) {
      if (!ctx.geographic_activity[fact.geographic_region]) {
        ctx.geographic_activity[fact.geographic_region] = {
          fact_count: 0,
          recent_facts: 0,
          dominant_type: fact.fact_type
        };
      }
      ctx.geographic_activity[fact.geographic_region].fact_count++;
      ctx.geographic_activity[fact.geographic_region].recent_facts++;
    }

    // Update relationship map
    for (const rel of fact.relationships || []) {
      if (!ctx.relationship_map[rel.entity]) {
        ctx.relationship_map[rel.entity] = {
          relationship_types: [],
          mention_count: 0,
          last_mentioned: '',
          sentiment_avg: 0
        };
      }
      const entityMap = ctx.relationship_map[rel.entity];
      entityMap.mention_count++;
      entityMap.last_mentioned = new Date().toISOString();
      if (!entityMap.relationship_types.includes(rel.type)) {
        entityMap.relationship_types.push(rel.type);
      }
    }

    // Update topic clusters (entities)
    for (const entity of fact.entities_mentioned || []) {
      ctx.topic_clusters[entity] = (ctx.topic_clusters[entity] || 0) + 1;
    }
  }

  // Update sentiment
  const avgSentiment = newFacts.reduce((sum, f) => sum + (f.sentiment_score || 0), 0) / newFacts.length;
  const today = new Date().toISOString().split('T')[0];

  // Add or update today's sentiment
  const existingToday = ctx.sentiment.history.find(h => h.period === today);
  if (existingToday) {
    existingToday.score = (existingToday.score + avgSentiment) / 2;
  } else {
    ctx.sentiment.history.push({ period: today, score: avgSentiment });
  }

  // Keep only last 90 days of history
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  ctx.sentiment.history = ctx.sentiment.history.filter(h => h.period >= cutoff);

  // Update current sentiment (rolling average of last 7 days)
  const recentSentiment = ctx.sentiment.history.slice(-7);
  ctx.sentiment.current = recentSentiment.length > 0
    ? recentSentiment.reduce((sum, h) => sum + h.score, 0) / recentSentiment.length
    : 0;

  // Determine trend
  if (ctx.sentiment.history.length >= 3) {
    const recent = ctx.sentiment.history.slice(-3).reduce((sum, h) => sum + h.score, 0) / 3;
    const older = ctx.sentiment.history.slice(-6, -3);
    const olderAvg = older.length > 0
      ? older.reduce((sum, h) => sum + h.score, 0) / older.length
      : recent;

    if (recent > olderAvg + 0.1) {
      ctx.sentiment.trend = 'improving';
    } else if (recent < olderAvg - 0.1) {
      ctx.sentiment.trend = 'declining';
    } else {
      ctx.sentiment.trend = 'stable';
    }
  }

  // Update recent highlights (keep top 5 by significance)
  const newHighlights = newFacts
    .filter(f => f.significance_score >= 70)
    .map(f => ({
      date: new Date().toISOString(),
      summary: f.fact_summary,
      type: f.fact_type,
      significance: f.significance_score
    }));

  ctx.recent_highlights = [...newHighlights, ...ctx.recent_highlights]
    .sort((a, b) => b.significance - a.significance)
    .slice(0, 5);

  // Update insights
  const factTypes = Object.entries(ctx.fact_type_distribution);
  if (factTypes.length > 0) {
    factTypes.sort((a, b) => b[1] - a[1]);
    ctx.insights.primary_activity = factTypes[0][0];
  }

  ctx.insights.activity_level = ctx.total_facts > 20 ? 'high' : ctx.total_facts > 5 ? 'medium' : 'low';

  // Check for risk indicators
  ctx.insights.risk_indicators = [];
  if (ctx.fact_type_distribution['crisis'] > 0) {
    ctx.insights.risk_indicators.push('Crisis events detected');
  }
  if (ctx.fact_type_distribution['legal_regulatory'] > 2) {
    ctx.insights.risk_indicators.push('Multiple regulatory events');
  }
  if (ctx.sentiment.current < -0.3) {
    ctx.insights.risk_indicators.push('Negative sentiment trend');
  }

  ctx.last_analyzed_at = new Date().toISOString();

  // Save updated context
  await supabase
    .from('intelligence_targets')
    .update({
      accumulated_context: ctx,
      updated_at: new Date().toISOString()
    })
    .eq('id', targetId);
}
