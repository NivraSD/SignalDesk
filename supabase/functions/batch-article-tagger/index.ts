// Batch Article Tagger
// Classifies scraped articles by industry using Claude Haiku
// Adds industries[] to raw_metadata for efficient filtering

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.28.0';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const BATCH_SIZE = 20; // Process 20 articles per batch

interface Article {
  id: string;
  title: string;
  description: string | null;
  full_content: string;
  source_name: string;
}

interface ClassificationResult {
  article_id: string;
  industries: string[];
  confidence: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const startTime = Date.now();

  console.log('🏷️  BATCH ARTICLE TAGGER');
  console.log(`   Time: ${new Date().toISOString()}\n`);

  try {
    // Get older articles first (newer ones were just tagged)
    // Fetch more than needed since some will already be tagged
    const { data: articles, error: queryError } = await supabase
      .from('raw_articles')
      .select('id, title, description, full_content, source_name, raw_metadata')
      .eq('scrape_status', 'completed')
      .not('full_content', 'is', null)
      .order('created_at', { ascending: true })  // Get older articles first (less likely to be tagged)
      .limit(BATCH_SIZE * 5);  // Fetch 5x batch size to ensure we get enough untagged

    if (queryError) throw new Error(`Query failed: ${queryError.message}`);

    // Filter to only untagged articles (no industries field in metadata)
    const untaggedArticles = (articles || [])
      .filter(a => !a.raw_metadata?.industries)
      .slice(0, BATCH_SIZE);  // Take only BATCH_SIZE for processing

    if (untaggedArticles.length === 0) {
      console.log('✅ No untagged articles found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No articles to tag',
        tagged: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📊 Found ${untaggedArticles.length} untagged articles\n`);

    // Prepare batch for classification
    const articleSummaries = untaggedArticles.map((article, idx) => {
      // Use title + description, or first 300 chars of content if no description
      const preview = article.description ||
        article.full_content.substring(0, 300).replace(/\n/g, ' ');

      return {
        index: idx,
        id: article.id,
        text: `Article ${idx + 1}:\nTitle: ${article.title}\nSource: ${article.source_name}\nPreview: ${preview}`
      };
    });

    // Build classification prompt
    const prompt = `You are classifying news articles by industry. Review these articles and identify the primary industries each one discusses.

${articleSummaries.map(a => a.text).join('\n\n')}

For each article, identify 1-3 primary industries from this list:
- technology (software, AI, cloud computing, tech companies)
- healthcare (hospitals, medical devices, pharmaceuticals, biotech)
- finance (banking, fintech, investment, trading, insurance)
- construction (building, infrastructure, real estate development, engineering)
- manufacturing (industrial production, factories, supply chain)
- retail (e-commerce, stores, consumer goods)
- energy (oil, gas, renewable energy, utilities)
- transportation (logistics, shipping, automotive, aviation)
- telecommunications (telecom companies, networks, 5G)
- media (entertainment, publishing, streaming)
- education (schools, ed-tech, universities)
- agriculture (farming, food production)
- government (policy, regulation, public sector)
- professional_services (consulting, legal, accounting)
- real_estate (commercial property, REITs, property management)

Return ONLY a JSON array with this exact format:
[
  {"article": 1, "industries": ["technology"], "confidence": "high"},
  {"article": 2, "industries": ["healthcare", "technology"], "confidence": "medium"}
]

Confidence levels:
- high: Industry clearly identified in title/content
- medium: Industry inferred from context
- low: Unclear, best guess

Return valid JSON only, no other text.`;

    console.log('🤖 Calling Claude Haiku for classification...\n');

    // Call Claude Haiku
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse classification results
    let classifications: ClassificationResult[];
    try {
      const parsed = JSON.parse(responseText);
      classifications = parsed.map((item: any) => ({
        article_id: articleSummaries[item.article - 1].id,
        industries: item.industries,
        confidence: item.confidence
      }));
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response:', responseText);
      throw new Error('Invalid classification response from Claude');
    }

    console.log(`✅ Classified ${classifications.length} articles\n`);

    // Update articles with industry tags
    let tagged = 0;
    let failed = 0;

    for (const classification of classifications) {
      const article = untaggedArticles.find(a => a.id === classification.article_id);
      if (!article) continue;

      const updatedMetadata = {
        ...(article.raw_metadata as any || {}),
        industries: classification.industries,
        classification_confidence: classification.confidence,
        classified_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('raw_articles')
        .update({ raw_metadata: updatedMetadata })
        .eq('id', classification.article_id);

      if (updateError) {
        console.error(`   ❌ Failed to update ${article.title}: ${updateError.message}`);
        failed++;
      } else {
        console.log(`   ✅ ${article.source_name}: ${article.title.substring(0, 60)}...`);
        console.log(`      Industries: ${classification.industries.join(', ')} (${classification.confidence})`);
        tagged++;
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);

    console.log('\n' + '='.repeat(80));
    console.log('✅ TAGGING COMPLETE');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Tagged: ${tagged}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Remaining untagged: ${articles!.length - untaggedArticles.length} (from query limit)`);
    console.log('='.repeat(80));

    return new Response(JSON.stringify({
      success: true,
      summary: {
        tagged,
        failed,
        duration_seconds: duration,
        batch_size: BATCH_SIZE
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ TAGGING FAILED:', error.message);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
