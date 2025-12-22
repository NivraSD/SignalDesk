// Article Selector V3 - Uses target_article_matches
// Leverages the semantic matching pipeline instead of doing its own source selection
// Much simpler and more accurate

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_ARTICLES = 50; // Final article count to return
const MIN_SIMILARITY_SCORE = 0.35; // Minimum semantic similarity (35%)
const MAX_PER_SOURCE = 8; // Max articles from any single source for diversity

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, organization_name } = await req.json();

    console.log('📰 ARTICLE SELECTOR V3 (Using target_article_matches)');
    console.log(`   Organization: ${organization_name || organization_id}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ================================================================
    // STEP 1: Get organization ID if only name provided
    // ================================================================
    let orgId = organization_id;

    if (!orgId && organization_name) {
      const { data: org } = await supabase
        .from('organization_profiles')
        .select('organization_id')
        .eq('organization_name', organization_name)
        .single();

      orgId = org?.organization_id;
    }

    if (!orgId) {
      throw new Error('Could not find organization');
    }

    console.log(`   Organization ID: ${orgId}`);

    // ================================================================
    // STEP 2: Get matched articles from target_article_matches
    // ================================================================
    // This table already has semantic matches from the embedding pipeline!
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: matches, error: matchError } = await supabase
      .from('target_article_matches')
      .select(`
        id,
        similarity_score,
        signal_category,
        signal_strength,
        match_reason,
        article_id,
        raw_articles!inner (
          id,
          url,
          title,
          description,
          source_name,
          published_at,
          full_content,
          content_length,
          scrape_status
        )
      `)
      .eq('organization_id', orgId)
      .gte('matched_at', twentyFourHoursAgo)
      .gte('similarity_score', MIN_SIMILARITY_SCORE)
      .order('similarity_score', { ascending: false })
      .limit(200); // Get pool of candidates

    if (matchError) {
      console.error('Error fetching matches:', matchError);
      throw new Error(`Failed to fetch matches: ${matchError.message}`);
    }

    console.log(`   Found ${matches?.length || 0} semantic matches from last 24h`);

    if (!matches || matches.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        organization_id: orgId,
        organization_name,
        total_articles: 0,
        articles: [],
        sources: [],
        selected_at: new Date().toISOString(),
        selection_method: 'v3_semantic_matches'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ================================================================
    // STEP 3: Quality validation - filter out garbage content
    // ================================================================
    const qualityValidatedMatches = matches.filter(match => {
      const article = match.raw_articles;
      if (!article) return false;

      // Only include completed scrapes
      if (article.scrape_status !== 'completed') {
        console.log(`   ⚠️  Skipping non-completed: "${article.title?.substring(0, 50)}..."`);
        return false;
      }

      const content = article.full_content || '';
      const hasDescription = article.description && article.description.length > 50;

      // Accept preview-only articles (headline + description) - still valuable
      if (content.length < 100 && hasDescription) {
        return true;
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

        // Check for cookie wall
        const cookieIndicators = [
          /we use cookies/i,
          /cookie (policy|preferences)/i,
          /accept (all )?cookies/i
        ];

        const cookieCount = cookieIndicators.filter(p => p.test(content.substring(0, 2000))).length;
        const isCookieWall = content.length < 2000 && cookieCount >= 2;

        // Check for structure (real articles have paragraphs)
        const hasStructure = (content.match(/\n\n/g) || []).length >= 3;

        const isValid = !hasPaywall && !isCookieWall && hasStructure && content.length > 500;

        if (!isValid) {
          console.log(`   ⚠️  Rejected: "${article.title?.substring(0, 50)}..." (paywall: ${hasPaywall}, cookie: ${isCookieWall})`);
        }

        return isValid;
      }

      // Reject if no content AND no description
      return hasDescription;
    });

    console.log(`   Quality validated: ${qualityValidatedMatches.length} articles`);

    // ================================================================
    // STEP 4: Source diversity enforcement
    // ================================================================
    const sourceArticleCounts = new Map<string, number>();
    const diverseArticles: typeof qualityValidatedMatches = [];

    for (const match of qualityValidatedMatches) {
      const source = match.raw_articles?.source_name || 'Unknown';
      const currentCount = sourceArticleCounts.get(source) || 0;

      if (currentCount < MAX_PER_SOURCE) {
        diverseArticles.push(match);
        sourceArticleCounts.set(source, currentCount + 1);
      }

      if (diverseArticles.length >= MAX_ARTICLES) break;
    }

    // Log source distribution
    const sourceDistribution: Record<string, number> = {};
    diverseArticles.forEach(m => {
      const src = m.raw_articles?.source_name || 'Unknown';
      sourceDistribution[src] = (sourceDistribution[src] || 0) + 1;
    });
    console.log(`   Source diversity:`, sourceDistribution);

    // ================================================================
    // STEP 5: Format for enrichment pipeline
    // ================================================================
    const formattedArticles = diverseArticles.map(match => ({
      url: match.raw_articles?.url,
      title: match.raw_articles?.title,
      description: match.raw_articles?.description || '',
      source: match.raw_articles?.source_name,
      published_at: match.raw_articles?.published_at,
      full_content: match.raw_articles?.full_content,
      pr_score: Math.round(match.similarity_score * 100), // Convert to 0-100
      relevance_reasoning: match.match_reason,
      signal_category: match.signal_category,
      signal_strength: match.signal_strength
    }));

    // ================================================================
    // FINAL RESPONSE
    // ================================================================
    const response = {
      success: true,
      organization_id: orgId,
      organization_name,

      // Statistics
      total_articles: formattedArticles.length,
      candidates_from_matches: matches.length,
      quality_filtered: qualityValidatedMatches.length,
      avg_score: Math.round(
        diverseArticles.reduce((sum, m) => sum + m.similarity_score * 100, 0) /
        (diverseArticles.length || 1)
      ),

      // Articles for enrichment
      articles: formattedArticles,

      // Source breakdown
      sources: Object.keys(sourceDistribution),

      // Metadata
      selected_at: new Date().toISOString(),
      selection_method: 'v3_semantic_matches'
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
