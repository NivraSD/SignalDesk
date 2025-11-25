// Batch Scraper V5 - Sitemap Orchestrator
// Discovers article URLs using news sitemaps from robots.txt
// Stores URLs in raw_articles for later content extraction

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Source {
  id: string;
  source_name: string;
  source_url: string;
  monitor_method: string;
  industries: string[];
  tier: number;
  last_successful_scrape?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const runId = crypto.randomUUID();
  const startTime = Date.now();

  console.log('🗺️  BATCH SCRAPER V5 - SITEMAP ORCHESTRATOR');
  console.log(`   Run ID: ${runId}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  try {
    const body = await req.json().catch(() => ({}));
    const maxSources = body.max_sources || 50;

    // Create batch run record
    await supabase
      .from('batch_scrape_runs')
      .insert({
        id: runId,
        run_type: 'sitemap_discovery',
        status: 'running',
        triggered_by: req.headers.get('user-agent') || 'manual'
      });

    // Get active sitemap sources, prioritize least recently scraped
    const { data: sources, error: sourcesError } = await supabase
      .from('source_registry')
      .select('*')
      .eq('active', true)
      .eq('monitor_method', 'sitemap')
      .order('last_successful_scrape', { ascending: true, nullsFirst: true })
      .order('tier', { ascending: true })
      .limit(maxSources);

    if (sourcesError) throw new Error(`Failed to load sources: ${sourcesError.message}`);

    console.log(`📊 Found ${sources?.length || 0} active sitemap sources\n`);

    let totalArticles = 0;
    let newArticles = 0;
    let duplicateArticles = 0;
    let sourcesSuccessful = 0;
    let sourcesFailed = 0;

    console.log('🗺️  Discovering articles via sitemaps...\n');

    for (const source of sources || []) {
      try {
        const result = await discoverViaSitemap(source, supabase);

        totalArticles += result.articles;
        newArticles += result.newCount;
        duplicateArticles += result.duplicateCount;
        sourcesSuccessful++;

        console.log(`   ✅ ${source.source_name}: ${result.newCount} new, ${result.duplicateCount} duplicates`);

        // Update last successful scrape
        await supabase
          .from('source_registry')
          .update({ last_successful_scrape: new Date().toISOString() })
          .eq('id', source.id);

      } catch (error) {
        console.error(`   ❌ ${source.source_name}: ${error.message}`);
        sourcesFailed++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Update batch run record
    await supabase
      .from('batch_scrape_runs')
      .update({
        status: 'completed',
        articles_discovered: totalArticles,
        articles_new: newArticles,
        articles_duplicate: duplicateArticles,
        sources_successful: sourcesSuccessful,
        sources_failed: sourcesFailed,
        duration_seconds: duration
      })
      .eq('id', runId);

    const summary = {
      sources_processed: sourcesSuccessful + sourcesFailed,
      sources_failed: sourcesFailed,
      articles_discovered: totalArticles,
      new_urls: newArticles,
      duplicates_skipped: duplicateArticles,
      duration_seconds: duration
    };

    console.log('\n📊 Summary:');
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
// Helper: Discover articles via sitemap
// ============================================================================
async function discoverViaSitemap(source: Source, supabase: any): Promise<{ articles: number, newCount: number, duplicateCount: number }> {
  const domain = new URL(source.source_url).origin;

  // Step 1: Fetch robots.txt to find sitemaps
  const robotsUrl = `${domain}/robots.txt`;
  const robotsRes = await fetch(robotsUrl);
  if (!robotsRes.ok) {
    throw new Error(`robots.txt not found (${robotsRes.status})`);
  }

  const robotsTxt = await robotsRes.text();
  const sitemapUrls = robotsTxt
    .split('\n')
    .filter(line => line.toLowerCase().startsWith('sitemap:'))
    .map(line => line.split(':').slice(1).join(':').trim())
    .filter(url => url.includes('news') || url.includes('latest') || url.includes('sitemap'));

  if (sitemapUrls.length === 0) {
    throw new Error('No sitemaps found in robots.txt');
  }

  console.log(`   🗺️  ${source.source_name}: Found ${sitemapUrls.length} sitemaps`);

  // Step 2: Parse sitemaps to extract article URLs
  const articles: { url: string, title: string }[] = [];

  // Date filtering: last 48 hours
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

  for (const sitemapUrl of sitemapUrls.slice(0, 3)) { // Limit to first 3 sitemaps per source
    try {
      const sitemapRes = await fetch(sitemapUrl);
      if (!sitemapRes.ok) continue;

      const xml = await sitemapRes.text();

      // Parse XML to extract URL, title, and publication date together
      const urlRegex = /<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?(?:<news:publication_date>(.*?)<\/news:publication_date>)?[\s\S]*?(?:<news:title>(.*?)<\/news:title>)?[\s\S]*?<\/url>/g;

      let match;
      while ((match = urlRegex.exec(xml)) !== null) {
        const url = match[1];
        const pubDate = match[2];
        const title = match[3] || url.split('/').pop() || 'Untitled';

        // Filter by date if available
        if (pubDate) {
          const articleDate = new Date(pubDate);
          if (articleDate < fortyEightHoursAgo) {
            continue; // Skip articles older than 48 hours
          }
        }

        // Filter by URL pattern
        if (url.includes('/article') || url.includes('/news/') || url.includes('/20')) {
          articles.push({ url, title });
        }
      }

    } catch (err) {
      console.error(`   ⚠️  Failed to parse sitemap ${sitemapUrl}: ${err.message}`);
    }
  }

  if (articles.length === 0) {
    throw new Error('No articles found in sitemaps');
  }

  // Step 3: Check for duplicates
  const urls = articles.map(a => a.url);
  const { data: existingUrls } = await supabase
    .from('raw_articles')
    .select('url')
    .in('url', urls);

  const existingUrlSet = new Set((existingUrls || []).map((r: any) => r.url));
  const newArticles = articles.filter(a => !existingUrlSet.has(a.url));

  // Step 4: Insert new articles
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
