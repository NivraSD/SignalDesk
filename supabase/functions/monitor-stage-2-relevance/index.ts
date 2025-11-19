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

    // Use Claude to intelligently filter articles in batches
    console.log(`🤖 Using Claude to intelligently filter ${articles.length} articles...`);

    const batchSize = 20; // Process 20 articles at a time
    const relevantArticles: any[] = [];

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);

      console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(articles.length/batchSize)} (${batch.length} articles)...`);

      const prompt = `You are filtering news articles for ${organization_name}, a company in ${profile?.industry || 'their industry'}.

YOUR JOB:
Filter articles for relevance to the ${profile?.industry || 'their industry'} industry. ${organization_name} wants to stay informed about industry trends, competitor activities, and stakeholder movements.

COMPETITORS TO TRACK (${competitors.length}):
${competitors.map(c => `- ${c.name}: ${c.monitoring_context || 'Monitor for competitive intelligence'}`).join('\n')}

STAKEHOLDERS TO TRACK (${stakeholders.length}):
${stakeholders.map(s => `- ${s.name}: ${s.monitoring_context || 'Monitor for stakeholder activities'}`).join('\n')}

An article IS relevant if it covers:
✅ Competitor news (product launches, hires, partnerships, acquisitions, crises, strategy shifts)
✅ Stakeholder activities (statements, policy changes, movements, initiatives)
✅ Industry trends affecting ${profile?.industry || 'the industry'} (market shifts, new regulations, technology changes)
✅ Major industry events, awards, or recognition
✅ Thought leadership or research relevant to ${profile?.industry || 'the industry'}

An article is NOT relevant if:
❌ It's about ${organization_name} themselves
❌ It's completely unrelated to ${profile?.industry || 'the industry'} (tech, finance, healthcare, etc. unless relevant)
❌ It's purely promotional/spam content

ARTICLES TO FILTER:
${batch.map((a, idx) => `
[${idx + 1}]
Title: ${a.title}
Description: ${a.description || 'N/A'}
${a.content ? `Content Preview: ${a.content.substring(0, 300)}...` : ''}
`).join('\n---\n')}

RESPOND IN JSON:
{
  "relevant": [
    {
      "article_number": 1,
      "is_relevant": true,
      "target_mentioned": "Edelman" OR "Industry Trend" OR "Stakeholder Name",
      "relevance_score": 85,
      "reason": "Brief explanation of why this is relevant to ${profile?.industry || 'the industry'}"
    }
  ]
}

Include ALL articles relevant to ${profile?.industry || 'the industry'}. Be inclusive - industry news is valuable even without specific competitor mentions.`;

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
              relevance_metadata: {
                target: result.target_mentioned,
                relevance_score: result.relevance_score,
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
            relevance_metadata: {
              relevance_score: 50,
              reason: 'Included due to filtering error',
              filtered_by: 'fallback'
            }
          });
        });
      }
    }

    const filteredOut = articles.length - relevantArticles.length;

    console.log(`✅ Relevance filtering complete:`);
    console.log(`   Total articles: ${articles.length}`);
    console.log(`   Relevant: ${relevantArticles.length}`);
    console.log(`   Filtered out: ${filteredOut}`);
    console.log(`   Keep rate: ${((relevantArticles.length / articles.length) * 100).toFixed(1)}%`);

    return new Response(JSON.stringify({
      relevant_articles: relevantArticles,
      filtered_out: filteredOut,
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
