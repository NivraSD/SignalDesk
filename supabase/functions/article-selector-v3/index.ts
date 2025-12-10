// Article Selector V5 - Strategic Intelligence Selection
// Selects articles that directly inform competitive intelligence and strategic decisions
// Focuses on: competitor actions, industry developments, stakeholder moves, client opportunities

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

    if (organization_id) {
      // Use ID if provided (most reliable)
      const { data: orgData, error: orgErr } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization_id)
        .maybeSingle();

      org = orgData;
      orgError = orgErr;
    } else if (organization_name) {
      // Try organizations table
      const { data: orgData, error: orgErr } = await supabase
        .from('organizations')
        .select('*')
        .eq('name', organization_name)
        .limit(1)
        .maybeSingle();

      org = orgData;
      orgError = orgErr;
    } else {
      throw new Error('Either organization_id or organization_name is required');
    }

    if (orgError || !org) {
      throw new Error(`Failed to fetch organization: ${orgError?.message}`);
    }

    const profileData = org.company_profile || {};
    const industry = org.industry || 'unknown';

    console.log(`   Industry: ${industry}`);
    console.log(`   Profile data keys:`, Object.keys(profileData));

    // ================================================================
    // STEP 2: Build search keywords from profile
    // ================================================================
    const keywords = new Set<string>();

    // Add organization name
    if (organization_name) keywords.add(organization_name.toLowerCase());
    if (org.name) keywords.add(org.name.toLowerCase());
    if (org.organization_name) keywords.add(org.organization_name.toLowerCase());

    // Extract keywords from common profile structures
    // Handle legacy structure (competition, stakeholders, etc.)
    if (profileData.competition) {
      [...(profileData.competition.direct_competitors || []),
       ...(profileData.competition.indirect_competitors || []),
       ...(profileData.competition.emerging_threats || [])].forEach(c => {
        if (c && typeof c === 'string') keywords.add(c.toLowerCase());
      });
    }
    if (profileData.stakeholders) {
      [...(profileData.stakeholders.regulators || []),
       ...(profileData.stakeholders.major_investors || []),
       ...(profileData.stakeholders.major_customers || [])].forEach(s => {
        if (s && typeof s === 'string') keywords.add(s.toLowerCase());
      });
    }
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

    // Handle market-based structure (key_metrics, market_drivers, etc.)
    if (profileData.market) {
      ['key_metrics', 'market_drivers', 'market_barriers', 'geographic_focus', 'monitoring_queries'].forEach(field => {
        const values = profileData.market[field];
        if (Array.isArray(values)) {
          values.forEach(v => {
            if (v && typeof v === 'string' && v.length > 2 && v.length < 100) {
              keywords.add(v.toLowerCase());
            }
          });
        }
      });
    }

    // Add industry name itself
    if (industry && industry !== 'unknown') keywords.add(industry.toLowerCase());

    console.log(`   Keywords: ${keywords.size} total`);

    // ================================================================
    // STEP 3: Get intelligence targets from database
    // ================================================================
    const { data: intelligenceTargets } = await supabase
      .from('intelligence_targets')
      .select('name, target_type, priority')  // Fixed: was 'type', column is 'target_type'
      .eq('organization_id', organization_id || org.id)
      .eq('is_active', true);  // Fixed: was 'active', column is 'is_active'

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

    // Convert keywords to array for filtering
    const keywordArray = Array.from(keywords);

    // ================================================================
    // STEP 5: Get articles from last 48h
    // ================================================================
    const twentyFourHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Get articles from last 48h - limit to 100 most recent to avoid timeout
    // Prefer published_at when available, fallback to scraped_at
    const { data: articlesWithPublishedDate } = await supabase
      .from('raw_articles')
      .select(`
        id,
        source_name,
        url,
        title,
        description,
        published_at,
        scraped_at,
        full_content,
        extracted_metadata,
        source_registry!inner(tier, industries)
      `)
      .in('scrape_status', ['completed', 'failed'])  // Include paywalled articles with titles
      .not('published_at', 'is', null)
      .gte('published_at', twentyFourHoursAgo)
      .order('published_at', { ascending: false })
      .limit(100);

    // REMOVED: No longer fetch articles without published_at
    // Articles without proper publication dates (like old Brookings research) were contaminating results
    // If an article doesn't have a published_at date, we can't trust its recency

    const allArticles = articlesWithPublishedDate || [];

    console.log(`   Found ${allArticles?.length || 0} articles from last 48h`);

    if (!allArticles || allArticles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        organization_id,
        organization_name,
        total_articles: 0,
        articles: [],
        message: 'No articles found in last 48 hours'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ================================================================
    // STEP 6: INTELLIGENT CLAUDE EVALUATION
    // ================================================================
    // Skip keyword pre-filtering - let Claude do the intelligent selection
    // We want VOLUME for synthesis, so evaluate as many articles as feasible
    console.log(`   🤖 Sending ${Math.min(allArticles.length, 100)} articles to Claude for intelligent evaluation...`);

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const matchedArticles = [];

    // SOURCE BALANCING: Limit articles per source to ensure diversity
    // Without this, one source can flood the evaluation window
    const MAX_PER_SOURCE_EVAL = 15;
    const sourceCountsEval: Record<string, number> = {};
    const balancedArticles: typeof allArticles = [];

    for (const article of allArticles) {
      const source = article.source_name || 'Unknown';
      sourceCountsEval[source] = (sourceCountsEval[source] || 0) + 1;

      if (sourceCountsEval[source] <= MAX_PER_SOURCE_EVAL) {
        balancedArticles.push(article);
      }

      // Stop once we have 200 balanced articles
      if (balancedArticles.length >= 200) break;
    }

    // Evaluate the balanced set (max 150)
    const articlesToEvaluate = balancedArticles.slice(0, 150);

    console.log(`   📊 Source balancing: ${allArticles.length} articles → ${balancedArticles.length} balanced (max ${MAX_PER_SOURCE_EVAL}/source)`);
    console.log(`   🤖 Using Claude to evaluate ${articlesToEvaluate.length} articles...`);

    // Give Claude more content to work with - 800 chars instead of 400
    // Include published_at so Claude can assess timeliness
    const articlesForEvaluation = articlesToEvaluate.map((article, idx) => ({
      id: idx,
      title: article.title,
      description: article.description || '',
      source: article.source_name,
      published_at: article.published_at,
      snippet: article.full_content ? article.full_content.substring(0, 800) : ''
    }));

    // Build rich intelligence context from the full company profile
    const competitors = intelligenceTargets
      ?.filter(t => t.type === 'competitor')
      .map(t => t.name) || [];

    const stakeholders = intelligenceTargets
      ?.filter(t => t.type === 'stakeholder')
      .map(t => t.name) || [];

    // Extract the rich context that already exists in the profile
    const companyDescription = profileData.description || '';
    const businessModel = profileData.company_profile?.business_model || '';
    const productLines = profileData.company_profile?.product_lines || [];
    const keyMarkets = profileData.company_profile?.key_markets || [];
    const strategicGoals = profileData.company_profile?.strategic_goals || [];
    const serviceLines = profileData.service_lines || [];
    const keyQuestions = profileData.intelligence_context?.key_questions || [];
    const marketDrivers = profileData.market?.market_drivers || [];

    const prompt = `You are an elite strategic intelligence analyst. Your client is ${organization_name || org.name}.

═══════════════════════════════════════════════════════════════
DEEP COMPANY UNDERSTANDING - Study this carefully before evaluating
═══════════════════════════════════════════════════════════════

COMPANY: ${organization_name || org.name}
INDUSTRY: ${industry}

DESCRIPTION:
${companyDescription || `A ${industry} company`}

BUSINESS MODEL:
${businessModel || 'Not specified'}

PRODUCT/SERVICE LINES:
${productLines.length > 0 ? productLines.map((p: string) => `• ${p}`).join('\n') : serviceLines.length > 0 ? serviceLines.map((s: string) => `• ${s}`).join('\n') : 'Not specified'}

KEY MARKETS:
${keyMarkets.length > 0 ? keyMarkets.join(', ') : 'Global'}

STRATEGIC GOALS:
${strategicGoals.length > 0 ? strategicGoals.map((g: any) => `• ${g.goal}: ${g.description}`).join('\n') : 'Not specified'}

MARKET DRIVERS TO WATCH:
${marketDrivers.length > 0 ? marketDrivers.join(', ') : 'Not specified'}

═══════════════════════════════════════════════════════════════
INTELLIGENCE TARGETS - Who/what we're hunting for
═══════════════════════════════════════════════════════════════

COMPETITORS (actively hunt for news about these):
${competitors.length > 0 ? competitors.map(c => `• ${c}`).join('\n') : 'None specified'}

KEY STAKEHOLDERS (analysts, regulators, industry figures):
${stakeholders.length > 0 ? stakeholders.map(s => `• ${s}`).join('\n') : 'None specified'}

KEY QUESTIONS THE EXECUTIVE TEAM WANTS ANSWERED:
${keyQuestions.length > 0 ? keyQuestions.map((q: string) => `• ${q}`).join('\n') : 'Not specified'}

═══════════════════════════════════════════════════════════════
YOUR MISSION: HUNT FOR BREAKING STRATEGIC INTELLIGENCE
═══════════════════════════════════════════════════════════════

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

You have ${articlesForEvaluation.length} RECENT articles (published in last 48 hours) to evaluate.
Your job is to HUNT for BREAKING NEWS that provides genuine strategic value.

CRITICAL: These should all be recent news. Each article has a published_at timestamp - verify it's from the last 48 hours. Reject anything that looks like old content, evergreen articles, or research papers.

WHAT TO SELECT:

1. COMPETITOR INTELLIGENCE (HIGHEST VALUE)
   - Any mention of a listed competitor
   - Competitor earnings, strategy shifts, leadership changes, M&A, partnerships
   - Even brief mentions - executives want to know what competitors are doing

2. MARKET/INDUSTRY INTELLIGENCE
   - Developments in ${industry} and adjacent sectors
   - For diversified companies: commodities, energy, mining, agriculture, infrastructure, logistics
   - Regulatory changes affecting any of the company's business lines
   - Geopolitical developments affecting supply chains or markets

3. STAKEHOLDER INTELLIGENCE
   - Statements from listed analysts, regulators, or industry figures
   - Government policy announcements affecting key markets

4. OPPORTUNITY/THREAT SIGNALS
   - Major deals, IPOs, restructurings that create opportunities
   - Supply chain disruptions, geopolitical tensions, price movements
   - Technology shifts affecting the company's sectors

WHAT TO EXCLUDE:

✗ OLD CONTENT - research papers, analysis pieces, or "evergreen" articles that aren't breaking news
✗ Generic tech news (AI model releases, gadget reviews) unless directly about ${industry}
✗ Consumer lifestyle content
✗ Local news with no business relevance
✗ Entertainment, sports, celebrity news
✗ Articles with no clear connection to ${organization_name || org.name}'s business
✗ Think tank research, white papers, or policy analysis (unless announcing new findings TODAY)

═══════════════════════════════════════════════════════════════
SCORING GUIDANCE
═══════════════════════════════════════════════════════════════

90-100: Direct competitor mention OR critical market-moving news
75-89:  Clear industry relevance, stakeholder activity, or major opportunity/threat
60-74:  Relevant to one of the company's business lines or markets
50-59:  Tangentially relevant - include only if strong signal
0-49:   No strategic value - EXCLUDE

TARGET: Select 25-40 high-quality articles. Be thorough but selective.

Return JSON only:
{
  "evaluations": [
    {"id": 0, "keep": true/false, "score": 0-100, "reason": "brief reason (3-6 words)"}
  ]
}

ARTICLES TO EVALUATE:
${JSON.stringify(articlesForEvaluation, null, 2)}`;

    try {
      // Use Sonnet for smarter analysis (no extended thinking - too slow)
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 16000,
          temperature: 0,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        console.error(`   ⚠️ Claude API error: ${response.status}, returning empty results`);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const result = await response.json();
      const responseText = result.content[0].text;

      console.log(`   🧠 Claude analysis complete, parsing response...`);

      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', responseText.substring(0, 500));
        throw new Error('No JSON found in Claude response');
      }

      const evaluations = JSON.parse(jsonMatch[0]).evaluations;

      for (const evaluation of evaluations) {
        // Threshold 50+ for strategic relevance - balanced approach
        // (60 was too strict for diversified companies like trading firms)
        if (evaluation.keep && evaluation.score >= 50) {
          const article = articlesToEvaluate[evaluation.id];
          matchedArticles.push({
            ...article,
            relevance_score: evaluation.score,
            matched_keywords: [], // No keyword matching used
            ai_reasoning: evaluation.reason
          });
        }
      }

      console.log(`   ✨ Claude kept: ${matchedArticles.length}/${articlesToEvaluate.length} articles`);
    } catch (error) {
      console.error(`   ❌ Claude evaluation error: ${error.message}`);
      throw error; // Don't fallback, just fail - we need intelligent selection
    }

    // ================================================================
    // STEP 7: CURATE - Enforce source diversity and take best
    // ================================================================
    const MAX_ARTICLES = 40;  // Allow more for diversified companies
    const MAX_PER_SOURCE = 5;

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
      published_at: article.published_at || article.scraped_at, // Use scraped_at if published_at is null
      scraped_at: article.scraped_at,
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
      selection_method: 'v5_strategic_intelligence'
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
