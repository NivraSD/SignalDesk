// Batch Scraper Orchestrator V3
// Uses Firecrawl Extract API for intelligent article extraction
// Runs every 4-6 hours with smart deduplication

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')!;

interface Source {
  id: string;
  source_name: string;
  source_url: string;
  source_type: string;
  monitor_method: string;
  tier: number;
  last_successful_scrape: string | null;
}

// Schema for extracted articles
const ARTICLE_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      title: { type: "string", description: "Article headline" },
      url: { type: "string", description: "Full article URL" },
      description: { type: "string", description: "Article summary or excerpt" },
      author: { type: "string", description: "Article author name if available" },
      published_at: { type: "string", description: "Publication date in ISO format (YYYY-MM-DD)" },
      topics: {
        type: "array",
        items: { type: "string" },
        description: "Article topics like 'merger', 'leadership', 'product launch', 'regulatory'"
      }
    },
    required: ["title", "url"]
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const runId = crypto.randomUUID();
  const startTime = Date.now();

  console.log('🚀 BATCH SCRAPER V3 (EXTRACT API) STARTING');
  console.log(`   Run ID: ${runId}`);
  console.log(`   Time: ${new Date().toISOString()}`);

  try {
    // Create batch run record
    await supabase
      .from('batch_scrape_runs')
      .insert({
        id: runId,
        run_type: 'scheduled',
        status: 'running',
        triggered_by: req.headers.get('user-agent') || 'manual'
      });

    console.log(`   ✅ Batch run created: ${runId}\n`);

    // Get active sources that need scraping
    const { data: sources, error: sourcesError } = await supabase
      .from('source_registry')
      .select('*')
      .eq('active', true)
      .order('tier', { ascending: true });

    if (sourcesError) {
      throw new Error(`Failed to load sources: ${sourcesError.message}`);
    }

    console.log(`📊 Found ${sources?.length || 0} active sources\n`);

    // Separate RSS from Extract-based sources
    const rssSources = sources?.filter(s => s.monitor_method === 'rss') || [];
    const extractSources = sources?.filter(s => s.monitor_method === 'firecrawl_observer') || [];

    console.log(`   📡 RSS sources: ${rssSources.length}`);
    console.log(`   🔥 Extract sources: ${extractSources.length}\n`);

    let totalArticles = 0;
    let newArticles = 0;
    let duplicateArticles = 0;
    let sourcesSuccessful = 0;
    let sourcesFailed = 0;
    const errors: any[] = [];

    // ========================================================================
    // PHASE 1: Scrape RSS sources (fast, free)
    // ========================================================================
    console.log('📡 PHASE 1: Scraping RSS sources...\n');

    for (const source of rssSources) { // Scrape ALL RSS sources
      try {
        const articles = await scrapeRSS(source);

        // If no articles found, log it but don't fail
        if (articles.length === 0) {
          console.log(`   ⚠️  ${source.source_name}: No RSS feed found`);
          sourcesFailed++;
          errors.push({ source: source.source_name, error: 'No valid RSS feed found' });
          continue;
        }

        totalArticles += articles.length;

        // Get existing URLs for this source to check duplicates
        const { data: existingUrls } = await supabase
          .from('raw_articles')
          .select('url')
          .eq('source_id', source.id);

        const existingUrlSet = new Set((existingUrls || []).map(r => r.url));

        // Insert only new articles
        let sourceNewArticles = 0;
        for (const article of articles) {
          // Skip if we already have this URL
          if (existingUrlSet.has(article.url)) {
            duplicateArticles++;
            continue;
          }

          const { error: insertError } = await supabase
            .from('raw_articles')
            .insert({
              source_id: source.id,
              source_name: source.source_name,
              url: article.url,
              title: article.title,
              description: article.description,
              author: article.author,
              published_at: article.published_at,
              raw_metadata: article.raw_metadata,
              content_length: 0,
              processed: false
            });

          if (!insertError) {
            newArticles++;
            sourceNewArticles++;
          } else if (insertError.code === '23505') {
            // Duplicate URL (caught by UNIQUE constraint)
            duplicateArticles++;
          }
        }

        // Update source metrics
        await supabase
          .from('source_registry')
          .update({
            last_successful_scrape: new Date().toISOString(),
            consecutive_failures: 0
          })
          .eq('id', source.id);

        sourcesSuccessful++;
        console.log(`   ✅ ${source.source_name}: ${sourceNewArticles} new / ${articles.length} total`);

      } catch (error: any) {
        sourcesFailed++;
        errors.push({ source: source.source_name, error: error.message });
        console.error(`   ❌ ${source.source_name}: ${error.message}`);
      }
    }

    // ========================================================================
    // PHASE 2: Extract articles using Firecrawl (intelligent LLM extraction)
    // ========================================================================
    console.log('\n🔥 PHASE 2: Extracting articles with Firecrawl...\n');

    // Process sources in batches to avoid overwhelming the API
    const BATCH_SIZE = 5;
    const sourcesToExtract = extractSources; // Scrape ALL Extract sources

    for (let i = 0; i < sourcesToExtract.length; i += BATCH_SIZE) {
      const batch = sourcesToExtract.slice(i, i + BATCH_SIZE);

      console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(sourcesToExtract.length / BATCH_SIZE)}: Processing ${batch.length} sources in parallel...`);

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(source => extractArticlesFromSource(source, supabase))
      );

      // Aggregate results
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const source = batch[j];

        if (result.status === 'fulfilled') {
          const { articles, newCount, duplicateCount } = result.value;
          totalArticles += articles;
          newArticles += newCount;
          duplicateArticles += duplicateCount;
          sourcesSuccessful++;

          console.log(`   ✅ ${source.source_name}: ${newCount} new / ${articles} total (${duplicateCount} duplicates)`);

          // Update source metrics
          await supabase
            .from('source_registry')
            .update({
              last_successful_scrape: new Date().toISOString(),
              consecutive_failures: 0
            })
            .eq('id', source.id);

        } else {
          sourcesFailed++;
          errors.push({ source: source.source_name, error: result.reason?.message || 'Unknown error' });
          console.error(`   ❌ ${source.source_name}: ${result.reason?.message || 'Unknown error'}`);
        }
      }

      // Rate limiting between batches
      if (i + BATCH_SIZE < sourcesToExtract.length) {
        console.log(`   ⏳ Waiting 3 seconds before next batch...\n`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Update batch run with results
    await supabase
      .from('batch_scrape_runs')
      .update({
        completed_at: new Date().toISOString(),
        status: sourcesFailed > 0 ? 'partial' : 'completed',
        sources_targeted: sources?.length || 0,
        sources_successful: sourcesSuccessful,
        sources_failed: sourcesFailed,
        articles_discovered: totalArticles,
        articles_new: newArticles,
        duration_seconds: duration,
        error_summary: errors.length > 0 ? errors : null
      })
      .eq('id', runId);

    console.log('\n' + '='.repeat(80));
    console.log('✅ BATCH SCRAPING COMPLETE');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Sources scraped: ${sourcesSuccessful}/${sources?.length || 0}`);
    console.log(`   Articles discovered: ${totalArticles}`);
    console.log(`   New articles: ${newArticles}`);
    console.log(`   Duplicates skipped: ${duplicateArticles}`);
    console.log(`   Failures: ${sourcesFailed}`);
    console.log('='.repeat(80));

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      summary: {
        sources_scraped: sourcesSuccessful,
        sources_failed: sourcesFailed,
        articles_discovered: totalArticles,
        articles_new: newArticles,
        duplicates_skipped: duplicateArticles,
        duration_seconds: duration
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ BATCH SCRAPING FAILED:', error.message);

    await supabase
      .from('batch_scrape_runs')
      .update({
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_summary: [{ error: error.message }]
      })
      .eq('id', runId);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================================================
// Helper: Extract articles using Firecrawl Extract API
// ============================================================================
async function extractArticlesFromSource(source: Source, supabase: any): Promise<{ articles: number, newCount: number, duplicateCount: number }> {
  // Calculate lookback window (only get articles newer than last scrape)
  const lookbackHours = 8; // Slightly more than scrape frequency to avoid gaps
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - lookbackHours);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD

  const response = await fetch('https://api.firecrawl.dev/v1/extract', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      urls: [`${source.source_url}/*`],

      // Natural language prompt with date filtering
      prompt: `Extract all news articles published after ${cutoffDateStr} (within last ${lookbackHours} hours).
               For each article, extract:
               - Title (headline)
               - Full URL
               - Description or summary
               - Author name (if shown)
               - Publication date (in YYYY-MM-DD format)
               - Topics/tags (like "merger", "funding", "leadership", "product launch", "regulatory")

               Only include actual articles, not category pages, author pages, or archives.
               Skip articles older than ${cutoffDateStr}.`,

      schema: ARTICLE_SCHEMA,

      limit: 30, // Max articles per source per run

      // Don't expand to other domains
      allowExternalLinks: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Extract failed: ${errorText}`);
  }

  const data = await response.json();
  const extractedArticles = data.data || [];

  // Get existing URLs for deduplication
  const { data: existingUrls } = await supabase
    .from('raw_articles')
    .select('url')
    .eq('source_id', source.id);

  const existingUrlSet = new Set((existingUrls || []).map((r: any) => r.url));

  let newCount = 0;
  let duplicateCount = 0;

  // Insert articles
  for (const article of extractedArticles) {
    // Skip if we already have this URL
    if (existingUrlSet.has(article.url)) {
      duplicateCount++;
      continue;
    }

    const { error: insertError } = await supabase
      .from('raw_articles')
      .insert({
        source_id: source.id,
        source_name: source.source_name,
        url: article.url,
        title: article.title,
        description: article.description,
        author: article.author,
        published_at: article.published_at,
        raw_metadata: { topics: article.topics, extraction_method: 'firecrawl_extract' },
        content_length: 0,
        processed: false
      });

    if (!insertError) {
      newCount++;
    } else if (insertError.code === '23505') {
      // Duplicate URL (UNIQUE constraint)
      duplicateCount++;
    }
  }

  return {
    articles: extractedArticles.length,
    newCount,
    duplicateCount
  };
}

// ============================================================================
// Helper: Scrape RSS feed
// ============================================================================
async function scrapeRSS(source: Source): Promise<any[]> {
  const rssUrls = [
    `${source.source_url}/rss`,
    `${source.source_url}/feed`,
    `${source.source_url}/rss.xml`,
    `${source.source_url}/feed.xml`,
    `${source.source_url}/atom.xml`,
  ];

  for (const rssUrl of rssUrls) {
    try {
      const response = await fetch(rssUrl, {
        headers: { 'User-Agent': 'SignalDesk-Scraper/1.0' }
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const articles: any[] = [];

      const itemMatches = xml.matchAll(/<item>(.*?)<\/item>/gs);

      for (const match of itemMatches) {
        const item = match[1];

        const titleMatch = item.match(/<title(?:[^>]*)>(.*?)<\/title>/s);
        const linkMatch = item.match(/<link(?:[^>]*)>(.*?)<\/link>/s);
        const descMatch = item.match(/<description(?:[^>]*)>(.*?)<\/description>/s);
        const pubDateMatch = item.match(/<pubDate(?:[^>]*)>(.*?)<\/pubDate>/s);

        if (titleMatch && linkMatch) {
          articles.push({
            url: linkMatch[1].trim(),
            title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
            description: descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : undefined,
            published_at: pubDateMatch ? new Date(pubDateMatch[1].trim()).toISOString() : undefined,
            raw_metadata: { rss_feed: rssUrl }
          });
        }
      }

      if (articles.length > 0) {
        return articles;
      }
    } catch (error) {
      continue;
    }
  }

  return [];
}
