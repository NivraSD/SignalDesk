// Article Selector V4 - Intelligence Hunter
// Three-part system:
// 1. INTELLIGENCE EXPANSION - Expand company profile into 50-100 search vectors
// 2. ARTICLE HUNTING - Match articles against expanded vectors with semantic understanding
// 3. QUALITY CONTROL - Final review pass to catch mistakes

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

interface IntelligenceVectors {
  commodities: string[];
  geographic_signals: string[];
  competitors: string[];
  themes: string[];
  specific_queries: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { organization_id, organization_name } = await req.json();

    console.log('🎯 ARTICLE SELECTOR V4 - INTELLIGENCE HUNTER');
    console.log(`   Organization: ${organization_name}`);
    console.log(`   Time: ${new Date().toISOString()}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ================================================================
    // STEP 1: Load company profile and intelligence targets
    // ================================================================
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq(organization_id ? 'id' : 'name', organization_id || organization_name)
      .maybeSingle();

    if (orgError || !org) {
      throw new Error(`Failed to fetch organization: ${orgError?.message || 'Not found'}`);
    }

    const { data: intelligenceTargets } = await supabase
      .from('intelligence_targets')
      .select('name, type, priority, monitoring_context')
      .eq('organization_id', org.id)
      .eq('active', true);

    const profileData = org.company_profile || {};
    const industry = org.industry || 'unknown';

    console.log(`   Industry: ${industry}`);
    console.log(`   Intelligence targets: ${intelligenceTargets?.length || 0}`);

    // ================================================================
    // STEP 2: Get articles from last 48h (ONLY with valid published_at)
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
        source_registry!inner(tier, industries)
      `)
      .in('scrape_status', ['completed', 'failed'])
      .not('published_at', 'is', null)
      .gte('published_at', fortyEightHoursAgo)
      .order('published_at', { ascending: false })
      .limit(150);  // Reduced to avoid timeout

