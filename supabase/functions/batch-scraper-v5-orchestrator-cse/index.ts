// Batch Scraper V5 - Google CSE Orchestrator
// Discovers article URLs using Google Custom Search Engine only
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

  console.log('🔍 BATCH SCRAPER V5 - GOOGLE CSE ORCHESTRATOR');
  console.log(`   Run ID: ${runId}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  try {
    // Create batch run record
    await supabase
      .from('batch_scrape_runs')
      .insert({
        id: runId,
        run_type: 'cse_discovery',
        status: 'running',
        triggered_by: req.headers.get('user-agent') || 'manual'
      });

    // Get active Google CSE sources only
    const { data: sources, error: sourcesError } = await supabase
      .from('source_registry')
      .select('*')
      .eq('active', true)
      .eq('monitor_method', 'google_cse')
      .order('tier', { ascending: true });

    if (sourcesError) throw new Error(`Failed to load sources: ${sourcesError.message}`);

    console.log(`📊 Found ${sources?.length || 0} active Google CSE sources\n`);

    let totalArticles = 0;
    let newArticles = 0;
    let duplicateArticles = 0;
    let sourcesSuccessful = 0;
    let sourcesFailed = 0;
    const errors: any[] = [];

    console.log('🔍 Discovering articles via Google CSE...\n');

    // Process CSE sources in small batches (API has daily quota)
    const BATCH_SIZE = 10; // Process 10 sources at a time
    const MAX_CSE_SOURCES = 50; // Limit to stay within daily quota

    const cseBatch = (sources || []).slice(0, MAX_CSE_SOURCES);

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
        sources_targeted: cseBatch.length,
        sources_successful: sourcesSuccessful,
        sources_failed: sourcesFailed,
        articles_discovered: totalArticles,
        articles_new: newArticles,
        duration_seconds: duration,
        error_summary: errors.length > 0 ? errors : null
      })
      .eq('id', runId);

    console.log('\n' + '='.repeat(80));
    console.log('✅ GOOGLE CSE DISCOVERY COMPLETE');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Sources processed: ${sourcesSuccessful}/${cseBatch.length}`);
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
    console.error('❌ GOOGLE CSE DISCOVERY FAILED:', error.message);

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
        scrape_priority: source.tier,
        scrape_status: 'pending',
        scrape_attempts: 0
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
