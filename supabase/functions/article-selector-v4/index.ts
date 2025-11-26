// Article Selector V4 - Source Registry Based
// 1. Gets company's relevant industries from profile
// 2. Looks up which sources cover those industries (from source_registry)
// 3. Returns ALL articles from those sources - no Claude filtering
// Relevance filter does the smart filtering downstream

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Map company industry to source_registry industry tags
const INDUSTRY_MAPPINGS: Record<string, string[]> = {
  // Trading/Conglomerate companies care about EVERYTHING
  trading: ['finance', 'energy', 'cleantech', 'logistics', 'transportation', 'supply_chain',
            'manufacturing', 'industrial', 'technology', 'healthcare', 'retail', 'food',
            'policy', 'international', 'politics', 'asia', 'europe', 'investing', 'economics'],
  conglomerate: ['finance', 'energy', 'cleantech', 'logistics', 'transportation', 'supply_chain',
                 'manufacturing', 'industrial', 'technology', 'healthcare', 'retail', 'food',
                 'policy', 'international', 'politics', 'asia', 'europe', 'investing', 'economics'],

  // PR companies
  public_relations: ['public_relations', 'marketing', 'advertising', 'corporate_communications',
                     'media', 'technology', 'retail', 'healthcare', 'finance'],

  // Tech companies
  technology: ['technology', 'ai', 'startups', 'venture_capital', 'science', 'engineering',
               'consumer_electronics', 'gaming', 'machine_learning', 'emerging_tech'],

  // Finance
  finance: ['finance', 'banking', 'fintech', 'investing', 'payments', 'crypto', 'blockchain',
            'private_equity', 'venture_capital', 'economics', 'regulation'],

  // Healthcare
  healthcare: ['healthcare', 'pharma', 'biotech', 'medtech', 'regulation'],

  // Energy
  energy: ['energy', 'cleantech', 'renewables', 'utilities'],

  // Retail
  retail: ['retail', 'ecommerce', 'fashion', 'food', 'consumer_protection'],

  // Default - tier 1 general sources
  default: ['finance', 'technology', 'healthcare', 'retail', 'politics']
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { organization_id, organization_name } = await req.json();

    console.log('🎯 ARTICLE SELECTOR V4 - SOURCE REGISTRY BASED');
    console.log(`   Organization: ${organization_name}`);
    console.log(`   Time: ${new Date().toISOString()}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ================================================================
    // STEP 1: Get company profile and determine relevant industries
    // ================================================================
    let org;
    let orgError;

    if (organization_id) {
      const result = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization_id)
        .maybeSingle();
      org = result.data;
      orgError = result.error;
    } else {
      // Use ilike for flexible name matching (handles "Mitsui & Co" vs "Mitsui & Co.")
      const result = await supabase
        .from('organizations')
        .select('*')
        .ilike('name', `%${organization_name}%`)
        .limit(1)
        .maybeSingle();
      org = result.data;
      orgError = result.error;
    }

    if (orgError || !org) {
      throw new Error(`Failed to fetch organization: ${orgError?.message || 'Not found'}`);
    }

    const profileData = org.company_profile || {};
    const industryRaw = (org.industry || profileData.industry || 'default').toLowerCase();

    // Normalize industry name
    let industry = industryRaw;
    if (industryRaw.includes('trading') || industryRaw.includes('sogo') || industryRaw.includes('conglomerate')) {
      industry = 'trading';
    } else if (industryRaw.includes('public_relations') || industryRaw.includes('pr ') || industryRaw.includes('communications')) {
      industry = 'public_relations';
    }

    const relevantIndustryTags = INDUSTRY_MAPPINGS[industry] || INDUSTRY_MAPPINGS.default;

    console.log(`   Company industry: ${industryRaw} -> ${industry}`);
    console.log(`   Relevant industry tags: ${relevantIndustryTags.join(', ')}`);

    // ================================================================
    // STEP 2: Get ALL sources that cover these industries from registry
    // ================================================================
    const { data: allSources, error: sourcesError } = await supabase
      .from('source_registry')
      .select('source_name, tier, industries')
      .eq('active', true);

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    // Filter sources that have ANY overlap with our relevant industries
    const relevantSources = allSources.filter(source => {
      if (!source.industries || source.industries.length === 0) return false;
      return source.industries.some((ind: string) => relevantIndustryTags.includes(ind));
    });

    // Also always include tier 1 sources
    const tier1Sources = allSources.filter(s => s.tier === 1);

    // Combine and dedupe
    const sourceNames = new Set<string>();
    [...relevantSources, ...tier1Sources].forEach(s => sourceNames.add(s.source_name));

    const sourceList = Array.from(sourceNames);

    console.log(`   Total sources in registry: ${allSources.length}`);
    console.log(`   Sources matching industries: ${relevantSources.length}`);
    console.log(`   Tier 1 sources: ${tier1Sources.length}`);
    console.log(`   Final source list: ${sourceList.length} sources`);
    console.log(`   Sources: ${sourceList.join(', ')}`);

    // ================================================================
    // STEP 3: Get ALL articles from these sources in last 48h
    // ================================================================
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: articles, error: articlesError } = await supabase
      .from('raw_articles')
      .select(`
        id,
        source_name,
        url,
        title,
        description,
        published_at,
        full_content,
        source_registry(tier, industries)
      `)
      .in('source_name', sourceList)
      .in('scrape_status', ['completed', 'failed'])
      .not('published_at', 'is', null)
      .gte('published_at', fortyEightHoursAgo)
      .order('published_at', { ascending: false });

    if (articlesError) {
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    console.log(`   Articles found: ${articles?.length || 0}`);

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        organization_id: org.id,
        organization_name: org.name,
        total_articles: 0,
        articles: [],
        message: 'No articles found from relevant sources in last 48 hours'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ================================================================
    // STEP 4: Apply source diversity - cap at ~100 articles
    // Round-robin selection ensures all sources get representation
    // ================================================================
    const TARGET_ARTICLES = 100;
    const MAX_PER_SOURCE = 12;  // Max articles from any single source

    // Group articles by source
    const bySource: Record<string, typeof articles> = {};
    articles.forEach(a => {
      if (!bySource[a.source_name]) bySource[a.source_name] = [];
      bySource[a.source_name].push(a);
    });

    // Sort each source by recency (already sorted, but ensure)
    Object.keys(bySource).forEach(src => {
      bySource[src].sort((a, b) =>
        new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime()
      );
    });

    // Round-robin selection: take 1 from each source per round
    const selectedArticles: typeof articles = [];
    const sourceCount: Record<string, number> = {};
    let round = 0;

    // Prioritize tier 1 sources first, then others
    const tier1SourceNames = tier1Sources.map(s => s.source_name);
    const sortedSources = Object.keys(bySource).sort((a, b) => {
      const aIsTier1 = tier1SourceNames.includes(a) ? 0 : 1;
      const bIsTier1 = tier1SourceNames.includes(b) ? 0 : 1;
      return aIsTier1 - bIsTier1;
    });

    while (selectedArticles.length < TARGET_ARTICLES) {
      let addedThisRound = 0;

      for (const src of sortedSources) {
        const count = sourceCount[src] || 0;
        if (count < MAX_PER_SOURCE && bySource[src][count]) {
          selectedArticles.push(bySource[src][count]);
          sourceCount[src] = count + 1;
          addedThisRound++;

          if (selectedArticles.length >= TARGET_ARTICLES) break;
        }
      }

      round++;
      if (addedThisRound === 0) break;  // No more articles to add
      if (round > 20) break;  // Safety limit
    }

    // Calculate final source distribution
    const sourceDistribution: Record<string, number> = {};
    selectedArticles.forEach(a => {
      sourceDistribution[a.source_name] = (sourceDistribution[a.source_name] || 0) + 1;
    });

    const formattedArticles = selectedArticles.map(article => ({
      url: article.url,
      title: article.title,
      description: article.description || '',
      source: article.source_name,
      published_at: article.published_at,
      full_content: article.full_content,
      source_tier: article.source_registry?.tier || 2
    }));

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('\n📊 FINAL RESULTS:');
    console.log(`   Raw articles found: ${articles.length}`);
    console.log(`   After diversity cap: ${formattedArticles.length}`);
    console.log(`   Sources with articles: ${Object.keys(sourceDistribution).length}`);
    console.log(`   Distribution:`, sourceDistribution);
    console.log(`   Duration: ${duration}s`);

    return new Response(JSON.stringify({
      success: true,
      organization_id: org.id,
      organization_name: org.name,
      industry,
      total_articles: formattedArticles.length,
      articles: formattedArticles,
      sources: Object.keys(sourceDistribution),
      source_distribution: sourceDistribution,
      relevant_sources_count: sourceList.length,
      selected_at: new Date().toISOString(),
      duration_seconds: duration,
      selection_method: 'v4_source_registry'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Article Selector V4 Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