    if (articlesError) {
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    console.log(`   Articles in last 48h: ${articles?.length || 0}`);

    if (!articles || articles.length === 0) {
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
    // PART 1: INTELLIGENCE EXPANSION
    // ================================================================
    console.log('\n📡 PART 1: INTELLIGENCE EXPANSION');
    console.log('   Expanding company profile into search vectors...');

    const competitors = intelligenceTargets?.filter(t => t.type === 'competitor') || [];
    const stakeholders = intelligenceTargets?.filter(t => t.type === 'stakeholder') || [];

    const expansionPrompt = `You are a senior intelligence analyst. Your client is ${org.name}.

COMPANY PROFILE:
- Name: ${org.name}
- Industry: ${industry}
- Description: ${profileData.description || 'Not provided'}
- Key Markets: ${profileData.market?.geographic_focus?.join(', ') || 'Global'}
- Market Drivers: ${profileData.market?.market_drivers?.join(', ') || 'Not specified'}

KNOWN COMPETITORS:
${competitors.map(c => `- ${c.name}`).join('\n') || 'None specified'}

KNOWN STAKEHOLDERS:
${stakeholders.map(s => `- ${s.name}: ${s.monitoring_context || ''}`).join('\n') || 'None specified'}

YOUR TASK: Generate comprehensive intelligence vectors for hunting relevant news.

Think deeply about what this company ACTUALLY cares about:
- What commodities/products do they trade or produce?
- What geographic regions are critical to their operations?
- What macro themes affect their business?
- What specific events would executives want to know about?

For a diversified trading company like a Japanese sogo shosha, think about:
- Energy (LNG, oil, gas, coal, renewables)
- Metals & Mining (iron ore, copper, nickel, aluminum, rare earths)
- Agriculture (soybeans, wheat, corn, coffee, palm oil)
- Infrastructure & Logistics (ports, shipping, rail, power plants)
- Chemicals & Materials
- Consumer & Retail investments

Return JSON only:
{
  "commodities": [
    "LNG spot prices and long-term contracts",
    "Iron ore prices and Australian exports",
    "Copper market and Chilean production",
    ... (15-25 specific commodity/product vectors)
  ],
  "geographic_signals": [
    "Japan energy policy and imports",
    "Australia mining regulations and exports",
    "Brazil agricultural exports and Petrobras",
    ... (15-25 specific geographic vectors)
  ],
  "competitors": [
    "Mitsubishi Corporation earnings and strategy",
    "Itochu quarterly results and investments",
    ... (include ALL known competitors plus any you identify)
  ],
  "themes": [
    "Energy transition and decarbonization investments",
    "Supply chain disruptions and logistics",
    "ESG regulations affecting resource companies",
    ... (10-15 macro themes)
  ],
  "specific_queries": [
    "LNG project delays or cancellations",
    "Mining M&A and asset sales",
    "Japanese trading house earnings",
    "Commodity price forecasts",
    ... (15-25 specific news queries an analyst would search for)
  ]
}

Be COMPREHENSIVE. Better to have too many vectors than miss important news.`;

    const expansionResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',  // Use Haiku for speed - expansion is simpler
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

    const vectors: IntelligenceVectors = JSON.parse(vectorsMatch[0]);

    const totalVectors =
      vectors.commodities.length +
      vectors.geographic_signals.length +
      vectors.competitors.length +
      vectors.themes.length +
      vectors.specific_queries.length;

    console.log(`   Generated ${totalVectors} intelligence vectors:`);
    console.log(`   - Commodities: ${vectors.commodities.length}`);
    console.log(`   - Geographic: ${vectors.geographic_signals.length}`);
    console.log(`   - Competitors: ${vectors.competitors.length}`);
    console.log(`   - Themes: ${vectors.themes.length}`);
    console.log(`   - Specific queries: ${vectors.specific_queries.length}`);

    // ================================================================
    // PART 2: ARTICLE HUNTING
    // ================================================================
    console.log('\n🔍 PART 2: ARTICLE HUNTING');
    console.log(`   Hunting through ${articles.length} articles...`);

    // Prepare articles for evaluation (title + description + snippet)
    const articlesForHunting = articles.map((article, idx) => ({
      id: idx,
      title: article.title,
      source: article.source_name,
      published: article.published_at,
      description: article.description || '',
      snippet: article.full_content ? article.full_content.substring(0, 300) : ''
    }));

    const huntingPrompt = `You are an intelligence analyst hunting for relevant news for ${org.name}.

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

INTELLIGENCE VECTORS TO HUNT FOR:

COMMODITIES:
${vectors.commodities.map(v => `• ${v}`).join('\n')}

GEOGRAPHIC SIGNALS:
${vectors.geographic_signals.map(v => `• ${v}`).join('\n')}

COMPETITORS:
${vectors.competitors.map(v => `• ${v}`).join('\n')}

THEMES:
${vectors.themes.map(v => `• ${v}`).join('\n')}

SPECIFIC QUERIES:
${vectors.specific_queries.map(v => `• ${v}`).join('\n')}

YOUR MISSION: Hunt through these ${articlesForHunting.length} articles and find EVERYTHING that matches ANY of the intelligence vectors above.

RULES:
1. Be AGGRESSIVE - if an article might be relevant, INCLUDE IT
2. Match against ANY vector - commodities, geographic, competitors, themes, or specific queries
3. An article about "copper prices" matches the commodities vector even if it doesn't mention ${org.name}
4. An article about "Australia mining" matches geographic signals
5. An article about any competitor is ALWAYS relevant
6. REJECT only things that are clearly irrelevant (celebrity news, sports, unrelated consumer tech)

For each article, decide:
- keep: true if it matches ANY intelligence vector
- vector_match: which category it matched (commodities/geographic/competitors/themes/specific)
- relevance: brief explanation of WHY it's relevant

Return JSON only:
{
  "selections": [
    {"id": 0, "keep": true, "vector_match": "commodities", "relevance": "LNG pricing in Asia"},
    {"id": 1, "keep": false, "relevance": "Celebrity news, not relevant"},
    ...
  ]
}

ARTICLES TO HUNT:
${JSON.stringify(articlesForHunting, null, 2)}`;

    const huntingResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
        messages: [{ role: 'user', content: huntingPrompt }]
      })
    });

    if (!huntingResponse.ok) {
      throw new Error(`Article hunting failed: ${huntingResponse.status}`);
    }

    const huntingResult = await huntingResponse.json();
    const huntingText = huntingResult.content[0].text;

    const selectionsMatch = huntingText.match(/\{[\s\S]*\}/);
    if (!selectionsMatch) {
      throw new Error('Failed to parse hunting selections');
    }

    const { selections } = JSON.parse(selectionsMatch[0]);

    // Collect selected articles
    const selectedArticles = [];
    const vectorMatchCounts: Record<string, number> = {};

    for (const selection of selections) {
      if (selection.keep) {
        const article = articles[selection.id];
        if (article) {
          selectedArticles.push({
            ...article,
            vector_match: selection.vector_match,
            relevance: selection.relevance
          });
          vectorMatchCounts[selection.vector_match] = (vectorMatchCounts[selection.vector_match] || 0) + 1;
        }
      }
    }

    console.log(`   Hunting found ${selectedArticles.length} relevant articles`);
    console.log(`   By vector type:`, vectorMatchCounts);

    // Log what Hunter selected (before QC)
    console.log('\n   📋 HUNTER SELECTIONS (before QC):');
    selectedArticles.slice(0, 30).forEach((a, i) => {
      console.log(`   ${i+1}. [${a.vector_match}] ${a.title?.substring(0, 60)}`);
      console.log(`      → ${a.relevance}`);
    });

    // QC REMOVED - Enrichment and Synthesis provide downstream filtering
    // No need to second-guess the Hunter's selections here
    const finalArticles = selectedArticles;

    // ================================================================
    // STEP 3: Format and return results
    // ================================================================

    // Enforce source diversity for final output
    // For diversified trading companies like Mitsui, we want MORE coverage
    const MAX_PER_SOURCE = 15;  // Allow up to 15 per source for better coverage
    const sourceCount = new Map<string, number>();
    const diverseArticles = [];

    for (const article of finalArticles) {
      const count = sourceCount.get(article.source_name) || 0;
      if (count < MAX_PER_SOURCE) {
        diverseArticles.push(article);
        sourceCount.set(article.source_name, count + 1);
      }
      if (diverseArticles.length >= 100) break;  // Allow up to 100 articles for comprehensive coverage
    }

    // Format for output
    const formattedArticles = diverseArticles.map(article => ({
      url: article.url,
      title: article.title,
      description: article.description || '',
      source: article.source_name,
      published_at: article.published_at,
      full_content: article.full_content,
      vector_match: article.vector_match,
      relevance: article.relevance,
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

    // Format hunter selections for debugging
    const hunterSelectionsFormatted = selectedArticles.slice(0, 60).map(a => ({
      title: a.title,
      source: a.source_name,
      vector_match: a.vector_match,
      relevance: a.relevance
    }));

    return new Response(JSON.stringify({
      success: true,
      organization_id: org.id,
      organization_name: org.name,
      industry,
      total_articles: formattedArticles.length,
      hunter_selected: selectedArticles.length,
      articles_scanned: articles.length,
      intelligence_vectors: totalVectors,
      vector_matches: vectorMatchCounts,
      hunter_selections: hunterSelectionsFormatted,
      articles: formattedArticles,
      sources: Object.keys(sourceDistribution),
      source_distribution: sourceDistribution,
      selected_at: new Date().toISOString(),
      duration_seconds: duration,
      selection_method: 'v4_intelligence_hunter'
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
