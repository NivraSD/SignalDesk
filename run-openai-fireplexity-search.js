const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

// Configuration
const TARGET_ORG = 'OpenAI';
const RELEVANCE_THRESHOLD = 30; // Same as monitor-stage-2-relevance

// Default OpenAI profile based on common knowledge
const OPENAI_PROFILE = {
  organization_name: 'OpenAI',
  organization_id: 'openai',
  competition: {
    direct_competitors: ['Anthropic', 'Google DeepMind', 'Cohere', 'AI21 Labs', 'Inflection AI'],
    indirect_competitors: ['Microsoft', 'Google', 'Amazon', 'Meta', 'Apple'],
    emerging_threats: ['Mistral AI', 'Stability AI', 'xAI', 'Hugging Face']
  },
  keywords: [
    'GPT', 'ChatGPT', 'GPT-4', 'GPT-5', 'DALL-E', 'Codex', 'Whisper',
    'artificial general intelligence', 'AGI', 'AI safety', 'alignment',
    'large language models', 'generative AI', 'transformer models'
  ],
  stakeholders: {
    regulators: ['FTC', 'EU Commission', 'UK CMA', 'White House'],
    executives: ['Sam Altman', 'Greg Brockman', 'Ilya Sutskever', 'Mira Murati'],
    major_investors: ['Microsoft', 'Reid Hoffman', 'Khosla Ventures', 'Tiger Global'],
    partners: ['Microsoft', 'GitHub', 'Shutterstock', 'Bain & Company']
  },
  monitoring_config: {
    keywords: [
      'OpenAI funding', 'GPT API', 'ChatGPT Enterprise', 'OpenAI partnership',
      'AI regulation OpenAI', 'Sam Altman', 'OpenAI safety', 'OpenAI lawsuit'
    ]
  },
  intelligence_context: {
    monitoring_prompt: `Monitor OpenAI for: product launches (GPT models, new features),
      competitive moves, Microsoft partnership developments, regulatory challenges,
      leadership changes, AI safety initiatives, and enterprise adoption`,
    relevance_criteria: {
      scoring_weights: {
        organization_mention: 40,
        competitor_action: 35,
        regulatory_news: 30,
        market_signal: 20,
        technology_update: 25
      }
    },
    topics: ['AGI development', 'enterprise AI', 'developer tools', 'AI safety', 'consumer products']
  }
};

