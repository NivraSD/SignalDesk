// Article Selector V4 - Intelligence-Driven Selection
// Uses Claude to intelligently filter articles based on the company's full profile:
// - Competitors and competitive dynamics
// - Strategic priorities and key questions
// - Service lines and target customers
// - Emerging threats and market context
// NO dumb keyword matching - Claude understands context

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

// Map company industry to source_registry industry tags (for initial source filtering)
const INDUSTRY_MAPPINGS: Record<string, string[]> = {
  trading: ['finance', 'energy', 'cleantech', 'logistics', 'transportation', 'supply_chain',
            'manufacturing', 'industrial', 'technology', 'healthcare', 'retail', 'food',
            'policy', 'international', 'politics', 'asia', 'europe', 'investing', 'economics'],
  conglomerate: ['finance', 'energy', 'cleantech', 'logistics', 'transportation', 'supply_chain',
                 'manufacturing', 'industrial', 'technology', 'healthcare', 'retail', 'food',
                 'policy', 'international', 'politics', 'asia', 'europe', 'investing', 'economics'],
  public_relations: ['public_relations', 'marketing', 'advertising', 'corporate_communications', 'media'],
  marketing: ['marketing', 'advertising', 'public_relations', 'media', 'events', 'experiential',
              'experiential_marketing', 'brand', 'brand_activation', 'retail', 'technology', 'consumer'],
  // Marketing industry aliases - all map to same tags
  'integrated marketing': ['marketing', 'advertising', 'public_relations', 'media', 'events', 'experiential',
              'experiential_marketing', 'brand', 'brand_activation', 'retail', 'technology', 'consumer'],
  'experiential marketing': ['marketing', 'advertising', 'public_relations', 'media', 'events', 'experiential',
              'experiential_marketing', 'brand', 'brand_activation', 'retail', 'technology', 'consumer'],
  'marketing & communications': ['marketing', 'advertising', 'public_relations', 'media', 'events', 'experiential',
              'experiential_marketing', 'brand', 'brand_activation', 'retail', 'technology', 'consumer'],
  technology: ['technology', 'ai', 'startups', 'venture_capital', 'science', 'engineering',
               'consumer_electronics', 'gaming', 'machine_learning', 'emerging_tech'],
  finance: ['finance', 'banking', 'fintech', 'investing', 'payments', 'crypto', 'blockchain',
            'private_equity', 'venture_capital', 'economics', 'regulation'],
  healthcare: ['healthcare', 'pharma', 'biotech', 'medtech', 'regulation'],
  energy: ['energy', 'cleantech', 'renewables', 'utilities'],
  retail: ['retail', 'ecommerce', 'fashion', 'food', 'consumer_protection'],
  default: ['finance', 'technology', 'healthcare', 'retail', 'politics']
};

// Core business news sources to always include for any industry (treated like trade sources)
const CORE_BUSINESS_SOURCES = ['Reuters', 'Wall Street Journal', 'Bloomberg', 'Financial Times'];

