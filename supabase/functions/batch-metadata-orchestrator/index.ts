// Batch Metadata Orchestrator - Extract metadata from all articles in parallel batches
// Prevents timeout by spawning multiple parallel extract-article-metadata function calls

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BATCH_SIZE = 10; // Articles per function call
const MAX_PARALLEL_BATCHES = 5; // Parallel function calls

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 1000; // Total articles to process

    console.log('📊 BATCH METADATA ORCHESTRATOR');
    console.log(`   Batch size: ${BATCH_SIZE} articles per call`);
    console.log(`   Max parallel: ${MAX_PARALLEL_BATCHES} concurrent calls`);
    console.log(`   Total limit: ${limit} articles\n`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get articles without metadata
    const { data: articlesNeedingMetadata, error: fetchError } = await supabase
      .from('raw_articles')
      .select('id')
      .eq('scrape_status', 'completed')
      .is('extracted_metadata', null)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    if (!articlesNeedingMetadata || articlesNeedingMetadata.length === 0) {
      console.log('✅ No articles need metadata extraction');
      return new Response(JSON.stringify({
        success: true,
        message: 'All articles have metadata',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${articlesNeedingMetadata.length} articles needing metadata\n`);

    const articleIds = articlesNeedingMetadata.map(a => a.id);

    // Split into batches
    const batches: string[][] = [];
    for (let i = 0; i < articleIds.length; i += BATCH_SIZE) {
      batches.push(articleIds.slice(i, i + BATCH_SIZE));
    }

    console.log(`Split into ${batches.length} batches of ${BATCH_SIZE}\n`);

    let totalProcessed = 0;
    let totalFailed = 0;

    // Process batches in parallel chunks
    for (let i = 0; i < batches.length; i += MAX_PARALLEL_BATCHES) {
      const chunk = batches.slice(i, i + MAX_PARALLEL_BATCHES);
      console.log(`\nProcessing batches ${i + 1}-${i + chunk.length} (${chunk.length} parallel calls)...`);

      const promises = chunk.map(async (batch, batchIndex) => {
        const actualBatchNum = i + batchIndex + 1;
        console.log(`  Batch ${actualBatchNum}: Calling extract-article-metadata with ${batch.length} articles`);

        try {
          const response = await fetch(
            `${SUPABASE_URL}/functions/v1/extract-article-metadata`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                article_ids: batch,
                batch_mode: false // Don't return full results, just stats
              })
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }

          const result = await response.json();
          console.log(`  Batch ${actualBatchNum}: ✅ ${result.processed} processed, ${result.failed} failed`);

          return {
            success: true,
            processed: result.processed || 0,
            failed: result.failed || 0
          };
        } catch (error) {
          console.error(`  Batch ${actualBatchNum}: ❌ ${error.message}`);
          return {
            success: false,
            processed: 0,
            failed: batch.length
          };
        }
      });

      const results = await Promise.all(promises);

      results.forEach(result => {
        totalProcessed += result.processed;
        totalFailed += result.failed;
      });

      console.log(`  Chunk complete: ${totalProcessed} total processed, ${totalFailed} total failed`);
    }

    console.log(`\n✅ ORCHESTRATION COMPLETE`);
    console.log(`   Processed: ${totalProcessed}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Total: ${totalProcessed + totalFailed}`);

    return new Response(JSON.stringify({
      success: true,
      total_batches: batches.length,
      processed: totalProcessed,
      failed: totalFailed,
      total: totalProcessed + totalFailed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Orchestrator Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
