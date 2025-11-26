// Article Selector V4 - Intelligence Hunter (INDUSTRY-AWARE)
// Uses company profile intelligence context for targeted article selection
// 1. PROFILE-DRIVEN - Uses intelligence_context from company profile
// 2. SOURCE-AWARE - Prioritizes industry-relevant sources
// 3. TOPIC-FOCUSED - Generates industry-specific search vectors

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

// Industry-specific source priorities - which sources matter most for each industry
const INDUSTRY_PRIORITY_SOURCES: Record<string, string[]> = {
  public_relations: ['PRWeek', 'PR Daily', 'AdWeek', 'Campaign', 'The Holmes Report', 'Ragan', 'Spin Sucks', 'CommPRO', 'PR News', "O'Dwyer's", 'AdAge', 'MediaPost'],
  advertising: ['AdWeek', 'AdAge', 'Campaign', 'The Drum', 'MediaPost', 'Marketing Week', 'Digiday'],
  finance: ['Wall Street Journal', 'Bloomberg', 'Financial Times', 'Reuters', 'CNBC', 'Seeking Alpha', "Barron's"],
  technology: ['TechCrunch', 'The Verge', 'Ars Technica', 'Wired', 'VentureBeat', 'Protocol', 'The Information'],
  healthcare: ['BioPharma Dive', 'Endpoints News', 'STAT News', 'FiercePharma', 'Healthcare Dive'],
  energy: ['CleanTechnica', 'Utility Dive', 'Energy Voice', 'Oil & Gas Journal', 'Renewable Energy World'],
  retail: ['Chain Store Age', 'Retail Dive', 'RetailWire', 'Progressive Grocer'],
  legal: ['Above the Law', 'Law360', 'The American Lawyer', 'Law.com'],
  logistics: ['FreightWaves', 'Supply Chain Dive', 'Logistics Management', 'Journal of Commerce'],
  trading: ['Wall Street Journal', 'Bloomberg', 'Reuters', 'Financial Times', 'Nikkei Asia'],
  default: ['Wall Street Journal', 'Bloomberg', 'Reuters', 'Financial Times', 'CNBC']
};