// Build intelligence context from company profile for Claude
function buildIntelligenceContext(profile: any, orgName: string): string {
  const parts: string[] = [];

  parts.push(`COMPANY: ${orgName}`);

  if (profile.description) {
    parts.push(`\nABOUT: ${profile.description}`);
  }

  if (profile.service_lines?.length) {
    parts.push(`\nSERVICE LINES: ${profile.service_lines.join(', ')}`);
  }

  if (profile.strategic_context) {
    const sc = profile.strategic_context;
    if (sc.target_customers) parts.push(`\nTARGET CUSTOMERS: ${sc.target_customers}`);
    if (sc.strategic_priorities?.length) parts.push(`\nSTRATEGIC PRIORITIES: ${sc.strategic_priorities.join(', ')}`);
  }

  if (profile.competition) {
    const comp = profile.competition;
    if (comp.direct_competitors?.length) {
      parts.push(`\nDIRECT COMPETITORS: ${comp.direct_competitors.join(', ')}`);
    }
    if (comp.indirect_competitors?.length) {
      parts.push(`\nINDIRECT COMPETITORS: ${comp.indirect_competitors.join(', ')}`);
    }
    if (comp.emerging_threats?.length) {
      parts.push(`\nEMERGING THREATS: ${comp.emerging_threats.join(', ')}`);
    }
    if (comp.competitive_dynamics) {
      parts.push(`\nCOMPETITIVE DYNAMICS: ${comp.competitive_dynamics}`);
    }
  }

  if (profile.intelligence_context) {
    const ic = profile.intelligence_context;
    if (ic.key_questions?.length) {
      parts.push(`\nKEY QUESTIONS TO ANSWER:\n${ic.key_questions.map((q: string) => `- ${q}`).join('\n')}`);
    }
    if (ic.extraction_focus?.length) {
      parts.push(`\nEXTRACTION FOCUS: ${ic.extraction_focus.join(', ')}`);
    }
    if (ic.analysis_perspective) {
      parts.push(`\nANALYSIS PERSPECTIVE: ${ic.analysis_perspective}`);
    }
  }

  if (profile.market) {
    const m = profile.market;
    if (m.market_drivers?.length) {
      parts.push(`\nMARKET DRIVERS: ${m.market_drivers.join(', ')}`);
    }
    if (m.market_barriers?.length) {
      parts.push(`\nMARKET BARRIERS: ${m.market_barriers.join(', ')}`);
    }
  }

  if (profile.stakeholders?.key_stakeholders?.length) {
    parts.push(`\nKEY STAKEHOLDERS: ${profile.stakeholders.key_stakeholders.map((s: any) => s.name || s).join(', ')}`);
  }

  return parts.join('\n');
}

