// Target Intelligence Collector
// Simple sorter: matches articles against intelligence targets and saves to target_intelligence table
// Enables pattern detection and signal-based predictions over time

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { articles, organization_id, organization_name } = await req.json();

    console.log(`📊 Target Intelligence Collector (Simple Sorter)`);
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

    // Simple sorter: match enriched article data against targets
    // No Claude API calls - enrichment already did the extraction
    let totalMentionsSaved = 0;

    for (const article of articles) {
      // Check if this article mentions any of our targets
      const articleText = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase();

      for (const target of targets) {
        const targetNameLower = target.name.toLowerCase();

        // Simple match: does the article mention this target?
        if (articleText.includes(targetNameLower)) {
          // Save to target_intelligence table
          const { error } = await supabase
            .from('target_intelligence')
            .insert({
              organization_id: organization_id,
              target_id: target.id,
              target_name: target.name,
              target_type: target.type,

              article_title: article.title,
              article_url: article.url,
              article_content: article.content || article.description,
              source_name: article.source,
              published_at: article.published_at,

              sentiment: article.sentiment || 'neutral',
              category: article.pr_category || article.category || 'general',
              relevance_score: article.pr_relevance_score || article.relevance_score || 50,

              key_entities: article.entities || [],
              key_topics: article.topics || [],
              extracted_facts: article.facts || {},

              mention_date: article.published_at || new Date().toISOString()
            });

          if (!error) {
            totalMentionsSaved++;
          }
        }
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
