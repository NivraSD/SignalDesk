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

    // Process each article - extract clean summaries from full content when available
    const enrichedArticles = articlesWithContent.map((article: Article, idx: number) => {
      const cleanTitle = cleanText(article.title || '');
      const cleanDescription = cleanText(article.description || '');
      const cleanSummary = extractCleanSummary(article);

      return {
        id: idx,
        title: cleanTitle,
        url: article.url,
        source: article.source || article.source_name || 'Unknown',
        published_at: article.published_at,

        // Content - cleaned
        description: cleanDescription,
        summary: cleanSummary,

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

    console.log(`\n✅ ENRICHMENT COMPLETE (${processingTime}ms)`);
    console.log(`   Articles: ${enrichedArticles.length}`);
    console.log(`   With clean content: ${withCleanContent}`);
    console.log(`   Fetched from DB: ${contentMap.size}`);
    console.log(`   Trade sources: ${tradeSources}`);

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
        processing_mode: 'content-enrichment'
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
