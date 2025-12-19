// Parallel Scraper Launcher
// Launches multiple batch-scraper-v5-worker instances in parallel
// Called by cron job to maximize throughput

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const DEFAULT_PARALLEL_WORKERS = 3;
const DEFAULT_BATCH_SIZE = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const numWorkers = body.workers || DEFAULT_PARALLEL_WORKERS;
    const batchSize = body.batch_size || DEFAULT_BATCH_SIZE;
    const drainQueue = body.drain_queue !== false; // Default true

    console.log('🚀 PARALLEL SCRAPER LAUNCHER');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Workers: ${numWorkers}`);
    console.log(`   Batch size: ${batchSize}`);
    console.log(`   Drain mode: ${drainQueue}\n`);

    // Launch workers in parallel (don't await - fire and forget)
    const workerPromises = [];

    for (let i = 0; i < numWorkers; i++) {
      const workerPromise = fetch(`${SUPABASE_URL}/functions/v1/batch-scraper-v5-worker`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batch_size: batchSize,
          drain_queue: drainQueue
        })
      }).then(async (res) => {
        const data = await res.json().catch(() => ({ error: 'Parse error' }));
        return { worker: i + 1, status: res.status, data };
      }).catch((err) => {
        return { worker: i + 1, status: 500, error: err.message };
      });

      workerPromises.push(workerPromise);
      console.log(`   Launched worker ${i + 1}`);
    }

    // Wait for all workers to complete
    const results = await Promise.all(workerPromises);

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Aggregate stats
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    results.forEach((r: any) => {
      if (r.data?.summary) {
        totalProcessed += r.data.summary.processed || 0;
        totalSuccessful += r.data.summary.successful || 0;
        totalFailed += r.data.summary.failed || 0;
      }
    });

    console.log('\n✅ PARALLEL LAUNCHER COMPLETE');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   Total successful: ${totalSuccessful}`);
    console.log(`   Total failed: ${totalFailed}`);

    return new Response(JSON.stringify({
      success: true,
      workers_launched: numWorkers,
      duration_seconds: duration,
      aggregate: {
        processed: totalProcessed,
        successful: totalSuccessful,
        failed: totalFailed
      },
      worker_results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Parallel launcher error:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
