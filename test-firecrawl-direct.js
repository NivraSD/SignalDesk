const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const FIRECRAWL_KEY = 'fc-3048810124b640eb99293880a4ab25d0';

async function testFirecrawlDirect() {
  console.log('🔍 Testing Firecrawl API with your key...\n');

  // Test queries
  const testQueries = [
    'Anthropic Claude 3.5 AI competition market share 2024',
    'Google DeepMind Gemini latest features pricing',
    'OpenAI GPT-5 development news latest'
  ];

  for (const query of testQueries) {
    console.log(`\n📌 Testing query: "${query}"\n`);

    try {
      // Try v1 search endpoint first (newer)
      console.log('Trying Firecrawl v1 search endpoint...');
      let response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          limit: 5,
          format: 'markdown'
        })
      });

      console.log(`Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('v1 Error response:', errorText);

        // Try v0 endpoint as fallback
        console.log('\nTrying Firecrawl v0 search endpoint...');
        response = await fetch('https://api.firecrawl.dev/v0/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: query,
            pageOptions: {
              fetchPageContent: true
            },
            searchOptions: {
              limit: 5
            }
          })
        });

        console.log(`v0 Response status: ${response.status} ${response.statusText}`);
      }

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Search successful!');

        // Handle different response formats
        let results = [];
        if (data.data) {
          results = Array.isArray(data.data) ? data.data : (data.data.results || []);
        } else if (data.results) {
          results = data.results;
        }

        console.log(`Found ${results.length} results:`);

        results.slice(0, 3).forEach((result, i) => {
          console.log(`\n  ${i + 1}. ${result.title || result.url || 'No title'}`);
          console.log(`     URL: ${result.url}`);
          if (result.markdown) {
            console.log(`     Content: ${result.markdown.substring(0, 100)}...`);
          } else if (result.content) {
            console.log(`     Content: ${result.content.substring(0, 100)}...`);
          }
        });

        return results; // Return for further processing
      } else {
        const errorText = await response.text();
        console.log('❌ Both v1 and v0 failed:', errorText);
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

async function testWithRelevanceFiltering() {
  console.log('\n\n🎯 Now testing with relevance filtering for OpenAI perspective...\n');

  const supabase = createClient(
    'https://zskaxjtyuaqazydouifp.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
  );

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

  // Build competitive intelligence queries
  const intelligenceQueries = [
    'Anthropic Claude 3.5 enterprise pricing features vs ChatGPT',
    'Google DeepMind Gemini Ultra performance benchmarks AI competition',
    'Meta Llama 3 open source AI model capabilities business impact',
    'Microsoft Copilot enterprise adoption statistics market share 2024',
    'AI startup funding Mistral xAI Cohere valuation 2024'
  ];

  const allResults = [];

  console.log('🔍 Gathering competitive intelligence...\n');

  for (const query of intelligenceQueries) {
    console.log(`Searching: "${query.substring(0, 50)}..."`);

    try {
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          limit: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.data || data.results || [];
        console.log(`  ✅ Found ${results.length} results`);

        results.forEach(r => {
          allResults.push({
            title: r.title || '',
            description: r.description || r.snippet || '',
            url: r.url || '',
            content: r.markdown || r.content || '',
            source_query: query
          });
        });
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
    }
  }

  console.log(`\n📊 Total results gathered: ${allResults.length}`);

  // Apply relevance scoring
  const scoredResults = allResults.map(article => {
    const text = `${article.title} ${article.description} ${article.content}`.toLowerCase();
    let score = 0;
    const factors = [];

    // Competitor mentions (high value for OpenAI)
    const competitors = profile.competition.direct_competitors || [];
    const competitorMentions = competitors.filter(c => text.includes(c.toLowerCase()));

    if (competitorMentions.length > 0) {
      score += 40 * Math.min(competitorMentions.length, 3);
      factors.push(`COMPETITORS:${competitorMentions.join(',')}`);
    }

    // Key intelligence topics
    const intelligenceTopics = ['pricing', 'enterprise', 'benchmark', 'performance', 'funding', 'market share', 'adoption'];
    const topicMatches = intelligenceTopics.filter(t => text.includes(t));

    score += topicMatches.length * 15;
    if (topicMatches.length > 0) {
      factors.push(`INTEL_TOPICS:${topicMatches.length}`);
    }

    // Penalty for self-focused content
    if ((text.includes('openai') || text.includes('chatgpt')) && competitorMentions.length === 0) {
      score = Math.floor(score * 0.3);
      factors.push('SELF_FOCUS_PENALTY');
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

  console.log(`\n✅ High-relevance articles: ${relevantResults.length}/${allResults.length}`);
  console.log(`   Quality ratio: ${Math.round((relevantResults.length / allResults.length) * 100)}%`);

  // Display top results
  console.log('\n🏆 Top Competitive Intelligence:');
  relevantResults.slice(0, 5).forEach((article, i) => {
    console.log(`\n${i + 1}. [Score: ${article.relevance_score}]`);
    console.log(`   ${article.title?.substring(0, 80)}`);
    console.log(`   Factors: ${article.relevance_factors.join(', ')}`);
  });

  // Save to database
  console.log('\n💾 Saving to database for NIV access...');

  const searchRecord = {
    query: `OpenAI Competitive Intelligence - Firecrawl - ${new Date().toISOString()}`,
    results: {
      articles: relevantResults.slice(0, 30),
      summary: `Competitive intelligence for OpenAI: ${relevantResults.length} high-value items from ${allResults.length} total. Key competitors covered: ${[...new Set(relevantResults.flatMap(r => r.relevance_factors.filter(f => f.startsWith('COMPETITORS:')).map(f => f.split(':')[1])))].join(', ')}`,
      totalResults: relevantResults.length,
      timestamp: new Date().toISOString(),
      metadata: {
        organization: 'OpenAI',
        perspective: 'competitive_intelligence',
        search_method: 'firecrawl_api',
        raw_count: allResults.length,
        filtered_count: relevantResults.length
      }
    },
    created_at: new Date().toISOString()
  };

  try {
    const { data: saved } = await supabase
      .from('fireplexity_searches')
      .insert([searchRecord])
      .select()
      .single();

    if (saved) {
      console.log(`✅ Saved with ID: ${saved.id}`);
      console.log(`   NIV can now query this intelligence using the search ID or organization name`);
    }
  } catch (e) {
    console.log('Save error:', e.message);
  }
}

// Run both tests
async function runTests() {
  await testFirecrawlDirect();
  await testWithRelevanceFiltering();
}

runTests();