// Industry-specific expansion prompts - what matters for each industry
const INDUSTRY_EXPANSION_TEMPLATES: Record<string, string> = {
  public_relations: `You are a PR intelligence analyst. For a PR/communications firm, focus on:
- Agency news: client wins/losses, new business pitches, account reviews
- Reputation & crisis: major corporate crises, PR responses, reputation damage
- Industry trends: earned media, influencer marketing, ESG communications, AI in PR
- M&A: agency acquisitions, holding company moves, agency mergers
- Executive moves: CCO hires, agency leadership changes
- Award shows: Cannes Lions, PRWeek Awards, SABRE Awards
- Client activity: major campaigns, rebrand announcements, product launches

DO NOT focus on: commodities, currencies, central banks, geopolitical tensions (unless there's a specific PR/reputation angle)`,

  advertising: `You are an advertising intelligence analyst. Focus on:
- Creative campaigns and award-winning work
- Agency reviews and client wins/losses
- Media buying trends and programmatic
- Brand marketing strategies
- CMO and marketing executive moves`,

  trading: `You are a commodities/trading intelligence analyst. Focus on:
- Commodity prices (LNG, oil, metals, agriculture)
- Trade flows and supply chain disruptions
- Geographic market developments (key trading regions)
- Competitor moves (other trading houses)
- Infrastructure and logistics investments`,

  technology: `You are a tech intelligence analyst. Focus on:
- Product launches and feature updates
- Funding rounds and M&A activity
- Executive moves and layoffs
- Competitive dynamics and market share
- Technology trends (AI, cloud, security)`,

  default: `You are a business intelligence analyst. Focus on:
- Competitive moves and market dynamics
- Industry trends and disruptions
- Executive changes and strategy shifts
- Regulatory developments
- M&A and partnership activity`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { organization_id, organization_name } = await req.json();

    console.log('🎯 ARTICLE SELECTOR V4 - INTELLIGENCE HUNTER (PROFILE-AWARE)');
    console.log(`   Organization: ${organization_name}`);
    console.log(`   Time: ${new Date().toISOString()}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ================================================================
    // STEP 1: Load company profile with intelligence context
    // ================================================================
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq(organization_id ? 'id' : 'name', organization_id || organization_name)
      .maybeSingle();

    if (orgError || !org) {
      throw new Error(`Failed to fetch organization: ${orgError?.message || 'Not found'}`);
    }

    const profileData = org.company_profile || {};
    // Normalize industry to lowercase for matching
    const industryRaw = org.industry || profileData.industry || 'default';
    const industry = industryRaw.toLowerCase().replace(/[^a-z_]/g, '_');
    const intelligenceContext = profileData.intelligence_context || {};
    const competitors = profileData.competition?.direct_competitors || [];
    const stakeholderAnalysts = profileData.stakeholders?.key_analysts || [];
    const serviceLines = profileData.service_lines || [];

    console.log(`   Industry: ${industry}`);
    console.log(`   Competitors from profile: ${competitors.length}`);
    console.log(`   Key analysts: ${stakeholderAnalysts.length}`);
    console.log(`   Service lines: ${serviceLines.length}`);

    // Get industry-specific priority sources
    const prioritySources = INDUSTRY_PRIORITY_SOURCES[industry] || INDUSTRY_PRIORITY_SOURCES.default;
    console.log(`   Priority sources for ${industry}: ${prioritySources.slice(0, 5).join(', ')}...`);

    // ================================================================
    // STEP 2: Get ALL articles from last 48h - NO CAPS
    // Pass everything to relevance filter which will do smart filtering
    // ================================================================
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Get ALL articles - no limits, relevance filter handles volume
    const { data: allArticles, error: articlesError } = await supabase
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
      .in('scrape_status', ['completed', 'failed'])
      .not('published_at', 'is', null)
      .gte('published_at', fortyEightHoursAgo)
      .order('published_at', { ascending: false });

    if (articlesError) {
      console.error('Articles fetch error:', articlesError.message);
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    console.log(`   Total articles from all sources: ${allArticles?.length || 0}`);

    // Mark priority sources for Claude's context
    const prioritySourcesLower = prioritySources.map(s => s.toLowerCase());
    const articles = (allArticles || []).map(a => ({
      ...a,
      isPriority: prioritySourcesLower.includes(a.source_name?.toLowerCase() || '')
    }));

    // Log source distribution
    const sourceDistributionRaw: Record<string, number> = {};
    articles.forEach(a => {
      sourceDistributionRaw[a.source_name] = (sourceDistributionRaw[a.source_name] || 0) + 1;
    });

    console.log(`   Total articles fetched: ${articles.length}`);
    console.log(`   Unique sources: ${Object.keys(sourceDistributionRaw).length}`);
    console.log(`   Source distribution:`, sourceDistributionRaw);

    if (articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        organization_id: org.id,
        organization_name: org.name,
        total_articles: 0,
        articles: [],
        message: 'No articles found in last 48 hours with valid publication dates'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ================================================================
    // PART 1: INTELLIGENCE EXPANSION (PROFILE-AWARE)
    // ================================================================
    console.log('\n📡 PART 1: INTELLIGENCE EXPANSION (using profile context)');

    // Get industry-specific expansion template
    const industryTemplate = INDUSTRY_EXPANSION_TEMPLATES[industry] || INDUSTRY_EXPANSION_TEMPLATES.default;

    const expansionPrompt = `${industryTemplate}

CLIENT: ${org.name}
INDUSTRY: ${industry}
${profileData.description ? `DESCRIPTION: ${profileData.description}` : ''}

SERVICE LINES:
${serviceLines.map(s => `- ${s}`).join('\n') || '- General services'}

KEY COMPETITORS TO TRACK:
${competitors.slice(0, 10).map(c => `- ${c}`).join('\n') || '- Unknown competitors'}

KEY INDUSTRY VOICES/ANALYSTS:
${stakeholderAnalysts.slice(0, 5).map(a => `- ${a}`).join('\n') || '- Industry analysts'}

MONITORING QUESTIONS FROM PROFILE:
${(intelligenceContext.key_questions || []).map(q => `- ${q}`).join('\n') || '- What are competitors doing?'}

YOUR TASK: Generate intelligence vectors specifically for ${org.name} in the ${industry} industry.

Think about what ACTUALLY matters to a ${industry} company:
${industry === 'public_relations' ? `
- PR agency news (wins, losses, reviews)
- Corporate crises and PR responses
- Communications trends (ESG, AI, influencers)
- Reputation management cases
- Industry M&A and consolidation
- CMO/CCO executive moves
` : ''}

Return JSON only:
{
  "industry_signals": [
    "15-20 industry-specific signals to hunt for",
    "These should be things that matter to a ${industry} company"
  ],
  "competitor_signals": [
    "5-10 competitor-specific signals",
    "Format: 'CompetitorName + what to watch for'"
  ],
  "trend_signals": [
    "5-10 industry trend signals",
    "Emerging topics, technology shifts, market changes"
  ],
  "crisis_signals": [
    "3-5 crisis/reputation signals",
    "Things that indicate reputation issues in the industry"
  ]
}

Be SPECIFIC to ${industry}. Not generic business news.`;

    const expansionResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{ role: 'user', content: expansionPrompt }]
      })
    });

    if (!expansionResponse.ok) {
      throw new Error(`Intelligence expansion failed: ${expansionResponse.status}`);
    }

    const expansionResult = await expansionResponse.json();
    const expansionText = expansionResult.content[0].text;

    // Parse the intelligence vectors
    const vectorsMatch = expansionText.match(/\{[\s\S]*\}/);
    if (!vectorsMatch) {
      throw new Error('Failed to parse intelligence vectors');
    }

    const vectors = JSON.parse(vectorsMatch[0]);

    const totalVectors =
      (vectors.industry_signals?.length || 0) +
      (vectors.competitor_signals?.length || 0) +
      (vectors.trend_signals?.length || 0) +
      (vectors.crisis_signals?.length || 0);

    console.log(`   Generated ${totalVectors} intelligence vectors:`);
    console.log(`   - Industry signals: ${vectors.industry_signals?.length || 0}`);
    console.log(`   - Competitor signals: ${vectors.competitor_signals?.length || 0}`);
    console.log(`   - Trend signals: ${vectors.trend_signals?.length || 0}`);
    console.log(`   - Crisis signals: ${vectors.crisis_signals?.length || 0}`);

    // ================================================================
    // PART 2: ARTICLE HUNTING (INDUSTRY-FOCUSED)
    // ================================================================
    console.log('\n🔍 PART 2: ARTICLE HUNTING');
    console.log(`   Hunting through ${articles.length} articles...`);

    // Prepare articles for evaluation - LIGHTWEIGHT: just title + source
    // Enrichment does the heavy processing, selector just matches headlines
    const articlesForHunting = articles.map((article, idx) => ({
      id: idx,
      t: article.title,  // title
      s: article.source_name  // source
    }));

    const huntingPrompt = `You are an intelligence analyst hunting for news relevant to ${org.name}, a ${industry} company.

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

ABOUT ${org.name}:
${profileData.description || `A ${industry} company`}

SERVICE LINES: ${serviceLines.join(', ') || 'Various services'}

KEY COMPETITORS: ${competitors.slice(0, 8).join(', ') || 'Unknown'}

INTELLIGENCE VECTORS TO MATCH:

INDUSTRY SIGNALS (${industry}-specific):
${(vectors.industry_signals || []).map(v => `• ${v}`).join('\n')}

COMPETITOR SIGNALS:
${(vectors.competitor_signals || []).map(v => `• ${v}`).join('\n')}

TREND SIGNALS:
${(vectors.trend_signals || []).map(v => `• ${v}`).join('\n')}

CRISIS/REPUTATION SIGNALS:
${(vectors.crisis_signals || []).map(v => `• ${v}`).join('\n')}

YOUR MISSION: Find articles that are relevant to a ${industry} company.

${industry === 'public_relations' ? `
FOR PR/COMMUNICATIONS FIRMS, PRIORITIZE:
✅ Agency news (account wins, losses, reviews, pitches)
✅ Corporate crises and PR responses
✅ Reputation management cases
✅ Communications industry M&A
✅ CMO/CCO/Communications executive moves
✅ PR campaign results and case studies
✅ Industry trends (ESG comms, AI in PR, influencer marketing)
✅ Any article mentioning competitors: ${competitors.slice(0, 5).join(', ')}

REJECT UNLESS CLEAR PR ANGLE:
❌ Commodity prices, currency moves, central bank rates
❌ General geopolitical news without PR implications
❌ Stock market movements
❌ Random company news with no communications angle
` : ''}

${industry === 'trading' ? `
FOR TRADING/SOGO SHOSHA (GLOBAL CONGLOMERATE) - BE VERY INCLUSIVE:

A diversified trading company like Mitsui operates across virtually every sector globally.
They care about EVERYTHING that affects global business, markets, and policy.

INCLUDE ALL OF THESE:
✅ Commodities: oil, gas, LNG, metals, minerals, agriculture, chemicals, steel
✅ Energy: renewable, solar, wind, nuclear, batteries, EVs, grid infrastructure
✅ Logistics: freight, shipping, ports, supply chain, warehousing
✅ Trade policy: tariffs, sanctions, trade agreements, export controls
✅ Politics & regulation: US policy, China relations, EU regulations, Japan policy
✅ Geopolitics: regional tensions, trade wars, diplomatic developments
✅ Environmental: climate policy, ESG, activists, sustainability regulations
✅ Industrial: manufacturing, infrastructure, construction, real estate
✅ Finance: currencies, interest rates, central banks, capital markets
✅ Technology: industrial tech, AI in business, digital transformation
✅ Competitors: Mitsubishi Corp, Sumitomo, Itochu, Marubeni, Glencore, Trafigura
✅ Regional: Asia-Pacific, Americas, Europe, Middle East, Africa developments

USE ALL SOURCES - each has value:
- Politico, Axios: policy and politics
- FreightWaves: logistics and freight
- CleanTechnica: energy transition
- Industry Week: manufacturing
- Bloomberg, Reuters, WSJ, FT: markets and finance
- CNBC: business news

Aim for 80-150 articles. When in doubt, INCLUDE IT.
` : ''}

PRIORITY SOURCES (articles from these are more likely relevant):
${prioritySources.slice(0, 10).join(', ')}

IMPORTANT GUIDELINES:
- Be INCLUSIVE, not exclusive. When in doubt, include the article.
- Aim for 50-100 articles. More is better - enrichment will filter further.
- Use DIVERSE sources. Don't just pick from one or two sources.
- Trade publications (FreightWaves, CleanTechnica, Industry Week) often have highly relevant industry news.
- Articles about competitors, commodities, supply chains, and markets are relevant to trading companies.

TASK: Return the IDs of relevant articles as a JSON array.
Just scan headlines - enrichment will do deep analysis later.

Return JSON only:
{"ids": [0, 3, 7, 12, ...]}

ARTICLES (id, title, source):
${articlesForHunting.map(a => `${a.id}|${a.t}|${a.s}`).join('\n')}`;

    // Use Sonnet for better judgment on relevance
    const huntingResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0,
        messages: [{ role: 'user', content: huntingPrompt }]
      })
    });

    if (!huntingResponse.ok) {
      throw new Error(`Article hunting failed: ${huntingResponse.status}`);
    }

    const huntingResult = await huntingResponse.json();
    const huntingText = huntingResult.content[0].text;

    // Parse simple ID array response
    const idsMatch = huntingText.match(/\{[\s\S]*\}/);
    if (!idsMatch) {
      throw new Error('Failed to parse hunting selections');
    }

    const { ids } = JSON.parse(idsMatch[0]);
    const selectedIds = new Set(ids || []);

    // Collect selected articles
    const selectedArticles = [];

    for (const id of selectedIds) {
      const article = articles[id];
      if (article) {
        selectedArticles.push({
          ...article,
          priority: article.isPriority ? 'high' : 'normal'
        });
      }
    }

    console.log(`   Hunting found ${selectedArticles.length} relevant articles`);

    // Log what Hunter selected
    console.log('\n   📋 HUNTER SELECTIONS:');
    selectedArticles.slice(0, 30).forEach((a, i) => {
      console.log(`   ${i+1}. [${a.source_name}] ${a.title?.substring(0, 60)}`);
    });

    // ================================================================
    // STEP 3: Format and return results
    // ================================================================

    // Sort by priority (high first), then by publication date
    const sortedArticles = selectedArticles.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    // Pass through ALL selected articles - let downstream stages filter
    // Selector should cast a wide net, relevance filter will score/trim
    const diverseArticles = sortedArticles.slice(0, 150);  // Cap at 150 max

    // Format for output
    const formattedArticles = diverseArticles.map(article => ({
      url: article.url,
      title: article.title,
      description: article.description || '',
      source: article.source_name,
      published_at: article.published_at,
      full_content: article.full_content,
      priority: article.priority,
      source_tier: article.source_registry?.tier || 2
    }));

    // Calculate source distribution
    const sourceDistribution: Record<string, number> = {};
    formattedArticles.forEach(a => {
      sourceDistribution[a.source] = (sourceDistribution[a.source] || 0) + 1;
    });

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('\n📊 FINAL RESULTS:');
    console.log(`   Total articles: ${formattedArticles.length}`);
    console.log(`   Sources: ${Object.keys(sourceDistribution).length}`);
    console.log(`   Distribution:`, sourceDistribution);
    console.log(`   Duration: ${duration}s`);

    return new Response(JSON.stringify({
      success: true,
      organization_id: org.id,
      organization_name: org.name,
      industry,
      total_articles: formattedArticles.length,
      hunter_selected: selectedArticles.length,
      articles_scanned: articles.length,
      intelligence_vectors: totalVectors,
      articles: formattedArticles,
      sources: Object.keys(sourceDistribution),
      source_distribution: sourceDistribution,
      selected_at: new Date().toISOString(),
      duration_seconds: duration,
      selection_method: 'v4_profile_aware_hunter'
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
