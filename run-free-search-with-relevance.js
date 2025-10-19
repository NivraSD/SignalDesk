const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

// Use Brave Search API (free tier available) or SerpAPI
async function performFreeWebSearch(query) {
  const results = [];

  // Option 1: Try Brave Search (has free tier)
  const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
  if (BRAVE_API_KEY) {
    try {
      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'X-Subscription-Token': BRAVE_API_KEY
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.web?.results || [];
      }
    } catch (e) {
      console.log('Brave search failed:', e.message);
    }
  }

  // Option 2: Use SerpAPI (has free tier)
  const SERP_API_KEY = process.env.SERP_API_KEY;
  if (SERP_API_KEY) {
    try {
      const response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}&num=10`
      );

      if (response.ok) {
        const data = await response.json();
        return data.organic_results || [];
      }
    } catch (e) {
      console.log('SerpAPI failed:', e.message);
    }
  }

  // Option 3: Use Google Custom Search (100 free queries/day)
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_CX = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (GOOGLE_API_KEY && GOOGLE_CX) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&num=10`
      );

      if (response.ok) {
        const data = await response.json();
        return data.items || [];
      }
    } catch (e) {
      console.log('Google search failed:', e.message);
    }
  }

  // Option 4: Scrape Google Search results (risky but free)
  try {
    console.log('Using web scraping fallback...');
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    // Use a proxy or headers to avoid blocking
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.ok) {
      const html = await response.text();
      // Basic extraction (would need proper HTML parsing)
      const titleMatches = html.match(/<h3[^>]*>(.*?)<\/h3>/g) || [];
      const linkMatches = html.match(/href="\/url\?q=(https?:\/\/[^&]+)/g) || [];

      for (let i = 0; i < Math.min(titleMatches.length, 10); i++) {
        results.push({
          title: titleMatches[i].replace(/<[^>]*>/g, ''),
          url: linkMatches[i]?.replace('href="/url?q=', '') || '',
          snippet: 'Web search result'
        });
      }
    }
  } catch (e) {
    console.log('Web scraping failed:', e.message);
  }

  // Option 5: Use DuckDuckGo Instant Answer API (very limited but free)
  try {
    const ddgResponse = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
    );

    if (ddgResponse.ok) {
      const ddgData = await ddgResponse.json();

      // Add DDG instant answer if available
      if (ddgData.Abstract) {
        results.push({
          title: ddgData.Heading || query,
          snippet: ddgData.Abstract,
          url: ddgData.AbstractURL || ''
        });
      }

      // Add related topics
      if (ddgData.RelatedTopics) {
        ddgData.RelatedTopics.slice(0, 5).forEach(topic => {
          if (topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text,
              snippet: topic.Text,
              url: topic.FirstURL || ''
            });
          }
        });
      }
    }
  } catch (e) {
    console.log('DuckDuckGo search failed:', e.message);
  }

  return results;
}

async function runFreeSearchWithRelevance() {
  console.log('🚀 Running Free Web Search with Relevance Filtering for OpenAI');
  console.log('================================================\n');

  // Get OpenAI profile
  const { data: profile } = await supabase
    .from('mcp_discovery')
    .select('*')
    .eq('organization_id', 'OpenAI')
    .single();

  if (!profile) {
    console.log('❌ No OpenAI profile found');
    return;
  }

  console.log('✅ Loaded OpenAI profile');

  // Build intelligent queries FROM OpenAI's perspective
  const queries = [
    'Anthropic Claude 3.5 features pricing enterprise',
    'Google DeepMind Gemini Ultra benchmarks performance',
    'Meta Llama 3 open source AI model release',
    'Microsoft Copilot enterprise adoption statistics 2024',
    'AI regulation EU Act compliance requirements 2024',
    'Mistral AI funding valuation European AI startup',
    'xAI Grok features Twitter integration Elon Musk',
    'Cohere enterprise API pricing comparison 2024'
  ];

  console.log('🔍 Searching for competitive intelligence...\n');

  const allResults = [];

  for (const query of queries) {
    console.log(`Searching: "${query}"...`);
    const results = await performFreeWebSearch(query);
    console.log(`  Found ${results.length} results`);

    // Normalize results
    results.forEach(r => {
      allResults.push({
        title: r.title || r.Title || '',
        description: r.snippet || r.description || r.Description || '',
        url: r.url || r.link || r.URL || '',
        source_query: query,
        publishedAt: r.publishedAt || new Date().toISOString()
      });
    });
  }

  console.log(`\n📊 Total results: ${allResults.length}`);

  // Apply relevance scoring
  const scoredResults = allResults.map(article => {
    const text = `${article.title} ${article.description}`.toLowerCase();
    let score = 0;
    const factors = [];

    // Score based on competitor mentions
    const competitors = profile.competition.direct_competitors || [];
    const competitorMentions = competitors.filter(c => text.includes(c.toLowerCase()));

    if (competitorMentions.length > 0) {
      score += 40 * competitorMentions.length;
      factors.push(`COMPETITORS:${competitorMentions.join(',')}`);
    }

    // Score based on key topics
    const keyTopics = ['pricing', 'enterprise', 'benchmark', 'performance', 'launch', 'funding', 'regulation'];
    const topicMatches = keyTopics.filter(t => text.includes(t));

    score += topicMatches.length * 15;
    if (topicMatches.length > 0) {
      factors.push(`TOPICS:${topicMatches.join(',')}`);
    }

    // Penalty for being too OpenAI-focused
    if (text.includes('openai') || text.includes('chatgpt')) {
      if (competitorMentions.length === 0) {
        score = Math.floor(score * 0.5);
        factors.push('SELF_FOCUS_PENALTY');
      }
    }

    return {
      ...article,
      relevance_score: Math.min(score, 100),
      relevance_factors: factors
    };
  });

  // Filter and sort
  const relevantResults = scoredResults
    .filter(a => a.relevance_score >= 30)
    .sort((a, b) => b.relevance_score - a.relevance_score);

  console.log(`\n✅ Relevant articles: ${relevantResults.length}`);

  // Display top results
  console.log('\n🏆 Top Intelligence Findings:');
  relevantResults.slice(0, 10).forEach((article, i) => {
    console.log(`\n${i + 1}. [Score: ${article.relevance_score}]`);
    console.log(`   ${article.title?.substring(0, 80)}`);
    console.log(`   ${article.relevance_factors.join(', ')}`);
  });

  // Save to database
  console.log('\n💾 Saving to database...');

  const searchRecord = {
    query: `OpenAI Competitive Intelligence - Free Search - ${new Date().toISOString()}`,
    results: {
      articles: relevantResults.slice(0, 20),
      summary: `Found ${relevantResults.length} relevant competitive intelligence items for OpenAI using free search APIs.`,
      totalResults: relevantResults.length,
      timestamp: new Date().toISOString(),
      metadata: {
        organization: 'OpenAI',
        search_method: 'free_apis',
        raw_count: allResults.length,
        filtered_count: relevantResults.length
      }
    },
    created_at: new Date().toISOString()
  };

  try {
    const { data: saved, error } = await supabase
      .from('fireplexity_searches')
      .insert([searchRecord])
      .select()
      .single();

    if (saved) {
      console.log(`✅ Saved with ID: ${saved.id}`);
    } else if (error) {
      console.log('Save error:', error.message);
    }
  } catch (e) {
    console.log('Database error:', e.message);
  }

  console.log('\n✨ Done! NIV can now access these filtered results.');
}

// Run it
runFreeSearchWithRelevance();