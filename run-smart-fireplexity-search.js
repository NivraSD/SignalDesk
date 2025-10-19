const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSmartFireplexitySearch() {
  console.log('🧠 Running SMART Fireplexity search with relevance filtering...\n');

  // Get OpenAI discovery profile
  const { data: discovery, error: discoveryError } = await supabase
    .from('mcp_discovery')
    .select('*')
    .eq('organization_id', 'OpenAI')
    .single();

  if (!discovery) {
    console.error('❌ No OpenAI discovery profile found');
    return;
  }

  console.log('✅ Loaded OpenAI discovery profile');

  // Extract key entities for relevance checking
  const relevanceContext = {
    organization: 'OpenAI',
    competitors: discovery.competition.direct_competitors,
    keywords: discovery.keywords,
    stakeholders: [
      ...discovery.stakeholders.regulators,
      ...discovery.stakeholders.executives
    ],
    topics: discovery.trending.hot_topics
  };

  console.log('📊 Relevance context:');
  console.log('   Competitors:', relevanceContext.competitors.slice(0, 5).join(', '));
  console.log('   Keywords:', relevanceContext.keywords.slice(0, 5).join(', '));

  // Define comprehensive search queries covering all key areas
  const searchQueries = [
    // Direct OpenAI searches
    {
      query: 'OpenAI GPT-5 GPT-4 latest developments 2025',
      category: 'openai',
      priority: 'critical'
    },

    // Competitor searches
    {
      query: 'Anthropic Claude 3 vs ChatGPT enterprise AI competition',
      category: 'competitors',
      priority: 'high'
    },
    {
      query: 'Google DeepMind Gemini AI model comparison OpenAI',
      category: 'competitors',
      priority: 'high'
    },

    // Market and industry
    {
      query: 'generative AI enterprise adoption 2025 ChatGPT Claude',
      category: 'market',
      priority: 'medium'
    },

    // Regulatory
    {
      query: 'AI regulation FTC EU Commission OpenAI investigation',
      category: 'regulatory',
      priority: 'high'
    },

    // Leadership
    {
      query: 'Sam Altman Ilya Sutskever OpenAI leadership announcements',
      category: 'leadership',
      priority: 'medium'
    },

    // Technology trends
    {
      query: 'AGI artificial general intelligence timeline predictions 2025',
      category: 'technology',
      priority: 'medium'
    }
  ];

  console.log(`\n🔍 Running ${searchQueries.length} targeted searches...\n`);

  const allResults = [];

  for (const searchConfig of searchQueries) {
    console.log(`\n📡 Searching: "${searchConfig.query.substring(0, 60)}..."`);
    console.log(`   Category: ${searchConfig.category} | Priority: ${searchConfig.priority}`);

    try {
      // Call monitor-stage-2-relevance to get filtered results
      const response = await fetch(`${supabaseUrl}/functions/v1/monitor-stage-2-relevance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          organization_name: 'OpenAI',
          profile: discovery,
          articles: [], // We'll get fresh ones from search
          search_query: searchConfig.query
        })
      });

      if (!response.ok) {
        // If monitor-stage-2 doesn't work, fall back to direct search
        console.log('   ⚠️ Monitor stage 2 not available, using direct search');

        const directResponse = await fetch(`${supabaseUrl}/functions/v1/niv-fireplexity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            query: searchConfig.query,
            module: 'intelligence',
            useCache: false
          })
        });

        if (directResponse.ok) {
          const result = await directResponse.json();

          if (result.articles && result.articles.length > 0) {
            // Apply our own relevance scoring
            const scoredArticles = scoreArticleRelevance(result.articles, relevanceContext, searchConfig);
            allResults.push({
              query: searchConfig.query,
              category: searchConfig.category,
              articles: scoredArticles.slice(0, 5) // Top 5 per search
            });

            console.log(`   ✅ Found ${result.articles.length} articles, kept ${Math.min(5, scoredArticles.length)} relevant ones`);
          }
        }
      } else {
        const result = await response.json();
        console.log(`   ✅ Monitor stage 2 filtered: ${result.articles?.length || 0} relevant articles`);

        if (result.articles && result.articles.length > 0) {
          allResults.push({
            query: searchConfig.query,
            category: searchConfig.category,
            articles: result.articles.slice(0, 5)
          });
        }
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log(`   ❌ Error:`, error.message);
    }
  }

  // Aggregate and deduplicate all articles
  console.log('\n\n📊 Processing and storing results...');

  const allArticles = [];
  const seenUrls = new Set();

  allResults.forEach(result => {
    result.articles?.forEach(article => {
      if (!seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        allArticles.push({
          ...article,
          category: result.category,
          search_query: result.query
        });
      }
    });
  });

  console.log(`   Total unique articles: ${allArticles.length}`);

  // Group by category for better storage
  const categorizedResults = {
    openai: allArticles.filter(a => a.category === 'openai'),
    competitors: allArticles.filter(a => a.category === 'competitors'),
    regulatory: allArticles.filter(a => a.category === 'regulatory'),
    market: allArticles.filter(a => a.category === 'market'),
    leadership: allArticles.filter(a => a.category === 'leadership'),
    technology: allArticles.filter(a => a.category === 'technology')
  };

  // Store comprehensive search results
  for (const [category, articles] of Object.entries(categorizedResults)) {
    if (articles.length > 0) {
      const { error } = await supabase
        .from('fireplexity_searches')
        .insert({
          organization_id: 'OpenAI',
          query: `Smart search: ${category}`,
          strategy: 'smart_filtered',
          results: {
            articles: articles.slice(0, 10), // Store top 10 per category
            summary: generateSmartSummary(articles, category),
            category,
            relevance_filtered: true,
            total_count: articles.length
          }
        });

      if (error) {
        console.log(`   ⚠️ Failed to store ${category}:`, error.message);
      } else {
        console.log(`   💾 Stored ${articles.length} ${category} articles`);
      }
    }
  }

  console.log('\n✅ Smart search complete!');
  console.log('NIV can now provide:');
  console.log('  - Relevant, filtered results for each category');
  console.log('  - Properly scored articles based on the discovery profile');
  console.log('  - Clean summaries for each topic area');
}