async function runOpenAIFireplexitySearch() {
  console.log('🚀 Running Real Fireplexity Search for OpenAI with Relevance Filtering');
  console.log('================================================\n');

  try {
    // Step 1: Build intelligent search queries
    console.log('🔍 Step 1: Building search queries for OpenAI...');

    const searchQueries = [
      `OpenAI latest news developments GPT ChatGPT`,
      `OpenAI Microsoft partnership AI competition Anthropic`,
      `Sam Altman OpenAI announcements product launches`
    ];

    console.log('Search queries:');
    searchQueries.forEach((q, i) => console.log(`  ${i + 1}. "${q}"`));

    // Step 2: Perform actual Fireplexity search
    console.log('\n🌐 Step 2: Performing Fireplexity search...');

    const allResults = [];

    for (const query of searchQueries) {
      console.log(`\n  Searching: "${query}"...`);

      try {
        // Call the Fireplexity edge function
        const response = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-fireplexity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'}`
          },
          body: JSON.stringify({
            query: query,
            module: 'intelligence',
            useCache: false, // Get fresh results
            context: {
              organization: TARGET_ORG,
              profile: OPENAI_PROFILE
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ Response received`);

          // Extract articles from various response formats
          let articles = [];

          if (data.articles) {
            articles = data.articles;
          } else if (data.news?.articles) {
            articles = data.news.articles;
          } else if (data.web?.sources) {
            articles = data.web.sources;
          } else if (data.results) {
            articles = Array.isArray(data.results) ? data.results : [];
          } else if (data.sources) {
            articles = data.sources;
          }

          console.log(`  Found ${articles.length} articles`);

          // Add to results
          articles.forEach(article => {
            // Normalize the article format
            const normalizedArticle = {
              title: article.title || article.headline || '',
              description: article.description || article.summary || article.snippet || '',
              url: article.url || article.link || '',
              publishedAt: article.publishedAt || article.published_at || article.date || new Date().toISOString(),
              source: article.source || { name: 'Unknown' },
              content: article.content || ''
            };

            // Only add if we have at least a title or description
            if (normalizedArticle.title || normalizedArticle.description) {
              allResults.push(normalizedArticle);
            }
          });
        } else {
          console.log(`  ⚠️ Search failed: ${response.statusText}`);
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    // Remove duplicates based on URL
    const uniqueResults = [];
    const seenUrls = new Set();

    for (const article of allResults) {
      if (article.url && !seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        uniqueResults.push(article);
      } else if (!article.url) {
        // Keep articles without URLs (might be summaries)
        uniqueResults.push(article);
      }
    }

    console.log(`\n📊 Total unique results: ${uniqueResults.length}`);

    // Step 3: Apply relevance filtering
    console.log('\n🎯 Step 3: Applying relevance filtering...');

    const scoredArticles = uniqueResults.map(article => {
      const score = calculateRelevanceScore(article, OPENAI_PROFILE);
      return { ...article, relevance_score: score.score, relevance_factors: score.factors };
    });

    // Sort by relevance
    scoredArticles.sort((a, b) => b.relevance_score - a.relevance_score);

    // Filter by threshold
    const relevantArticles = scoredArticles.filter(a => a.relevance_score >= RELEVANCE_THRESHOLD);

    console.log(`\n📈 Relevance Filtering Results:`);
    console.log(`  - Total articles: ${uniqueResults.length}`);
    console.log(`  - Articles passing threshold (${RELEVANCE_THRESHOLD}+): ${relevantArticles.length}`);

    if (relevantArticles.length > 0) {
      console.log(`  - Average relevance score: ${Math.round(relevantArticles.reduce((sum, a) => sum + a.relevance_score, 0) / relevantArticles.length)}`);
    }

    // Display top articles
    console.log('\n🏆 Top Relevant Articles:');
    relevantArticles.slice(0, 5).forEach((article, i) => {
      console.log(`\n  ${i + 1}. [Score: ${article.relevance_score}] ${article.title?.substring(0, 80)}`);
      console.log(`     URL: ${article.url}`);
      console.log(`     Factors: ${article.relevance_factors?.slice(0, 3).join(', ')}`);
    });

    // Step 4: Save to database
    console.log('\n💾 Step 4: Saving filtered results to database...');

    const searchRecord = {
      query: `OpenAI intelligent search - ${new Date().toISOString()}`,
      module: 'niv_production',
      strategy: 'filtered_fireplexity',
      results: {
        articles: relevantArticles.slice(0, 20), // Save top 20
        summary: generateSummary(relevantArticles, TARGET_ORG),
        totalResults: relevantArticles.length,
        timestamp: new Date().toISOString(),
        metadata: {
          organization: TARGET_ORG,
          profile_used: true,
          relevance_threshold: RELEVANCE_THRESHOLD,
          raw_count: uniqueResults.length,
          filtered_count: relevantArticles.length,
          search_queries: searchQueries
        }
      },
      created_at: new Date().toISOString()
    };

    try {
      const { data: savedSearch, error: saveError } = await supabase
        .from('fireplexity_searches')
        .insert([searchRecord])
        .select()
        .single();

      if (savedSearch) {
        console.log(`✅ Saved search results with ID: ${savedSearch.id}`);
        console.log(`   Query: "${savedSearch.query}"`);
      } else if (saveError) {
        console.log(`⚠️ Save error: ${saveError.message}`);

        // Try without the cost field if that's the issue
        delete searchRecord.cost;
        const { data: retrySave } = await supabase
          .from('fireplexity_searches')
          .insert([searchRecord])
          .select()
          .single();

        if (retrySave) {
          console.log(`✅ Saved on retry with ID: ${retrySave.id}`);
        }
      }
    } catch (e) {
      console.log(`❌ Database error: ${e.message}`);
    }

    // Step 5: Verify NIV can access it
    console.log('\n🤖 Step 5: Verifying NIV access...');

    const { data: verifyData } = await supabase
      .from('fireplexity_searches')
      .select('id, query, results')
      .or(`query.ilike.%${TARGET_ORG}%,results->>summary.ilike.%${TARGET_ORG}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (verifyData && verifyData.length > 0) {
      console.log('✅ NIV can access the filtered search results');
      console.log(`   Latest search has ${verifyData[0].results?.articles?.length || 0} high-quality articles`);
    }

    console.log('\n✨ Search completed successfully!');
    console.log('\n📊 Final Summary:');
    console.log(`  - Organization: ${TARGET_ORG}`);
    console.log(`  - Raw results: ${uniqueResults.length}`);
    console.log(`  - High-quality filtered results: ${relevantArticles.length}`);
    console.log(`  - Quality ratio: ${Math.round((relevantArticles.length / uniqueResults.length) * 100)}% passed relevance filter`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Relevance scoring function (based on monitor-stage-2-relevance)
function calculateRelevanceScore(article, profile) {
  const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase();
  const titleText = (article.title || '').toLowerCase();

  let score = 0;
  const factors = [];

  // Organization in title/content
  const orgName = profile.organization_name.toLowerCase();
  const orgVariations = ['openai', 'open ai', 'chatgpt', 'gpt'];

  const orgInTitle = orgVariations.some(variant => titleText.includes(variant));
  const orgInContent = orgVariations.some(variant => text.includes(variant));

  if (orgInTitle) {
    score += 40;
    factors.push('ORG_IN_TITLE');
  } else if (orgInContent) {
    score += 15;
    factors.push('ORG_MENTIONED');
  }

  // Direct competitor mentions
  const competitors = profile.competition?.direct_competitors || [];
  const competitorMentions = competitors.filter(comp =>
    text.includes(comp.toLowerCase())
  );

  if (competitorMentions.length > 0) {
    score += 30 * Math.min(competitorMentions.length, 3); // Cap at 3
    factors.push(`COMPETITORS:${competitorMentions.join(',')}`);
  }

  // Keyword matches
  const allKeywords = [
    ...(profile.keywords || []),
    ...(profile.monitoring_config?.keywords || [])
  ];

  const keywordMatches = allKeywords.filter(kw =>
    text.includes(kw.toLowerCase())
  );

  score += Math.min(keywordMatches.length * 10, 50); // Cap keyword bonus
  if (keywordMatches.length > 0) {
    factors.push(`KEYWORDS:${keywordMatches.length}`);
  }

  // Stakeholder mentions (executives, partners, investors)
  const stakeholders = [
    ...(profile.stakeholders?.executives || []),
    ...(profile.stakeholders?.major_investors || []),
    ...(profile.stakeholders?.partners || [])
  ];

  const stakeholderMentions = stakeholders.filter(sh =>
    text.includes(sh.toLowerCase())
  );

  if (stakeholderMentions.length > 0) {
    score += 25 * Math.min(stakeholderMentions.length, 2);
    factors.push(`STAKEHOLDERS:${stakeholderMentions.join(',')}`);
  }

  // Regulatory mentions
  const regulators = profile.stakeholders?.regulators || [];
  const regulatoryMention = regulators.some(reg =>
    text.includes(reg.toLowerCase())
  );

  if (regulatoryMention) {
    score += 30;
    factors.push('REGULATORY');
  }

  // Action signals
  const actionPatterns = {
    product_launch: /launch|unveil|introduce|release|announce.*new/i,
    funding: /funding|investment|raise|billion|million|valuation/i,
    partnership: /partner|collaborate|team|alliance|integrate/i,
    leadership: /ceo|executive|appoint|resign|hire|departure/i,
    competitive: /compete|rival|versus|beat|surpass|overtake/i,
    crisis: /lawsuit|investigation|scrutiny|controversy|breach/i
  };

  for (const [signal, pattern] of Object.entries(actionPatterns)) {
    if (pattern.test(text)) {
      score += 20;
      factors.push(signal.toUpperCase());
    }
  }

  // Time sensitivity
  if (article.publishedAt) {
    const ageInDays = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays < 1) {
      score += 15;
      factors.push('BREAKING_NEWS');
    } else if (ageInDays < 3) {
      score += 10;
      factors.push('RECENT');
    } else if (ageInDays < 7) {
      score += 5;
      factors.push('THIS_WEEK');
    }
  }

  // Penalty for generic/low-quality signals
  const genericTerms = ['newsletter', 'roundup', 'brief mention', 'also includes', 'among others'];
  const hasGenericSignal = genericTerms.some(term => text.includes(term));

  if (hasGenericSignal && factors.length < 3) {
    score = Math.floor(score * 0.5);
    factors.push('GENERIC_PENALTY');
  }

  return {
    score: Math.min(score, 100),
    factors: factors
  };
}

// Generate summary for the search results
function generateSummary(articles, orgName) {
  if (!articles || articles.length === 0) {
    return `No relevant articles found for ${orgName}`;
  }

  const topTitles = articles.slice(0, 3)
    .map(a => a.title)
    .filter(Boolean);

  // Analyze the types of news found
  const hasProductNews = articles.some(a =>
    a.relevance_factors?.some(f => f.includes('PRODUCT_LAUNCH'))
  );
  const hasFunding = articles.some(a =>
    a.relevance_factors?.some(f => f.includes('FUNDING'))
  );
  const hasCompetitive = articles.some(a =>
    a.relevance_factors?.some(f => f.includes('COMPETITOR'))
  );
  const hasRegulatory = articles.some(a =>
    a.relevance_factors?.includes('REGULATORY')
  );

  let summary = `Found ${articles.length} high-relevance articles about ${orgName}. `;

  const insights = [];
  if (hasProductNews) insights.push('product launches');
  if (hasFunding) insights.push('funding news');
  if (hasCompetitive) insights.push('competitive intelligence');
  if (hasRegulatory) insights.push('regulatory developments');

  if (insights.length > 0) {
    summary += `Key topics include: ${insights.join(', ')}. `;
  }

  if (topTitles.length > 0) {
    summary += `Latest: "${topTitles[0].substring(0, 100)}..."`;
  }

  return summary;
}

// Run the search
runOpenAIFireplexitySearch();