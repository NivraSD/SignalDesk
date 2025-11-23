// Article Selector V2 - AI-Powered Relevance
// Intelligently selects articles based on company profile understanding
// Uses Claude to score article relevance instead of rigid industry matching

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const MAX_ARTICLES = 50; // Final article count to return
const TIME_WINDOW_DAYS = 2; // Look back 2 days for fresh news
const CANDIDATE_POOL_SIZE = 200; // Fetch more candidates for AI scoring
const RELEVANCE_THRESHOLD = 60; // Minimum score to include (0-100)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, organization_name } = await req.json();

    console.log('📰 ARTICLE SELECTOR V2 (AI-Powered)');
    console.log(`   Organization: ${organization_name}`);
    console.log(`   Time window: ${TIME_WINDOW_DAYS} days`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ================================================================
    // STEP 1: Get full company profile with intelligence context
    // ================================================================
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('industry, company_profile')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      throw new Error(`Failed to fetch organization: ${orgError?.message}`);
    }

    const companyProfile = org.company_profile || {};
    const intelligenceContext = companyProfile.intelligence_context || '';

    console.log(`   Industry: ${org.industry}`);
    console.log(`   Has intelligence context: ${!!intelligenceContext}`);

    // ================================================================
    // STEP 2: Fetch candidate articles (cast wide net)
    // ================================================================
    const timeThreshold = new Date();
    timeThreshold.setDate(timeThreshold.getDate() - TIME_WINDOW_DAYS);

    // Get recent completed articles from ALL sources
    // Filter by published_at (when article was published) not created_at (when we scraped it)
    const { data: candidateArticles } = await supabase
      .from('raw_articles')
      .select(`
        id,
        source_id,
        source_name,
        url,
        title,
        description,
        published_at,
        full_content,
        raw_metadata,
        source_registry!inner(tier, industries)
      `)
      .eq('scrape_status', 'completed')
      .gte('published_at', timeThreshold.toISOString())
      .not('full_content', 'is', null)
      .order('published_at', { ascending: false })
      .limit(CANDIDATE_POOL_SIZE);

    console.log(`   Fetched ${candidateArticles?.length || 0} candidate articles`);

    if (!candidateArticles || candidateArticles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        organization_id,
        organization_name,
        total_articles: 0,
        articles: [],
        sources: [],
        selected_at: new Date().toISOString(),
        selection_method: 'v2_ai_relevance_scoring'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ================================================================
    // STEP 3: AI-powered relevance scoring
    // ================================================================
    console.log(`   Scoring articles with Claude...`);

    const scoredArticles = await scoreArticlesWithAI(
      candidateArticles,
      organization_name,
      org.industry,
      intelligenceContext,
      companyProfile
    );

    // Filter by threshold and take top N
    const relevantArticles = scoredArticles
      .filter(a => a.relevance_score >= RELEVANCE_THRESHOLD)
      .slice(0, MAX_ARTICLES);

    console.log(`   Articles above threshold (${RELEVANCE_THRESHOLD}): ${relevantArticles.length}`);
    console.log(`   Returning top ${Math.min(relevantArticles.length, MAX_ARTICLES)} articles`);

    // ================================================================
    // STEP 4: Format for enrichment pipeline
    // ================================================================
    const formattedArticles = relevantArticles.map(article => ({
      url: article.url,
      title: article.title,
      description: article.description || '',
      source: article.source_name,
      published_at: article.published_at,
      full_content: article.full_content,
      pr_score: article.relevance_score, // Use AI score as relevance
      source_tier: article.source_registry?.tier || 2,
      relevance_reasoning: article.relevance_reasoning
    }));

    // ================================================================
    // FINAL RESPONSE
    // ================================================================
    const response = {
      success: true,
      organization_id,
      organization_name,
      industry: org.industry,
      time_window_days: TIME_WINDOW_DAYS,

      // Statistics
      total_articles: relevantArticles.length,
      candidates_scored: candidateArticles.length,
      avg_score: Math.round(
        relevantArticles.reduce((sum, a) => sum + a.relevance_score, 0) /
        (relevantArticles.length || 1)
      ),

      // Articles for enrichment
      articles: formattedArticles,

      // Source breakdown
      sources: [...new Set(formattedArticles.map(a => a.source))],

      // Metadata
      selected_at: new Date().toISOString(),
      selection_method: 'v2_ai_relevance_scoring',
      scoring_model: 'claude-3-haiku-20240307'
    };

    console.log('✅ Article selection complete');
    console.log(`   Selected: ${formattedArticles.length} articles from ${response.sources.length} sources`);
    console.log(`   Avg relevance score: ${response.avg_score}/100`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Article selection failed:', error);

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
// AI Relevance Scoring with Claude Haiku (fast + cheap)
// ============================================================================
async function scoreArticlesWithAI(
  articles: any[],
  organization_name: string,
  industry: string,
  intelligence_context: string,
  company_profile: any
): Promise<any[]> {

  // Build company context for Claude
  const companyContext = `
Company: ${organization_name}
Industry: ${industry}
${intelligence_context ? `Intelligence Context: ${intelligence_context}` : ''}
${company_profile.description ? `Description: ${company_profile.description}` : ''}
${company_profile.target_audience ? `Target Audience: ${company_profile.target_audience}` : ''}
`.trim();

  // Batch score articles (process in chunks of 20 for efficiency)
  const BATCH_SIZE = 20;
  const scoredArticles: any[] = [];

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);

    // Format articles for Claude
    const articlesForScoring = batch.map((article, idx) => ({
      id: idx,
      source: article.source_name,
      source_industries: article.source_registry?.industries || [],
      title: article.title,
      description: article.description || ''
    }));

    const prompt = `You are analyzing news articles for relevance to a specific company.

COMPANY PROFILE:
${companyContext}

ARTICLES TO SCORE:
${JSON.stringify(articlesForScoring, null, 2)}

TASK:
Score each article's relevance to this company on a scale of 0-100, where:
- 100 = Highly relevant (directly about the company's industry, competitors, clients, or key topics)
- 75-99 = Very relevant (about related industries, trends, or stakeholders)
- 50-74 = Moderately relevant (tangentially related or broader industry news)
- 25-49 = Somewhat relevant (general business news with loose connection)
- 0-24 = Not relevant (unrelated topic or industry)

Consider:
1. Does the article match ANY keywords from the company profile?
2. Is it about the company's industry or related fields?
3. Would this information be valuable for the company's competitive intelligence?
4. Are competitors, clients, or partners mentioned?

Respond with ONLY a valid JSON array of scores:
[
  {"id": 0, "score": 85, "reasoning": "Brief explanation"},
  {"id": 1, "score": 45, "reasoning": "Brief explanation"},
  ...
]`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307', // Fast + cheap for scoring
          max_tokens: 2000,
          temperature: 0,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Claude API error (${response.status}):`, errorBody);
        throw new Error(`Claude API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      const scoresText = data.content[0].text;

      // Parse JSON response
      const scores = JSON.parse(scoresText);

      // Map scores back to articles
      for (const scoreData of scores) {
        const article = batch[scoreData.id];
        scoredArticles.push({
          ...article,
          relevance_score: scoreData.score,
          relevance_reasoning: scoreData.reasoning
        });
      }

    } catch (error) {
      console.error(`⚠️ Failed to score batch ${i}-${i + BATCH_SIZE}:`, error);
      console.log('   Using rule-based fallback scoring for this batch');

      // Fallback: Use simple keyword matching for industry relevance
      batch.forEach(article => {
        const articleText = `${article.title} ${article.description}`.toLowerCase();
        const industryLower = industry.toLowerCase();
        const sourceIndustries = article.source_registry?.industries || [];

        let score = 50; // Default medium relevance
        let reasoning = 'AI scoring unavailable, used keyword matching';

        // Boost score if source is tagged with matching industry
        if (sourceIndustries.some((ind: string) => ind.toLowerCase().includes(industryLower))) {
          score = 75;
          reasoning = `Source covers ${industry} industry`;
        }

        // Boost score if article text mentions industry
        if (articleText.includes(industryLower)) {
          score = Math.min(score + 15, 90);
          reasoning = `Article mentions ${industry}`;
        }

        scoredArticles.push({
          ...article,
          relevance_score: score,
          relevance_reasoning: reasoning
        });
      });
    }
  }

  // Sort by relevance score (highest first)
  return scoredArticles.sort((a, b) => b.relevance_score - a.relevance_score);
}
