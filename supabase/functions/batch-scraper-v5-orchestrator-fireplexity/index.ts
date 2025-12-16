// Batch Scraper V5 - Firecrawl Map Orchestrator
// Discovers article URLs using Firecrawl Map API for premium sources
// Stores URLs in raw_articles for later content extraction

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0';

// Timeouts and limits
const API_TIMEOUT_MS = 20000; // 20 seconds per API call
const MAX_SOURCES_DEFAULT = 15; // Reduced from 50 to avoid Edge Function timeout
const STUCK_RUN_THRESHOLD_MINUTES = 10; // Mark runs older than this as failed
const MAX_ARTICLE_AGE_DAYS = 14; // Skip articles with old dates in URL

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const runId = crypto.randomUUID();
  const startTime = Date.now();

  console.log('🔥 BATCH SCRAPER V5 - FIRECRAWL MAP ORCHESTRATOR');
  console.log(`   Run ID: ${runId}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  try {
    const body = await req.json().catch(() => ({}));
    const maxSources = body.max_sources || MAX_SOURCES_DEFAULT;

    // CLEANUP: Mark stuck "running" fireplexity runs as failed
    const stuckThreshold = new Date(Date.now() - STUCK_RUN_THRESHOLD_MINUTES * 60 * 1000).toISOString();
    const { data: stuckRuns } = await supabase
      .from('batch_scrape_runs')
      .update({
        status: 'failed',
        error_message: 'Timed out (cleanup by new run)'
      })
      .eq('run_type', 'firecrawl_discovery')
      .eq('status', 'running')
      .lt('started_at', stuckThreshold)
      .select('id');

    if (stuckRuns && stuckRuns.length > 0) {
      console.log(`🧹 Cleaned up ${stuckRuns.length} stuck firecrawl runs`);
    }

    // Create batch run record
    await supabase
      .from('batch_scrape_runs')
      .insert({
        id: runId,
        run_type: 'firecrawl_discovery',
        status: 'running',
        triggered_by: req.headers.get('user-agent') || 'manual'
      });

    // Get active Firecrawl sources, prioritize least recently scraped
    const { data: sources, error: sourcesError } = await supabase
      .from('source_registry')
      .select('*')
      .eq('active', true)
      .eq('monitor_method', 'firecrawl')
      .order('last_successful_scrape', { ascending: true, nullsFirst: true })
      .order('tier', { ascending: true })
      .limit(maxSources);

    if (sourcesError) throw new Error(`Failed to load sources: ${sourcesError.message}`);

    console.log(`📊 Found ${sources?.length || 0} active Firecrawl sources\\n`);

    let totalArticles = 0;
    let newArticles = 0;
    let duplicateArticles = 0;
    let sourcesSuccessful = 0;
    let sourcesFailed = 0;

    console.log('🔥 Discovering articles via Firecrawl Map...\\n');

    // Process sources in parallel batches for speed
    const BATCH_SIZE = 5; // Process 5 sources concurrently
    const allSources = sources || [];

    for (let i = 0; i < allSources.length; i += BATCH_SIZE) {
      const batch = allSources.slice(i, i + BATCH_SIZE);
      console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allSources.length / BATCH_SIZE)}: Processing ${batch.length} sources...`);

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(source => discoverViaFirecrawlMap(source, supabase))
      );

      // Aggregate results
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const source = batch[j];

        if (result.status === 'fulfilled') {
          totalArticles += result.value.articles;
          newArticles += result.value.newCount;
          duplicateArticles += result.value.duplicateCount;
          sourcesSuccessful++;

          console.log(`   ✅ ${source.source_name}: ${result.value.newCount} new, ${result.value.duplicateCount} duplicates`);

          // Update last successful scrape and reset consecutive failures
          await supabase
            .from('source_registry')
            .update({
              last_successful_scrape: new Date().toISOString(),
              consecutive_failures: 0
            })
            .eq('id', source.id);

        } else {
          console.error(`   ❌ ${source.source_name}: ${result.reason?.message || 'Unknown error'}`);
          sourcesFailed++;

          // Increment consecutive failures and update last_successful_scrape
          // This prevents infinite retries of failing sources
          await supabase
            .from('source_registry')
            .update({
              consecutive_failures: (source.consecutive_failures || 0) + 1,
              // Still update timestamp so we don't keep retrying immediately
              last_successful_scrape: new Date().toISOString()
            })
            .eq('id', source.id);
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < allSources.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Update batch run record
    const { error: updateError } = await supabase
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

    if (updateError) {
      console.error('Failed to update batch run:', updateError);
    }

    const summary = {
      sources_processed: sourcesSuccessful + sourcesFailed,
      sources_failed: sourcesFailed,
      articles_discovered: totalArticles,
      new_urls: newArticles,
      duplicates_skipped: duplicateArticles,
      duration_seconds: duration
    };

    console.log('\\n📊 Summary:');
    console.log(`   Sources processed: ${summary.sources_processed}`);
    console.log(`   New URLs: ${summary.new_urls}`);
    console.log(`   Duplicates: ${summary.duplicates_skipped}`);
    console.log(`   Duration: ${duration}s`);

    return new Response(
      JSON.stringify({ success: true, run_id: runId, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
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
// Helper: Fetch with timeout using AbortController
// ============================================================================
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// Helper: Discover articles via Firecrawl Map API
// ============================================================================
async function discoverViaFirecrawlMap(source: Source, supabase: any): Promise<{ articles: number, newCount: number, duplicateCount: number }> {
  // Use Firecrawl Map to discover article URLs on the site (with timeout)
  let mapResponse: Response;
  try {
    mapResponse = await fetchWithTimeout('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: source.source_url,
        search: 'article news',  // Search for article-related pages
        limit: 50,  // Limit URLs per source for cost control
        includeSubdomains: false
      })
    }, API_TIMEOUT_MS);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`API timeout after ${API_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  }

  if (!mapResponse.ok) {
    const errorText = await mapResponse.text();
    throw new Error(`Firecrawl Map API error (${mapResponse.status}): ${errorText}`);
  }

  const mapData = await mapResponse.json();
  const discoveredLinks = mapData.links || [];

  if (discoveredLinks.length === 0) {
    throw new Error('No links discovered');
  }

  // Filter URLs to find actual content (not category/profile pages)
  // More permissive approach: if Firecrawl returned it, it's likely an article
  // Only exclude obvious non-article pages
  const articles = discoveredLinks
    .filter((link: string | {url: string}) => {
      const url = typeof link === 'string' ? link : link.url;
      const lowerUrl = url.toLowerCase();

      // Skip the exact source URL (the page we started from)
      if (lowerUrl === source.source_url.toLowerCase()) {
        return false;
      }

      // DATE FILTERING: Skip URLs with old dates in them
      const dateInUrl = extractDateFromUrl(url);
      if (dateInUrl) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - MAX_ARTICLE_AGE_DAYS);
        if (dateInUrl < cutoffDate) {
          return false; // URL date is too old
        }
      }

      // Exclude obvious non-article pages
      const isExcluded =
        lowerUrl.includes('/category') ||
        lowerUrl.includes('/tag/') ||
        lowerUrl.includes('/author/') ||
        lowerUrl.includes('/topics/') ||
        lowerUrl.includes('/login') ||
        lowerUrl.includes('/subscribe') ||
        lowerUrl.includes('/signup') ||
        lowerUrl.includes('/search') ||
        lowerUrl.includes('/contact') ||
        lowerUrl.includes('/about') ||
        lowerUrl.includes('/privacy') ||
        lowerUrl.includes('/terms') ||
        lowerUrl.includes('/faq') ||
        lowerUrl.includes('.pdf') ||
        lowerUrl.includes('.xml') ||
        lowerUrl.endsWith('/news') ||
        lowerUrl.endsWith('/latest') ||
        lowerUrl.endsWith('/archive') ||
        // Skip if URL is just the domain or has only 1-2 path segments
        (new URL(url).pathname.split('/').filter(Boolean).length < 2);

      return !isExcluded;
    })
    .map((link: string | {url: string, title?: string}) => {
      if (typeof link === 'string') {
        return { url: link, title: link.split('/').pop()?.replace(/-/g, ' ') || 'Untitled' };
      }
      return { url: link.url, title: link.title || link.url.split('/').pop()?.replace(/-/g, ' ') || 'Untitled' };
    });

  if (articles.length === 0) {
    throw new Error('No valid articles after filtering');
  }

  // Check for duplicates
  const urls = articles.map(a => a.url);
  const { data: existingUrls } = await supabase
    .from('raw_articles')
    .select('url')
    .in('url', urls);

  const existingUrlSet = new Set((existingUrls || []).map((r: any) => r.url));
  const newArticles = articles.filter(a => !existingUrlSet.has(a.url));

  // Insert new articles
  if (newArticles.length > 0) {
    const records = newArticles.map(article => ({
      source_id: source.id,
      source_name: source.source_name,
      url: article.url,
      title: article.title,
      scrape_status: 'pending'
    }));

    await supabase.from('raw_articles').insert(records);
  }

  return {
    articles: articles.length,
    newCount: newArticles.length,
    duplicateCount: articles.length - newArticles.length
  };
}

// ============================================================================
// Helper: Extract date from URL patterns
// ============================================================================
function extractDateFromUrl(url: string): Date | null {
  // Pattern 1: /YYYY/MM/DD/ or /YYYY/MM/
  const slashPattern = url.match(/\/(\d{4})\/(\d{2})(?:\/(\d{2}))?/);
  if (slashPattern) {
    const [, year, month, day] = slashPattern;
    const yearNum = parseInt(year);
    // Sanity check: year should be reasonable (2000-2030)
    if (yearNum >= 2000 && yearNum <= 2030) {
      return new Date(yearNum, parseInt(month) - 1, day ? parseInt(day) : 1);
    }
  }

  // Pattern 2: YYYY-MM-DD in URL
  const dashPattern = url.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (dashPattern) {
    const [, year, month, day] = dashPattern;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Pattern 3: -YYYYMMDD (some sites use this)
  const compactPattern = url.match(/-?(20\d{2})(\d{2})(\d{2})(?:[^0-9]|$)/);
  if (compactPattern) {
    const [, year, month, day] = compactPattern;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    // Sanity check: valid month and day
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return new Date(parseInt(year), monthNum - 1, dayNum);
    }
  }

  return null;
}
