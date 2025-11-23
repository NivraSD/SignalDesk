// Batch Scraper V5 - Worker
// Pulls articles from scrape queue and processes them using mcp-firecrawl parallel batch scraping
// mcp-firecrawl scrapes 5 articles in parallel internally, with built-in caching

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BATCH_SIZE = 25; // How many articles to process per run (mcp-firecrawl will split into batches of 5)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const startTime = Date.now();

  console.log('🔥 BATCH SCRAPER V5 - WORKER (MCP-Firecrawl Parallel Batch Scraper)');
  console.log(`   Time: ${new Date().toISOString()}\n`);

  try {
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
      .limit(BATCH_SIZE);

    if (queueError) throw new Error(`Failed to load queue: ${queueError.message}`);

    if (!queuedArticles || queuedArticles.length === 0) {
      console.log('   ℹ️  Queue is empty - no articles to process\n');
      return new Response(JSON.stringify({
        success: true,
        message: 'Queue is empty',
        processed: 0
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
          maxTimeout: 10000
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
        // Successfully scraped - update with content
        const { error: updateError } = await supabase
          .from('raw_articles')
          .update({
            full_content: result.data.markdown,
            scrape_status: 'completed',
            scraped_at: new Date().toISOString(),
            content_length: result.data.markdown.length,
            raw_metadata: {
              ...(result.data.metadata || {}),
              scraping_method: 'mcp_firecrawl',
              cached: result.cached || false
            }
          })
          .eq('id', articleId);

        if (!updateError) {
          successCount++;
          console.log(`   ✅ ${result.metadata.title?.substring(0, 50) || result.url.substring(0, 50)} (${result.data.markdown.length} chars${result.cached ? ', cached' : ''})`);
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

    const duration = Math.floor((Date.now() - startTime) / 1000);

    console.log('\n' + '='.repeat(80));
    console.log('✅ WORKER COMPLETE');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Processed: ${queuedArticles.length} articles`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`   Queue remaining: ${queuedArticles.length - successCount - failedCount}`);
    console.log('='.repeat(80));

    return new Response(JSON.stringify({
      success: true,
      summary: {
        processed: queuedArticles.length,
        successful: successCount,
        failed: failedCount,
        duration_seconds: duration,
        mcp_stats: mcpResult.stats
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ WORKER FAILED:', error.message);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
