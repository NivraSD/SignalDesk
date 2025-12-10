// Batch Embed Articles
// Embeds articles that have been scraped but not yet embedded
// Processes all unembedded articles from the last N hours in batches
// Uses Voyage AI for embeddings

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')!;

const DEFAULT_BATCH_SIZE = 100;  // Voyage AI supports up to 128 texts per request
const DEFAULT_MAX_BATCHES = 10;  // Process up to 1000 articles per cron run
const DEFAULT_HOURS_BACK = 24;   // Only embed articles from last 24 hours
const MAX_TEXT_LENGTH = 8000;    // Truncate long texts

interface Article {
  id: string;
  title: string;
  description: string | null;
  source_name: string;
  full_content: string | null;
  extracted_metadata: {
    topics?: string[];
    summary?: string;
  } | null;
}

// Strip common navigation/boilerplate from full content for cleaner embeddings
function cleanFullContent(content: string): string {
  let cleaned = content;

  // Remove common navigation patterns
  cleaned = cleaned.replace(/\[Skip to content\].*?\n/gi, '');
  cleaned = cleaned.replace(/Text\s*settings[\s\S]*?Minimize to nav/gi, '');
  cleaned = cleaned.replace(/\*\s*Subscribers only[\s\S]*?\[Learn more\].*?\n/gi, '');
  cleaned = cleaned.replace(/Share this article.*?\n/gi, '');
  cleaned = cleaned.replace(/Related articles?.*?\n/gi, '');
  cleaned = cleaned.replace(/Sign up|Log in|Subscribe now/gi, '');

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();

  return cleaned;
}

function buildEmbeddingText(article: Article): string {
  const parts: string[] = [];

  parts.push(`Title: ${article.title}`);
  parts.push(`Source: ${article.source_name}`);

  // Use full_content if available (this is the scraped article body - MUCH better for matching)
  if (article.full_content) {
    const cleanedContent = cleanFullContent(article.full_content);
    // Use first 6000 chars of content to leave room for other fields
    const contentPreview = cleanedContent.slice(0, 6000);
    parts.push(`Content: ${contentPreview}`);
  } else if (article.description) {
    // Fall back to description if no full content
    parts.push(`Description: ${article.description}`);
  }

  if (article.extracted_metadata?.topics?.length) {
    parts.push(`Topics: ${article.extracted_metadata.topics.join(', ')}`);
  }

  if (article.extracted_metadata?.summary) {
    parts.push(`Summary: ${article.extracted_metadata.summary.slice(0, 500)}`);
  }

  const text = parts.join('\n');
  return text.slice(0, MAX_TEXT_LENGTH);
}

async function embedTexts(texts: string[]): Promise<number[][] | null> {
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'voyage-3',
        input: texts,
        input_type: 'document'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Voyage API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  } catch (error) {
    console.error('Error calling Voyage API:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || DEFAULT_BATCH_SIZE;
    const maxBatches = body.max_batches || DEFAULT_MAX_BATCHES;
    const hoursBack = body.hours_back || DEFAULT_HOURS_BACK;

    // Calculate time cutoff
    const sinceTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    console.log('🔢 BATCH EMBED ARTICLES');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Batch size: ${batchSize}`);
    console.log(`   Max batches: ${maxBatches}`);
    console.log(`   Hours back: ${hoursBack}`);
    console.log(`   Since: ${sinceTime}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    let batchNumber = 0;

    // Process batches until no more articles or max batches reached
    while (batchNumber < maxBatches) {
      batchNumber++;

      // Get articles that need embedding (from last N hours)
      // Now includes ANY article that has content to embed:
      // - completed: has full_content (best)
      // - metadata_only: may have description
      // - pending: may have description from RSS
      const { data: articles, error: fetchError } = await supabase
        .from('raw_articles')
        .select('id, title, description, source_name, full_content, extracted_metadata')
        .is('embedding', null)
        .in('scrape_status', ['completed', 'metadata_only', 'pending'])
        .gte('created_at', sinceTime)
        .not('title', 'is', null)
        // Prioritize completed articles (have full_content) first
        .order('scrape_status', { ascending: true })  // 'completed' comes before 'pending' alphabetically
        .order('created_at', { ascending: false })
        .limit(batchSize);

      if (fetchError) {
        throw new Error(`Failed to fetch articles: ${fetchError.message}`);
      }

      if (!articles || articles.length === 0) {
        console.log(`   Batch ${batchNumber}: No more articles to embed`);
        break;
      }

      // Filter out articles with no meaningful content (title-only = sparse, won't match well)
      const articlesToEmbed = articles.filter(a => a.full_content || a.description);
      const skippedTitleOnly = articles.length - articlesToEmbed.length;

      // Count content types for logging
      const withFullContent = articlesToEmbed.filter(a => a.full_content).length;
      const withDescription = articlesToEmbed.filter(a => !a.full_content && a.description).length;

      console.log(`   Batch ${batchNumber}: Processing ${articlesToEmbed.length} articles (skipped ${skippedTitleOnly} title-only)...`);
      console.log(`      - ${withFullContent} with full content`);
      console.log(`      - ${withDescription} with description only`);

      if (articlesToEmbed.length === 0) {
        console.log(`   Batch ${batchNumber}: No articles with content to embed, skipping...`);
        // Still increment processed count for the skipped ones
        totalProcessed += skippedTitleOnly;
        continue;
      }

      // Build embedding texts
      const texts = articlesToEmbed.map(a => buildEmbeddingText(a as Article));

      // Get embeddings from Voyage
      const embeddings = await embedTexts(texts);

      if (!embeddings) {
        console.error(`   Batch ${batchNumber}: Failed to get embeddings from Voyage AI`);
        totalFailed += articlesToEmbed.length;
        continue;
      }

      // Update articles with embeddings
      let batchSuccess = 0;
      let batchFailed = 0;

      for (let i = 0; i < articlesToEmbed.length; i++) {
        const embeddingStr = JSON.stringify(embeddings[i]);
        const { error: updateError } = await supabase
          .from('raw_articles')
          .update({
            embedding: embeddingStr,
            embedded_at: new Date().toISOString()
          })
          .eq('id', articlesToEmbed[i].id);

        if (updateError) {
          console.error(`   Failed to update article ${articlesToEmbed[i].id}: ${updateError.message}`);
          batchFailed++;
        } else {
          batchSuccess++;
        }
      }

      totalProcessed += articlesToEmbed.length + skippedTitleOnly;
      totalSuccess += batchSuccess;
      totalFailed += batchFailed;

      console.log(`   Batch ${batchNumber}: ${batchSuccess} embedded, ${batchFailed} failed`);

      // If we got fewer articles than batch size (including skipped), we're done
      if (articles.length < batchSize) {
        break;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('📊 RESULTS:');
    console.log(`   Total batches: ${batchNumber}`);
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   Total success: ${totalSuccess}`);
    console.log(`   Total failed: ${totalFailed}`);
    console.log(`   Duration: ${duration}s`);

    // Log job to embedding_jobs table
    await supabase.from('embedding_jobs').insert({
      job_type: 'articles',
      status: 'completed',
      items_total: totalProcessed,
      items_processed: totalSuccess,
      items_failed: totalFailed,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      metadata: { batches: batchNumber, hours_back: hoursBack }
    });

    return new Response(JSON.stringify({
      success: true,
      batches: batchNumber,
      processed: totalProcessed,
      embedded: totalSuccess,
      failed: totalFailed,
      duration_seconds: duration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
