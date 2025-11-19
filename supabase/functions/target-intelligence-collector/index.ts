// Target Intelligence Collector
// Extracts mentions of intelligence targets from articles and saves to target_intelligence table
// Enables pattern detection and signal-based predictions

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { articles, organization_id, organization_name } = await req.json();

    console.log(`📊 Target Intelligence Collector`);
    console.log(`   Organization: ${organization_name}`);
    console.log(`   Articles to process: ${articles?.length || 0}`);

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        mentions_saved: 0,
        message: 'No articles to process'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Load intelligence targets
    const { data: targets } = await supabase
      .from('intelligence_targets')
      .select('id, name, type, monitoring_context')
      .eq('organization_id', organization_id)
      .eq('active', true);

    if (!targets || targets.length === 0) {
      console.log('⚠️ No intelligence targets found');
      return new Response(JSON.stringify({
        success: true,
        mentions_saved: 0,
        message: 'No intelligence targets configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Loaded ${targets.length} intelligence targets`);

    // Process articles in batches
    const batchSize = 10;
    let totalMentionsSaved = 0;

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(articles.length/batchSize)}`);

      // Use Claude to extract target mentions and intelligence
      const prompt = `You are an intelligence analyst. Analyze these articles and identify ALL mentions of the intelligence targets below.

INTELLIGENCE TARGETS:
${targets.map(t => `- ${t.name} (${t.type}): ${t.monitoring_context || 'General monitoring'}`).join('\n')}

ARTICLES:
${batch.map((a, idx) => `
[Article ${idx + 1}]
Title: ${a.title}
Description: ${a.description || 'N/A'}
Content: ${(a.content || a.description || '').substring(0, 1000)}
URL: ${a.url || 'N/A'}
Published: ${a.published_at || 'Unknown'}
---`).join('\n')}

For EACH article, identify:
1. Which targets are mentioned (by exact name match or clear reference)
2. Sentiment towards each target (positive, negative, neutral, mixed)
3. Category of the article (partnership, crisis, product_launch, regulatory, financial, leadership, legal, market_trend, other)
4. Key entities mentioned (companies, people, organizations)
5. Key topics/themes
6. Relevance score for each target (0-100)

Respond in JSON:
{
  "mentions": [
    {
      "article_index": 0,
      "target_name": "Target Name",
      "target_type": "competitor",
      "sentiment": "positive",
      "category": "partnership",
      "relevance_score": 85,
      "key_entities": ["Entity1", "Entity2"],
      "key_topics": ["Topic1", "Topic2"],
      "extracted_facts": {
        "key_points": ["Fact1", "Fact2"],
        "metrics": {},
        "quotes": []
      },
      "reasoning": "Why this target is mentioned"
    }
  ]
}

IMPORTANT:
- Only include targets that are ACTUALLY mentioned or clearly relevant
- Be conservative with relevance scores - only high scores for direct mentions
- Sentiment should reflect how the article discusses the target
- Category should be the primary focus of the article`;

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            temperature: 0.2,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })
        });

        if (!response.ok) {
          console.error(`❌ Claude API error: ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        const claudeResponse = data.content[0].text;

        // Parse JSON
        const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('❌ Failed to parse Claude response');
          continue;
        }

        const result = JSON.parse(jsonMatch[0]);
        const mentions = result.mentions || [];

        console.log(`   ✅ Found ${mentions.length} target mentions in batch`);

        // Save mentions to target_intelligence table
        for (const mention of mentions) {
          const article = batch[mention.article_index];
          if (!article) continue;

          // Find matching target
          const target = targets.find(t => t.name === mention.target_name);
          if (!target) continue;

          const { error } = await supabase
            .from('target_intelligence')
            .insert({
              organization_id: organization_id,
              target_id: target.id,
              target_name: mention.target_name,
              target_type: mention.target_type,

              article_title: article.title,
              article_url: article.url,
              article_content: article.content || article.description,
              source_name: article.source,
              published_at: article.published_at,

              sentiment: mention.sentiment,
              category: mention.category,
              relevance_score: mention.relevance_score,

              key_entities: mention.key_entities || [],
              key_topics: mention.key_topics || [],
              extracted_facts: mention.extracted_facts || {},

              mention_date: article.published_at || new Date().toISOString()
            });

          if (error) {
            console.error(`❌ Failed to save mention:`, error.message);
          } else {
            totalMentionsSaved++;
          }
        }

      } catch (err: any) {
        console.error(`❌ Batch error:`, err.message);
      }
    }

    console.log(`✅ Target Intelligence Collection complete: ${totalMentionsSaved} mentions saved`);

    return new Response(JSON.stringify({
      success: true,
      mentions_saved: totalMentionsSaved,
      articles_processed: articles.length,
      targets_monitored: targets.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Target Intelligence Collector error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
