// Extract Article Metadata - Organization-agnostic metadata extraction
// Runs after scraping to extract universal article properties
// Works with whatever data we have (title only, title+desc, or full content)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

interface ArticleMetadata {
  entities: {
    companies: string[];
    people: string[];
    locations: string[];
    technologies: string[];
  };
  article_type: string;
  topics: string[];
  industries: string[];
  temporal: {
    published_at: string;
    age_hours: number;
    is_within_24h: boolean;
    is_breaking: boolean;
  };
  signals: {
    word_count: number;
    has_content: boolean;
    has_paywall: boolean;
    confidence: 'high' | 'medium' | 'low';
  };
  summary: string;
  extracted_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { article_ids, batch_mode = false } = await req.json();

    if (!article_ids || article_ids.length === 0) {
      throw new Error('article_ids array is required');
    }

    console.log(`📊 METADATA EXTRACTION`);
    console.log(`   Processing ${article_ids.length} articles`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch articles
    const { data: articles, error: fetchError } = await supabase
      .from('raw_articles')
      .select('id, title, description, full_content, published_at, url, source_name')
      .in('id', article_ids);

    if (fetchError || !articles) {
      throw new Error(`Failed to fetch articles: ${fetchError?.message}`);
    }

    console.log(`   Found ${articles.length} articles to process`);

    const results = [];
    let processed = 0;
    let failed = 0;

    for (const article of articles) {
      try {
        console.log(`   Processing: ${article.title?.substring(0, 60)}...`);

        const metadata = await extractMetadata(article);

        // Update article with metadata
        const { error: updateError } = await supabase
          .from('raw_articles')
          .update({ extracted_metadata: metadata })
          .eq('id', article.id);

        if (updateError) {
          console.error(`   ❌ Failed to update article ${article.id}:`, updateError.message);
          failed++;
        } else {
          console.log(`   ✓ Extracted metadata (${metadata.signals.confidence} confidence)`);
          processed++;
          results.push({
            article_id: article.id,
            metadata,
            success: true
          });
        }
      } catch (error) {
        console.error(`   ❌ Error processing article ${article.id}:`, error.message);
        failed++;
        results.push({
          article_id: article.id,
          error: error.message,
          success: false
        });
      }
    }

    console.log(`   ✓ Processed: ${processed}, Failed: ${failed}`);

    return new Response(JSON.stringify({
      success: true,
      processed,
      failed,
      total: articles.length,
      results: batch_mode ? results : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Metadata Extraction Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function extractMetadata(article: any): Promise<ArticleMetadata> {
  // Use whatever we have, prioritize richer sources
  const textToAnalyze = article.full_content
    || `${article.title || ''} ${article.description || ''}`
    || article.title || '';

  const confidence = article.full_content ? 'high'
    : article.description ? 'medium'
    : 'low';

  // Calculate temporal info
  const publishedDate = new Date(article.published_at);
  const ageHours = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);

  const wordCount = textToAnalyze.split(/\s+/).filter(w => w.length > 0).length;

  // Call Claude for extraction
  const extracted = await callClaudeForExtraction(textToAnalyze, article.title, confidence);

  return {
    entities: extracted.entities,
    article_type: extracted.article_type,
    topics: extracted.topics,
    industries: extracted.industries,
    temporal: {
      published_at: article.published_at,
      age_hours: Math.round(ageHours * 10) / 10,
      is_within_24h: ageHours <= 24,
      is_breaking: ageHours <= 2
    },
    signals: {
      word_count: wordCount,
      has_content: !!article.full_content,
      has_paywall: detectPaywall(article),
      confidence
    },
    summary: extracted.summary,
    extracted_at: new Date().toISOString()
  };
}

async function callClaudeForExtraction(text: string, title: string, confidence: string) {
  const prompt = `Extract metadata from this article. Work with whatever information is available.

Title: ${title}

Text: ${text.substring(0, 3000)}

Extract:
1. Entities (companies, people, locations, technologies mentioned)
2. Article type (news, opinion, analysis, earnings, personnel, product_launch, merger, acquisition, lawsuit, campaign, other)
3. Topics/themes (be specific - "crisis communications", "AI regulation", "venture funding", etc.)
4. Industries (public_relations, technology, finance, healthcare, energy, manufacturing, etc.)
5. Brief 2-sentence summary

Return as JSON:
{
  "entities": {
    "companies": ["Company A", "Company B"],
    "people": ["Person Name"],
    "locations": ["Location"],
    "technologies": ["AI", "blockchain"]
  },
  "article_type": "news",
  "topics": ["topic1", "topic2"],
  "industries": ["industry1", "industry2"],
  "summary": "Two sentence summary."
}

Note: Confidence level is ${confidence}. Extract what you can from the available text.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Parse JSON from Claude's response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}

function detectPaywall(article: any): boolean {
  const text = `${article.title || ''} ${article.description || ''} ${article.full_content || ''}`.toLowerCase();

  const paywallIndicators = [
    'subscribe to continue',
    'subscription required',
    'premium content',
    'members only',
    'sign in to read',
    'continue reading with',
    'become a member'
  ];

  return paywallIndicators.some(indicator => text.includes(indicator));
}
