/**
 * Monitoring Stage 2: Enrichment
 *
 * Previous version did complex event/entity extraction with Claude,
 * which caused issues:
 * - Same article appearing multiple times (multiple "events" from one article)
 * - Garbage entities extracted from website boilerplate ("Keyboard", "Click", "sec")
 * - Synthesis over-prioritizing articles with richer extractions
 *
 * CURRENT APPROACH:
 * - Fetch full_content from database for articles (not passed from selector for efficiency)
 * - Clean and extract summaries from full content when available
 * - Pass through to synthesis with enriched summaries
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Article {
  id?: number;
  title: string;
  description?: string;
  full_content?: string;
  url: string;
  source?: string;
  source_name?: string;
  published_at?: string;
  relevance_score?: number;
  relevance_reason?: string;
  is_trade_source?: boolean;
  industry_priority?: boolean;
  [key: string]: any;
}

/**
 * Extract intelligence targets from company profile
 * Returns lists of competitors, stakeholders, and topics to match against
 */
function extractTargetsFromProfile(profile: any): {
  competitors: string[];
  stakeholders: string[];
  topics: string[];
} {
  const competitors: string[] = [];
  const stakeholders: string[] = [];
  const topics: string[] = [];

  // Extract competitors
  if (profile?.competition?.direct_competitors) {
    competitors.push(...profile.competition.direct_competitors);
  }
  if (profile?.competition?.indirect_competitors) {
    competitors.push(...profile.competition.indirect_competitors);
  }

  // Extract stakeholders (regulators, analysts, activists, key people)
  if (profile?.stakeholders?.regulators) {
    stakeholders.push(...profile.stakeholders.regulators);
  }
  if (profile?.stakeholders?.key_analysts) {
    stakeholders.push(...profile.stakeholders.key_analysts);
  }
  if (profile?.stakeholders?.activists) {
    stakeholders.push(...profile.stakeholders.activists);
  }
  if (profile?.leadership) {
    // Add leadership names (extract just names, not roles)
    profile.leadership.forEach((l: any) => {
      if (typeof l === 'string') {
        const namePart = l.split(' - ')[0].trim();
        if (namePart) stakeholders.push(namePart);
      } else if (l.name) {
        stakeholders.push(l.name);
      }
    });
  }

  // Extract topics from extraction_focus, strategic_priorities, service_lines
  if (profile?.intelligence_context?.extraction_focus) {
    topics.push(...profile.intelligence_context.extraction_focus);
  }
  if (profile?.strategic_context?.strategic_priorities) {
    topics.push(...profile.strategic_context.strategic_priorities);
  }
  if (profile?.service_lines) {
    topics.push(...profile.service_lines);
  }

  return {
    competitors: [...new Set(competitors)].filter(Boolean),
    stakeholders: [...new Set(stakeholders)].filter(Boolean),
    topics: [...new Set(topics)].filter(Boolean)
  };
}

/**
 * Match article text against known targets
 * Returns which targets were found in the article
 */
