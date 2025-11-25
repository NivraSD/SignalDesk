// Article Selector V3 - Smart, Fast, Effective
// No bullshit AI scoring. Simple logic: Does it mention the company or industry? Include it.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, organization_name } = await req.json();

    console.log('📰 ARTICLE SELECTOR V3 (Smart Curation)');
    console.log(`   Organization: ${organization_name}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ================================================================
    // STEP 1: Get company profile and intelligence targets
    // ================================================================
    let org;
    let orgError;

    if (organization_name) {
      // Try organization_profiles first
      const { data: profileData, error: profileError } = await supabase
        .from('organization_profiles')
        .select('*')
        .eq('organization_name', organization_name)
        .limit(1)
        .maybeSingle();

      if (profileData) {
        org = profileData;
      } else {
        // Fallback to organizations table
        const { data: orgData, error: orgErr } = await supabase
          .from('organizations')
          .select('*')
          .eq('name', organization_name)
          .limit(1)
          .maybeSingle();

        org = orgData;
        orgError = orgErr;
      }
    } else if (organization_id) {
      const { data: orgData, error: orgErr } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization_id)
        .single();

      org = orgData;
      orgError = orgErr;
    } else {
      throw new Error('Either organization_id or organization_name is required');
    }

    if (orgError || !org) {
      throw new Error(`Failed to fetch organization: ${orgError?.message}`);
    }

    const profileData = org.profile_data || org.company_profile || {};
    const industry = profileData.industry || org.industry || 'unknown';

    console.log(`   Industry: ${industry}`);
    console.log(`   Profile data available: ${!!profileData && Object.keys(profileData).length > 0}`);

    // ================================================================
    // STEP 2: Build search keywords from profile
    // ================================================================
    const keywords = new Set<string>();

    // Add organization name
    if (organization_name) keywords.add(organization_name.toLowerCase());
    if (org.name) keywords.add(org.name.toLowerCase());
    if (org.organization_name) keywords.add(org.organization_name.toLowerCase());

    // Add competitors
    if (profileData.competition) {
      [...(profileData.competition.direct_competitors || []),
       ...(profileData.competition.indirect_competitors || []),
       ...(profileData.competition.emerging_threats || [])].forEach(c => {
        if (c && typeof c === 'string') keywords.add(c.toLowerCase());
      });
    }

    // Add stakeholders
    if (profileData.stakeholders) {
      [...(profileData.stakeholders.regulators || []),
       ...(profileData.stakeholders.major_investors || []),
       ...(profileData.stakeholders.major_customers || [])].forEach(s => {
        if (s && typeof s === 'string') keywords.add(s.toLowerCase());
      });
    }

    // Add industry keywords
    if (profileData.keywords) {
      profileData.keywords.forEach(k => {
        if (k && typeof k === 'string') keywords.add(k.toLowerCase());
      });
    }
    if (profileData.monitoring_config?.keywords) {
      profileData.monitoring_config.keywords.forEach(k => {
        if (k && typeof k === 'string') keywords.add(k.toLowerCase());
      });
    }

    // Add industry name itself
    if (industry && industry !== 'unknown') keywords.add(industry.toLowerCase());

    console.log(`   Keywords: ${keywords.size} total`);
    console.log(`   All keywords:`, Array.from(keywords));

    // DEBUG: Log profile data structure
    console.log(`   Profile structure:`, {
      has_competition: !!profileData.competition,
      has_stakeholders: !!profileData.stakeholders,
      has_keywords: !!profileData.keywords,
      has_monitoring_config: !!profileData.monitoring_config,
      competitors_count: profileData.competition?.direct_competitors?.length || 0,
      profile_keys: Object.keys(profileData)
    });

    // ================================================================
    // STEP 3: Get intelligence targets from database
    // ================================================================
    const { data: intelligenceTargets } = await supabase
      .from('intelligence_targets')
      .select('name, type, priority')
      .eq('organization_id', organization_id || org.id)
      .eq('active', true);

    if (intelligenceTargets && intelligenceTargets.length > 0) {
      intelligenceTargets.forEach(target => {
        keywords.add(target.name.toLowerCase());
      });
      console.log(`   Added ${intelligenceTargets.length} intelligence targets`);
    }

    // ================================================================
    // STEP 4: Determine source strategy based on company type
    // ================================================================
    const isDiversified =
      /conglomerate|diversified|holding|multi-industry/i.test(profileData.description || '') ||
      ['Mitsui', 'Mitsubishi', 'Sumitomo', 'Berkshire Hathaway'].some(name =>
        organization_name?.includes(name)
      );

    console.log(`   Company type: ${isDiversified ? 'DIVERSIFIED' : 'FOCUSED'}`);

    // ================================================================
    // STEP 5: Get articles from ALL sources from last 24h
    // ================================================================
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: allArticles } = await supabase
      .from('raw_articles')
      .select(`
        id,
        source_name,
        url,
        title,
        description,
        published_at,
        full_content,
        source_registry!inner(tier, industries)
      `)
      .eq('scrape_status', 'completed')
      .gte('published_at', twentyFourHoursAgo)
      .order('published_at', { ascending: false })
      .limit(500); // Get plenty to work with

    console.log(`   Found ${allArticles?.length || 0} articles from last 24h`);

    if (!allArticles || allArticles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        organization_id,
        organization_name,
        total_articles: 0,
        articles: [],
        message: 'No articles found in last 24 hours'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ================================================================
    // STEP 6: SMART MATCHING - Check each article for keyword matches
    // ================================================================
    const matchedArticles = [];
    const keywordArray = Array.from(keywords);

    for (const article of allArticles) {
      const searchText = `${article.title || ''} ${article.description || ''}`.toLowerCase();

      // Check if ANY keyword matches
      const matches = keywordArray.filter(keyword => searchText.includes(keyword));

      if (matches.length > 0) {
        // Calculate relevance score based on matches
        let score = matches.length * 10; // Base score

        // Bonus for company name match
        const companyName = organization_name || org.name || org.organization_name;
        if (companyName && searchText.includes(companyName.toLowerCase())) {
          score += 30;
        }

        // Bonus for tier 1 sources if diversified company
        if (isDiversified && article.source_registry?.tier === 1) {
          score += 20;
        }

        // Bonus for full content
        if (article.full_content && article.full_content.length > 500) {
          score += 10;
        }

        matchedArticles.push({
          ...article,
          relevance_score: Math.min(score, 100),
          matched_keywords: matches
        });
      }
    }

    console.log(`   Matched: ${matchedArticles.length} articles`);

    // ================================================================
    // STEP 7: CURATE - Enforce source diversity and take best
    // ================================================================
    const MAX_ARTICLES = 50;
    const MAX_PER_SOURCE = 8;

    // Sort by relevance score
    matchedArticles.sort((a, b) => b.relevance_score - a.relevance_score);

    // Enforce source diversity
    const sourceCount = new Map<string, number>();
    const curatedArticles = [];

    for (const article of matchedArticles) {
      const count = sourceCount.get(article.source_name) || 0;

      if (count < MAX_PER_SOURCE) {
        curatedArticles.push(article);
        sourceCount.set(article.source_name, count + 1);
      }

      if (curatedArticles.length >= MAX_ARTICLES) break;
    }

    // Log source distribution
    const sourceDistribution = {};
    curatedArticles.forEach(a => {
      sourceDistribution[a.source_name] = (sourceDistribution[a.source_name] || 0) + 1;
    });

    console.log(`   Curated: ${curatedArticles.length} articles from ${Object.keys(sourceDistribution).length} sources`);
    console.log(`   Distribution:`, sourceDistribution);

    // ================================================================
    // STEP 8: Format for enrichment
    // ================================================================
    const formattedArticles = curatedArticles.map(article => ({
      url: article.url,
      title: article.title,
      description: article.description || '',
      source: article.source_name,
      published_at: article.published_at,
      full_content: article.full_content,
      pr_score: article.relevance_score,
      source_tier: article.source_registry?.tier || 2,
      matched_keywords: article.matched_keywords
    }));

    return new Response(JSON.stringify({
      success: true,
      organization_id,
      organization_name,
      industry,
      total_articles: curatedArticles.length,
      candidates_checked: allArticles.length,
      avg_score: Math.round(
        curatedArticles.reduce((sum, a) => sum + a.relevance_score, 0) /
        (curatedArticles.length || 1)
      ),
      articles: formattedArticles,
      sources: Object.keys(sourceDistribution),
      source_distribution: sourceDistribution,
      selected_at: new Date().toISOString(),
      selection_method: 'v3_keyword_matching'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Article Selector Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