// Score articles based on relevance to OpenAI context
function scoreArticleRelevance(articles, context, searchConfig) {
  return articles.map(article => {
    let score = 0;
    const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();

    // Direct organization mentions (highest weight)
    if (text.includes('openai')) score += 100;
    if (text.includes('chatgpt')) score += 80;
    if (text.includes('gpt-4') || text.includes('gpt-5')) score += 70;

    // Competitor mentions (high weight)
    context.competitors.forEach(comp => {
      if (text.includes(comp.toLowerCase())) score += 50;
    });

    // Keyword matches (medium weight)
    context.keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) score += 30;
    });

    // Stakeholder mentions (medium weight)
    context.stakeholders.forEach(stakeholder => {
      if (text.includes(stakeholder.toLowerCase())) score += 40;
    });

    // Topic relevance (low weight)
    context.topics.forEach(topic => {
      if (text.includes(topic.toLowerCase())) score += 20;
    });

    // Priority boost based on search category
    if (searchConfig.priority === 'critical') score += 50;
    if (searchConfig.priority === 'high') score += 30;

    // Recency boost (if published date available)
    if (article.publishedAt) {
      const ageInHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
      if (ageInHours < 24) score += 40;
      else if (ageInHours < 48) score += 20;
      else if (ageInHours < 72) score += 10;
    }

    return {
      ...article,
      relevance_score: score,
      relevance_tier: score > 150 ? 'critical' : score > 100 ? 'high' : score > 50 ? 'medium' : 'low'
    };
  }).filter(article => article.relevance_score > 30) // Filter out low relevance
    .sort((a, b) => b.relevance_score - a.relevance_score);
}

// Generate smart summaries for each category
function generateSmartSummary(articles, category) {
  const topTitles = articles.slice(0, 3).map(a => a.title).filter(Boolean);

  const summaries = {
    openai: `Latest OpenAI developments: ${topTitles.join('; ')}`,
    competitors: `Competitive landscape updates: ${topTitles.join('; ')}`,
    regulatory: `Regulatory and compliance news: ${topTitles.join('; ')}`,
    market: `Market trends and adoption: ${topTitles.join('; ')}`,
    leadership: `Executive and leadership updates: ${topTitles.join('; ')}`,
    technology: `Technology and research advances: ${topTitles.join('; ')}`
  };

  return summaries[category] || `${category} updates: ${topTitles.join('; ')}`;
}

runSmartFireplexitySearch();