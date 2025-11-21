// Monitor Stage 2: AI-Powered Intelligent Relevance Filtering
// Uses Claude to understand if articles are actually about the organization's targets

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Article {
  id?: number;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  source?: string;
  published_at?: string;
  [key: string]: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articles, organization_name, organization_id, profile } = await req.json();

    console.log(`🔍 Relevance filtering for ${organization_name}: ${articles?.length || 0} articles`);

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        relevant_articles: [],
        filtered_out: 0,
        total: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Load intelligence targets with monitoring context
    console.log(`📊 Loading intelligence targets for ${organization_name}...`);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: targets, error: targetsError } = await supabase
      .from('intelligence_targets')
      .select('name, type, monitoring_context, industry_context, relevance_filter, priority')
      .eq('organization_id', organization_id)
      .eq('active', true);

    if (targetsError) {
      console.error('❌ Failed to load intelligence targets:', targetsError);
      throw new Error(`Failed to load targets: ${targetsError.message}`);
    }

    console.log(`✅ Loaded ${targets?.length || 0} intelligence targets`);

    const competitors = targets?.filter(t => t.type === 'competitor').map(t => ({
      name: t.name,
      monitoring_context: t.monitoring_context,
      industry_context: t.industry_context,
      keywords: t.relevance_filter?.keywords || []
    })) || [];

    const stakeholders = targets?.filter(t => t.type === 'stakeholder').map(t => ({
      name: t.name,
      monitoring_context: t.monitoring_context,
      industry_context: t.industry_context,
      keywords: t.relevance_filter?.keywords || []
    })) || [];

    if (competitors.length === 0 && stakeholders.length === 0) {
      console.warn('⚠️ No intelligence targets found - returning all articles');
      return new Response(JSON.stringify({
        relevant_articles: articles,
        filtered_out: 0,
        total: articles.length,
        warning: 'No intelligence targets configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Filter out old articles (keep last 7 days)
    const RECENCY_DAYS = 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RECENCY_DAYS);

    const recentArticles = articles.filter(article => {
      const publishedDate = new Date(article.published_at || article.publishDate || 0);
      const isRecent = publishedDate >= cutoffDate;

      if (!isRecent) {
        console.log(`   ⏭️  Filtering out old article: "${article.title?.substring(0, 60)}..." (${publishedDate.toDateString()})`);
      }

      return isRecent;
    });

    const filteredByAge = articles.length - recentArticles.length;
    console.log(`📅 Date filtering: ${articles.length} → ${recentArticles.length} articles (removed ${filteredByAge} older than ${RECENCY_DAYS} days)`);

    if (recentArticles.length === 0) {
      console.log('⚠️ No recent articles after date filtering');
      return new Response(JSON.stringify({
        relevant_articles: [],
        filtered_out: articles.length,
        filtered_by_age: filteredByAge,
        total: articles.length,
        message: `All ${articles.length} articles were older than ${RECENCY_DAYS} days`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use Claude to intelligently filter articles in batches
    console.log(`🤖 Using Claude to intelligently filter ${recentArticles.length} recent articles...`);

    const batchSize = 20; // Process 20 articles at a time
    const relevantArticles: any[] = [];

    for (let i = 0; i < recentArticles.length; i += batchSize) {
      const batch = recentArticles.slice(i, i + batchSize);

      console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(recentArticles.length/batchSize)} (${batch.length} articles)...`);

      const prompt = `You are an INTELLIGENCE ANALYST filtering news for ${organization_name}, a ${profile?.industry || 'trading'} company.

YOUR MISSION:
Cast a WIDE net. This company needs strategic intelligence about their industry, competitors, and market forces.

CONTEXT:
Industry: ${profile?.industry || 'trading'}
Competitors: ${competitors.map(c => c.name).join(', ')}
Stakeholders: ${stakeholders.map(s => s.name).join(', ')}

✅ RELEVANT ARTICLES (be INCLUSIVE):

1. DIRECT COMPETITOR INTELLIGENCE:
   - Any news about competitors (launches, hires, partnerships, acquisitions, crises, lawsuits, investigations)
   - Competitor financial results, strategy shifts, market moves

2. INDUSTRY CONTEXT (CRITICAL - even without competitor mention):
   - Major industry lawsuits/investigations (e.g., "Total Energies war crimes" affects trading industry)
   - Regulatory changes affecting ${profile?.industry || 'trading'}
   - Market trends, commodity price shifts, supply chain disruptions
   - Technology innovations in the industry
   - Major M&A activity in the sector

3. STAKEHOLDER ACTIVITY:
   - Policy announcements, regulatory changes
   - Government initiatives affecting the industry

4. STRATEGIC SIGNALS:
   - Emerging markets, new partnerships
   - ESG/sustainability trends in industry
   - Geopolitical events affecting ${profile?.industry || 'trading'}

❌ NOT RELEVANT:
   - Articles about ${organization_name} themselves
   - Completely unrelated industries (unless clear spillover effect)
   - Pure spam/promotional content

ARTICLES:
${batch.map((a, idx) => `
[${idx + 1}]
Title: ${a.title}
Description: ${a.description || 'N/A'}
${a.content ? `Content: ${a.content.substring(0, 500)}` : ''}
`).join('\n---\n')}

RESPOND IN JSON:
{
  "relevant": [
    {
      "article_number": 1,
      "is_relevant": true,
      "relevance_type": "competitor_intelligence" OR "industry_context" OR "regulatory" OR "strategic_signal",
      "relevance_score": 85,
      "reason": "Why this matters for ${organization_name}"
    }
  ]
}

Be INCLUSIVE - when in doubt, include it. Better to have too many than miss critical intelligence.`;

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
            temperature: 0.3,
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
        const claudeResponse = data.content[0].text;

        // Parse Claude's JSON response
        const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('❌ Failed to parse Claude response - no JSON found');
          continue;
        }

        const filterResults = JSON.parse(jsonMatch[0]);

        // Add relevant articles with enriched metadata
        filterResults.relevant?.forEach((result: any) => {
          const articleIdx = result.article_number - 1;
          if (articleIdx >= 0 && articleIdx < batch.length) {
            relevantArticles.push({
              ...batch[articleIdx],
              // Top-level fields for enrichment stage
              pr_relevance_score: result.relevance_score || 75,
              pr_category: result.relevance_type || 'industry_context',
              // Nested metadata for reference
              relevance_metadata: {
                target: result.target_mentioned,
                relevance_score: result.relevance_score,
                relevance_type: result.relevance_type,
                reason: result.reason,
                filtered_by: 'claude_ai'
              }
            });
          }
        });

        console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${filterResults.relevant?.length || 0} relevant articles found`);

      } catch (claudeError: any) {
        console.error(`❌ Claude filtering error for batch ${Math.floor(i/batchSize) + 1}:`, claudeError.message);
        // On error, include the batch as-is with lower confidence
        batch.forEach(article => {
          relevantArticles.push({
            ...article,
            // Top-level fields for enrichment stage
            pr_relevance_score: 50,
            pr_category: 'general',
            // Nested metadata for reference
            relevance_metadata: {
              relevance_score: 50,
              reason: 'Included due to filtering error',
              filtered_by: 'fallback'
            }
          });
        });
      }
    }

    const filteredByRelevance = recentArticles.length - relevantArticles.length;
    const totalFilteredOut = articles.length - relevantArticles.length;

    console.log(`✅ Relevance filtering complete:`);
    console.log(`   Original articles: ${articles.length}`);
    console.log(`   After date filter: ${recentArticles.length} (removed ${filteredByAge})`);
    console.log(`   After relevance filter: ${relevantArticles.length} (removed ${filteredByRelevance})`);
    console.log(`   Total filtered out: ${totalFilteredOut}`);
    console.log(`   Keep rate: ${((relevantArticles.length / articles.length) * 100).toFixed(1)}%`);

    return new Response(JSON.stringify({
      relevant_articles: relevantArticles,
      filtered_out: totalFilteredOut,
      filtered_by_age: filteredByAge,
      filtered_by_relevance: filteredByRelevance,
      total: articles.length,
      keep_rate: ((relevantArticles.length / articles.length) * 100).toFixed(1) + '%',
      targets_loaded: {
        competitors: competitors.length,
        stakeholders: stakeholders.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Relevance filtering error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
