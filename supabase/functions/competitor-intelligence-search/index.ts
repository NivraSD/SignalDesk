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

// Search for competitor news using Perplexity Search API
async function searchCompetitorNews(competitorName: string, industry: string): Promise<any[]> {
  if (!PERPLEXITY_API_KEY) {
    console.error('❌ PERPLEXITY_API_KEY not configured');
    return [];
  }

  // Build search query - focus on business news, announcements, wins
  const query = `"${competitorName}" ${industry} agency news client wins campaigns 2024`;

  console.log(`   🔍 Searching: ${query.substring(0, 60)}...`);

  try {
    // Use the Search API endpoint (not chat/completions)
    const response = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        search_recency_filter: 'month', // Last month only
        max_results: 5
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Perplexity Search API error: ${response.status} - ${errorText}`);

      // Fallback to Chat API if Search API fails
      return await searchCompetitorNewsViaChatAPI(competitorName, industry);
    }

    const data = await response.json();
    const results = data.results || [];

    console.log(`   ✅ Found ${results.length} search results for ${competitorName}`);

    // Transform search results to our format
    return results.map((item: any) => ({
      title: item.title || 'No title',
      description: item.snippet || item.content || '',
      source: extractDomain(item.url) || 'Unknown',
      url: item.url || '',
      date: item.date || item.last_updated || new Date().toISOString(),
      category: inferCategory(item.title, item.snippet),
      competitor: competitorName
    }));

  } catch (error: any) {
    console.error(`   ❌ Search error for ${competitorName}:`, error.message);
    // Try fallback
    return await searchCompetitorNewsViaChatAPI(competitorName, industry);
  }
}

// Fallback: Use Chat API with web search enabled
async function searchCompetitorNewsViaChatAPI(competitorName: string, industry: string): Promise<any[]> {
  console.log(`   🔄 Fallback to Chat API for ${competitorName}`);

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
          content: `Find the 3 most recent news items about "${competitorName}" ${industry} agency from the last 3 months. Focus on client wins, campaigns, leadership changes, or awards.

Return ONLY a JSON array (no other text):
[{"title":"...", "description":"...", "source":"...", "url":"...", "category":"client_win|campaign|leadership|award"}]

If no news found, return: []`
        }],
        temperature: 0.1,
        max_tokens: 1000,
        return_citations: true
      })
    });

    if (!response.ok) {
      console.error(`   ❌ Chat API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    // Try to parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      try {
        const results = JSON.parse(jsonMatch[0]);
        console.log(`   ✅ Chat API found ${results.length} items for ${competitorName}`);
        return results.map((item: any, idx: number) => ({
          ...item,
          url: item.url || citations[idx] || '',
          competitor: competitorName,
          date: new Date().toISOString()
        }));
      } catch (e) {
        console.error(`   ⚠️ Failed to parse Chat API JSON`);
      }
    }

    return [];
  } catch (error: any) {
    console.error(`   ❌ Chat API error for ${competitorName}:`, error.message);
    return [];
  }
}

// Helper: Extract domain from URL
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return '';
  }
}

// Helper: Infer category from title/description
function inferCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('win') || text.includes('client') || text.includes('account')) return 'client_win';
  if (text.includes('campaign') || text.includes('activation') || text.includes('launch')) return 'campaign';
  if (text.includes('ceo') || text.includes('hire') || text.includes('appoint') || text.includes('join')) return 'leadership';
  if (text.includes('award') || text.includes('recognition') || text.includes('honor')) return 'award';
  if (text.includes('acquire') || text.includes('merge') || text.includes('partner')) return 'strategic_move';
  return 'general';
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
