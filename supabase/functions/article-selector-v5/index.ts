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
  'prnewswire', 'einewswire', 'marketwatch press release',
  'bcg',  // BCG scraper grabs old archive articles with wrong dates
  'the financial brand',  // RSS feed returns category pages with fake future dates (2026)
  'finextra',  // Low quality fintech spam
  'pitchbook',  // Paywalled/low value
  'ai news'  // Low quality AI aggregator
]);

// Industry-specific source relevance (Stage 2 filtering)
// Maps org industries to sources that are directly relevant
const INDUSTRY_SOURCES: Record<string, Set<string>> = {
  'marketing': new Set(['adweek', 'prweek', 'pr daily', 'digiday', 'campaign', 'ad age', 'marketing week', 'the drum', 'mediapost', 'adexchanger', 'marketing dive', 'modern retail']),
  'advertising': new Set(['adweek', 'prweek', 'campaign', 'ad age', 'the drum', 'mediapost', 'adexchanger', 'digiday']),
  'integrated marketing': new Set(['adweek', 'prweek', 'pr daily', 'digiday', 'campaign', 'ad age', 'marketing week', 'the drum', 'mediapost', 'adexchanger', 'marketing dive', 'modern retail', 'provoke media', "o'dwyer's"]),
  'finance': new Set(['bloomberg', 'reuters', 'financial times', 'wall street journal', 'wsj', 'barrons', 'seeking alpha', 'the information']),
  'technology': new Set(['techcrunch', 'the verge', 'wired', 'ars technica', 'venturebeat', 'the information', 'mit technology review']),
  'healthcare': new Set(['stat news', 'fierce healthcare', 'modern healthcare', 'medcity news', 'healthcare dive', 'biopharma dive']),
  'retail': new Set(['retail dive', 'modern retail', 'chain store age', 'grocery dive', 'wwd', 'business of fashion']),
  'energy': new Set(['utility dive', 'recharge news', 'greentech media', 'cleantechnica']),
};

// Irrelevant source categories for specific industries
// Articles from these sources should be heavily penalized for these industries
const IRRELEVANT_SOURCES: Record<string, Set<string>> = {
  'marketing': new Set(['csis', 'brookings institution', 'pew research', 'fcc', 'federal reserve', 'sec', 'ftc']),
  'advertising': new Set(['csis', 'brookings institution', 'pew research', 'fcc', 'federal reserve', 'sec', 'ftc']),
  'integrated marketing': new Set(['csis', 'brookings institution', 'pew research', 'fcc', 'federal reserve', 'sec', 'ftc']),
};

function isIndustryRelevantSource(sourceName: string, industry: string): boolean {
  const industryLower = industry.toLowerCase();
  const sourceNameLower = sourceName.toLowerCase();

  const relevantSources = INDUSTRY_SOURCES[industryLower];
  if (relevantSources) {
    for (const src of relevantSources) {
      if (sourceNameLower.includes(src)) return true;
    }
  }
  return false;
}

function isIndustryIrrelevantSource(sourceName: string, industry: string): boolean {
  const industryLower = industry.toLowerCase();
  const sourceNameLower = sourceName.toLowerCase();

  const irrelevantSources = IRRELEVANT_SOURCES[industryLower];
  if (irrelevantSources) {
    for (const src of irrelevantSources) {
      if (sourceNameLower.includes(src)) return true;
    }
  }
  return false;
}

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
  relevance_score: number;  // Claude-scored for RANKING (not filtering)
  matched_targets: string[];
  signal_strength: string;
  signal_category: string;
  is_priority_source?: boolean;
  source_tier?: number;  // 1=critical, 2=high, 3=other
  priority_tier?: 'high' | 'medium' | 'low';  // For enrichment/synthesis prioritization
}

