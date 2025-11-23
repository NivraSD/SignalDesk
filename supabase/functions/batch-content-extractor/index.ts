// Batch Content Extractor
// Extracts full article content from discovered URLs using Firecrawl Scrape API
// Runs separately from discovery to avoid timeouts and enable retries

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const startTime = Date.now();

  console.log('📄 BATCH CONTENT EXTRACTOR STARTING');
  console.log(`   Time: ${new Date().toISOString()}\n`);

  try {
    // Get unprocessed articles (no full_content yet)
    const { data: articles, error: articlesError } = await supabase
      .from('raw_articles')
      .select('id, url, title, source_name')
      .is('full_content', null)
      .eq('processed', false)
      .order('scraped_at', { ascending: false })
      .limit(100); // Process 100 articles per run

    if (articlesError) {
      throw new Error(`Failed to load articles: ${articlesError.message}`);
    }

    console.log(`📊 Found ${articles?.length || 0} articles needing content extraction\n`);

    if (!articles || articles.length === 0) {
      console.log('✅ No articles to process. Exiting.');
      return new Response(JSON.stringify({
        success: true,
        message: 'No articles to process',
        articles_processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 10; // Process 10 URLs at a time

    // Process in batches
    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE);

      console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(articles.length / BATCH_SIZE)}: Processing ${batch.length} articles...`);

      // Extract URLs in batch
      const batchResults = await Promise.allSettled(
        batch.map(article => extractArticleContent(article, supabase))
      );

      // Process results
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const article = batch[j];

        if (result.status === 'fulfilled') {
          successCount++;
          console.log(`   ✅ ${article.source_name}: ${article.title.substring(0, 60)}...`);
        } else {
          errorCount++;
          console.error(`   ❌ ${article.source_name}: ${result.reason?.message || 'Unknown error'}`);

          // Mark article with error
          await supabase
            .from('raw_articles')
            .update({
              processing_error: result.reason?.message || 'Unknown error'
            })
            .eq('id', article.id);
        }
      }

      // Rate limiting between batches
      if (i + BATCH_SIZE < articles.length) {
        console.log(`   ⏳ Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);

    console.log('\n' + '='.repeat(80));
    console.log('✅ CONTENT EXTRACTION COMPLETE');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('='.repeat(80));

    return new Response(JSON.stringify({
      success: true,
      summary: {
        articles_processed: successCount,
        errors: errorCount,
        duration_seconds: duration
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ CONTENT EXTRACTION FAILED:', error.message);

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
// Helper: Extract full article content using Firecrawl Scrape API
// ============================================================================
async function extractArticleContent(article: any, supabase: any): Promise<void> {
  // Use Firecrawl Scrape API (not Extract!)
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: article.url,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      includeTags: ['article', 'main'],
      excludeTags: ['nav', 'footer', 'aside', 'script', 'style'],
      waitFor: 1000 // Wait for dynamic content
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Scrape failed for ${article.url}: ${errorText}`);
  }

  const data = await response.json();

  // Extract metadata
  const markdown = data.data?.markdown || '';
  const html = data.data?.html || '';
  const metadata = data.data?.metadata || {};

  // Extract publication date if not already set
  const publishedAt = metadata.publishedTime || metadata.modifiedTime || null;

  // Update article with full content
  await supabase
    .from('raw_articles')
    .update({
      full_content: markdown,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
      content_length: markdown.length,
      raw_metadata: {
        ...metadata,
        extraction_method: 'firecrawl_scrape',
        extracted_at: new Date().toISOString()
      },
      processing_error: null // Clear any previous errors
    })
    .eq('id', article.id);
}
