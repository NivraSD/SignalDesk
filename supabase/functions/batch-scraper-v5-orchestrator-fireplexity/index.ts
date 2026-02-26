// Batch Scraper V5 - Firecrawl CRAWL Orchestrator
// Uses Firecrawl Crawl API to discover AND scrape articles in one pass
// Much more reliable than Map + separate scrape approach

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0';

// Timeouts and limits
const CRAWL_TIMEOUT_MS = 60000; // 60 seconds max wait per crawl
const POLL_INTERVAL_MS = 3000; // Check every 3 seconds
const MAX_SOURCES_DEFAULT = 5; // Fewer sources since crawl is more thorough
const MAX_PAGES_PER_SOURCE = 25; // Limit pages per crawl for cost control
const MAX_ARTICLE_AGE_DAYS = 14; // Skip articles with old dates

interface Source {
  id: string;
  source_name: string;
  source_url: string;
  monitor_method: string;
  industries: string[];
  tier: number;
  consecutive_failures?: number;
  last_successful_scrape?: string;
}

interface CrawlResult {
  markdown: string;
  metadata: Record<string, any>;
  sourceURL: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const runId = crypto.randomUUID();
  const startTime = Date.now();

  console.log('🔥 BATCH SCRAPER V5 - FIRECRAWL CRAWL ORCHESTRATOR');
  console.log(`   Run ID: ${runId}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   Using CRAWL API (discover + scrape in one pass)\n`);

