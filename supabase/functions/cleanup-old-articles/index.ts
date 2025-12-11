// Cleanup Old Articles
// Removes articles older than 72 hours to prevent database bloat
// Also cleans up orphaned matches

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Batch size for deletion - keep small to stay under URL length limits
const BATCH_SIZE = 100;
const MAX_BATCHES = 20; // Process max 2000 articles per run to stay under timeout

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const hoursToKeep = body.hours_to_keep || 72;
    const dryRun = body.dry_run || false;

    console.log('🧹 CLEANUP OLD ARTICLES');
    console.log(`   Hours to keep: ${hoursToKeep}`);
    console.log(`   Dry run: ${dryRun}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const cutoffDate = new Date(Date.now() - hoursToKeep * 60 * 60 * 1000).toISOString();

    console.log(`   Cutoff date: ${cutoffDate}`);

    // Count articles to delete
    const { count: articlesToDelete } = await supabase
      .from('raw_articles')
      .select('id', { count: 'exact', head: true })
      .lt('scraped_at', cutoffDate);

    console.log(`   Articles older than ${hoursToKeep}h: ${articlesToDelete}`);

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true,
        dry_run: true,
        would_delete: {
          raw_articles: articlesToDelete
        },
        cutoff_date: cutoffDate
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let articlesDeleted = 0;
    let matchesDeleted = 0;
    let batchCount = 0;

    // Process in batches until done or max batches reached
    while (batchCount < MAX_BATCHES) {
      // Get batch of article IDs to delete
      const { data: oldArticles, error: fetchError } = await supabase
        .from('raw_articles')
        .select('id')
        .lt('scraped_at', cutoffDate)
        .limit(BATCH_SIZE);

      if (fetchError) {
        console.error('   Fetch error:', fetchError);
        break;
      }

      if (!oldArticles || oldArticles.length === 0) {
        console.log('   No more articles to delete');
        break;
      }

      const articleIds = oldArticles.map(a => a.id);
      console.log(`   Batch ${batchCount + 1}: Processing ${articleIds.length} articles...`);

      // Delete matches for these articles first (foreign key constraint)
      // Use in.() filter to delete all matches in one request
      const matchDeleteRes = await fetch(
        `${SUPABASE_URL}/rest/v1/target_article_matches?article_id=in.(${articleIds.join(',')})`,
        {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Prefer': 'return=representation'
          }
        }
      );

      if (matchDeleteRes.ok) {
        const deletedMatches = await matchDeleteRes.json();
        matchesDeleted += Array.isArray(deletedMatches) ? deletedMatches.length : 0;
      }

      // Delete articles using in.() filter - single request for all IDs
      const articleDeleteRes = await fetch(
        `${SUPABASE_URL}/rest/v1/raw_articles?id=in.(${articleIds.join(',')})`,
        {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Prefer': 'return=representation'
          }
        }
      );

      if (articleDeleteRes.ok) {
        const deletedArticles = await articleDeleteRes.json();
        const count = Array.isArray(deletedArticles) ? deletedArticles.length : 0;
        articlesDeleted += count;
        console.log(`   Batch ${batchCount + 1} complete: ${count} articles deleted`);
      } else {
        const errorText = await articleDeleteRes.text();
        console.error(`   Batch ${batchCount + 1} failed: ${articleDeleteRes.status} - ${errorText}`);
      }

      batchCount++;
    }

    console.log(`   Total: ${articlesDeleted} articles, ${matchesDeleted} matches deleted`);

    // Also clean up old batch_scrape_runs (keep 7 days) using REST API
    const runsCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const runsDeleteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/batch_scrape_runs?started_at=lt.${encodeURIComponent(runsCutoff)}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=representation'
        }
      }
    );

    let runsDeleted = 0;
    if (runsDeleteRes.ok) {
      const deletedRuns = await runsDeleteRes.json();
      runsDeleted = Array.isArray(deletedRuns) ? deletedRuns.length : 0;
    }
    console.log(`   Deleted ${runsDeleted} old batch_scrape_runs`);

    // Clean up old pipeline_runs (keep 30 days)
    const pipelineCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const pipelineDeleteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/pipeline_runs?started_at=lt.${encodeURIComponent(pipelineCutoff)}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=representation'
        }
      }
    );

    let pipelineRunsDeleted = 0;
    if (pipelineDeleteRes.ok) {
      const deletedPipelineRuns = await pipelineDeleteRes.json();
      pipelineRunsDeleted = Array.isArray(deletedPipelineRuns) ? deletedPipelineRuns.length : 0;
    }
    console.log(`   Deleted ${pipelineRunsDeleted} old pipeline_runs`);

    // Clean up old embedding_jobs (keep 7 days)
    const embedDeleteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/embedding_jobs?created_at=lt.${encodeURIComponent(runsCutoff)}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=representation'
        }
      }
    );

    let embedJobsDeleted = 0;
    if (embedDeleteRes.ok) {
      const deletedJobs = await embedDeleteRes.json();
      embedJobsDeleted = Array.isArray(deletedJobs) ? deletedJobs.length : 0;
    }
    console.log(`   Deleted ${embedJobsDeleted} old embedding_jobs`);

    const duration = Math.round((Date.now() - startTime) / 1000);
    const remainingToDelete = Math.max(0, (articlesToDelete || 0) - articlesDeleted);

    const summary = {
      success: true,
      deleted: {
        raw_articles: articlesDeleted,
        target_article_matches: matchesDeleted,
        batch_scrape_runs: runsDeleted,
        pipeline_runs: pipelineRunsDeleted,
        embedding_jobs: embedJobsDeleted
      },
      remaining_to_delete: remainingToDelete,
      batches_processed: batchCount,
      cutoff_date: cutoffDate,
      duration_seconds: duration
    };

    console.log('\n📊 Cleanup complete:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