// Check if article is garbage (malformed scrape, no real content)
function isGarbageArticle(article: { title: string; description?: string | null }): boolean {
  const title = article.title || '';
  const titleLower = title.toLowerCase().trim();

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

  // Navigation/category elements scraped as titles
  const GARBAGE_PATTERNS = [
    'most popular', 'most read', 'trending', 'top stories',
    'feed', 'rss', 'newsletter', 'subscribe',
    'banking technology', 'gen z banking', 'digital banking',
    'latest news', 'breaking news', 'related articles',
    'read more', 'see more', 'view all', 'load more',
    'advertisement', 'sponsored', 'promoted'
  ];
  if (GARBAGE_PATTERNS.some(p => titleLower === p || titleLower === p + 's')) return true;

  // Very generic 1-2 word titles that are likely navigation
  const words = titleLower.split(/\s+/).filter(w => w.length > 0);
  if (words.length <= 2 && !titleLower.includes(':') && !titleLower.includes('-')) {
    // 1-2 word titles without punctuation are usually garbage
    // Exception: proper nouns or specific terms
    const genericWords = ['news', 'feed', 'home', 'about', 'contact', 'popular', 'trending', 'latest', 'more'];
    if (words.some(w => genericWords.includes(w))) return true;
  }

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

  const prompt = `You are scoring articles for DIRECT BUSINESS RELEVANCE to a specific company. Be STRICT.

${intelligenceContext}

SCORING (return ONE integer 0-100 per article):
90-100: CRITICAL - Directly mentions this company or competitors BY NAME: ${competitorList}
70-89: HIGH VALUE - Directly about this company's specific industry, clients, or services
50-69: RELEVANT - News about this company's actual market/sector with clear business implications
30-49: WEAK - Tangentially related, might be interesting but not actionable
0-29: NOT RELEVANT - Different industry, wrong sector, no business connection

⚠️ STRICT FILTERING RULES - Score 20 or LOWER for:
- Think tank articles about geopolitics, national security, or government policy (unless directly about advertising/marketing regulation)
- Generic "AI" articles about chips, semiconductors, or global tech competition (NOT relevant to marketing agencies)
- Media company M&A (like Paramount, Warner Bros) unless it directly involves advertising agencies
- Political news, international relations, defense articles
- Articles where the company's industry is NOT the central focus
- Press releases (score 20-30 points LOWER than equivalent journalism)

The article must be DIRECTLY relevant to ${intelligenceContext.split('\n')[0]} - not just tangentially related to a keyword.

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

    // Extract JSON array - find the FIRST complete array by matching brackets
    const bracketStart = content.indexOf('[');
    if (bracketStart === -1) {
      console.error('No JSON array found in response:', content.substring(0, 200));
      return new Map();
    }

    // Find matching closing bracket (not just the last one)
    let depth = 0;
    let bracketEnd = -1;
    for (let i = bracketStart; i < content.length; i++) {
      if (content[i] === '[') depth++;
      else if (content[i] === ']') {
        depth--;
        if (depth === 0) {
          bracketEnd = i;
          break;
        }
      }
    }

    if (bracketEnd === -1) {
      console.error('No matching closing bracket found:', content.substring(0, 200));
      return new Map();
    }

    let jsonContent = content.substring(bracketStart, bracketEnd + 1);

    // Clean up common issues:
    // 1. Remove // comments
    jsonContent = jsonContent.replace(/\/\/[^\n]*/g, '');
    // 2. Remove /* */ comments
    jsonContent = jsonContent.replace(/\/\*[\s\S]*?\*\//g, '');
    // 3. Remove newlines and extra whitespace inside array
    jsonContent = jsonContent.replace(/\s+/g, ' ');
    // 4. Fix trailing commas
    jsonContent = jsonContent.replace(/,\s*\]/g, ']');
    // 5. Fix multiple commas
    jsonContent = jsonContent.replace(/,\s*,/g, ',');
    // 6. Ensure it's just numbers and commas (keep only valid JSON array chars)
    jsonContent = jsonContent.replace(/[^\[\]0-9,\s]/g, '');

    console.log(`Claude score response (cleaned): ${jsonContent.substring(0, 100)}...`);

    let scores: number[];
    try {
      scores = JSON.parse(jsonContent);
    } catch (parseError) {
      // Fallback: try to extract numbers directly
      console.error('JSON parse failed, extracting numbers directly:', parseError);
      const numberMatches = jsonContent.match(/\d+/g);
      if (numberMatches && numberMatches.length === articles.length) {
        scores = numberMatches.map(n => parseInt(n, 10));
        console.log(`Extracted ${scores.length} scores via regex fallback`);
      } else {
        console.error(`Number count mismatch: found ${numberMatches?.length || 0}, expected ${articles.length}`);
        return new Map();
      }
    }
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
    const useToday = body.use_today || false; // If true, use midnight UTC today instead of hours_back
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

    // Calculate sinceTime: either midnight UTC today or rolling hours_back
    let sinceTime: string;
    if (useToday) {
      // Get midnight UTC today
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      sinceTime = today.toISOString();
      console.log(`   Using TODAY mode: since ${sinceTime}`);
    } else {
      sinceTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    }

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
    let filteredIndustryIrrelevant = 0;
    let filteredOld = 0;

    for (const target of targets || []) {
      const { data: matches } = await supabase
        .from('target_article_matches')
        .select(`
          similarity_score, signal_strength, signal_category,
          article:raw_articles(id, title, description, url, source_name, published_at, created_at)
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

        // Filter 3: Old articles - Two-tier date filtering
        // - If published_at exists: use STRICT 2-day window (user wants recent articles)
        // - If published_at is NULL: require published_at for certain sources known
        //   to scrape old articles (BoF, etc.), otherwise use created_at fallback
        // NOTE: 2-day window still let in stale articles - tightened to 1 day
        const MAX_PUBLISHED_AGE_DAYS = 1;  // STRICT: Only articles from last 24 hours
        const MAX_CREATED_AGE_HOURS = 24;  // 1-day window for created_at fallback

        // Sources that often scrape old articles without extracting dates - REQUIRE published_at
        const REQUIRE_PUBLISHED_AT = ['business of fashion', 'bof'];
        const requiresDate = REQUIRE_PUBLISHED_AT.some(s => srcLower.includes(s));

        if (a.published_at) {
          // Has published_at - use generous window
          const maxAgeMs = MAX_PUBLISHED_AGE_DAYS * 24 * 60 * 60 * 1000;
          const maxAgeDate = new Date(Date.now() - maxAgeMs);
          const now = new Date();
          try {
            const articleDate = new Date(a.published_at);
            // Filter out FUTURE dates (bad date extraction) - allow 1 day tolerance
            const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            if (articleDate > oneDayFromNow) {
              filteredOld++;
              continue;
            }
            if (articleDate < maxAgeDate) {
              filteredOld++;
              continue;
            }
          } catch {
            // Date parsing failed - skip to be safe
            filteredOld++;
            continue;
          }
        } else if (requiresDate) {
          // Source requires published_at but doesn't have it - skip
          // (e.g., Business of Fashion often scrapes old articles without dates)
          filteredOld++;
          continue;
        } else if (a.created_at) {
          // No published_at - use STRICT window on created_at
          const maxAgeMs = MAX_CREATED_AGE_HOURS * 60 * 60 * 1000;
          const maxAgeDate = new Date(Date.now() - maxAgeMs);
          try {
            const createdDate = new Date(a.created_at);
            if (createdDate < maxAgeDate) {
              filteredOld++;
              continue;
            }
          } catch {
            filteredOld++;
            continue;
          }
        } else {
          // No date at all - skip
          filteredOld++;
          continue;
        }

        // Filter 4 (Stage 2): Industry-irrelevant sources
        // Skip think tanks, policy orgs for marketing/advertising companies
        if (isIndustryIrrelevantSource(a.source_name, industry)) {
          filteredIndustryIrrelevant++;
          continue;
        }

        // Determine source tier
        let sourceTier = 3;
        if (criticalSources.has(srcLower)) sourceTier = 1;
        else if (highPrioritySources.has(srcLower)) sourceTier = 2;
        // Boost industry-relevant sources (e.g., AdWeek for marketing orgs)
        else if (isIndustryRelevantSource(a.source_name, industry)) sourceTier = 2;

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
            published_at: a.published_at || a.created_at,
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
    console.log(`   Filtered industry-irrelevant: ${filteredIndustryIrrelevant}`);
    console.log(`   Candidates remaining: ${articleMap.size}`);

    // STEP 1.5: DISABLED - Direct Tier 1 injection was causing Bloomberg dominance
    // The embedding matches already provide good source diversity when targets are
    // properly set up. Injecting unmatched Tier 1 articles dilutes the signal.
    // If an org wants more Bloomberg coverage, they should add it as a target.
    console.log('\n📊 STEP 1.5: Skipped (Direct Tier 1 injection disabled)');
    console.log(`   Total candidates: ${articleMap.size}`);

    // STEP 2: Apply source caps BEFORE Claude scoring (to limit API calls)
    // NOTE: These caps were too restrictive (5 per tier3 source was killing article counts)
    // Increased significantly to let more articles through - diversity constraint later handles balance
    console.log('\n📊 STEP 2: Applying source tier caps...');
    const CAPS = { tier1: 50, tier2: 30, tier3: 20 }; // Per-source caps by tier (relaxed)
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

    // STEP 4: Ranking with diversity constraint (NO relevance filtering - Claude is for ranking, not gating)
    console.log('\n📊 STEP 4: Ranking with diversity...');
    // Claude relevance score is now used for RANKING and ENRICHMENT PRIORITY, not filtering
    // Stage 1 (embedding thresholds) + Stage 2 (source filtering) handle relevance filtering
    const MAX_SOURCE_PERCENT = 0.30; // No single source > 30% of results
    const TARGET_TOTAL = 150; // Target number of articles (increased from 60)

    // Add priority_tier based on Claude score (for enrichment/synthesis prioritization)
    const rankedArticles = v4Articles
      .map(a => ({
        ...a,
        priority_tier: a.relevance_score >= 70 ? 'high' : a.relevance_score >= 50 ? 'medium' : 'low'
      }))
      .sort((a, b) => {
        // Sort by relevance score first (best articles first)
        if (b.relevance_score !== a.relevance_score) {
          return b.relevance_score - a.relevance_score;
        }
        // Then by tier
        return (a.source_tier || 3) - (b.source_tier || 3);
      });

    const relevantArticles = rankedArticles;

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

        if (finalArticles.length >= 200) break; // Hard cap at 200 (increased from 100)
      }
    }

    const highPriority = finalArticles.filter(a => a.priority_tier === 'high').length;
    const mediumPriority = finalArticles.filter(a => a.priority_tier === 'medium').length;
    const lowPriority = finalArticles.filter(a => a.priority_tier === 'low').length;
    console.log(`   Total ranked: ${rankedArticles.length}`);
    console.log(`   After diversity constraint (max ${MAX_SOURCE_PERCENT * 100}% per source): ${finalArticles.length}`);
    console.log(`   Priority tiers: ${highPriority} high, ${mediumPriority} medium, ${lowPriority} low`);

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

      time_range: { hours_back: useToday ? null : hoursBack, use_today: useToday, since: sinceTime },
      summary: {
        targets_with_signals: targetMatches.length,
        total_targets: targets?.length || 0,
        total_matches: totalMatches,
        filtered_blocked: filteredBlocked,
        filtered_garbage: filteredGarbage,
        filtered_old: filteredOld,
        filtered_industry_irrelevant: filteredIndustryIrrelevant,
        after_quality_filter: articleMap.size,
        after_source_caps: cappedArticles.length,
        final_articles: outputArticles.length,
        from_priority_sources: prioritySourceCount,
        priority_breakdown: { high: highPriority, medium: mediumPriority, low: lowPriority }
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
