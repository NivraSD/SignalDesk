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
const CANDIDATE_POOL_SIZE = 200; // Fetch more candidates for AI scoring
const RELEVANCE_THRESHOLD = 45; // Minimum score to include (0-100) - Lowered to capture moderately relevant articles

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, organization_name } = await req.json();

    console.log('📰 ARTICLE SELECTOR V2 (AI-Powered)');
    console.log(`   Organization: ${organization_name}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ================================================================
    // STEP 1: Get full company profile with intelligence context
    // ================================================================
    // Support both organization_id and organization_name
    // Prefer organization_name when both are provided (more reliable)
    let query = supabase.from('organization_profiles').select('*');

    if (organization_name) {
      query = query.eq('organization_name', organization_name);
    } else if (organization_id) {
      // organization_id can match either the profile's id or organization_id field
      query = query.or(`id.eq.${organization_id},organization_id.eq.${organization_id}`);
    } else {
      throw new Error('Either organization_id or organization_name is required');
    }

    const { data: org, error: orgError } = await query.single();

    if (orgError || !org) {
      throw new Error(`Failed to fetch organization: ${orgError?.message}`);
    }

    const profileData = org.profile_data || {};
    const industry = profileData.industry || org.industry || 'unknown';

    // Extract intelligence context - it may be an object with monitoring_prompt, or a string
    let intelligenceContext = '';
    if (profileData.intelligence_context) {
      if (typeof profileData.intelligence_context === 'string') {
        intelligenceContext = profileData.intelligence_context;
      } else if (profileData.intelligence_context.monitoring_prompt) {
        intelligenceContext = profileData.intelligence_context.monitoring_prompt;
      }
    }

    console.log(`   Organization: ${org.organization_name}`);
    console.log(`   Industry: ${industry}`);
    console.log(`   Has intelligence context: ${!!intelligenceContext}`);

    // ================================================================
    // STEP 2: Get ALL available sources and let Claude select relevant ones
    // ================================================================
    // STRATEGY: Fetch all sources with their industry tags, ask Claude which sources
    // are relevant for this organization, then get articles from those sources

    // Get all active sources with their industries
    const { data: allSources } = await supabase
      .from('source_registry')
      .select('source_name, tier, industries')
      .eq('active', true)
      .order('tier', { ascending: true });

    console.log(`   Found ${allSources?.length || 0} total active sources`);

    // Ask Claude to select relevant sources for this organization
    const sourceSelectionPrompt = `You are selecting news sources for ${organization_name}, a ${industry} company.

ORGANIZATION CONTEXT:
${intelligenceContext}

AVAILABLE SOURCES (${allSources?.length || 0} total):
${allSources?.map(s => `- ${s.source_name} (Tier ${s.tier}): ${s.industries?.join(', ') || 'general'}`).join('\n')}

Select 15-25 sources that are most relevant for monitoring this organization's competitive landscape and industry.
Prioritize:
1. Sources that cover the organization's industry directly
2. Tier 2/3 specialist sources over Tier 1 general news
3. Sources that would have information about competitors, industry trends, and market developments

Respond with ONLY a JSON array of source names:
["Source Name 1", "Source Name 2", ...]`;

    const sourceSelectionResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: sourceSelectionPrompt
        }]
      })
    });

    const sourceSelectionResult = await sourceSelectionResponse.json();

    // Error handling for Claude API response
    if (!sourceSelectionResult.content || !sourceSelectionResult.content[0]) {
      console.error('❌ Claude API error:', JSON.stringify(sourceSelectionResult, null, 2));
      throw new Error(`Claude API error: ${sourceSelectionResult.error?.message || 'Invalid response structure'}`);
    }

    const selectedSourcesText = sourceSelectionResult.content[0].text;
    console.log('📝 Claude response:', selectedSourcesText.substring(0, 500));

    const selectedSources = JSON.parse(selectedSourcesText.match(/\[.*\]/s)?.[0] || '[]');

    console.log(`   Claude selected ${selectedSources.length} relevant sources`);

    // Fetch articles from selected sources WITH SOURCE DIVERSITY
    // Strategy: Get articles distributed across sources, not all from 1-2 sources
    const articlesPerSource = Math.ceil(CANDIDATE_POOL_SIZE / Math.max(selectedSources.length, 10));
    console.log(`   Fetching up to ${articlesPerSource} articles per source for diversity`);

    // Calculate 24 hours ago for filtering
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    console.log(`   Filtering articles from last 24 hours (since ${twentyFourHoursAgo})`);

    const articlesBySource = await Promise.all(
      selectedSources.map(async (sourceName: string) => {
        const { data } = await supabase
          .from('raw_articles')
          .select(`
            id,
            source_id,
            source_name,
            url,
            title,
            description,
            published_at,
            created_at,
            full_content,
            raw_metadata,
            source_registry!inner(tier, industries)
          `)
          .eq('scrape_status', 'completed')
          .eq('source_name', sourceName)
          // CRITICAL FIX: Filter by published_at (when article was published), not created_at
          .gte('published_at', twentyFourHoursAgo)
          // Accept articles with OR without full_content (preview-only articles still valuable)
          .order('published_at', { ascending: false })  // Order by actual publication date
          .limit(articlesPerSource);

        return data || [];
      })
    );

    // Flatten and sort by recency (using published_at, not created_at)
    const selectedArticles = articlesBySource
      .flat()
      .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime())
      .slice(0, CANDIDATE_POOL_SIZE);

    console.log(`   Fetched ${selectedArticles?.length || 0} articles from selected sources`);
    const candidateArticles = selectedArticles || [];

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
      organization_name || org.organization_name,
      industry,
      intelligenceContext,
      profileData
    );

    // Filter by threshold and take top N
    const relevantArticles = scoredArticles
      .filter(a => a.relevance_score >= RELEVANCE_THRESHOLD)
      .slice(0, MAX_ARTICLES);

    console.log(`   Articles above threshold (${RELEVANCE_THRESHOLD}): ${relevantArticles.length}`);

    // ================================================================
    // QUALITY VALIDATION: Filter out garbage content
    // ================================================================
    const qualityValidatedArticles = relevantArticles.filter(article => {
      const content = article.full_content || '';
      const hasDescription = article.description && article.description.length > 50;

      // ACCEPT preview-only articles (headline + description) - valuable for intelligence
      if (content.length < 100 && hasDescription) {
        console.log(`   ✅ Preview-only: "${article.title?.substring(0, 60)}..." (using title+description)`);
        return true; // Keep preview-only articles
      }

      // For full content articles, validate quality
      if (content.length >= 100) {
        // Check for paywall indicators
        const paywallPatterns = [
          /subscribe to continue reading/i,
          /this article is for subscribers only/i,
          /sign up to unlock/i,
          /become a (member|subscriber) to (read|access)/i
        ];

        const hasPaywall = paywallPatterns.some(p => p.test(content.substring(0, 2000)));

        // Check for cookie wall (short content dominated by cookie text)
        const cookieIndicators = [
          /we use cookies/i,
          /cookie (policy|preferences)/i,
          /accept (all )?cookies/i
        ];

        const cookieCount = cookieIndicators.filter(p => p.test(content.substring(0, 2000))).length;
        const isCookieWall = content.length < 2000 && cookieCount >= 2;

        // Check for navigation/UI garbage
        const hasStructure = (content.match(/\n\n/g) || []).length >= 3;

        // Check for identical content (same length across multiple articles suggests paywall)
        const contentLength = content.length;
        const isDuplicateLength = contentLength > 0 && contentLength === 8713; // GreenTech Media paywall

        const isValid = !hasPaywall && !isCookieWall && hasStructure && !isDuplicateLength && contentLength > 500;

        if (!isValid) {
          console.log(`   ⚠️  Rejected low-quality: "${article.title?.substring(0, 60)}..." (${content.length} chars, paywall: ${hasPaywall}, cookie: ${isCookieWall}, structure: ${hasStructure})`);
        }

        return isValid;
      }

      // Reject if no content AND no description
      if (!hasDescription) {
        console.log(`   ❌ No content or description: "${article.title?.substring(0, 60)}..."`);
        return false;
      }

      return true;
    });

    const rejectedCount = relevantArticles.length - qualityValidatedArticles.length;
    console.log(`   Quality validation: ${qualityValidatedArticles.length} passed, ${rejectedCount} rejected`);
    console.log(`   Returning top ${Math.min(qualityValidatedArticles.length, MAX_ARTICLES)} articles`);

    // ================================================================
    // STEP 4: Format for enrichment pipeline
    // ================================================================
    const formattedArticles = qualityValidatedArticles.map(article => ({
      url: article.url,
      title: article.title,
      description: article.description || '',
      source: article.source_name,
      published_at: article.published_at || article.created_at, // Fallback to scrape date if no pub date
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
      organization_name: organization_name || org.organization_name,
      industry: industry,

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

  // Build COMPREHENSIVE strategic context for Claude - use ALL available profile data
  const competitors = [
    ...(company_profile.competition?.direct_competitors || []),
    ...(company_profile.competition?.indirect_competitors || []),
    ...(company_profile.competition?.emerging_threats || [])
  ].filter(Boolean);

  const stakeholders = [
    ...(company_profile.stakeholders?.major_customers || []),
    ...(company_profile.stakeholders?.key_partners || []),
    ...(company_profile.stakeholders?.key_analysts || []),
    ...(company_profile.stakeholders?.regulators || [])
  ].filter(Boolean);

  const topics = company_profile.topics || [];
  const strategicContext = company_profile.strategic_context || '';
  const forwardLooking = company_profile.forward_looking || '';
  const serviceLines = company_profile.service_lines || [];

  // Extract from nested company_profile object if it exists
  const nestedProfile = company_profile.company_profile || {};
  const productLines = nestedProfile.product_lines || company_profile.product_lines || [];
  const markets = nestedProfile.key_markets || company_profile.market || company_profile.markets || [];
  const strategicGoals = nestedProfile.strategic_goals || company_profile.strategic_goals || company_profile.goals || [];
  const businessModel = nestedProfile.business_model || '';

  const companyContext = `
Company: ${organization_name}
Industry: ${industry}
${company_profile.description ? `\nBusiness: ${company_profile.description}` : ''}
${businessModel ? `\nBusiness Model: ${businessModel}` : ''}

${(serviceLines.length > 0 || productLines.length > 0) ? `\nService/Product Lines:
${[...serviceLines, ...productLines].slice(0, 10).map(p => `  - ${p}`).join('\n')}` : ''}

${Array.isArray(markets) && markets.length > 0 ? `\nKey Markets:
${markets.slice(0, 8).map(m => `  - ${m}`).join('\n')}` : ''}

${competitors.length > 0 ? `\nKey Competitors to Monitor:
${competitors.slice(0, 15).map(c => `  - ${c}`).join('\n')}` : ''}

${stakeholders.length > 0 ? `\nKey Stakeholders (Clients, Partners, Analysts):
${stakeholders.slice(0, 10).map(s => `  - ${s}`).join('\n')}` : ''}

${topics.length > 0 ? `\nStrategic Topics of Interest:
${topics.slice(0, 10).map(t => `  - ${t}`).join('\n')}` : ''}

${Array.isArray(strategicGoals) && strategicGoals.length > 0 ? `\nStrategic Goals:
${strategicGoals.slice(0, 5).map(g => typeof g === 'object' ? `  - ${g.goal}: ${g.description}` : `  - ${g}`).join('\n')}` : ''}

${strategicContext ? `\nStrategic Context: ${strategicContext}` : ''}
${forwardLooking ? `\nFuture Outlook: ${forwardLooking}` : ''}
${intelligence_context ? `\nIntelligence Focus: ${intelligence_context}` : ''}
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

    const prompt = `You are selecting articles for ${organization_name}'s executive intelligence briefing.

PURPOSE: These articles will be analyzed and synthesized into an executive report that helps leadership understand:
- What competitors are doing (moves, wins, strategy changes)
- Industry trends and best practices they should know about
- Market developments that create opportunities or threats

${intelligence_context}

ARTICLES TO SCORE:
${JSON.stringify(articlesForScoring, null, 2)}

SCORING RULES:
- 90-100: Direct competitor intelligence (the companies/people listed above doing something)
- 75-89: Industry trends and best practices relevant to ${industry}
- 50-74: Market context that provides strategic backdrop
- 0-49: Generic business news executives don't need

Score each article. Respond with ONLY valid JSON:
[
  {"id": 0, "score": 85, "reasoning": "Brief explanation"},
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
          model: 'claude-3-5-haiku-20241022', // Fast + cheap for scoring
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
