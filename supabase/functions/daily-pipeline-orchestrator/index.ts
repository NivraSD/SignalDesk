// Daily Pipeline Orchestrator
// Coordinates all scraping stages in sequence with proper completion awareness
// Replaces fragmented cron jobs with a single coordinated pipeline

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Timeouts and limits
const WORKER_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes max for worker phase
const WORKER_BATCH_SIZE = 50; // Increased from 20 - Firecrawl handles 5 in parallel internally
const WORKER_DELAY_MS = 2000; // 2 seconds between worker batches (was 3)
const EMBED_BATCH_SIZE = 100;
const EMBED_DELAY_MS = 5000; // 5 seconds between embedding batches to avoid rate limits
const MAX_EMBED_BATCHES = 10;

interface StageResult {
  stage: string;
  success: boolean;
  duration_ms: number;
  details?: Record<string, unknown>;
  error?: string;
}

// Helper to call an edge function
async function callFunction(
  functionName: string,
  body: Record<string, unknown> = {}
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get count of pending articles
async function getPendingCount(supabase: ReturnType<typeof createClient>): Promise<number> {
  const { count } = await supabase
    .from('raw_articles')
    .select('id', { count: 'exact', head: true })
    .eq('scrape_status', 'pending');
  return count || 0;
}

// Get count of processing articles (stuck)
async function getProcessingCount(supabase: ReturnType<typeof createClient>): Promise<number> {
  const { count } = await supabase
    .from('raw_articles')
    .select('id', { count: 'exact', head: true })
    .eq('scrape_status', 'processing');
  return count || 0;
}

// Get count of unembedded articles (last 48h)
async function getUnembeddedCount(supabase: ReturnType<typeof createClient>): Promise<number> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('raw_articles')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)
    .in('scrape_status', ['completed', 'metadata_only', 'pending'])
    .gte('scraped_at', since);
  return count || 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const pipelineStart = Date.now();
  const results: StageResult[] = [];

  try {
    const body = await req.json().catch(() => ({}));
    const skipDiscovery = body.skip_discovery || false;
    const skipWorker = body.skip_worker || false;
    const skipMetadata = body.skip_metadata || false;
    const skipEmbedding = body.skip_embedding || false;
    const skipMatching = body.skip_matching || false;

    console.log('🚀 DAILY PIPELINE ORCHESTRATOR');
    console.log(`   Started: ${new Date().toISOString()}`);
    console.log(`   Options: skip_discovery=${skipDiscovery}, skip_worker=${skipWorker}, skip_embedding=${skipEmbedding}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // =========================================================================
    // STAGE 1: DISCOVERY (parallel)
    // =========================================================================
    if (!skipDiscovery) {
      console.log('\n📡 STAGE 1: DISCOVERY');
      const discoveryStart = Date.now();

      const [rss, sitemap, fireplexity, cse] = await Promise.all([
        callFunction('batch-scraper-v5-orchestrator-rss'),
        callFunction('batch-scraper-v5-orchestrator-sitemap'),
        callFunction('batch-scraper-v5-orchestrator-fireplexity'),
        callFunction('batch-scraper-v5-orchestrator-cse')
      ]);

      const discoveryDuration = Date.now() - discoveryStart;
      const discoverySuccess = rss.success || sitemap.success || fireplexity.success || cse.success;

      results.push({
        stage: 'discovery',
        success: discoverySuccess,
        duration_ms: discoveryDuration,
        details: {
          rss: rss.success ? rss.data : rss.error,
          sitemap: sitemap.success ? sitemap.data : sitemap.error,
          fireplexity: fireplexity.success ? fireplexity.data : fireplexity.error,
          cse: cse.success ? cse.data : cse.error
        }
      });

      console.log(`   Discovery completed in ${discoveryDuration}ms`);
      console.log(`   RSS: ${rss.success ? '✓' : '✗'}, Sitemap: ${sitemap.success ? '✓' : '✗'}, Fireplexity: ${fireplexity.success ? '✓' : '✗'}, CSE: ${cse.success ? '✓' : '✗'}`);
    }

    // =========================================================================
    // STAGE 2: WORKER (loop until queue clear or timeout)
    // =========================================================================
    if (!skipWorker) {
      console.log('\n🔧 STAGE 2: WORKER (scraping)');
      const workerStart = Date.now();
      let workerIterations = 0;
      let totalProcessed = 0;
      let lastPendingCount = await getPendingCount(supabase);

      console.log(`   Starting with ${lastPendingCount} pending articles`);

      while (Date.now() - workerStart < WORKER_TIMEOUT_MS) {
        const pendingCount = await getPendingCount(supabase);

        if (pendingCount === 0) {
          console.log(`   Queue empty after ${workerIterations} iterations`);
          break;
        }

        // If pending count hasn't changed in 3 iterations, might be stuck
        if (workerIterations > 0 && pendingCount === lastPendingCount && workerIterations % 3 === 0) {
          console.log(`   Warning: Pending count unchanged at ${pendingCount}, checking for stuck articles...`);
        }

        const result = await callFunction('batch-scraper-v5-worker', { batch_size: WORKER_BATCH_SIZE });
        workerIterations++;

        if (result.success && result.data) {
          const data = result.data as { successful?: number; processed?: number };
          totalProcessed += data.successful || data.processed || 0;
        }

        lastPendingCount = pendingCount;

        // Brief delay between batches
        await new Promise(r => setTimeout(r, WORKER_DELAY_MS));
      }

      const workerDuration = Date.now() - workerStart;
      const finalPending = await getPendingCount(supabase);

      results.push({
        stage: 'worker',
        success: true,
        duration_ms: workerDuration,
        details: {
          iterations: workerIterations,
          total_processed: totalProcessed,
          remaining_pending: finalPending
        }
      });

      console.log(`   Worker completed: ${workerIterations} iterations, ${totalProcessed} processed, ${finalPending} remaining`);
    }

    // =========================================================================
    // STAGE 2.5: RESET STUCK "PROCESSING" ARTICLES
    // =========================================================================
    const processingCount = await getProcessingCount(supabase);
    if (processingCount > 0) {
      console.log(`\n🔄 STAGE 2.5: Resetting ${processingCount} stuck "processing" articles`);

      // Reset articles that have been "processing" for more than 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { error: resetError } = await supabase
        .from('raw_articles')
        .update({
          scrape_status: 'pending',
          scrape_attempts: supabase.rpc('increment_scrape_attempts') // Will need to handle this differently
        })
        .eq('scrape_status', 'processing')
        .lt('last_scrape_attempt', tenMinutesAgo);

      // Simpler reset without incrementing attempts
      if (resetError) {
        await supabase
          .from('raw_articles')
          .update({ scrape_status: 'pending' })
          .eq('scrape_status', 'processing')
          .lt('last_scrape_attempt', tenMinutesAgo);
      }

      console.log(`   Reset stuck articles to pending`);
    }

    // =========================================================================
    // STAGE 3: METADATA EXTRACTION
    // =========================================================================
    if (!skipMetadata) {
      console.log('\n📋 STAGE 3: METADATA EXTRACTION');
      const metadataStart = Date.now();

      const result = await callFunction('batch-metadata-orchestrator', { limit: 200 });
      const metadataDuration = Date.now() - metadataStart;

      results.push({
        stage: 'metadata',
        success: result.success,
        duration_ms: metadataDuration,
        details: result.data as Record<string, unknown>,
        error: result.error
      });

      console.log(`   Metadata extraction: ${result.success ? '✓' : '✗'} in ${metadataDuration}ms`);
    }

    // =========================================================================
    // STAGE 4: EMBEDDING (with rate limit protection)
    // =========================================================================
    if (!skipEmbedding) {
      console.log('\n🧠 STAGE 4: EMBEDDING');
      const embeddingStart = Date.now();
      let embeddingIterations = 0;
      let totalEmbedded = 0;

      let unembeddedCount = await getUnembeddedCount(supabase);
      console.log(`   Starting with ${unembeddedCount} unembedded articles`);

      while (unembeddedCount > 0 && embeddingIterations < MAX_EMBED_BATCHES) {
        const result = await callFunction('batch-embed-articles', {
          batch_size: EMBED_BATCH_SIZE,
          hours_back: 48,
          max_batches: 2 // Process 2 batches per call to stay under rate limits
        });

        embeddingIterations++;

        if (result.success && result.data) {
          const data = result.data as { embedded?: number; processed?: number };
          totalEmbedded += data.embedded || data.processed || 0;
        } else {
          console.log(`   Embedding batch ${embeddingIterations} failed: ${result.error}`);
          // If rate limited, wait longer
          if (result.error?.includes('429') || result.error?.includes('rate')) {
            console.log(`   Rate limited, waiting 30 seconds...`);
            await new Promise(r => setTimeout(r, 30000));
          }
        }

        unembeddedCount = await getUnembeddedCount(supabase);

        // Delay between batches to avoid rate limits
        await new Promise(r => setTimeout(r, EMBED_DELAY_MS));
      }

      const embeddingDuration = Date.now() - embeddingStart;
      const finalUnembedded = await getUnembeddedCount(supabase);

      results.push({
        stage: 'embedding',
        success: true,
        duration_ms: embeddingDuration,
        details: {
          iterations: embeddingIterations,
          total_embedded: totalEmbedded,
          remaining_unembedded: finalUnembedded
        }
      });

      console.log(`   Embedding completed: ${embeddingIterations} iterations, ${totalEmbedded} embedded, ${finalUnembedded} remaining`);
    }

    // =========================================================================
    // STAGE 5: SIGNAL MATCHING
    // =========================================================================
    if (!skipMatching) {
      console.log('\n🎯 STAGE 5: SIGNAL MATCHING');
      const matchingStart = Date.now();

      const result = await callFunction('batch-match-signals', {
        hours_back: 48,
        max_articles: 500
      });

      const matchingDuration = Date.now() - matchingStart;

      results.push({
        stage: 'matching',
        success: result.success,
        duration_ms: matchingDuration,
        details: result.data as Record<string, unknown>,
        error: result.error
      });

      console.log(`   Matching: ${result.success ? '✓' : '✗'} in ${matchingDuration}ms`);
    }

    // =========================================================================
    // SUMMARY
    // =========================================================================
    const totalDuration = Date.now() - pipelineStart;

    console.log('\n📊 PIPELINE COMPLETE');
    console.log(`   Total duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`   Stages: ${results.filter(r => r.success).length}/${results.length} successful`);

    // Log pipeline run to database
    try {
      await supabase.from('pipeline_runs').insert({
        run_type: 'daily_orchestrator',
        status: results.every(r => r.success) ? 'completed' : 'partial',
        started_at: new Date(pipelineStart).toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round(totalDuration / 1000),
        metadata: { stages: results }
      });
    } catch {
      // Table might not exist yet, ignore
    }

    return new Response(JSON.stringify({
      success: true,
      duration_seconds: Math.round(totalDuration / 1000),
      stages: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Pipeline error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stages: results
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
