const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function runIntelligentOpenAISearch() {
  console.log('🚀 Running Intelligent Fireplexity Search FROM OpenAI\'s Perspective');
  console.log('================================================\n');

  try {
    // Step 1: Get OpenAI's actual discovery profile
    console.log('📊 Step 1: Loading OpenAI discovery profile...');

    const { data: profile, error } = await supabase
      .from('mcp_discovery')
      .select('*')
      .eq('organization_id', 'OpenAI')
      .single();

    if (!profile) {
      console.log('❌ No OpenAI profile found');
      return;
    }

    console.log('✅ Loaded OpenAI profile');
    console.log(`  - Direct Competitors: ${profile.competition.direct_competitors.slice(0, 5).join(', ')}`);
    console.log(`  - Key Partners: ${profile.stakeholders.key_partners.join(', ')}`);
    console.log(`  - Monitoring: ${profile.monitoring_config.keywords.slice(0, 5).join(', ')}\n`);

    // Step 2: Build COMPETITIVE INTELLIGENCE queries (FROM OpenAI's perspective)
    console.log('🎯 Step 2: Building competitive intelligence queries...');

    // These queries should find info OpenAI would want about their market
    const searchQueries = [
      // Competitor intelligence
      `Anthropic Claude latest developments AI competition market share`,
      `Google DeepMind Gemini features pricing enterprise adoption`,
      `Meta AI Llama open source strategy Microsoft partnership`,

      // Market dynamics
      `enterprise AI adoption trends 2025 LLM deployment challenges`,
      `AI regulation FTC EU safety requirements compliance`,

      // Emerging threats
      `Mistral AI xAI funding valuation AI startup competition`,

      // Technology trends
      `multimodal AI breakthrough computer vision language models integration`,

      // Partnership opportunities
      `AI enterprise integration platforms API marketplace opportunities`
    ];

    console.log('Intelligence queries (FROM OpenAI\'s perspective):');
    searchQueries.forEach((q, i) => console.log(`  ${i + 1}. "${q}"`));

    // Step 3: Perform Fireplexity searches
    console.log('\n🌐 Step 3: Performing competitive intelligence searches...\n');

    const allResults = [];
    let totalSearched = 0;

    for (const query of searchQueries) {
      console.log(`  🔍 Searching: "${query.substring(0, 60)}..."`);

      try {
        const response = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-fireplexity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'}`
          },
          body: JSON.stringify({
            query: query,
            module: 'intelligence',
            useCache: false,
            context: {
              organization: 'OpenAI',
              profile: profile
            }
          })
        });

        if (response.ok) {
          const data = await response.json();

          // Extract articles from various response formats
          let articles = [];
          if (data.articles) articles = data.articles;
          else if (data.news?.articles) articles = data.news.articles;
          else if (data.web?.sources) articles = data.web.sources;
          else if (data.results) articles = Array.isArray(data.results) ? data.results : [];
          else if (data.sources) articles = data.sources;
          else if (data.previousSearches?.[0]?.results?.articles) {
            // If it returned cached searches, extract those
            articles = data.previousSearches[0].results.articles;
          }

          totalSearched++;
          console.log(`     ✅ Found ${articles.length} results`);

          // Normalize and add to results
          articles.forEach(article => {
            const normalized = {
              title: article.title || article.headline || '',
              description: article.description || article.summary || article.snippet || '',
              url: article.url || article.link || '',
              publishedAt: article.publishedAt || article.published_at || article.date || new Date().toISOString(),
              source: article.source || { name: 'Unknown' },
              content: article.content || '',
              search_query: query // Track which query found this
            };

            if (normalized.title || normalized.description) {
              allResults.push(normalized);
            }
          });
        }
      } catch (error) {
        console.log(`     ❌ Search failed: ${error.message}`);
      }
    }

    // Remove duplicates
    const uniqueResults = [];
    const seenUrls = new Set();

    for (const article of allResults) {
      if (article.url && !seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        uniqueResults.push(article);
      }
    }

    console.log(`\n📊 Search Results:`);
    console.log(`  - Queries executed: ${totalSearched}/${searchQueries.length}`);
    console.log(`  - Total articles found: ${allResults.length}`);
    console.log(`  - Unique articles: ${uniqueResults.length}`);

    // Step 4: Apply INTELLIGENCE-FOCUSED relevance scoring
    console.log('\n🎯 Step 4: Applying intelligence-focused relevance scoring...\n');

    const scoredArticles = uniqueResults.map(article => {
      const score = calculateIntelligenceRelevance(article, profile);
      return { ...article, ...score };
    });

    // Sort by relevance
    scoredArticles.sort((a, b) => b.relevance_score - a.relevance_score);

    // Filter by threshold
    const RELEVANCE_THRESHOLD = 30;
    const relevantArticles = scoredArticles.filter(a => a.relevance_score >= RELEVANCE_THRESHOLD);

    console.log(`📈 Relevance Filtering Results:`);
    console.log(`  - Articles passing threshold (${RELEVANCE_THRESHOLD}+): ${relevantArticles.length}/${uniqueResults.length}`);

    if (relevantArticles.length > 0) {
      console.log(`  - Average relevance score: ${Math.round(relevantArticles.reduce((sum, a) => sum + a.relevance_score, 0) / relevantArticles.length)}`);
    }

    // Categorize the intelligence
    const intelligence = {
      competitor_moves: [],
      market_dynamics: [],
      regulatory: [],
      technology: [],
      partnerships: [],
      threats: []
    };

    relevantArticles.forEach(article => {
      if (article.intelligence_category) {
        if (!intelligence[article.intelligence_category]) {
          intelligence[article.intelligence_category] = [];
        }
        intelligence[article.intelligence_category].push(article);
      }
    });

    console.log('\n📋 Intelligence Categories:');
    Object.entries(intelligence).forEach(([category, articles]) => {
      if (articles.length > 0) {
        console.log(`  - ${category}: ${articles.length} articles`);
      }
    });

    // Display top intelligence findings
    console.log('\n🏆 Top Intelligence Findings:');
    relevantArticles.slice(0, 10).forEach((article, i) => {
      console.log(`\n  ${i + 1}. [Score: ${article.relevance_score}] [${article.intelligence_category}]`);
      console.log(`     ${article.title?.substring(0, 80)}`);
      console.log(`     Intelligence value: ${article.intelligence_value}`);
      if (article.competitive_entities?.length > 0) {
        console.log(`     Entities: ${article.competitive_entities.join(', ')}`);
      }
    });

    // Step 5: Save to database
    console.log('\n💾 Step 5: Saving intelligence to database...');

    const searchRecord = {
      query: `OpenAI Competitive Intelligence - ${new Date().toISOString()}`,
      strategy: 'competitive_intelligence',
      results: {
        articles: relevantArticles.slice(0, 30), // Save top 30
        summary: generateIntelligenceSummary(relevantArticles, intelligence, 'OpenAI'),
        totalResults: relevantArticles.length,
        timestamp: new Date().toISOString(),
        metadata: {
          organization: 'OpenAI',
          perspective: 'competitive_intelligence',
          profile_used: true,
          relevance_threshold: RELEVANCE_THRESHOLD,
          raw_count: uniqueResults.length,
          filtered_count: relevantArticles.length,
          categories: Object.entries(intelligence).map(([cat, articles]) => ({
            category: cat,
            count: articles.length
          }))
        },
        intelligence_breakdown: {
          competitor_moves: intelligence.competitor_moves.length,
          market_dynamics: intelligence.market_dynamics.length,
          regulatory: intelligence.regulatory.length,
          technology: intelligence.technology.length,
          partnerships: intelligence.partnerships.length,
          threats: intelligence.threats.length
        }
      },
      created_at: new Date().toISOString()
    };

    try {
      // Try to save without problematic fields first
      const cleanRecord = {
        query: searchRecord.query,
        results: searchRecord.results,
        created_at: searchRecord.created_at
      };

      const { data: savedSearch, error: saveError } = await supabase
        .from('fireplexity_searches')
        .insert([cleanRecord])
        .select()
        .single();

      if (savedSearch) {
        console.log(`✅ Saved intelligence with ID: ${savedSearch.id}`);
      } else if (saveError) {
        console.log(`⚠️ Save issue: ${saveError.message}`);
      }
    } catch (e) {
      console.log(`❌ Database error: ${e.message}`);
    }

    console.log('\n✨ Intelligence gathering completed!');
    console.log('\n📊 Final Intelligence Summary:');
    console.log(`  - Organization perspective: OpenAI`);
    console.log(`  - Raw intelligence gathered: ${uniqueResults.length} articles`);
    console.log(`  - High-value intelligence: ${relevantArticles.length} articles`);
    console.log(`  - Quality ratio: ${Math.round((relevantArticles.length / uniqueResults.length) * 100)}%`);
    console.log(`  - Key competitor intel: ${intelligence.competitor_moves.length} items`);
    console.log(`  - Market dynamics: ${intelligence.market_dynamics.length} items`);
    console.log(`  - Emerging threats: ${intelligence.threats.length} items`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Intelligence-focused relevance scoring (FROM OpenAI's perspective)
function calculateIntelligenceRelevance(article, profile) {
  const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase();
  const titleText = (article.title || '').toLowerCase();

  let score = 0;
  const factors = [];
  let intelligence_category = 'general';
  let intelligence_value = 'low';
  const competitive_entities = [];

  // HIGH VALUE: Direct competitor intelligence
  const directCompetitors = profile.competition.direct_competitors || [];
  const competitorInTitle = directCompetitors.find(comp =>
    titleText.includes(comp.toLowerCase())
  );
  const competitorsInContent = directCompetitors.filter(comp =>
    text.includes(comp.toLowerCase())
  );

  if (competitorInTitle) {
    score += 50; // High value - competitor in title
    factors.push(`COMPETITOR_FOCUS:${competitorInTitle}`);
    intelligence_category = 'competitor_moves';
    intelligence_value = 'high';
    competitive_entities.push(competitorInTitle);
  }

  competitorsInContent.forEach(comp => {
    if (!competitive_entities.includes(comp)) {
      score += 25;
      competitive_entities.push(comp);
    }
  });

  // MEDIUM-HIGH VALUE: Emerging threats
  const emergingThreats = profile.competition.emerging_threats || [];
  const threatsFound = emergingThreats.filter(threat =>
    text.includes(threat.toLowerCase())
  );

  if (threatsFound.length > 0) {
    score += 35;
    factors.push(`EMERGING_THREATS:${threatsFound.join(',')}`);
    if (intelligence_category === 'general') {
      intelligence_category = 'threats';
      intelligence_value = 'medium';
    }
    competitive_entities.push(...threatsFound);
  }

  // HIGH VALUE: Market intelligence (without OpenAI mention - we want MARKET intel)
  const marketSignals = [
    'market share', 'valuation', 'funding', 'revenue', 'growth',
    'adoption', 'enterprise', 'customers', 'users', 'billion'
  ];

  const hasMarketIntel = marketSignals.filter(signal => text.includes(signal)).length;
  if (hasMarketIntel > 2 && competitorsInContent.length > 0) {
    score += 40;
    factors.push('MARKET_INTELLIGENCE');
    if (intelligence_category === 'general') {
      intelligence_category = 'market_dynamics';
      intelligence_value = 'high';
    }
  }

  // HIGH VALUE: Technology developments
  const techKeywords = [
    'breakthrough', 'launch', 'release', 'feature', 'capability',
    'model', 'api', 'performance', 'benchmark', 'multimodal'
  ];

  const hasTechDevelopment = techKeywords.filter(kw => text.includes(kw)).length;
  if (hasTechDevelopment > 2) {
    score += 30;
    factors.push('TECH_DEVELOPMENT');
    if (intelligence_category === 'general') {
      intelligence_category = 'technology';
    }
  }

  // HIGH VALUE: Regulatory intelligence
  const regulators = profile.stakeholders.regulators || [];
  const regulatoryTerms = ['regulation', 'compliance', 'investigation', 'lawsuit', 'ftc', 'eu', 'safety'];

  const hasRegulatory = regulators.some(reg => text.includes(reg.toLowerCase())) ||
                        regulatoryTerms.filter(term => text.includes(term)).length > 2;

  if (hasRegulatory) {
    score += 35;
    factors.push('REGULATORY_INTEL');
    if (intelligence_category === 'general') {
      intelligence_category = 'regulatory';
      intelligence_value = 'high';
    }
  }

  // MEDIUM VALUE: Partnership opportunities
  const partnershipSignals = ['partnership', 'collaboration', 'integration', 'alliance', 'deal'];
  const hasPartnership = partnershipSignals.some(signal => text.includes(signal));

  if (hasPartnership && competitorsInContent.length > 0) {
    score += 25;
    factors.push('PARTNERSHIP_INTEL');
    if (intelligence_category === 'general') {
      intelligence_category = 'partnerships';
    }
  }

  // PENALTY: Articles primarily about OpenAI (we want intel ABOUT others)
  const openaiMentions = ['openai', 'chatgpt', 'gpt-4', 'gpt-5', 'sam altman'].filter(term =>
    titleText.includes(term)
  ).length;

  if (openaiMentions > 0 && competitive_entities.length === 0) {
    score = Math.floor(score * 0.3); // Heavy penalty for OpenAI-only content
    factors.push('SELF_REFERENCE_PENALTY');
    intelligence_value = 'low';
  }

  // BONUS: Exclusive or breaking intelligence
  if (text.includes('exclusive') || text.includes('breaking') || text.includes('leaked')) {
    score += 20;
    factors.push('EXCLUSIVE_INTEL');
    if (intelligence_value === 'low') intelligence_value = 'medium';
    if (intelligence_value === 'medium') intelligence_value = 'high';
  }

  // Time relevance
  if (article.publishedAt) {
    const ageInDays = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays < 1) {
      score += 15;
      factors.push('BREAKING');
    } else if (ageInDays < 3) {
      score += 10;
      factors.push('RECENT');
    }
  }

  return {
    relevance_score: Math.min(score, 100),
    relevance_factors: factors,
    intelligence_category,
    intelligence_value,
    competitive_entities: [...new Set(competitive_entities)]
  };
}

// Generate intelligence summary
function generateIntelligenceSummary(articles, intelligenceBreakdown, orgName) {
  if (!articles || articles.length === 0) {
    return `No competitive intelligence found for ${orgName}`;
  }

  let summary = `Competitive intelligence report for ${orgName}: ${articles.length} high-value items identified. `;

  // Highlight key findings by category
  const insights = [];

  if (intelligenceBreakdown.competitor_moves.length > 0) {
    const topCompetitors = [...new Set(
      intelligenceBreakdown.competitor_moves
        .flatMap(a => a.competitive_entities || [])
        .slice(0, 3)
    )];
    insights.push(`Competitor activity from ${topCompetitors.join(', ')}`);
  }

  if (intelligenceBreakdown.market_dynamics.length > 0) {
    insights.push(`${intelligenceBreakdown.market_dynamics.length} market dynamics signals`);
  }

  if (intelligenceBreakdown.threats.length > 0) {
    insights.push(`${intelligenceBreakdown.threats.length} emerging threats identified`);
  }

  if (intelligenceBreakdown.regulatory.length > 0) {
    insights.push('Regulatory developments detected');
  }

  summary += insights.join('. ') + '.';

  // Add top headline if available
  const topArticle = articles[0];
  if (topArticle && topArticle.title) {
    summary += ` Key finding: "${topArticle.title.substring(0, 80)}..."`;
  }

  return summary;
}

// Run the search
runIntelligentOpenAISearch();