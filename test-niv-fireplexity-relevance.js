const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

// Configuration
const TARGET_ORG = 'Anthropic'; // Change this to test different organizations
const USE_CACHED_DISCOVERY = true; // Set to false to fetch fresh discovery data

async function testNIVFireplexityWithRelevance() {
  console.log('🚀 Starting NIV Fireplexity Test with Relevance Filtering');
  console.log(`Target Organization: ${TARGET_ORG}`);
  console.log('================================================\n');

  try {
    // Step 1: Get organization profile from mcp_discovery
    console.log('📊 Step 1: Getting organization profile from mcp_discovery...');

    let discoveryProfile;

    if (USE_CACHED_DISCOVERY) {
      // Check if we have cached discovery data
      const { data: discoveryData, error: discoveryError } = await supabase
        .from('mcp_discovery')
        .select('*')
        .or(`organization_name.ilike.%${TARGET_ORG}%,organization_id.eq.${TARGET_ORG}`)
        .single();

      if (discoveryData) {
        discoveryProfile = discoveryData;
        console.log(`✅ Found cached discovery profile for ${TARGET_ORG}`);
      } else {
        console.log(`⚠️ No cached discovery data found for ${TARGET_ORG}`);
        // You could call mcp-discovery edge function here if needed
      }
    }

    if (!discoveryProfile) {
      // Create a default profile for testing
      console.log('📝 Creating default discovery profile for testing...');
      discoveryProfile = {
        organization_name: TARGET_ORG,
        organization_id: TARGET_ORG.toLowerCase(),
        competition: {
          direct_competitors: ['OpenAI', 'Google DeepMind', 'Cohere', 'AI21 Labs', 'Inflection AI'],
          indirect_competitors: ['Microsoft', 'Google', 'Amazon', 'Meta', 'Apple'],
          emerging_threats: ['Mistral AI', 'Stability AI', 'Hugging Face']
        },
        keywords: [
          'Claude', 'AI safety', 'constitutional AI', 'large language models',
          'generative AI', 'AI alignment', 'responsible AI', 'AI ethics'
        ],
        stakeholders: {
          regulators: ['FTC', 'EU Commission', 'UK CMA'],
          executives: ['Dario Amodei', 'Daniela Amodei', 'Tom Brown', 'Sam McCandlish'],
          major_investors: ['Google', 'Salesforce', 'Zoom', 'Spark Capital'],
          partners: ['AWS', 'Notion', 'DuckDuckGo', 'Quora']
        },
        monitoring_config: {
          keywords: [
            'Claude 3', 'Claude API', 'Anthropic funding', 'AI safety research',
            'constitutional AI', 'AI red teaming', 'prompt engineering'
          ]
        },
        intelligence_context: {
          monitoring_prompt: `Monitor ${TARGET_ORG} for: product launches, competitive moves,
            partnerships, regulatory developments, leadership changes, and AI safety initiatives`,
          relevance_criteria: {
            scoring_weights: {
              organization_mention: 40,
              competitor_action: 35,
              regulatory_news: 30,
              market_signal: 20,
              technology_update: 25
            }
          },
          topics: ['AI safety', 'enterprise AI', 'developer tools', 'research breakthroughs']
        }
      };
    }

    // Display key profile elements
    console.log('\n📋 Profile Summary:');
    console.log(`  - Direct Competitors: ${discoveryProfile.competition?.direct_competitors?.slice(0, 3).join(', ')}...`);
    console.log(`  - Keywords: ${discoveryProfile.keywords?.slice(0, 5).join(', ')}...`);
    console.log(`  - Key Stakeholders: ${discoveryProfile.stakeholders?.executives?.slice(0, 3).join(', ')}...`);

    // Step 2: Build intelligent search query based on profile
    console.log('\n🔍 Step 2: Building intelligent search query...');

    // Create a focused search query that will get relevant results
    const searchQueries = [
      // Primary query about the organization
      `${TARGET_ORG} latest news developments announcements`,

      // Competitive intelligence query
      `${TARGET_ORG} vs ${discoveryProfile.competition?.direct_competitors?.[0]} AI competition`,

      // Market/technology query
      `AI safety constitutional AI ${TARGET_ORG} Claude technology`
    ];

    console.log('Search queries to test:');
    searchQueries.forEach((q, i) => console.log(`  ${i + 1}. "${q}"`));

    // Step 3: Perform Fireplexity search
    console.log('\n🌐 Step 3: Performing Fireplexity search...');

    const searchResults = [];

    for (const query of searchQueries) {
      console.log(`\n  Searching: "${query}"...`);

      try {
        // Call the actual Fireplexity API or use mock data for testing
        const results = await performFireplexitySearch(query, discoveryProfile);
        searchResults.push(...results);
        console.log(`  ✅ Found ${results.length} results`);
      } catch (error) {
        console.log(`  ❌ Search failed: ${error.message}`);
      }
    }

    console.log(`\n📊 Total raw results: ${searchResults.length}`);

    // Step 4: Apply relevance filtering (like monitor-stage-2-relevance)
    console.log('\n🎯 Step 4: Applying relevance filtering...');

    const scoredArticles = searchResults.map(article => {
      const score = calculateRelevanceScore(article, discoveryProfile);
      return { ...article, relevance_score: score };
    });

    // Sort by relevance score
    scoredArticles.sort((a, b) => b.relevance_score - a.relevance_score);

    // Filter to keep only high-quality results
    const RELEVANCE_THRESHOLD = 30; // Same as monitor-stage-2-relevance
    const relevantArticles = scoredArticles.filter(a => a.relevance_score >= RELEVANCE_THRESHOLD);

    console.log(`\n📈 Relevance Scoring Results:`);
    console.log(`  - Total articles: ${searchResults.length}`);
    console.log(`  - Articles passing threshold (${RELEVANCE_THRESHOLD}+): ${relevantArticles.length}`);
    console.log(`  - Average relevance score: ${Math.round(relevantArticles.reduce((sum, a) => sum + a.relevance_score, 0) / relevantArticles.length)}`);

    // Display top relevant articles
    console.log('\n🏆 Top 5 Relevant Articles:');
    relevantArticles.slice(0, 5).forEach((article, i) => {
      console.log(`\n  ${i + 1}. [Score: ${article.relevance_score}] ${article.title}`);
      console.log(`     URL: ${article.url}`);
      console.log(`     Why relevant: ${article.relevance_factors?.slice(0, 2).join(', ')}`);
    });

    // Step 5: Save filtered results to fireplexity_searches table
    console.log('\n💾 Step 5: Saving filtered results to database...');

    const searchRecord = {
      query: `${TARGET_ORG} intelligent search`,
      module: 'niv_test',
      strategy: 'filtered_search',
      results: {
        articles: relevantArticles.slice(0, 10), // Save top 10
        summary: generateSummary(relevantArticles, TARGET_ORG),
        totalResults: relevantArticles.length,
        timestamp: new Date().toISOString(),
        metadata: {
          organization: TARGET_ORG,
          profile_used: true,
          relevance_threshold: RELEVANCE_THRESHOLD,
          raw_count: searchResults.length,
          filtered_count: relevantArticles.length
        }
      },
      cost: 0.001, // Estimated cost
      created_at: new Date().toISOString()
    };

    const { data: savedSearch, error: saveError } = await supabase
      .from('fireplexity_searches')
      .insert([searchRecord])
      .select()
      .single();

    if (savedSearch) {
      console.log(`✅ Saved search results with ID: ${savedSearch.id}`);
    } else {
      console.log(`❌ Failed to save: ${saveError?.message}`);
    }

    // Step 6: Test NIV retrieval
    console.log('\n🤖 Step 6: Testing NIV retrieval of filtered data...');

    const { data: nivData } = await supabase
      .from('fireplexity_searches')
      .select('*')
      .or(`query.ilike.%${TARGET_ORG}%,results->>summary.ilike.%${TARGET_ORG}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (nivData && nivData.length > 0) {
      console.log('✅ NIV can successfully retrieve filtered search results');
      console.log(`   Articles available: ${nivData[0].results?.articles?.length || 0}`);
      console.log(`   Summary: "${nivData[0].results?.summary?.substring(0, 100)}..."`);
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n📊 Final Summary:');
    console.log(`  - Organization: ${TARGET_ORG}`);
    console.log(`  - Raw search results: ${searchResults.length}`);
    console.log(`  - Filtered relevant results: ${relevantArticles.length}`);
    console.log(`  - Quality improvement: ${Math.round((relevantArticles.length / searchResults.length) * 100)}% of results are high-quality`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper function to perform Fireplexity search (mock or real)
async function performFireplexitySearch(query, profile) {
  // For testing, we'll use mock data that simulates Fireplexity results
  // In production, this would call the actual Fireplexity API

  const mockArticles = [
    // High relevance articles
    {
      title: `${TARGET_ORG} Launches Claude 3.5 Sonnet with Breakthrough Capabilities`,
      description: `${TARGET_ORG} unveiled Claude 3.5 Sonnet, featuring improved reasoning and coding abilities that outperform OpenAI's GPT-4 on key benchmarks.`,
      url: 'https://example.com/anthropic-claude-launch',
      publishedAt: new Date().toISOString(),
      source: { name: 'TechCrunch' }
    },
    {
      title: `${TARGET_ORG} Secures $2B Funding from Google at $18B Valuation`,
      description: `In a major funding round, ${TARGET_ORG} raised $2 billion from Google, positioning itself as a key competitor to OpenAI in the AI race.`,
      url: 'https://example.com/anthropic-funding',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      source: { name: 'Bloomberg' }
    },
    {
      title: 'OpenAI and Anthropic Face Regulatory Scrutiny Over AI Safety Claims',
      description: 'FTC investigating both OpenAI and Anthropic regarding their AI safety practices and marketing claims about responsible AI development.',
      url: 'https://example.com/regulatory-scrutiny',
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      source: { name: 'Reuters' }
    },
    // Medium relevance articles
    {
      title: 'Enterprise AI Adoption Accelerates with New Tools from Major Providers',
      description: 'Companies including Microsoft, Google, and Anthropic are seeing increased enterprise adoption of their AI tools.',
      url: 'https://example.com/enterprise-ai',
      publishedAt: new Date(Date.now() - 259200000).toISOString(),
      source: { name: 'WSJ' }
    },
    {
      title: 'AI Safety Researchers Warn of Potential Risks in Latest Models',
      description: 'Researchers from various institutions express concerns about the rapid advancement of AI models from companies like Anthropic and OpenAI.',
      url: 'https://example.com/ai-safety-concerns',
      publishedAt: new Date(Date.now() - 345600000).toISOString(),
      source: { name: 'MIT Technology Review' }
    },
    // Low relevance articles (noise that should be filtered out)
    {
      title: 'Tech Stocks Rally as NASDAQ Hits New High',
      description: 'Major tech companies including Apple, Microsoft, and others see gains. Brief mention of AI sector including Anthropic.',
      url: 'https://example.com/tech-stocks',
      publishedAt: new Date(Date.now() - 432000000).toISOString(),
      source: { name: 'CNBC' }
    },
    {
      title: 'Top 100 Startups to Watch in 2024',
      description: 'Annual list includes various companies across sectors. Anthropic mentioned among many others in the AI category.',
      url: 'https://example.com/startup-list',
      publishedAt: new Date(Date.now() - 518400000).toISOString(),
      source: { name: 'Forbes' }
    },
    {
      title: 'University Study on Programming Languages Mentions Various AI Tools',
      description: 'Academic research briefly references tools from OpenAI, Anthropic, and others in a study about programming education.',
      url: 'https://example.com/university-study',
      publishedAt: new Date(Date.now() - 604800000).toISOString(),
      source: { name: 'Academic Journal' }
    }
  ];

  // Return subset based on query relevance
  if (query.toLowerCase().includes('latest') || query.toLowerCase().includes('announcement')) {
    return mockArticles.slice(0, 4);
  } else if (query.toLowerCase().includes('competition') || query.toLowerCase().includes('vs')) {
    return mockArticles.slice(2, 6);
  } else {
    return mockArticles.slice(1, 5);
  }
}

