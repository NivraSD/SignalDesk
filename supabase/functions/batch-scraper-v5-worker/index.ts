// Batch Scraper V5 - Worker
// Pulls articles from scrape queue and processes them using mcp-firecrawl parallel batch scraping
// mcp-firecrawl scrapes 5 articles in parallel internally, with built-in caching

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BATCH_SIZE = 10; // Reduced from 25 to avoid timeouts with slow sites (WSJ, etc) - mcp-firecrawl scrapes 5 in parallel
const MAX_ARTICLE_AGE_DAYS = 3; // Reject articles older than this
const MAX_DRAIN_TIME_MS = 120 * 1000; // 120 seconds max when draining (Edge Function timeout is 150s)
const DRAIN_BATCH_DELAY_MS = 500; // 0.5 seconds between batches when draining
// Finalize before the ~150s gateway wall-clock kill. Past this we stop and
// close out the run cleanly instead of being terminated mid-batch (which
// leaves the run stuck 'running' and its articles orphaned in 'processing').
const WORKER_DEADLINE_MS = 130 * 1000;
// A batch's articles sit in 'processing' while being scraped. If a run is
// killed before it can resolve them, they're stranded — the queue query only
// picks up 'pending'/'failed', so nothing ever reclaims them. Any 'processing'
// row older than this is treated as orphaned and reset to 'pending'.
const PROCESSING_STALE_MS = 10 * 60 * 1000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const startTime = Date.now();
  const runId = crypto.randomUUID();

  // Read options from request body
  const requestBody = await req.json().catch(() => ({}));
  const batchSize = requestBody.batch_size || BATCH_SIZE;
  const drainQueue = requestBody.drain_queue || false; // When true, keep processing until queue empty

  console.log('🔥 BATCH SCRAPER V5 - WORKER (MCP-Firecrawl Parallel Batch Scraper)');
  console.log(`   Run ID: ${runId}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   Batch size: ${batchSize}`);
  console.log(`   Drain queue: ${drainQueue}\n`);

  const deadline = startTime + WORKER_DEADLINE_MS;

  // Create batch run record for tracking
  await supabase
    .from('batch_scrape_runs')
    .insert({
      id: runId,
      run_type: 'worker',
      status: 'running',
      triggered_by: req.headers.get('user-agent') || 'cron'
    });

  // Self-heal: reclaim articles orphaned in 'processing' by a previously
  // killed run. Runs every invocation, so leaks recover on their own.
  {
    const staleCutoff = new Date(Date.now() - PROCESSING_STALE_MS).toISOString();
    const { count: reclaimed } = await supabase
      .from('raw_articles')
      .update({ scrape_status: 'pending' })
      .eq('scrape_status', 'processing')
      .lt('last_scrape_attempt', staleCutoff)
      .select('id', { count: 'exact', head: true });
    if (reclaimed && reclaimed > 0) {
      console.log(`🔄 Reclaimed ${reclaimed} orphaned 'processing' articles from a prior killed run`);
    }
  }

  // Track totals across all batches when draining
  let totalProcessed = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  let batchCount = 0;
  // IDs of the batch currently in 'processing'. On error/abort we reset these
  // to 'pending' so a killed run doesn't strand its own batch.
  let inFlightIds: string[] = [];

  try {
    // Main processing loop - runs once normally, or until queue empty/timeout when draining
    while (true) {
      // Stop before the gateway kills us mid-batch. In drain mode we may have
      // already done useful work; either way we exit cleanly and finalize.
      const drainStop = drainQueue && (Date.now() - startTime) >= MAX_DRAIN_TIME_MS;
      if (drainStop || Date.now() >= deadline) {
        console.log(`\n⏱️  ${drainStop ? 'Drain timeout' : 'Worker deadline'} reached - stopping`);
        break;
      }

      batchCount++;
      if (drainQueue) {
        console.log(`\n--- BATCH ${batchCount} (elapsed: ${Math.floor((Date.now() - startTime) / 1000)}s) ---`);
      }

      // ========================================================================
      // STEP 1: Get articles from queue (pending or failed with <3 attempts)
      // ========================================================================
      const { data: queuedArticles, error: queueError } = await supabase
        .from('raw_articles')
        .select('id, url, title, source_name, scrape_priority, scrape_attempts')
        .is('full_content', null)
        .in('scrape_status', ['pending', 'failed'])
        .lt('scrape_attempts', 3)
        .order('scrape_priority', { ascending: true })  // High priority first (1=Tier 1)
        .order('created_at', { ascending: false })       // Newest first
        .limit(batchSize);

      if (queueError) throw new Error(`Failed to load queue: ${queueError.message}`);

      if (!queuedArticles || queuedArticles.length === 0) {
        console.log('   ℹ️  Queue is empty - no articles to process\n');

        // If draining and we've processed some, this is success
        if (drainQueue && totalProcessed > 0) {
          console.log(`✅ Queue drained! Processed ${totalProcessed} articles across ${batchCount - 1} batches`);
          break;
        }

        // Mark run as completed even when queue is empty
        await supabase
          .from('batch_scrape_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            articles_discovered: totalProcessed,
            articles_new: totalSuccessful,
            duration_seconds: Math.floor((Date.now() - startTime) / 1000)
          })
          .eq('id', runId);

        return new Response(JSON.stringify({
          success: true,
          message: 'Queue is empty',
          processed: totalProcessed,
          successful: totalSuccessful,
          failed: totalFailed,
          batches: batchCount - 1
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`📊 Found ${queuedArticles.length} articles in queue`);
      console.log(`   Priority distribution: ${JSON.stringify(
        queuedArticles.reduce((acc, a) => {
          acc[`Tier ${a.scrape_priority}`] = (acc[`Tier ${a.scrape_priority}`] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )}\n`);

      // Mark articles as processing
      const articleIds = queuedArticles.map(a => a.id);
      inFlightIds = articleIds;
      await supabase
        .from('raw_articles')
        .update({
          scrape_status: 'processing',
          last_scrape_attempt: new Date().toISOString()
        })
        .in('id', articleIds);

      // ========================================================================
      // STEP 2: Call mcp-firecrawl batch_scrape_articles (with retry for 503)
      // ========================================================================
      console.log('🔥 Calling mcp-firecrawl for parallel batch scraping...\n');

      const mcpPayload = {
        method: 'tools/call',
        params: {
          name: 'batch_scrape_articles',
          arguments: {
            articles: queuedArticles.map(article => ({
              url: article.url,
              priority: article.scrape_priority,
              metadata: {
                id: article.id,
                title: article.title,
                source_name: article.source_name
              }
            })),
            formats: ['markdown'],
            onlyMainContent: true,  // Extract only main content, filter out navigation/boilerplate
            maxTimeout: 30000,  // Increased from 10s to 30s for sites with heavy JS/anti-scraping (WSJ, etc)
            // Extract published date using LLM when metadata doesn't have it
            extractSchema: {
              type: 'object',
              properties: {
                published_date: {
                  type: 'string',
                  description: 'The publication date of this article in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ). Look for dates near the title, byline, or at the top of the article.'
                }
              }
            }
          }
        }
      };

      // Retry logic for 503 BOOT_ERROR (cold start issues with Supabase Edge Functions)
      const MAX_RETRIES = 3;
      const RETRY_DELAYS = [2000, 4000, 8000]; // Exponential backoff: 2s, 4s, 8s
      let mcpResponse: Response | null = null;
      let lastError = '';

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        // Don't start (or retry) an mcp call we can't finish before the
        // deadline — that's what previously ran the worker into the gateway
        // kill. Bail out and let the batch's articles reset to pending.
        const budgetMs = deadline - Date.now();
        if (budgetMs < 5000) {
          lastError = lastError || 'worker deadline reached before mcp-firecrawl could run';
          console.log(`   ⏱️  Only ${Math.round(budgetMs / 1000)}s of budget left — not calling mcp-firecrawl`);
          break;
        }

        if (attempt > 0) {
          const delay = RETRY_DELAYS[attempt - 1] || 8000;
          console.log(`   ⏳ Retry ${attempt}/${MAX_RETRIES} after ${delay}ms delay...`);
          await new Promise(r => setTimeout(r, delay));
        }

        try {
          // AbortSignal bounds the call so a hung mcp-firecrawl / Firecrawl API
          // can't block until the gateway kills the worker. No default timeout
          // exists on fetch — this is the fix for the stuck-'running' runs.
          mcpResponse = await fetch(`${SUPABASE_URL}/functions/v1/mcp-firecrawl`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(mcpPayload),
            signal: AbortSignal.timeout(deadline - Date.now())
          });

          if (mcpResponse.ok) {
            break; // Success!
          }

          // Check if retryable error (503 = BOOT_ERROR, 502 = Gateway, 504 = Timeout)
          if (mcpResponse.status >= 500 && mcpResponse.status < 600) {
            lastError = `${mcpResponse.status} ${await mcpResponse.text()}`;
            console.log(`   ⚠️  mcp-firecrawl returned ${mcpResponse.status}, will retry...`);
            mcpResponse = null; // Mark for retry
          } else {
            // Non-retryable error (4xx)
            throw new Error(`mcp-firecrawl failed: ${mcpResponse.status} ${await mcpResponse.text()}`);
          }
        } catch (fetchError: any) {
          // Network error - also retryable
          lastError = fetchError.message;
          console.log(`   ⚠️  Network error: ${fetchError.message}, will retry...`);
          mcpResponse = null;
        }
      }

      if (!mcpResponse || !mcpResponse.ok) {
        throw new Error(`mcp-firecrawl failed after ${MAX_RETRIES} retries: ${lastError}`);
      }

      const mcpData = await mcpResponse.json();
      const mcpResult = JSON.parse(mcpData.content[0].text);

      console.log('\n📊 mcp-firecrawl Results:');
      console.log(`   Total requested: ${mcpResult.stats.total_requested}`);
      console.log(`   Successful: ${mcpResult.stats.successful}`);
      console.log(`   Failed: ${mcpResult.stats.failed}`);
      console.log(`   Cached: ${mcpResult.stats.cached}`);
      console.log(`   Freshly scraped: ${mcpResult.stats.freshly_scraped}\n`);

      // ========================================================================
      // STEP 3: Update database with results
      // ========================================================================
      console.log('💾 Updating database with scraped content...\n');

      let successCount = 0;
      let failedCount = 0;

      for (const result of mcpResult.results) {
        const articleId = result.metadata?.id;
        if (!articleId) continue;

        if (result.success && result.data?.markdown) {
          // Check content quality before storing
          const qualityCheck = validateArticleContent(
            result.data.markdown,
            result.metadata?.title || '',
            result.url
          );

          // NEW APPROACH: Store even paywalled content with metadata flag
          const isPaywall = qualityCheck.reason?.includes('Paywall');
          const shouldStoreAnyway = isPaywall || qualityCheck.reason?.includes('Cookie consent wall');

          if (!qualityCheck.is_valid && !shouldStoreAnyway) {
            // Content failed quality check (non-paywall) - mark as failed
            const { error: updateError } = await supabase
              .from('raw_articles')
              .update({
                scrape_status: 'failed',
                scrape_attempts: 3, // Max out attempts to prevent retrying
                processing_error: `Quality check failed: ${qualityCheck.reason}`
              })
              .eq('id', articleId);

            if (!updateError) {
              failedCount++;
              console.log(`   ⚠️  ${result.metadata?.title?.substring(0, 50) || result.url.substring(0, 50)}: ${qualityCheck.reason}`);
            }
            continue;
          }

          // Successfully scraped - update with content (may include paywall flag)
          // Extract published date from metadata (try multiple sources)
          const metadata = result.data.metadata || {};
          const publishedDateStr = metadata.publishedTime ||
                                   metadata['article:published_time'] ||
                                   metadata.datePublished ||
                                   metadata.dateCreated ||
                                   null;

          // Convert to ISO string if valid
          let publishedDate = null;
          if (publishedDateStr) {
            try {
              publishedDate = new Date(publishedDateStr).toISOString();
            } catch {
              publishedDate = null;
            }
          }

          // Fallback: Use LLM-extracted date if metadata didn't have it
          if (!publishedDate && result.extracted?.published_date) {
            try {
              publishedDate = new Date(result.extracted.published_date).toISOString();
              console.log(`   📅 Used LLM-extracted date: ${publishedDate}`);
            } catch {
              // Invalid date format from LLM
              publishedDate = null;
            }
          }

          // DATE FILTERING: Reject articles older than MAX_ARTICLE_AGE_DAYS
          if (publishedDate) {
            const articleDate = new Date(publishedDate);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - MAX_ARTICLE_AGE_DAYS);

            if (articleDate < cutoffDate) {
              // Article is too old - mark as failed and skip
              await supabase
                .from('raw_articles')
                .update({
                  scrape_status: 'failed',
                  scrape_attempts: 3, // Max out attempts
                  processing_error: `Article too old: ${publishedDate.split('T')[0]} (>${MAX_ARTICLE_AGE_DAYS} days)`
                })
                .eq('id', articleId);

              failedCount++;
              console.log(`   ⏰ ${result.metadata?.title?.substring(0, 40) || 'Article'}: Too old (${publishedDate.split('T')[0]})`);
              continue;
            }
          }

          // Build update object - only include published_at if we extracted one
          // This preserves existing RSS-provided dates when scraping doesn't extract a date
          const updateData: Record<string, any> = {
            full_content: result.data.markdown,
            scrape_status: 'completed',
            scraped_at: new Date().toISOString(),
            content_length: result.data.markdown.length,
            raw_metadata: {
              ...(result.data.metadata || {}),
              scraping_method: 'mcp_firecrawl',
              cached: result.cached || false,
              quality_check: qualityCheck,
              paywall: isPaywall || false,
              limited_content: !qualityCheck.is_valid
            }
          };

          // Only update published_at if we extracted a valid date
          if (publishedDate) {
            updateData.published_at = publishedDate;
          }

          const { error: updateError } = await supabase
            .from('raw_articles')
            .update(updateData)
            .eq('id', articleId);

          if (!updateError) {
            successCount++;
            const paywallNote = isPaywall ? ' [PAYWALL - headline only]' : '';
            console.log(`   ✅ ${result.metadata.title?.substring(0, 50) || result.url.substring(0, 50)} (${result.data.markdown.length} chars${result.cached ? ', cached' : ''}${paywallNote})`);
          } else {
            console.error(`   ❌ DB update failed for ${articleId}: ${updateError.message}`);
          }
        } else {
          // Failed to scrape - increment attempts
          // Find the original article to get current attempt count
          const originalArticle = queuedArticles.find(a => a.id === articleId);
          const currentAttempts = originalArticle?.scrape_attempts || 0;

          const { error: updateError } = await supabase
            .from('raw_articles')
            .update({
              scrape_status: 'failed',
              scrape_attempts: currentAttempts + 1,
              processing_error: result.error || 'Unknown scraping error'
            })
            .eq('id', articleId);

          if (!updateError) {
            failedCount++;
            console.log(`   ❌ ${result.metadata?.title?.substring(0, 50) || result.url.substring(0, 50)}: ${result.error}`);
          } else {
            console.error(`   ❌ DB update failed for ${articleId}: ${updateError.message}`);
          }
        }
      }

      // Accumulate totals
      totalProcessed += queuedArticles.length;
      totalSuccessful += successCount;
      totalFailed += failedCount;
      // This batch's rows are now resolved to completed/failed — no longer in flight.
      inFlightIds = [];

      const batchDuration = Math.floor((Date.now() - startTime) / 1000);

      console.log(`\n   Batch ${batchCount}: ${queuedArticles.length} processed, ${successCount} successful, ${failedCount} failed (${batchDuration}s elapsed)`);

      // If not draining, return after one batch (original behavior)
      if (!drainQueue) {
        console.log('\n' + '='.repeat(80));
        console.log('✅ WORKER COMPLETE (single batch)');
        console.log(`   Duration: ${batchDuration}s`);
        console.log(`   Processed: ${queuedArticles.length} articles`);
        console.log(`   Successful: ${successCount}`);
        console.log(`   Failed: ${failedCount}`);
        console.log('='.repeat(80));

        // Update batch run record
        // NOTE: only columns that exist on batch_scrape_runs. Referencing a
        // missing column (previously articles_processed) makes PostgREST reject
        // the whole UPDATE, which left every processing run stuck in 'running'.
        const { error: finalizeError } = await supabase
          .from('batch_scrape_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            articles_discovered: queuedArticles.length,
            articles_new: successCount,
            sources_successful: successCount,
            sources_failed: failedCount,
            duration_seconds: batchDuration
          })
          .eq('id', runId);
        if (finalizeError) console.error(`   ⚠️  Failed to finalize run record: ${finalizeError.message}`);

        return new Response(JSON.stringify({
          success: true,
          run_id: runId,
          summary: {
            processed: queuedArticles.length,
            successful: successCount,
            failed: failedCount,
            duration_seconds: batchDuration,
            mcp_stats: mcpResult.stats
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Draining: brief delay before next batch
      await new Promise(r => setTimeout(r, DRAIN_BATCH_DELAY_MS));
    } // End of while loop

    // Cleanup: Reset any stuck "processing" articles back to pending
    // This handles cases where we timed out mid-batch
    if (drainQueue) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: resetCount } = await supabase
        .from('raw_articles')
        .update({ scrape_status: 'pending' })
        .eq('scrape_status', 'processing')
        .lt('last_scrape_attempt', fiveMinutesAgo)
        .select('id', { count: 'exact', head: true });

      if (resetCount && resetCount > 0) {
        console.log(`🔄 Reset ${resetCount} stuck "processing" articles to pending`);
      }
    }

    // If we get here, we've finished draining (timeout or queue empty)
    const totalDuration = Math.floor((Date.now() - startTime) / 1000);

    console.log('\n' + '='.repeat(80));
    console.log('✅ WORKER COMPLETE (drain mode)');
    console.log(`   Duration: ${totalDuration}s`);
    console.log(`   Batches: ${batchCount}`);
    console.log(`   Total processed: ${totalProcessed} articles`);
    console.log(`   Total successful: ${totalSuccessful}`);
    console.log(`   Total failed: ${totalFailed}`);
    console.log('='.repeat(80));

    // Update batch run record (only existing columns — see note above)
    const { error: finalizeError } = await supabase
      .from('batch_scrape_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        articles_discovered: totalProcessed,
        articles_new: totalSuccessful,
        sources_successful: totalSuccessful,
        sources_failed: totalFailed,
        duration_seconds: totalDuration
      })
      .eq('id', runId);
    if (finalizeError) console.error(`   ⚠️  Failed to finalize run record: ${finalizeError.message}`);

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      drain_mode: true,
      summary: {
        batches: batchCount,
        processed: totalProcessed,
        successful: totalSuccessful,
        failed: totalFailed,
        duration_seconds: totalDuration
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    const aborted = error.name === 'TimeoutError' || error.name === 'AbortError';
    console.error(`❌ WORKER ${aborted ? 'ABORTED (deadline)' : 'FAILED'}:`, error.message);

    // Reset this run's in-flight batch back to 'pending' so the next run
    // retries them instead of leaving them stranded in 'processing'.
    if (inFlightIds.length > 0) {
      await supabase
        .from('raw_articles')
        .update({ scrape_status: 'pending' })
        .in('id', inFlightIds)
        .eq('scrape_status', 'processing');
      console.log(`🔄 Reset ${inFlightIds.length} in-flight articles back to pending`);
    }

    // Update batch run record with failure (error_summary, not error_message —
    // the latter doesn't exist and made this UPDATE fail silently too).
    await supabase
      .from('batch_scrape_runs')
      .update({
        status: aborted ? 'partial' : 'failed',
        completed_at: new Date().toISOString(),
        error_summary: [{ error: error.message }],
        duration_seconds: Math.floor((Date.now() - startTime) / 1000)
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
// Article Content Quality Validation
// ============================================================================
interface QualityCheckResult {
  is_valid: boolean;
  reason?: string;
  confidence: number;
}

function validateArticleContent(
  content: string,
  title: string,
  url: string
): QualityCheckResult {
  const contentSample = content.substring(0, 2000).toLowerCase();
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();

  // 0a. Reject garbage titles (XML filenames, numeric IDs, date-only titles)
  const garbageTitlePatterns = [
    /^article\s*\d+xml$/i,           // "article 14819xml"
    /^\d+\s+\d+\s+\d+$/,             // "2 1 1915105" (Upstream IDs)
    /^\d{4}\s+\d{2}\s+\d{2}$/,       // "2025 02 14" (date-only titles)
    /^\d{4}-\d{2}-\d{2}$/,           // "2025-02-14" (ISO date-only)
    /^[a-f0-9]{8,}$/i,               // hex IDs only
    /^untitled$/i,                   // Literally "untitled"
  ];

  for (const pattern of garbageTitlePatterns) {
    if (pattern.test(title.trim())) {
      return {
        is_valid: false,
        reason: `Garbage title: "${title}"`,
        confidence: 1.0
      };
    }
  }

  // 0b. Reject non-article file types (XML sitemaps, archives, etc.)
  if (urlLower.endsWith('.xml') || urlLower.includes('/archive/') && urlLower.match(/\d{4}\/\w+\.xml$/)) {
    return {
      is_valid: false,
      reason: 'Not an article URL (XML/archive file)',
      confidence: 1.0
    };
  }

  // 1. Check for category/landing page patterns in URL
  const categoryUrlPatterns = [
    '/insights',
    '/our-insights',
    '/category',
    '/categories',
    '/tag/',
    '/tags/',
    '/topics/',
    '/section/',
    '/industry/',
    '/industries/',
    '/market-data',
    '/latest-news',
    '/press-releases',
    '/news-releases',
  ];

  for (const pattern of categoryUrlPatterns) {
    if (urlLower.includes(pattern)) {
      // Skip category check if URL has article identifiers:
      // - Date pattern (YYYY/MM)
      // - PR Newswire numeric ID (e.g., -302636860.html)
      // - GlobeNewswire ID pattern
      const hasDatePattern = urlLower.match(/\/\d{4}\/\d{2}/);
      const hasPRNewswireId = urlLower.match(/prnewswire\.com.*-\d{6,}\.html$/);
      const hasGlobeNewswireId = urlLower.match(/globenewswire\.com.*\/\d{7,}/);
      const hasArticleId = urlLower.match(/\d{6,}\.html$/) || urlLower.match(/\/\d{7,}$/);

      if (!hasDatePattern && !hasPRNewswireId && !hasGlobeNewswireId && !hasArticleId) {
        // URL has category pattern and NO article identifier
        return {
          is_valid: false,
          reason: `Category page URL pattern: ${pattern}`,
          confidence: 0.9
        };
      }
    }
  }

  // 2. Check for generic category titles
  const categoryTitlePatterns = [
    /^(latest|recent|all|top)\s+(news|articles|stories|posts|updates)/i,
    /^(technology|business|finance|markets?|industry|industries)\s*\|\s*/i,
    /^(our|featured)\s+(insights?|articles?|content)/i,
    /\|\s*press releases?\s*$/i,
    /^press releases?\s*$/i,
    /^news\s+(center|room|hub)\s*$/i,
  ];

  for (const pattern of categoryTitlePatterns) {
    if (pattern.test(title)) {
      return {
        is_valid: false,
        reason: 'Generic category page title',
        confidence: 0.85
      };
    }
  }

  // 3. Check content for article listing patterns
  const listingIndicators = [
    // Multiple article links/titles in short succession
    (contentSample.match(/\n\s*[-*]\s*\[.*?\]\(/g) || []).length > 10,
    // "View all" / "See more" / "Load more" patterns
    /view all (articles|news|posts|stories)|see more|load more|show more/i.test(contentSample),
    // Navigation breadcrumbs
    /home\s*[>\/]\s*(news|insights|articles)/i.test(contentSample),
    // Multiple repeated date patterns (article listings)
    (contentSample.match(/\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi) || []).length > 5,
  ];

  const listingCount = listingIndicators.filter(Boolean).length;
  if (listingCount >= 2) {
    return {
      is_valid: false,
      reason: 'Content appears to be an article listing page',
      confidence: 0.8
    };
  }

  // 4. Check for insufficient article content
  if (content.length < 300) {
    return {
      is_valid: false,
      reason: 'Content too short to be a full article',
      confidence: 0.95
    };
  }

  // 5. Check for excessive navigation/UI elements
  const navigationPatterns = [
    /skip to (main )?content/i,
    /cookie (policy|consent|preferences)/i,
    /sign up|log in|subscribe now/i,
    /share this article/i,
    /related articles?/i,
  ];

  const navCount = navigationPatterns.filter(pattern => pattern.test(contentSample)).length;
  const navDensity = navCount / (content.length / 1000); // Navigation patterns per 1000 chars

  if (navDensity > 2) {
    return {
      is_valid: false,
      reason: 'Excessive navigation/UI elements (likely not article content)',
      confidence: 0.7
    };
  }

  // 6. Check for lack of article structure
  const hasArticleStructure =
    // Has paragraphs (multiple newlines)
    (content.match(/\n\n/g) || []).length >= 3 ||
    // Has sentences (periods followed by capital letters)
    (content.match(/\.\s+[A-Z]/g) || []).length >= 5;

  if (!hasArticleStructure) {
    return {
      is_valid: false,
      reason: 'Lacks article structure (paragraphs/sentences)',
      confidence: 0.75
    };
  }

  // 7. Check for paywall/subscription wall content
  const paywallIndicators = [
    /subscribe to continue reading/i,
    /this article is for subscribers only/i,
    /become a (member|subscriber) to (read|access)/i,
    /sign up to unlock this article/i,
    /upgrade to premium/i,
    /register to read/i,
    /complete your (free )?registration/i,
    /you have reached your article limit/i,
  ];

  const paywallCount = paywallIndicators.filter(pattern => pattern.test(contentSample)).length;
  if (paywallCount >= 2) {
    return {
      is_valid: false,
      reason: 'Paywall/subscription wall detected',
      confidence: 0.9
    };
  }

  // 8. Check for cookie consent walls (entire content is just cookie notice)
  const cookieWallIndicators = [
    /we use cookies/i,
    /cookie (policy|preferences|settings)/i,
    /accept (all )?cookies/i,
    /privacy policy/i,
  ];

  const cookieCount = cookieWallIndicators.filter(pattern => pattern.test(contentSample)).length;
  const cookieDensity = cookieCount / (content.length / 500); // per 500 chars

  // If content is short and full of cookie/privacy text, it's a cookie wall
  if (content.length < 2000 && cookieDensity > 0.8) {
    return {
      is_valid: false,
      reason: 'Cookie consent wall (no actual article content)',
      confidence: 0.85
    };
  }

  // Content passed all checks
  return {
    is_valid: true,
    confidence: 1.0
  };
}
