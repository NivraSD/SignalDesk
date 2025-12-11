// Article Selector V5.1
// Hybrid approach: Embeddings find CANDIDATES, Claude scores BUSINESS RELEVANCE
//
// V5.0 was broken because:
// 1. Embedding context was garbage ("Target: X. Type: competitor.")
// 2. No quality filtering - garbage articles with numeric titles passed through
// 3. No business relevance scoring - just pattern matching
// 4. No source quality consideration
//
// V5.1 fixes:
// 1. Embeddings now have rich context (from batch-embed-targets v2)
// 2. Quality filter rejects garbage articles
// 3. Claude scores business relevance (like V4)
// 4. Source tiers: critical > high > other, with caps

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const DEFAULT_HOURS_BACK = 24;

// Built-in source quality tiers (fallback if company profile doesn't have them)
const TIER1_SOURCES = new Set([
  'reuters', 'bloomberg', 'financial times', 'wall street journal', 'wsj',
  'the information', 'cnbc', 'nikkei asia', 'the economist', 'ft'
]);

const ALWAYS_BLOCK_SOURCES = new Set([
  'pr newswire', 'globenewswire', 'businesswire', 'cision', 'accesswire',
  'prnewswire', 'einewswire', 'marketwatch press release'
]);

interface TargetMatch {
  target_id: string;
  target_name: string;
  target_type: string;
  priority: string;
  articles: Array<{
    id: string;
    title: string;
    description: string | null;
    url: string;
    source_name: string;
    published_at: string;
    similarity_score: number;
    signal_strength: string;
    signal_category: string;
  }>;
}

interface CrossTargetArticle {
  article_id: string;
  title: string;
  source_name: string;
  targets: Array<{
    target_id: string;
    target_name: string;
    similarity: number;
  }>;
}

// V4-compatible article format
interface V4Article {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source_name: string;
  published_at: string;
  relevance_score: number;  // Now Claude-scored, not just embedding similarity
  matched_targets: string[];
  signal_strength: string;
  signal_category: string;
  is_priority_source?: boolean;
  source_tier?: number;  // 1=critical, 2=high, 3=other
}

// Check if article is garbage (malformed scrape, no real content)
function isGarbageArticle(article: { title: string; description?: string | null }): boolean {
  const title = article.title || '';

  // Numeric-only titles (malformed sitemap extraction like "566046")
  if (/^\d+$/.test(title.trim())) return true;

  // Too short titles (less than 15 chars)
  if (title.trim().length < 15) return true;

  // HTML file extensions in title (scraper grabbed filename)
  if (/\.html?$/i.test(title.trim())) return true;

  // Just a URL slug
  if (/^[a-z0-9-]+$/.test(title.trim()) && title.includes('-') && !title.includes(' ')) return true;

  // Mostly non-alphabetic (likely garbled encoding)
  const alphaRatio = (title.match(/[a-zA-Z]/g) || []).length / title.length;
  if (alphaRatio < 0.5 && title.length > 10) return true;

  return false;
}

// Build intelligence context for Claude scoring (similar to V4)
function buildIntelligenceContext(profile: any, orgName: string, industry: string): string {
  const parts: string[] = [];
  parts.push(`COMPANY: ${orgName}`);
  parts.push(`INDUSTRY: ${industry}`);

  if (profile?.description) {
    parts.push(`\nABOUT: ${profile.description}`);
  }

  if (profile?.service_lines?.length) {
    parts.push(`\nSERVICE LINES: ${profile.service_lines.join(', ')}`);
  }

  if (profile?.competition) {
    const comp = profile.competition;
    if (comp.direct_competitors?.length) {
      parts.push(`\nDIRECT COMPETITORS: ${comp.direct_competitors.slice(0, 10).join(', ')}`);
    }
  }

  if (profile?.strategic_context?.strategic_priorities?.length) {
    parts.push(`\nSTRATEGIC PRIORITIES: ${profile.strategic_context.strategic_priorities.join(', ')}`);
  }

  if (profile?.intelligence_context?.key_questions?.length) {
    parts.push(`\nKEY QUESTIONS: ${profile.intelligence_context.key_questions.slice(0, 5).join('; ')}`);
  }

  return parts.join('\n');
}

