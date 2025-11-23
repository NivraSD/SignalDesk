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
        // Check content quality before storing
        const qualityCheck = validateArticleContent(
          result.data.markdown,
          result.metadata?.title || '',
          result.url
        );

        if (!qualityCheck.is_valid) {
          // Content failed quality check - mark as failed with reason
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

        // Successfully scraped with valid content - update with content
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
              cached: result.cached || false,
              quality_check: qualityCheck
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
    if (urlLower.includes(pattern) && !urlLower.match(/\/\d{4}\/\d{2}/)) {
      // URL has category pattern and NO date pattern (YYYY/MM)
      return {
        is_valid: false,
        reason: `Category page URL pattern: ${pattern}`,
        confidence: 0.9
      };
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

  // Content passed all checks
  return {
    is_valid: true,
    confidence: 1.0
  };
}
