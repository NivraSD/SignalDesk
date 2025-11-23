// Batch Scraper V4 - Discovery Phase
// Discovers article URLs using RSS and Google Custom Search Engine
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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const runId = crypto.randomUUID();
  const startTime = Date.now();

  console.log('🔍 BATCH SCRAPER V5 - ORCHESTRATOR (Discovery + Queue)');
  console.log(`   Run ID: ${runId}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

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

    // Get active sources
    const { data: sources, error: sourcesError } = await supabase
      .from('source_registry')
      .select('*')
      .eq('active', true)
      .order('tier', { ascending: true });

    if (sourcesError) throw new Error(`Failed to load sources: ${sourcesError.message}`);

    console.log(`📊 Found ${sources?.length || 0} active sources\n`);

    // Separate by discovery method
    const rssSources = sources?.filter(s => s.monitor_method === 'rss') || [];
    const cseSources = sources?.filter(s => s.monitor_method === 'google_cse') || [];

    console.log(`   📡 RSS sources: ${rssSources.length}`);
    console.log(`   🔍 Google CSE sources: ${cseSources.length}\n`);

    let totalArticles = 0;
    let newArticles = 0;
    let duplicateArticles = 0;
    let sourcesSuccessful = 0;
    let sourcesFailed = 0;
    const errors: any[] = [];

    // ========================================================================
    // PHASE 1: RSS Discovery (Fast, Free, Reliable)
    // ========================================================================
    console.log('📡 PHASE 1: Discovering articles via RSS...\n');

    for (const source of rssSources) {
      try {
        const articles = await discoverViaRSS(source);

        if (articles.length === 0) {
          console.log(`   ⚠️  ${source.source_name}: No RSS feed found`);
          sourcesFailed++;
          errors.push({ source: source.source_name, error: 'No valid RSS feed' });
          continue;
        }

        totalArticles += articles.length;

        // Check for duplicates
        const { data: existingUrls } = await supabase
          .from('raw_articles')
          .select('url')
          .eq('source_id', source.id);

        const existingUrlSet = new Set((existingUrls || []).map(r => r.url));

        // Insert new articles
        let sourceNewArticles = 0;
        for (const article of articles) {
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
              raw_metadata: { ...article.raw_metadata, discovery_method: 'rss' },
              content_length: 0,
              processed: false,
              scrape_priority: source.tier,  // V5: Priority based on tier (1=high, 3=low)
              scrape_status: 'pending',       // V5: Queue status
              scrape_attempts: 0              // V5: Retry counter
            });

          if (!insertError) {
            newArticles++;
            sourceNewArticles++;
          } else if (insertError.code === '23505') {
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
    // PHASE 2: Google Custom Search Engine Discovery
    // ========================================================================
    console.log('\n🔍 PHASE 2: Discovering articles via Google CSE...\n');

    // Process CSE sources in small batches (API has daily quota)
    const BATCH_SIZE = 10; // Process 10 sources at a time
    const MAX_CSE_SOURCES = 50; // Limit to stay within daily quota

    const cseBatch = cseSources.slice(0, MAX_CSE_SOURCES);

    for (let i = 0; i < cseBatch.length; i += BATCH_SIZE) {
      const batch = cseBatch.slice(i, i + BATCH_SIZE);

      console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(cseBatch.length / BATCH_SIZE)}: Processing ${batch.length} sources...`);

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(source => discoverViaGoogleCSE(source, supabase))
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

          console.log(`   ✅ ${source.source_name}: ${newCount} new / ${articles} total`);

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

      // Rate limiting between batches (Google CSE has quotas)
      if (i + BATCH_SIZE < cseBatch.length) {
        console.log(`   ⏳ Waiting 2 seconds before next batch...\n`);
        await new Promise(resolve => setTimeout(resolve, 2000));
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
    console.log('✅ DISCOVERY PHASE COMPLETE');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Sources processed: ${sourcesSuccessful}/${sources?.length || 0}`);
    console.log(`   Articles discovered: ${totalArticles}`);
    console.log(`   New URLs: ${newArticles}`);
    console.log(`   Duplicates skipped: ${duplicateArticles}`);
    console.log(`   Failures: ${sourcesFailed}`);
    console.log('='.repeat(80));

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      summary: {
        sources_processed: sourcesSuccessful,
        sources_failed: sourcesFailed,
        articles_discovered: totalArticles,
        new_urls: newArticles,
        duplicates_skipped: duplicateArticles,
        duration_seconds: duration
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ DISCOVERY FAILED:', error.message);

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
// Helper: Discover articles via RSS
// ============================================================================
async function discoverViaRSS(source: Source): Promise<any[]> {
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
        headers: { 'User-Agent': 'SignalDesk-Scraper/4.0' }
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
        const authorMatch = item.match(/<(?:dc:)?creator(?:[^>]*)>(.*?)<\/(?:dc:)?creator>/s);

        if (titleMatch && linkMatch) {
          articles.push({
            url: linkMatch[1].trim(),
            title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
            description: descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : undefined,
            author: authorMatch ? authorMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : undefined,
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

// ============================================================================
// Helper: Discover articles via Google Custom Search Engine
// ============================================================================
async function discoverViaGoogleCSE(source: Source, supabase: any): Promise<{ articles: number, newCount: number, duplicateCount: number }> {
  // Calculate date range (last 7 days)
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const afterDate = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD

  // Extract domain from source URL
  const domain = new URL(source.source_url).hostname.replace('www.', '');

  // Build search query
  const query = `site:${domain} after:${afterDate}`;

  // Call existing niv-google-cse Edge Function
  const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-google-cse`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: query,
      max_results: 10,
      date_restrict: 'd7' // Last 7 days
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google CSE failed: ${errorText}`);
  }

  const data = await response.json();
  const results = data.results || [];

  // Get existing URLs for deduplication
  const { data: existingUrls } = await supabase
    .from('raw_articles')
    .select('url')
    .eq('source_id', source.id);

  const existingUrlSet = new Set((existingUrls || []).map((r: any) => r.url));

  let newCount = 0;
  let duplicateCount = 0;

  // Insert discovered URLs
  for (const result of results) {
    const url = result.url;
    const title = result.title;
    const description = result.snippet;

    // Skip if we already have this URL
    if (existingUrlSet.has(url)) {
      duplicateCount++;
      continue;
    }

    const { error: insertError } = await supabase
      .from('raw_articles')
      .insert({
        source_id: source.id,
        source_name: source.source_name,
        url: url,
        title: title,
        description: description,
        published_at: result.published_date || null,
        raw_metadata: {
          discovery_method: 'google_cse',
          cse_snippet: description,
          age_hours: result.age_hours
        },
        content_length: 0,
        processed: false,
        scrape_priority: source.tier,  // V5: Priority based on tier
        scrape_status: 'pending',       // V5: Queue status
        scrape_attempts: 0              // V5: Retry counter
      });

    if (!insertError) {
      newCount++;
    } else if (insertError.code === '23505') {
      duplicateCount++;
    }
  }

  return {
    articles: results.length,
    newCount,
    duplicateCount
  };
}
