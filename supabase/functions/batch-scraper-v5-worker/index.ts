// Batch Scraper V5 - Worker
// Pulls articles from scrape queue and processes them using mcp-firecrawl parallel batch scraping
// mcp-firecrawl scrapes 5 articles in parallel internally, with built-in caching

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BATCH_SIZE = 10; // Reduced from 25 to avoid timeouts with slow sites (WSJ, etc) - mcp-firecrawl scrapes 5 in parallel
const MAX_ARTICLE_AGE_DAYS = 14; // Reject articles older than this
const MAX_DRAIN_TIME_MS = 120 * 1000; // 120 seconds max when draining (Edge Function timeout is 150s)
const DRAIN_BATCH_DELAY_MS = 500; // 0.5 seconds between batches when draining

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

  // Create batch run record for tracking
  await supabase
    .from('batch_scrape_runs')
    .insert({
      id: runId,
      run_type: 'worker',
      status: 'running',
      triggered_by: req.headers.get('user-agent') || 'cron'
    });

  // Track totals across all batches when draining
  let totalProcessed = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  let batchCount = 0;

  try {
    // Main processing loop - runs once normally, or until queue empty/timeout when draining
    while (true) {
      // Check timeout when draining
      if (drainQueue && (Date.now() - startTime) >= MAX_DRAIN_TIME_MS) {
        console.log(`\n⏱️  Drain timeout reached (${MAX_DRAIN_TIME_MS / 1000}s) - stopping`);
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
      await supabase
        .from('raw_articles')
        .update({
          scrape_status: 'processing',
          last_scrape_attempt: new Date().toISOString()
        })
        .in('id', articleIds);

      // ========================================================================
      // STEP 2: Call mcp-firecrawl batch_scrape_articles
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
            maxTimeout: 30000  // Increased from 10s to 30s for sites with heavy JS/anti-scraping (WSJ, etc)
          }
        }
      };

      const mcpResponse = await fetch(`${SUPABASE_URL}/functions/v1/mcp-firecrawl`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mcpPayload)
      });

      if (!mcpResponse.ok) {
        throw new Error(`mcp-firecrawl failed: ${mcpResponse.status} ${await mcpResponse.text()}`);
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
          // Extract published date from metadata
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

          const { error: updateError } = await supabase
            .from('raw_articles')
            .update({
              full_content: result.data.markdown,
              scrape_status: 'completed',
              scraped_at: new Date().toISOString(),
              published_at: publishedDate, // Extract from metadata and convert to ISO
              content_length: result.data.markdown.length,
              raw_metadata: {
                ...(result.data.metadata || {}),
                scraping_method: 'mcp_firecrawl',
                cached: result.cached || false,
                quality_check: qualityCheck,
                paywall: isPaywall || false,
                limited_content: !qualityCheck.is_valid
              }
            })
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
          const { error: updateError } = await supabase
            .from('raw_articles')
            .update({
              scrape_status: 'failed',
              scrape_attempts: supabase.rpc('increment_scrape_attempts', { article_id: articleId }),
              processing_error: result.error || 'Unknown scraping error'
            })
            .eq('id', articleId);

          if (!updateError) {
            failedCount++;
            console.log(`   ❌ ${result.metadata?.title?.substring(0, 50) || result.url.substring(0, 50)}: ${result.error}`);
          }
        }
      }

      // Accumulate totals
      totalProcessed += queuedArticles.length;
      totalSuccessful += successCount;
      totalFailed += failedCount;

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
        await supabase
          .from('batch_scrape_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            articles_discovered: queuedArticles.length,
            articles_new: successCount,
            articles_processed: successCount,
            sources_successful: successCount,
            sources_failed: failedCount,
            duration_seconds: batchDuration
          })
          .eq('id', runId);

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

    // Update batch run record
    await supabase
      .from('batch_scrape_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        articles_discovered: totalProcessed,
        articles_new: totalSuccessful,
        articles_processed: totalSuccessful,
        sources_successful: totalSuccessful,
        sources_failed: totalFailed,
        duration_seconds: totalDuration
      })
      .eq('id', runId);

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
    console.error('❌ WORKER FAILED:', error.message);

    // Update batch run record with failure
    await supabase
      .from('batch_scrape_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
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