function matchTargets(
  text: string,
  targets: { competitors: string[]; stakeholders: string[]; topics: string[] }
): {
  matched_competitors: string[];
  matched_stakeholders: string[];
  matched_topics: string[];
  entities: string[];
  category: string;
} {
  const textLower = text.toLowerCase();

  const matched_competitors = targets.competitors.filter(c => {
    // Match whole word to avoid partial matches (e.g., "Ad" in "Adobe")
    const pattern = new RegExp(`\\b${escapeRegex(c)}\\b`, 'i');
    return pattern.test(text);
  });

  const matched_stakeholders = targets.stakeholders.filter(s => {
    const pattern = new RegExp(`\\b${escapeRegex(s)}\\b`, 'i');
    return pattern.test(text);
  });

  const matched_topics = targets.topics.filter(t => {
    // Topics can be phrases, use looser matching
    return textLower.includes(t.toLowerCase());
  });

  // Combine all entities (for backwards compatibility with synthesis)
  const entities = [...matched_competitors, ...matched_stakeholders];

  // Determine category based on matches
  let category = 'industry_news';
  if (matched_competitors.length > 0) {
    category = 'competitor_news';
  } else if (matched_stakeholders.length > 0) {
    category = 'stakeholder_news';
  } else if (matched_topics.length > 0) {
    category = 'topic_news';
  }

  return {
    matched_competitors,
    matched_stakeholders,
    matched_topics,
    entities,
    category
  };
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Clean HTML and garbage from text
 */
function cleanText(text: string): string {
  if (!text) return '';

  return text
    .replace(/<[^>]*>/g, ' ')           // Remove HTML tags
    .replace(/&[^;]+;/g, ' ')           // Remove HTML entities
    .replace(/\s+/g, ' ')               // Normalize whitespace
    .replace(/^\s*Skip to.*$/gim, '')   // Remove "Skip to content" etc
    .replace(/^\s*Sign (up|in).*$/gim, '')  // Remove auth prompts
    .trim();
}

/**
 * Extract a clean summary from content if available
 * Returns description if full_content is garbage/paywall
 */
function extractCleanSummary(article: Article): string {
  const description = cleanText(article.description || '');
  const fullContent = article.full_content || '';

  // If no full content, use description
  if (!fullContent || fullContent.length < 200) {
    return description;
  }

  // Check if full content is mostly garbage (paywall, navigation, etc.)
  const cleaned = cleanText(fullContent);

  // Garbage indicators
  const garbagePatterns = [
    /Subscribe to continue/i,
    /Sign up.*to read/i,
    /Already a subscriber/i,
    /Unlock this article/i,
    /Start your free trial/i,
    /What's included.*Standard Digital/i,
    /non-commercial use only/i,
    /governed by our Subscriber Agreement/i,
    /Afghanistan.*Albania.*Algeria/i,  // Country dropdown lists
    /Cookie.*Privacy Policy/i,
  ];

  const hasGarbage = garbagePatterns.some(p => p.test(cleaned.substring(0, 1500)));

  if (hasGarbage) {
    // Full content is garbage, use description
    return description;
  }

  // Full content looks clean - extract first ~500 chars as summary
  // Find a good breakpoint (end of sentence)
  const maxLen = 500;
  let summary = cleaned.substring(0, maxLen);

  // Try to end at a sentence boundary
  const lastPeriod = summary.lastIndexOf('. ');
  if (lastPeriod > 200) {
    summary = summary.substring(0, lastPeriod + 1);
  }

  return summary || description;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const { articles, profile, organization_name, coverage_report } = await req.json();

    console.log(`📊 ENRICHMENT`);
    console.log(`   Received ${articles?.length || 0} articles for ${organization_name}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Extract intelligence targets from profile for matching
    const targets = extractTargetsFromProfile(profile);
    console.log(`   📎 Targets: ${targets.competitors.length} competitors, ${targets.stakeholders.length} stakeholders, ${targets.topics.length} topics`);

    // Fetch full_content for articles that have UUIDs
    // (articles from article-selector don't include full_content to keep payloads small)
    const articleIds = (articles || [])
      .map((a: Article) => a.id)
      .filter((id: any) => typeof id === 'string' && id.includes('-')); // UUID format

    let contentMap = new Map<string, string>();

    if (articleIds.length > 0) {
      console.log(`   Fetching full_content for ${articleIds.length} articles...`);
      const fetchStart = Date.now();

      // Fetch in batches of 20 to avoid payload limits
      const BATCH_SIZE = 20;
      for (let i = 0; i < articleIds.length; i += BATCH_SIZE) {
        const batchIds = articleIds.slice(i, i + BATCH_SIZE);
        const { data: contentData } = await supabase
          .from('raw_articles')
          .select('id, full_content')
          .in('id', batchIds)
          .not('full_content', 'is', null);

        if (contentData) {
          contentData.forEach((row: any) => {
            if (row.full_content && row.full_content.length > 200) {
              contentMap.set(row.id, row.full_content);
            }
          });
        }
      }

      console.log(`   Fetched ${contentMap.size} articles with content (${Date.now() - fetchStart}ms)`);
    }

    // Merge full_content back into articles
    const articlesWithContent = (articles || []).map((a: Article) => ({
      ...a,
      full_content: contentMap.get(a.id as string) || a.full_content
    }));

    if (!articlesWithContent || !articlesWithContent.length) {
      return new Response(JSON.stringify({
        success: true,
        articles: [],
        stats: { total_articles: 0, processing_mode: 'enrichment' }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log article distribution by source
    const bySource: Record<string, number> = {};
    articlesWithContent.forEach((a: Article) => {
      const src = a.source || a.source_name || 'Unknown';
      bySource[src] = (bySource[src] || 0) + 1;
    });
    console.log(`   Sources: ${Object.keys(bySource).length}`);
    console.log(`   Distribution:`, bySource);

    // Log date range
    const sortedByDate = [...articlesWithContent].sort((a: Article, b: Article) =>
      new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
    );
    if (sortedByDate.length > 0) {
      console.log(`   Date range: ${sortedByDate[sortedByDate.length - 1].published_at} to ${sortedByDate[0].published_at}`);
    }

    // Process each article - extract clean summaries and match against targets
    const enrichedArticles = articlesWithContent.map((article: Article, idx: number) => {
      const cleanTitle = cleanText(article.title || '');
      const cleanDescription = cleanText(article.description || '');
      const cleanSummary = extractCleanSummary(article);

      // Match article against known targets (title + summary for better coverage)
      const textToMatch = `${cleanTitle} ${cleanSummary}`;
      const matches = matchTargets(textToMatch, targets);

      return {
        id: idx,
        title: cleanTitle,
        url: article.url,
        source: article.source || article.source_name || 'Unknown',
        published_at: article.published_at,

        // Content - cleaned
        description: cleanDescription,
        summary: cleanSummary,

        // TARGET MATCHING - this is what synthesis needs!
        matched_competitors: matches.matched_competitors,
        matched_stakeholders: matches.matched_stakeholders,
        matched_topics: matches.matched_topics,
        entities: matches.entities,  // Combined list for backwards compatibility
        pr_category: matches.category,  // Category based on matches

        // Metadata from previous stages
        relevance_score: article.relevance_score || 50,
        relevance_reason: article.relevance_reason || '',
        is_trade_source: article.is_trade_source || false,
        industry_priority: article.industry_priority || false,

        // Flag if we had usable full content
        has_clean_content: cleanSummary.length > cleanDescription.length
      };
    });

    // Sort by relevance score (highest first) then by date
    enrichedArticles.sort((a: any, b: any) => {
      if (b.relevance_score !== a.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }
      return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
    });

    const processingTime = Date.now() - startTime;

    // Count content quality
    const withCleanContent = enrichedArticles.filter((a: any) => a.has_clean_content).length;
    const tradeSources = enrichedArticles.filter((a: any) => a.is_trade_source).length;

    // Count target matches - THIS IS THE KEY METRIC!
    const withCompetitorMatch = enrichedArticles.filter((a: any) => a.matched_competitors?.length > 0).length;
    const withStakeholderMatch = enrichedArticles.filter((a: any) => a.matched_stakeholders?.length > 0).length;
    const withTopicMatch = enrichedArticles.filter((a: any) => a.matched_topics?.length > 0).length;
    const withAnyMatch = enrichedArticles.filter((a: any) =>
      (a.matched_competitors?.length > 0) ||
      (a.matched_stakeholders?.length > 0) ||
      (a.matched_topics?.length > 0)
    ).length;

    // Collect unique matched entities for synthesis
    const allMatchedCompetitors = new Set<string>();
    const allMatchedStakeholders = new Set<string>();
    const allMatchedTopics = new Set<string>();
    enrichedArticles.forEach((a: any) => {
      (a.matched_competitors || []).forEach((c: string) => allMatchedCompetitors.add(c));
      (a.matched_stakeholders || []).forEach((s: string) => allMatchedStakeholders.add(s));
      (a.matched_topics || []).forEach((t: string) => allMatchedTopics.add(t));
    });

    console.log(`\n✅ ENRICHMENT COMPLETE (${processingTime}ms)`);
    console.log(`   Articles: ${enrichedArticles.length}`);
    console.log(`   With clean content: ${withCleanContent}`);
    console.log(`   Fetched from DB: ${contentMap.size}`);
    console.log(`   Trade sources: ${tradeSources}`);
    console.log(`   📎 TARGET MATCHES:`);
    console.log(`      Competitor mentions: ${withCompetitorMatch} articles (${allMatchedCompetitors.size} unique: ${[...allMatchedCompetitors].slice(0, 5).join(', ')}${allMatchedCompetitors.size > 5 ? '...' : ''})`);
    console.log(`      Stakeholder mentions: ${withStakeholderMatch} articles (${allMatchedStakeholders.size} unique: ${[...allMatchedStakeholders].slice(0, 5).join(', ')}${allMatchedStakeholders.size > 5 ? '...' : ''})`);
    console.log(`      Topic matches: ${withTopicMatch} articles (${allMatchedTopics.size} unique)`);
    console.log(`      Any match: ${withAnyMatch}/${enrichedArticles.length} (${Math.round(withAnyMatch / enrichedArticles.length * 100)}%)`);

    // Build response - simplified structure for synthesis
    const response = {
      success: true,

      // Pass through profile for synthesis
      profile: profile,

      // The enriched articles - this is what synthesis will use
      articles: enrichedArticles,

      // Also provide as enriched_articles for backwards compatibility
      enriched_articles: enrichedArticles,

      // Provide article_summaries format for synthesis compatibility
      article_summaries: enrichedArticles.map((a: any) => ({
        id: a.id,
        title: a.title,
        url: a.url,
        source: a.source,
        published: a.published_at,
        summary: a.summary || a.description,
        relevance_score: a.relevance_score,
        is_trade_source: a.is_trade_source
      })),

      // Empty structures for backwards compatibility
      // (synthesis may expect these even if empty)
      extracted_data: {
        events: [],
        entities: [],
        quotes: [],
        metrics: [],
        article_summaries: enrichedArticles,
        topic_clusters: []
      },

      organized_intelligence: {
        events: [],
        entities: [],
        quotes: [],
        metrics: [],
        topic_clusters: [],
        article_summaries: enrichedArticles
      },

      // Stats
      stats: {
        total_articles: enrichedArticles.length,
        articles_with_clean_content: withCleanContent,
        fetched_from_db: contentMap.size,
        trade_source_articles: tradeSources,
        unique_sources: Object.keys(bySource).length,
        processing_time_ms: processingTime,
        processing_mode: 'content-enrichment',
        // TARGET MATCH STATS - critical for synthesis
        target_matches: {
          articles_with_competitor_match: withCompetitorMatch,
          articles_with_stakeholder_match: withStakeholderMatch,
          articles_with_topic_match: withTopicMatch,
          articles_with_any_match: withAnyMatch,
          unique_competitors_found: [...allMatchedCompetitors],
          unique_stakeholders_found: [...allMatchedStakeholders],
          unique_topics_found: [...allMatchedTopics]
        }
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Enrichment error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