// Use Claude to score article relevance
async function scoreArticlesWithClaude(
  articles: Array<{ id: string; title: string; description: string; source: string }>,
  intelligenceContext: string,
  competitors: string[]
): Promise<Map<string, number>> {

  // Format articles for Claude - just titles and sources for efficiency
  const articleList = articles.map((a, i) =>
    `[${i}] ${a.source}: ${a.title}`
  ).join('\n');

  const competitorList = competitors.length > 0
    ? competitors.slice(0, 10).join(', ')
    : 'key industry competitors';

  // The prompt uses the intelligence context which already contains:
  // - Company description and industry
  // - Service lines
  // - Competitors (direct and indirect)
  // - Strategic priorities
  // - Key questions to answer
  // - Market drivers and barriers
  // This makes scoring industry-agnostic - Claude uses the context to judge relevance
  const prompt = `You are an intelligence analyst scoring news articles for relevance to a SPECIFIC COMPANY.

${intelligenceContext}

SCORING FRAMEWORK - Use the company context above to judge relevance:

90-100: DIRECT HITS
- Article mentions the company by name
- Article mentions these specific competitors: ${competitorList}
- M&A, major deals, or leadership changes involving the company or competitors

75-89: INDUSTRY-SPECIFIC NEWS
- From trade publications specific to the company's industry
- About trends, events, or developments directly in the company's sector
- News that answers the company's key intelligence questions

50-74: ADJACENT RELEVANCE
- Topics related to the company's service lines or target customers
- News that could affect the company's market or clients
- Regulatory or policy changes in relevant areas

30-49: WEAK CONNECTION
- General business news with tenuous link to the company's world
- News from adjacent industries with no direct impact

0-29: NOT RELEVANT
- News from completely unrelated industries
- Generic tech/AI/stock market news unless directly tied to company's sector
- Sports, entertainment, politics unless specifically relevant

CRITICAL: Judge relevance based on the COMPANY CONTEXT above, not general business interest.

ARTICLES:
${articleList}

Return ONLY a JSON array of ${articles.length} integers.`;

  try {
    console.log(`   📝 Scoring ${articles.length} articles with Claude...`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Claude API error: ${response.status} - ${errorText}`);
      return new Map(); // Fall back to no filtering
    }

    const data = await response.json();
    const content = data.content[0].text.trim();

    console.log(`   📊 Claude response (first 200 chars): ${content.substring(0, 200)}`);

    // Parse the JSON array - Claude sometimes adds explanatory text after the array
    // Extract just the JSON array portion
    let jsonContent = content;
    const arrayMatch = content.match(/^\s*\[[\s\S]*?\]/);
    if (arrayMatch) {
      jsonContent = arrayMatch[0];
    }

    let scores;
    try {
      scores = JSON.parse(jsonContent);
    } catch (parseError) {
      // Try to extract array from response if direct parse fails
      const bracketStart = content.indexOf('[');
      const bracketEnd = content.lastIndexOf(']');
      if (bracketStart !== -1 && bracketEnd !== -1 && bracketEnd > bracketStart) {
        const extracted = content.substring(bracketStart, bracketEnd + 1);
        scores = JSON.parse(extracted);
      } else {
        throw parseError;
      }
    }

    if (!Array.isArray(scores)) {
      console.error(`   ❌ Claude returned non-array: ${typeof scores}`);
      return new Map();
    }

    console.log(`   ✅ Parsed ${scores.length} scores, sample: [${scores.slice(0, 5).join(', ')}...]`);

    const scoreMap = new Map<string, number>();
    articles.forEach((article, i) => {
      scoreMap.set(article.id, scores[i] || 50);
    });

    // Log score distribution
    const distribution: Record<string, number> = {};
    scores.forEach((s: number) => {
      const bucket = Math.floor(s / 10) * 10;
      distribution[bucket] = (distribution[bucket] || 0) + 1;
    });
    console.log(`   📈 Score distribution: ${JSON.stringify(distribution)}`);

    return scoreMap;
  } catch (error: any) {
    console.error(`   ❌ Error scoring articles: ${error.message}`);
    return new Map(); // Fall back to no filtering
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { organization_id, organization_name } = await req.json();

    console.log('🎯 ARTICLE SELECTOR V4 - INTELLIGENCE-DRIVEN SELECTION');
    console.log(`   Organization: ${organization_name}`);
    console.log(`   Time: ${new Date().toISOString()}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ================================================================
    // STEP 1: Get company profile with full intelligence context
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
    } else if (industryRaw.includes('marketing') || industryRaw.includes('experiential') || industryRaw.includes('advertising') || industryRaw.includes('agency')) {
      industry = 'marketing';
    }

    // Build intelligence context for Claude
    const intelligenceContext = buildIntelligenceContext(profileData, org.name);
    console.log(`   Intelligence context built (${intelligenceContext.length} chars)`);

    // Extract competitors list for strict matching
    const competitors: string[] = [
      ...(profileData.competition?.direct_competitors || []),
      ...(profileData.competition?.indirect_competitors || [])
    ];
    console.log(`   Competitors to watch: ${competitors.slice(0, 5).join(', ')}${competitors.length > 5 ? '...' : ''}`);

    const relevantIndustryTags = INDUSTRY_MAPPINGS[industry] || INDUSTRY_MAPPINGS.default;
    console.log(`   Company industry: ${industryRaw} -> ${industry}`);

    // ================================================================
    // STEP 2: Get sources from registry
    // ================================================================
    const { data: allSources, error: sourcesError } = await supabase
      .from('source_registry')
      .select('source_name, tier, industries')
      .eq('active', true);

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    const relevantSources = allSources.filter(source => {
      if (!source.industries || source.industries.length === 0) return false;
      return source.industries.some((ind: string) => relevantIndustryTags.includes(ind));
    });

    const tier1Sources = allSources.filter(s => s.tier === 1);
    const sourceNames = new Set<string>();
    [...relevantSources, ...tier1Sources].forEach(s => sourceNames.add(s.source_name));
    const sourceList = Array.from(sourceNames);

    console.log(`   Sources: ${sourceList.length} total`);

    // ================================================================
    // STEP 3: Get articles - time window can be configured per-org or uses default
    // Some industries have less frequent trade news and need longer windows
    // ================================================================
    const defaultHours = 168; // 7 days
    const hoursBack = profileData.intelligence_settings?.time_window_hours || defaultHours;
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    console.log(`   Time window: ${hoursBack}h (${(hoursBack / 24).toFixed(1)} days)`);

    // Get trade sources first so we know which to query differently
    const profileSources = [
      ...(profileData.competition?.sources || []).map((s: any) => s.name),
      ...(profileData.intelligence_guidance?.focus_areas?.match(/\b[A-Z][a-zA-Z\s']+(?=,|\s+as)/g) || [])
    ].filter(Boolean);

    const defaultTradeSources: Record<string, string[]> = {
      public_relations: ['PRWeek', 'PR Daily', 'PRovoke Media', 'Ragan', "O'Dwyer's", 'AdWeek', 'AdAge', 'Campaign'],
      marketing: ['Ad Age', 'AdWeek', 'Campaign', 'The Drum', 'Marketing Week', 'Marketing Dive',
                  'Event Marketer', 'BizBash', 'Chief Marketer', 'Digiday', 'Brand Innovators',
                  'AgencySpy', 'Little Black Book', 'Creativity Online', 'PSFK'],
      technology: ['TechCrunch', 'Wired', 'The Verge', 'Ars Technica', 'VentureBeat', 'The Information'],
      finance: ['Financial Times', 'Barrons', 'Seeking Alpha', 'Bloomberg'],
      healthcare: ['STAT News', 'FierceHealthcare', 'MedCity News', 'Endpoints News'],
      retail: ['Retail Dive', 'Modern Retail', 'Chain Store Age'],
      trading: ['Financial Times', 'Nikkei Asia', 'Reuters', 'Bloomberg', 'FreightWaves']
    };

    const industryTradeSources = new Set([
      ...profileSources,
      ...(defaultTradeSources[industry] || []),
      ...CORE_BUSINESS_SOURCES,  // Always include Reuters, WSJ, Bloomberg, FT
      'Forrester', 'Gartner'  // Research always relevant
    ]);

    const tradeSourceList = Array.from(industryTradeSources);
    console.log(`   Industry trade sources: ${tradeSourceList.join(', ')}`);

    // Query 1: Get articles WITH valid published_at dates
    const { data: articlesWithDates, error: articlesError } = await supabase
      .from('raw_articles')
      .select(`
        id,
        source_name,
        url,
        title,
        description,
        published_at,
        created_at,
        full_content,
        source_registry(tier, industries)
      `)
      .in('source_name', sourceList)
      .in('scrape_status', ['completed', 'failed'])
      .not('published_at', 'is', null)
      .gte('published_at', cutoffTime)
      .order('published_at', { ascending: false });

    if (articlesError) {
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    // Query 2: Get TRADE SOURCE articles with NULL published_at (use created_at as fallback)
    // These are important articles where date extraction failed
    const { data: tradeArticlesNoDate, error: tradeError } = await supabase
      .from('raw_articles')
      .select(`
        id,
        source_name,
        url,
        title,
        description,
        published_at,
        created_at,
        full_content,
        source_registry(tier, industries)
      `)
      .in('source_name', tradeSourceList)
      .in('scrape_status', ['completed', 'failed'])
      .is('published_at', null)
      .gte('created_at', cutoffTime)  // Use created_at as fallback
      .order('created_at', { ascending: false });

    if (tradeError) {
      console.error('Error fetching trade articles without dates:', tradeError.message);
    }

    // Combine articles, using created_at as published_at fallback for trade sources
    const tradeNoDateMapped = (tradeArticlesNoDate || []).map(a => ({
      ...a,
      published_at: a.published_at || a.created_at  // Use created_at as fallback
    }));

    // Dedupe by id (in case somehow same article in both queries)
    const seenIds = new Set((articlesWithDates || []).map(a => a.id));
    const uniqueTradeNoDate = tradeNoDateMapped.filter(a => !seenIds.has(a.id));

    const articles = [...(articlesWithDates || []), ...uniqueTradeNoDate];

    console.log(`   Articles with dates: ${articlesWithDates?.length || 0}`);
    console.log(`   Trade articles with null dates (using created_at): ${uniqueTradeNoDate.length}`);
    console.log(`   Total articles: ${articles.length}`);

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        organization_id: org.id,
        organization_name: org.name,
        total_articles: 0,
        articles: [],
        message: 'No articles found from relevant sources'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ================================================================
    // STEP 4: Separate trade source articles from others
    // Trade sources already identified above - they go straight through
    // ================================================================
    const tradeArticles = articles.filter(a => industryTradeSources.has(a.source_name));
    const otherArticles = articles.filter(a => !industryTradeSources.has(a.source_name));

    console.log(`   Trade source articles: ${tradeArticles.length} (auto-include)`);
    console.log(`   Other articles to score: ${otherArticles.length}`);

    // ================================================================
    // STEP 5: Score only non-trade articles with Claude
    // ================================================================
    const BATCH_SIZE = 50;
    const allScores = new Map<string, number>();

    if (otherArticles.length > 0) {
      console.log(`   Scoring ${otherArticles.length} non-trade articles with Claude...`);

      for (let i = 0; i < otherArticles.length; i += BATCH_SIZE) {
        const batch = otherArticles.slice(i, i + BATCH_SIZE).map(a => ({
          id: a.id,
          title: a.title || 'Untitled',
          description: a.description || '',
          source: a.source_name
        }));

        const batchScores = await scoreArticlesWithClaude(batch, intelligenceContext, competitors);
        batchScores.forEach((score, id) => allScores.set(id, score));

        console.log(`   Scored batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(otherArticles.length/BATCH_SIZE)}`);
      }
    }

    // ================================================================
    // STEP 6: Combine and select final articles
    // Trade articles first (score 100), then scored articles
    // ================================================================
    const TARGET_ARTICLES = 100;
    const MAX_PER_SOURCE = 15;
    const RELEVANCE_THRESHOLD = 60; // Raised from 50 - require at least medium relevance

    // Trade articles get score 100, sorted by date
    const scoredTradeArticles = tradeArticles
      .map(a => ({ ...a, relevance_score: 100, is_trade_source: true }))
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    // Other articles filtered by score threshold
    const scoredOtherArticles = otherArticles
      .map(a => ({ ...a, relevance_score: allScores.get(a.id) || 50, is_trade_source: false }))
      .filter(a => a.relevance_score >= RELEVANCE_THRESHOLD)
      .sort((a, b) => b.relevance_score - a.relevance_score);

    console.log(`   Trade articles: ${scoredTradeArticles.length}`);
    console.log(`   Other articles above threshold: ${scoredOtherArticles.length}`);

    // Combine: trade first, then scored
    const allScoredArticles = [...scoredTradeArticles, ...scoredOtherArticles];

    // Apply source diversity cap
    const sourceCount: Record<string, number> = {};
    const selectedArticles = allScoredArticles.filter(a => {
      const count = sourceCount[a.source_name] || 0;
      if (count >= MAX_PER_SOURCE) return false;
      sourceCount[a.source_name] = count + 1;
      return true;
    }).slice(0, TARGET_ARTICLES);

    // Calculate distribution
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
      has_full_content: !!(article.full_content && article.full_content.length > 500),
      source_tier: article.source_registry?.tier || 2,
      relevance_score: article.relevance_score,
      industry_priority: article.is_trade_source || article.relevance_score >= 75,
      priority_reason: article.is_trade_source ? 'industry_trade_source' : (article.relevance_score >= 75 ? 'high_relevance_score' : null)
    }));

    const duration = Math.round((Date.now() - startTime) / 1000);

    const tradeSourceCount = formattedArticles.filter(a => a.priority_reason === 'industry_trade_source').length;
    const highRelevanceCount = formattedArticles.filter(a => a.priority_reason === 'high_relevance_score').length;
    const priorityCount = tradeSourceCount + highRelevanceCount;

    console.log('\n📊 FINAL RESULTS:');
    console.log(`   Raw articles: ${articles.length}`);
    console.log(`   Trade source articles: ${tradeSourceCount}`);
    console.log(`   Other scored articles: ${formattedArticles.length - tradeSourceCount}`);
    console.log(`   Final selection: ${formattedArticles.length}`);
    console.log(`   Industry priority articles: ${priorityCount}`);
    console.log(`   Sources: ${Object.keys(sourceDistribution).length}`);
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
      industry_priority_count: priorityCount,
      trade_source_count: tradeSourceCount,
      high_relevance_count: highRelevanceCount,
      relevance_threshold: RELEVANCE_THRESHOLD,
      selected_at: new Date().toISOString(),
      duration_seconds: duration,
      selection_method: 'v4_trade_first'
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
