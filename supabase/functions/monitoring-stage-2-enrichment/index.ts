/**
 * Monitoring Stage 2: Enrichment - SIMPLIFIED PASS-THROUGH
 *
 * Previous version did complex event/entity extraction with Claude,
 * which caused issues:
 * - Same article appearing multiple times (multiple "events" from one article)
 * - Garbage entities extracted from website boilerplate ("Keyboard", "Click", "sec")
 * - Synthesis over-prioritizing articles with richer extractions
 *
 * NEW APPROACH: Just pass through article metadata cleanly.
 * Let synthesis work directly with titles/descriptions.
 * This is simpler, faster, and avoids the complexity issues.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

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

    console.log(`📊 ENRICHMENT (PASS-THROUGH MODE)`);
    console.log(`   Received ${articles?.length || 0} articles for ${organization_name}`);

    if (!articles || !articles.length) {
      return new Response(JSON.stringify({
        success: true,
        articles: [],
        stats: { total_articles: 0, processing_mode: 'pass-through' }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log article distribution by source
    const bySource: Record<string, number> = {};
    articles.forEach((a: Article) => {
      const src = a.source || a.source_name || 'Unknown';
      bySource[src] = (bySource[src] || 0) + 1;
    });
    console.log(`   Sources: ${Object.keys(bySource).length}`);
    console.log(`   Distribution:`, bySource);

    // Log date range
    const sortedByDate = [...articles].sort((a: Article, b: Article) =>
      new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
    );
    if (sortedByDate.length > 0) {
      console.log(`   Date range: ${sortedByDate[sortedByDate.length - 1].published_at} to ${sortedByDate[0].published_at}`);
    }

    // SIMPLE PASS-THROUGH: Clean up each article and pass it along
    const enrichedArticles = articles.map((article: Article, idx: number) => {
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
    console.log(`   Trade sources: ${tradeSources}`);
    console.log(`   Mode: PASS-THROUGH (no event extraction)`);

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
        trade_source_articles: tradeSources,
        unique_sources: Object.keys(bySource).length,
        processing_time_ms: processingTime,
        processing_mode: 'pass-through',
        event_extraction: 'disabled'
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