  try {
    const body = await req.json().catch(() => ({}));
    const maxSources = body.max_sources || MAX_SOURCES_DEFAULT;
    const testSourceIds = body.test_source_ids || null; // For testing specific sources

    // Create batch run record
    await supabase
      .from('batch_scrape_runs')
      .insert({
        id: runId,
        run_type: 'firecrawl_crawl',
        status: 'running',
        triggered_by: req.headers.get('user-agent') || 'manual'
      });

    // Get sources to crawl
    let sourcesQuery = supabase
      .from('source_registry')
      .select('*')
      .eq('active', true)
      .eq('monitor_method', 'firecrawl');

    if (testSourceIds && testSourceIds.length > 0) {
      // Testing specific sources
      sourcesQuery = sourcesQuery.in('id', testSourceIds);
    } else {
      // Normal operation: prioritize least recently scraped
      sourcesQuery = sourcesQuery
        .order('last_successful_scrape', { ascending: true, nullsFirst: true })
        .order('tier', { ascending: true })
        .limit(maxSources);
    }

    const { data: sources, error: sourcesError } = await sourcesQuery;

    if (sourcesError) throw new Error(`Failed to load sources: ${sourcesError.message}`);

    console.log(`📊 Processing ${sources?.length || 0} sources with Crawl API\n`);

    let totalArticles = 0;
    let newArticles = 0;
    let duplicateArticles = 0;
    let sourcesSuccessful = 0;
    let sourcesFailed = 0;

    // Process sources sequentially (crawl is async but we poll each to completion)
    for (const source of sources || []) {
      console.log(`\n🌐 Crawling: ${source.source_name}`);
      console.log(`   URL: ${source.source_url}`);

      try {
        const result = await crawlSource(source, supabase);

        totalArticles += result.articles;
        newArticles += result.newCount;
        duplicateArticles += result.duplicateCount;
        sourcesSuccessful++;

        console.log(`   ✅ Success: ${result.newCount} new, ${result.duplicateCount} duplicates, ${result.withContent} with content`);

        // Update source success
        await supabase
          .from('source_registry')
          .update({
            last_successful_scrape: new Date().toISOString(),
            consecutive_failures: 0
          })
          .eq('id', source.id);

      } catch (error: any) {
        console.error(`   ❌ Failed: ${error.message}`);
        sourcesFailed++;

        // Increment failure count
        await supabase
          .from('source_registry')
          .update({
            consecutive_failures: (source.consecutive_failures || 0) + 1,
            last_successful_scrape: new Date().toISOString() // Still update to prevent immediate retry
          })
          .eq('id', source.id);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Update batch run record
    await supabase
      .from('batch_scrape_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        articles_discovered: totalArticles,
        articles_new: newArticles,
        sources_successful: sourcesSuccessful,
        sources_failed: sourcesFailed,
        duration_seconds: duration
      })
      .eq('id', runId);

    const summary = {
      sources_processed: sourcesSuccessful + sourcesFailed,
      sources_successful: sourcesSuccessful,
      sources_failed: sourcesFailed,
      articles_discovered: totalArticles,
      new_articles: newArticles,
      duplicates_skipped: duplicateArticles,
      duration_seconds: duration
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 CRAWL COMPLETE');
    console.log(`   Sources: ${summary.sources_successful}/${summary.sources_processed} successful`);
    console.log(`   New articles: ${summary.new_articles}`);
    console.log(`   Duplicates: ${summary.duplicates_skipped}`);
    console.log(`   Duration: ${duration}s`);
    console.log('='.repeat(60));

    return new Response(
      JSON.stringify({ success: true, run_id: runId, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Fatal error:', error);

    await supabase
      .from('batch_scrape_runs')
      .update({ status: 'failed', error_message: error.message })
      .eq('id', runId);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// Crawl a single source using Firecrawl Crawl API
// ============================================================================
async function crawlSource(source: Source, supabase: any): Promise<{
  articles: number;
  newCount: number;
  duplicateCount: number;
  withContent: number;
}> {
  // Step 1: Start the crawl job
  const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: source.source_url,
      limit: MAX_PAGES_PER_SOURCE,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000, // Wait 2s for JS to render
      },
      excludePaths: [
        '/category/*',
        '/tag/*',
        '/author/*',
        '/login',
        '/subscribe',
        '/signup',
        '/search',
        '/contact',
        '/about',
        '/privacy',
        '/terms',
      ]
    })
  });

  if (!crawlResponse.ok) {
    const errorText = await crawlResponse.text();
    throw new Error(`Crawl API error (${crawlResponse.status}): ${errorText}`);
  }

  const crawlData = await crawlResponse.json();
  const crawlId = crawlData.id;

  if (!crawlId) {
    throw new Error('No crawl ID returned');
  }

  console.log(`   Started crawl job: ${crawlId}`);

  // Step 2: Poll for completion
  const startPoll = Date.now();
  let crawlResult: any = null;

  while (Date.now() - startPoll < CRAWL_TIMEOUT_MS) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

    const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      }
    });

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status}`);
    }

    const status = await statusResponse.json();

    if (status.status === 'completed') {
      crawlResult = status;
      console.log(`   Crawl completed: ${status.total || 0} pages found`);
      break;
    } else if (status.status === 'failed') {
      throw new Error(`Crawl failed: ${status.error || 'Unknown error'}`);
    }

    // Still running
    console.log(`   Crawling... (${status.completed || 0}/${status.total || '?'} pages)`);
  }

  if (!crawlResult) {
    throw new Error(`Crawl timed out after ${CRAWL_TIMEOUT_MS / 1000}s`);
  }

  // Step 3: Process results
  const pages = crawlResult.data || [];

  if (pages.length === 0) {
    throw new Error('No pages returned from crawl');
  }

  // Filter to actual articles (not category pages, etc.)
  const articles = pages.filter((page: CrawlResult) => {
    const url = page.sourceURL || page.metadata?.sourceURL || '';
    return isValidArticleUrl(url, source.source_url);
  });

  console.log(`   Filtered to ${articles.length} valid articles from ${pages.length} pages`);

  // Check for duplicates
  const urls = articles.map((a: CrawlResult) => a.sourceURL || a.metadata?.sourceURL);
  const { data: existingUrls } = await supabase
    .from('raw_articles')
    .select('url')
    .in('url', urls);

  const existingUrlSet = new Set((existingUrls || []).map((r: any) => r.url));
  const newArticles = articles.filter((a: CrawlResult) => {
    const url = a.sourceURL || a.metadata?.sourceURL;
    return !existingUrlSet.has(url);
  });

  // Insert new articles WITH content already scraped
  let withContentCount = 0;

  if (newArticles.length > 0) {
    const records = newArticles.map((article: CrawlResult) => {
      const url = article.sourceURL || article.metadata?.sourceURL || '';
      const metadata = article.metadata || {};
      const markdown = article.markdown || '';

      // Extract published date
      let publishedDate = null;
      const dateStr = metadata.publishedTime ||
                      metadata['article:published_time'] ||
                      metadata.datePublished ||
                      extractDateFromUrl(url);

      if (dateStr) {
        try {
          const date = new Date(dateStr);
          // Check if too old
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - MAX_ARTICLE_AGE_DAYS);
          if (date >= cutoff) {
            publishedDate = date.toISOString();
          }
        } catch {}
      }

      // Determine title
      const title = metadata.title ||
                    metadata.ogTitle ||
                    metadata['og:title'] ||
                    url.split('/').pop()?.replace(/-/g, ' ') ||
                    'Untitled';

      const hasContent = markdown.length > 300;
      if (hasContent) withContentCount++;

      return {
        source_id: source.id,
        source_name: source.source_name,
        url: url,
        title: title,
        full_content: hasContent ? markdown : null,
        content_length: markdown.length,
        published_at: publishedDate,
        scrape_status: hasContent ? 'completed' : 'pending', // If no content, will retry with worker
        scraped_at: hasContent ? new Date().toISOString() : null,
        raw_metadata: {
          ...metadata,
          scraping_method: 'firecrawl_crawl',
          crawl_id: crawlId
        }
      };
    });

    // Filter out articles without URLs
    const validRecords = records.filter(r => r.url && r.url.length > 0);

    if (validRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('raw_articles')
        .insert(validRecords);

      if (insertError) {
        console.error(`   Insert error: ${insertError.message}`);
      }
    }
  }

  return {
    articles: articles.length,
    newCount: newArticles.length,
    duplicateCount: articles.length - newArticles.length,
    withContent: withContentCount
  };
}

// ============================================================================
// Helper: Check if URL is a valid article (not category/landing page)
// ============================================================================
function isValidArticleUrl(url: string, sourceUrl: string): boolean {
  const lowerUrl = url.toLowerCase();

  let sourceDomain: string;
  let pathname: string;

  try {
    sourceDomain = new URL(sourceUrl).hostname;
    const urlObj = new URL(url);
    if (urlObj.hostname !== sourceDomain) {
      return false;
    }
    pathname = urlObj.pathname;
  } catch {
    return false;
  }

  // Skip the exact source URL
  if (lowerUrl === sourceUrl.toLowerCase()) {
    return false;
  }

  // Skip obvious non-article pages
  const excludePatterns = [
    '/category/',
    '/categories/',
    '/tag/',
    '/tags/',
    '/author/',
    '/authors/',
    '/topics/',
    '/topic/',
    '/login',
    '/subscribe',
    '/signup',
    '/search',
    '/contact',
    '/about-us',
    '/privacy-policy',
    '/terms',
    '/faq',
    '.pdf',
    '.xml',
    '/feed/',
    '/rss/',
  ];

  for (const pattern of excludePatterns) {
    if (lowerUrl.includes(pattern)) {
      return false;
    }
  }

  // Check for article-like patterns that strongly indicate an article
  // 1. Date in URL path (e.g., /2025/12/ or -2025-12 at end)
  const hasDateInPath = /\/\d{4}\/\d{2}/.test(pathname);
  const hasDateSuffix = /-\d{4}-\d{2}$/.test(pathname); // e.g., headline-2025-12

  // 2. Article slug pattern (multiple hyphenated words)
  const pathSegments = pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] || '';
  const isArticleSlug = lastSegment.split('-').length >= 4; // At least 4 words hyphenated

  // If it has date pattern or looks like an article slug, accept it
  if (hasDateInPath || hasDateSuffix || isArticleSlug) {
    return true;
  }

  // For paths without clear article indicators, require more structure
  // Skip if only 1 segment and doesn't look like an article
  if (pathSegments.length < 2) {
    return false;
  }

  // Skip very short paths that are likely category pages
  // e.g., /news, /tech, /latest (without article content)
  if (pathSegments.length === 1 && lastSegment.length < 20) {
    return false;
  }

  return true;
}

// ============================================================================
// Helper: Extract date from URL patterns
// ============================================================================
function extractDateFromUrl(url: string): string | null {
  // Pattern 1: /YYYY/MM/DD/ or /YYYY/MM/
  const slashPattern = url.match(/\/(\d{4})\/(\d{2})(?:\/(\d{2}))?/);
  if (slashPattern) {
    const [, year, month, day] = slashPattern;
    const yearNum = parseInt(year);
    if (yearNum >= 2000 && yearNum <= 2030) {
      return new Date(yearNum, parseInt(month) - 1, day ? parseInt(day) : 1).toISOString();
    }
  }

  // Pattern 2: YYYY-MM-DD in URL
  const dashPattern = url.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (dashPattern) {
    const [, year, month, day] = dashPattern;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
  }

  return null;
}
