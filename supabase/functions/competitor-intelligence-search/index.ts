// Competitor Intelligence Search
// Actively searches for news about tracked competitors using Perplexity
// Fills the gap when passive article collection doesn't capture niche competitors

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Search for competitor news using Perplexity
async function searchCompetitorNews(competitorName: string, industry: string): Promise<any[]> {
  if (!PERPLEXITY_API_KEY) {
    console.error('❌ PERPLEXITY_API_KEY not configured');
    return [];
  }

  // Build search query - focus on business news, announcements, wins
  const query = `"${competitorName}" ${industry} news announcements wins clients 2024 2025`;

  console.log(`   🔍 Searching: ${query.substring(0, 60)}...`);

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{
          role: 'user',
          content: `Find recent news about ${competitorName} in the ${industry} industry. Focus on:
- Client wins and new business
- Leadership changes
- Campaigns and activations they've done
- Awards and recognition
- Strategic moves (acquisitions, partnerships, expansions)

Return a JSON array of news items with this structure:
[{
  "title": "headline",
  "description": "brief summary",
  "source": "publication name",
  "url": "article URL if available",
  "date": "approximate date",
  "category": "client_win|leadership|campaign|award|strategic_move"
}]

Only include items from the last 3 months. Return empty array [] if no recent news found.`
        }],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error(`   ❌ Perplexity error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract citations if available
    const citations = data.citations || [];

    // Try to parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const results = JSON.parse(jsonMatch[0]);
        console.log(`   ✅ Found ${results.length} news items for ${competitorName}`);
        return results.map((item: any) => ({
          ...item,
          competitor: competitorName,
          citations
        }));
      } catch (e) {
        console.error(`   ⚠️ Failed to parse JSON for ${competitorName}`);
      }
    }

    return [];
  } catch (error: any) {
    console.error(`   ❌ Search error for ${competitorName}:`, error.message);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { organization_id, organization_name } = await req.json();

    console.log(`🎯 Competitor Intelligence Search`);
    console.log(`   Organization: ${organization_name}`);

    // Load organization data for industry context
    const { data: orgData } = await supabase
      .from('organizations')
      .select('industry, company_profile')
      .eq('id', organization_id)
      .single();

    const industry = orgData?.industry || 'business';

    // Load competitors from intelligence_targets
    const { data: competitors } = await supabase
      .from('intelligence_targets')
      .select('id, name, type, priority')
      .eq('organization_id', organization_id)
      .eq('type', 'competitor')
      .eq('active', true)
      .order('priority', { ascending: false });

    if (!competitors || competitors.length === 0) {
      console.log('⚠️ No competitors to search for');
      return new Response(JSON.stringify({
        success: true,
        competitors_searched: 0,
        intelligence_found: 0,
        message: 'No competitors configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Found ${competitors.length} competitors to search`);

    // Search for each competitor (limit to top 5 to avoid rate limits)
    const topCompetitors = competitors.slice(0, 5);
    let totalIntelligence = 0;
    const allResults: any[] = [];

    for (const competitor of topCompetitors) {
      const newsItems = await searchCompetitorNews(competitor.name, industry);

      // Save each news item to target_intelligence
      for (const item of newsItems) {
        const { error } = await supabase
          .from('target_intelligence')
          .insert({
            organization_id: organization_id,
            target_id: competitor.id,
            target_name: competitor.name,
            target_type: 'competitor',

            article_title: item.title,
            article_url: item.url || `perplexity-search-${Date.now()}`,
            article_content: item.description,
            source_name: item.source || 'Perplexity Search',
            published_at: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),

            sentiment: 'neutral',
            category: item.category || 'general',
            relevance_score: 80, // High relevance since we specifically searched for this

            key_entities: [competitor.name],
            key_topics: [item.category || 'competitor_activity'],
            extracted_facts: {
              source_type: 'perplexity_search',
              citations: item.citations || []
            },

            mention_date: new Date().toISOString()
          });

        if (!error) {
          totalIntelligence++;
          allResults.push({
            competitor: competitor.name,
            title: item.title,
            category: item.category
          });
        }
      }

      // Small delay between searches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Competitor Intelligence Search Complete`);
    console.log(`   Competitors searched: ${topCompetitors.length}`);
    console.log(`   Intelligence items saved: ${totalIntelligence}`);

    return new Response(JSON.stringify({
      success: true,
      competitors_searched: topCompetitors.length,
      intelligence_found: totalIntelligence,
      results: allResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Competitor Intelligence Search error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