// Helper function to calculate relevance score (simplified from monitor-stage-2-relevance)
function calculateRelevanceScore(article, profile) {
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
  const titleText = (article.title || '').toLowerCase();

  let score = 0;
  const factors = [];

  // Organization mentions
  const orgName = profile.organization_name.toLowerCase();
  if (titleText.includes(orgName)) {
    score += 40;
    factors.push('ORG_IN_TITLE');
  } else if (text.includes(orgName)) {
    score += 15;
    factors.push('ORG_MENTIONED');
  }

  // Competitor mentions
  const competitors = profile.competition?.direct_competitors || [];
  const competitorMentions = competitors.filter(comp =>
    text.includes(comp.toLowerCase())
  );

  if (competitorMentions.length > 0) {
    score += 30 * competitorMentions.length;
    factors.push(`COMPETITORS:${competitorMentions.length}`);
  }

  // Keyword matches
  const keywords = [...(profile.keywords || []), ...(profile.monitoring_config?.keywords || [])];
  const keywordMatches = keywords.filter(kw =>
    text.includes(kw.toLowerCase())
  );

  score += keywordMatches.length * 10;
  if (keywordMatches.length > 0) {
    factors.push(`KEYWORDS:${keywordMatches.length}`);
  }

  // Stakeholder mentions
  const allStakeholders = [
    ...(profile.stakeholders?.regulators || []),
    ...(profile.stakeholders?.executives || []),
    ...(profile.stakeholders?.major_investors || []),
    ...(profile.stakeholders?.partners || [])
  ];

  const stakeholderMentions = allStakeholders.filter(sh =>
    text.includes(sh.toLowerCase())
  );

  if (stakeholderMentions.length > 0) {
    score += 25 * stakeholderMentions.length;
    factors.push(`STAKEHOLDERS:${stakeholderMentions.length}`);
  }

  // Action signals (product launch, funding, partnership, etc.)
  const actionSignals = {
    product_launch: /launch|unveil|introduce|announce|release/i,
    funding: /funding|investment|raise|billion|million|valuation/i,
    partnership: /partner|collaborate|team|alliance|agreement/i,
    regulatory: /regulate|scrutiny|investigation|compliance|ftc|sec/i,
    competitive: /outperform|surpass|compete|vs|versus|beat/i
  };

  for (const [signal, pattern] of Object.entries(actionSignals)) {
    if (pattern.test(text)) {
      score += 20;
      factors.push(signal.toUpperCase());
    }
  }

  // Time sensitivity bonus
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

  // Store factors for debugging
  article.relevance_factors = factors;

  return Math.min(score, 100); // Cap at 100
}

// Helper function to generate summary
function generateSummary(articles, orgName) {
  if (articles.length === 0) {
    return `No relevant articles found for ${orgName}`;
  }

  const topTitles = articles.slice(0, 3).map(a => a.title).filter(Boolean);
  const competitorCount = new Set(
    articles.flatMap(a => a.relevance_factors?.filter(f => f.includes('COMPETITOR')) || [])
  ).size;

  const hasProductNews = articles.some(a => a.relevance_factors?.includes('PRODUCT_LAUNCH'));
  const hasFunding = articles.some(a => a.relevance_factors?.includes('FUNDING'));
  const hasRegulatory = articles.some(a => a.relevance_factors?.includes('REGULATORY'));

  let summary = `Found ${articles.length} highly relevant articles about ${orgName}. `;

  if (hasProductNews) summary += 'Product launches detected. ';
  if (hasFunding) summary += 'Funding news identified. ';
  if (hasRegulatory) summary += 'Regulatory developments found. ';
  if (competitorCount > 0) summary += `${competitorCount} competitor actions tracked. `;

  summary += `Latest: ${topTitles[0]?.substring(0, 100)}`;

  return summary;
}

// Run the test
testNIVFireplexityWithRelevance();