// Use Claude to score article relevance (from V4)
async function scoreArticlesWithClaude(
  articles: Array<{ id: string; title: string; source: string; matched_targets: string[] }>,
  intelligenceContext: string,
  competitors: string[]
): Promise<Map<string, number>> {
  if (articles.length === 0) return new Map();

  const articleList = articles.map((a, i) =>
    `[${i}] ${a.source}: ${a.title}${a.matched_targets.length > 0 ? ` (matched: ${a.matched_targets.slice(0, 2).join(', ')})` : ''}`
  ).join('\n');

  const competitorList = competitors.length > 0 ? competitors.slice(0, 10).join(', ') : 'key competitors';

  const prompt = `You are scoring articles for BUSINESS RELEVANCE to a company.

${intelligenceContext}

SCORING (return ONE integer 0-100 per article):
90-100: CRITICAL - Mentions company/competitors by name: ${competitorList}
70-89: HIGH VALUE - Target customers, M&A, regulatory, industry-specific developments
50-69: RELEVANT - Industry news, market trends in company's sectors
30-49: BACKGROUND - Tangential relevance
0-29: NOT RELEVANT - Wrong industry, consumer news, unrelated tech

⚠️ ANTI-GARBAGE RULES:
- Generic "AI" news is NOT relevant unless it affects THIS company's industry
- Press releases score 20-30 points LOWER than equivalent journalism
- "Tech giant does X" is NOT relevant unless it directly affects this company

ARTICLES:
${articleList}

Return ONLY a JSON array of ${articles.length} integers, nothing else:`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      console.error(`Claude API error: ${response.status}`);
      return new Map();
    }

    const data = await response.json();
    const content = data.content[0].text.trim();

    // Extract JSON array
    const bracketStart = content.indexOf('[');
    const bracketEnd = content.lastIndexOf(']');
    if (bracketStart === -1 || bracketEnd === -1) return new Map();

    let jsonContent = content.substring(bracketStart, bracketEnd + 1);
    jsonContent = jsonContent.replace(/\/\/[^\n]*/g, '').replace(/,\s*\]/g, ']');

    const scores = JSON.parse(jsonContent);
    const scoreMap = new Map<string, number>();

    articles.forEach((article, i) => {
      scoreMap.set(article.id, scores[i] || 50);
    });

    return scoreMap;
  } catch (error) {
    console.error('Claude scoring error:', error);
    return new Map();
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id;
    const organizationName = body.organization_name;
    const hoursBack = body.hours_back || DEFAULT_HOURS_BACK;
    const minSignalStrength = body.min_signal_strength || 'weak';
    const maxArticlesPerTarget = body.max_articles_per_target || 50;
    const includeConnections = body.include_connections !== false;
    const skipClaudeScoring = body.skip_claude_scoring || false; // For debugging

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organization_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📰 ARTICLE SELECTOR V5.1 (Embeddings + Claude Scoring)');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Organization: ${organizationId}`);
    console.log(`   Hours back: ${hoursBack}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get organization with full profile
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, industry, company_profile')
      .eq('id', organizationId)
      .single();

    const orgName = organizationName || org?.name || 'Unknown';
    const industry = org?.industry || 'default';
    const companyProfile = org?.company_profile || {};

    // Build intelligence context for Claude scoring
    const intelligenceContext = buildIntelligenceContext(companyProfile, orgName, industry);
    const competitors = [
      ...(companyProfile.competition?.direct_competitors || []),
      ...(companyProfile.competition?.indirect_competitors || [])
    ];

    // Extract source priorities (case-insensitive)
    const sourcePriorities = companyProfile.monitoring_config?.source_priorities || {};
    const criticalSources = new Set<string>((sourcePriorities.critical || []).map((s: string) => s.toLowerCase()));
    const highPrioritySources = new Set<string>((sourcePriorities.high || []).map((s: string) => s.toLowerCase()));

    // Merge with built-in tier 1 sources
    TIER1_SOURCES.forEach(s => criticalSources.add(s));

    // Build blocked sources set
    const blockedSources = new Set<string>((sourcePriorities.blocked || []).map((s: string) => s.toLowerCase()));
    ALWAYS_BLOCK_SOURCES.forEach(s => blockedSources.add(s));

    console.log(`   Critical sources: ${criticalSources.size}, High: ${highPrioritySources.size}`);
    console.log(`   Blocked sources: ${blockedSources.size}`);

    const sinceTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    // Get intelligence targets
    const { data: targets, error: targetError } = await supabase
      .from('intelligence_targets')
      .select('id, name, target_type, priority')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (targetError) throw new Error(`Failed to fetch targets: ${targetError.message}`);

    const strengthFilter = minSignalStrength === 'strong' ? ['strong']
      : minSignalStrength === 'moderate' ? ['strong', 'moderate']
      : ['strong', 'moderate', 'weak'];

    // STEP 1: Fetch embedding matches (candidates)
    console.log('\n📊 STEP 1: Fetching embedding matches...');
    const articleMap = new Map<string, V4Article & { embedding_score: number }>();
    let totalMatches = 0;
    let filteredBlocked = 0;
    let filteredGarbage = 0;
    let filteredOld = 0;

    for (const target of targets || []) {
      const { data: matches } = await supabase
        .from('target_article_matches')
        .select(`
          similarity_score, signal_strength, signal_category,
          article:raw_articles(id, title, description, url, source_name, published_at, scraped_at)
        `)
        .eq('target_id', target.id)
        .gte('matched_at', sinceTime)
        .in('signal_strength', strengthFilter)
        .order('similarity_score', { ascending: false })
        .limit(maxArticlesPerTarget);

      if (!matches) continue;

      for (const m of matches) {
        if (!m.article) continue;
        const a = m.article as any;
        totalMatches++;

        // Filter 1: Blocked sources
        const srcLower = (a.source_name || '').toLowerCase();
        if (blockedSources.has(srcLower)) {
          filteredBlocked++;
          continue;
        }

        // Filter 2: Garbage articles
        if (isGarbageArticle({ title: a.title, description: a.description })) {
          filteredGarbage++;
          continue;
        }

        // Filter 3: Old articles
        const dateToCheck = a.published_at || a.scraped_at;
        if (dateToCheck) {
          try {
            if (new Date(dateToCheck) < new Date(sinceTime)) {
              filteredOld++;
              continue;
            }
          } catch { /* keep if date parsing fails */ }
        }

        // Determine source tier
        let sourceTier = 3;
        if (criticalSources.has(srcLower)) sourceTier = 1;
        else if (highPrioritySources.has(srcLower)) sourceTier = 2;

        const existing = articleMap.get(a.id);
        if (existing) {
          if (!existing.matched_targets.includes(target.name)) {
            existing.matched_targets.push(target.name);
          }
          if (m.similarity_score > existing.embedding_score) {
            existing.embedding_score = m.similarity_score;
          }
        } else {
          articleMap.set(a.id, {
            id: a.id,
            title: a.title,
            description: a.description,
            url: a.url,
            source_name: a.source_name,
            published_at: a.published_at || a.scraped_at,
            relevance_score: 0, // Will be set by Claude
            embedding_score: m.similarity_score,
            matched_targets: [target.name],
            signal_strength: m.signal_strength,
            signal_category: m.signal_category,
            is_priority_source: sourceTier <= 2,
            source_tier: sourceTier
          });
        }
      }
    }

    console.log(`   Total matches: ${totalMatches}`);
    console.log(`   Filtered blocked: ${filteredBlocked}`);
    console.log(`   Filtered garbage: ${filteredGarbage}`);
    console.log(`   Filtered old: ${filteredOld}`);
    console.log(`   Candidates remaining: ${articleMap.size}`);

    // STEP 2: Apply source caps BEFORE Claude scoring (to limit API calls)
    console.log('\n📊 STEP 2: Applying source tier caps...');
    const CAPS = { tier1: 20, tier2: 10, tier3: 5 }; // Per-source caps by tier
    const sourceCount: Record<string, number> = {};
    const cappedArticles: Array<V4Article & { embedding_score: number }> = [];

    // Sort by source tier first, then embedding score
    const sortedCandidates = Array.from(articleMap.values())
      .sort((a, b) => {
        if ((a.source_tier || 3) !== (b.source_tier || 3)) {
          return (a.source_tier || 3) - (b.source_tier || 3);
        }
        return b.embedding_score - a.embedding_score;
      });

    for (const article of sortedCandidates) {
      const src = article.source_name;
      const tier = article.source_tier || 3;
      const cap = tier === 1 ? CAPS.tier1 : tier === 2 ? CAPS.tier2 : CAPS.tier3;
      const count = sourceCount[src] || 0;

      if (count < cap) {
        sourceCount[src] = count + 1;
        cappedArticles.push(article);
      }
    }

    console.log(`   After source caps: ${cappedArticles.length} articles`);

    // STEP 3: Claude scoring for business relevance
    let v4Articles: V4Article[];

    if (skipClaudeScoring || cappedArticles.length === 0) {
      console.log('\n📊 STEP 3: Skipping Claude scoring (using embedding scores)');
      v4Articles = cappedArticles.map(a => ({
        ...a,
        relevance_score: Math.round(a.embedding_score * 100)
      }));
    } else {
      console.log(`\n📊 STEP 3: Claude scoring ${cappedArticles.length} articles...`);
      const BATCH_SIZE = 40;
      const allScores = new Map<string, number>();

      for (let i = 0; i < cappedArticles.length; i += BATCH_SIZE) {
        const batch = cappedArticles.slice(i, i + BATCH_SIZE).map(a => ({
          id: a.id,
          title: a.title,
          source: a.source_name,
          matched_targets: a.matched_targets
        }));

        const batchScores = await scoreArticlesWithClaude(batch, intelligenceContext, competitors);
        batchScores.forEach((score, id) => allScores.set(id, score));
        console.log(`   Scored batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(cappedArticles.length/BATCH_SIZE)}`);
      }

      // Apply Claude scores
      v4Articles = cappedArticles.map(a => ({
        ...a,
        relevance_score: allScores.get(a.id) || Math.round(a.embedding_score * 100)
      }));
    }

    // STEP 4: Final filtering with diversity constraint
    console.log('\n📊 STEP 4: Final filtering with diversity...');
    const MIN_RELEVANCE = 40; // Minimum Claude score to include
    const MAX_SOURCE_PERCENT = 0.25; // No single source > 25% of results
    const TARGET_TOTAL = 60; // Target number of articles

    // First filter by relevance and sort
    const relevantArticles = v4Articles
      .filter(a => a.relevance_score >= MIN_RELEVANCE)
      .sort((a, b) => {
        // Sort by relevance score first (best articles first)
        if (b.relevance_score !== a.relevance_score) {
          return b.relevance_score - a.relevance_score;
        }
        // Then by tier
        return (a.source_tier || 3) - (b.source_tier || 3);
      });

    // Apply diversity constraint: no single source > 25%
    const finalArticles: typeof relevantArticles = [];
    const diversitySourceCount: Record<string, number> = {};

    for (const article of relevantArticles) {
      const src = article.source_name;
      const currentCount = diversitySourceCount[src] || 0;
      const maxForSource = Math.ceil(TARGET_TOTAL * MAX_SOURCE_PERCENT);

      if (currentCount < maxForSource) {
        finalArticles.push(article);
        diversitySourceCount[src] = currentCount + 1;

        if (finalArticles.length >= 100) break; // Hard cap at 100
      }
    }

    console.log(`   After relevance filter: ${relevantArticles.length}`);
    console.log(`   After diversity constraint (max ${MAX_SOURCE_PERCENT * 100}% per source): ${finalArticles.length}`);

    // Build target matches for V5 format
    const targetMatches: TargetMatch[] = [];
    for (const target of targets || []) {
      const matchingArticles = finalArticles.filter(a => a.matched_targets.includes(target.name));
      if (matchingArticles.length > 0) {
        targetMatches.push({
          target_id: target.id,
          target_name: target.name,
          target_type: target.target_type,
          priority: target.priority,
          articles: matchingArticles.map(a => ({
            id: a.id,
            title: a.title,
            description: a.description,
            url: a.url,
            source_name: a.source_name,
            published_at: a.published_at,
            similarity_score: a.embedding_score,
            signal_strength: a.signal_strength,
            signal_category: a.signal_category
          }))
        });
      }
    }

    // Calculate source distribution
    const finalSourceDistribution: Record<string, number> = {};
    finalArticles.forEach(a => {
      finalSourceDistribution[a.source_name] = (finalSourceDistribution[a.source_name] || 0) + 1;
    });

    // Get cross-target connections
    let connections: CrossTargetArticle[] = [];
    if (includeConnections) {
      const { data: crossMatches, error: crossError } = await supabase.rpc(
        'find_cross_target_articles',
        { org_id: organizationId, min_targets: 2, since_time: sinceTime }
      );
      if (!crossError && crossMatches) {
        connections = crossMatches.map((c: any) => ({
          article_id: c.article_id,
          title: c.title,
          source_name: c.source_name,
          targets: c.targets
        }));
      }
    }

    const duration = Date.now() - startTime;
    const prioritySourceCount = finalArticles.filter(a => a.is_priority_source).length;

    console.log('\n📊 FINAL RESULTS:');
    console.log(`   Total matches found: ${totalMatches}`);
    console.log(`   After quality filters: ${articleMap.size}`);
    console.log(`   After source caps: ${cappedArticles.length}`);
    console.log(`   After Claude scoring: ${finalArticles.length}`);
    console.log(`   From priority sources: ${prioritySourceCount}`);
    console.log(`   Duration: ${duration}ms`);

    // Remove embedding_score from output (internal only)
    const outputArticles = finalArticles.map(({ embedding_score, ...rest }) => rest);

    return new Response(JSON.stringify({
      success: true,
      organization_id: organizationId,
      organization_name: orgName,
      industry,
      total_articles: outputArticles.length,
      articles: outputArticles,
      sources: Object.keys(finalSourceDistribution),
      source_distribution: finalSourceDistribution,
      selected_at: new Date().toISOString(),
      duration_seconds: Math.round(duration / 1000),
      selection_method: 'v5.1_embeddings_plus_claude',

      time_range: { hours_back: hoursBack, since: sinceTime },
      summary: {
        targets_with_signals: targetMatches.length,
        total_targets: targets?.length || 0,
        total_matches: totalMatches,
        filtered_blocked: filteredBlocked,
        filtered_garbage: filteredGarbage,
        filtered_old: filteredOld,
        after_quality_filter: articleMap.size,
        after_source_caps: cappedArticles.length,
        final_articles: outputArticles.length,
        from_priority_sources: prioritySourceCount
      },
      target_signals: targetMatches,
      connections,
      duration_ms: duration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
