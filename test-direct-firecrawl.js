require('dotenv').config();

async function testDirectFirecrawl() {
  console.log('🔍 Testing Direct Firecrawl API...\n');

  // Check if we have the API key
  const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;

  console.log('Firecrawl API Key present:', !!FIRECRAWL_KEY);
  if (FIRECRAWL_KEY) {
    console.log('Key prefix:', FIRECRAWL_KEY.substring(0, 10) + '...');
  }

  if (!FIRECRAWL_KEY) {
    console.log('❌ No FIRECRAWL_API_KEY found in environment');
    console.log('   Add FIRECRAWL_API_KEY to your .env file');
    return;
  }

  // Test direct Firecrawl search
  const testQuery = "Anthropic Claude AI competition OpenAI latest news";

  console.log(`\n🚀 Testing Firecrawl search with query: "${testQuery}"\n`);

  try {
    // Try Firecrawl v1 search endpoint
    console.log('Calling Firecrawl API v1/search...');
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: testQuery,
        limit: 10,
        format: 'markdown'
      })
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);

      // Try v0 endpoint as fallback
      console.log('\n🔄 Trying Firecrawl v0 endpoint...');
      const v0Response = await fetch('https://api.firecrawl.dev/v0/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: testQuery,
          pageOptions: {
            fetchPageContent: true
          },
          searchOptions: {
            limit: 10
          }
        })
      });

      console.log('v0 Response status:', v0Response.status, v0Response.statusText);

      if (v0Response.ok) {
        const v0Data = await v0Response.json();
        console.log('\n✅ v0 Search successful!');
        console.log('Results structure:', Object.keys(v0Data));
        if (v0Data.data) {
          console.log(`Found ${v0Data.data.length} results`);
          v0Data.data.slice(0, 3).forEach((result, i) => {
            console.log(`\n${i + 1}. ${result.title || result.url}`);
            console.log(`   URL: ${result.url}`);
            if (result.content) {
              console.log(`   Content preview: ${result.content.substring(0, 100)}...`);
            }
          });
        }
      } else {
        const v0Error = await v0Response.text();
        console.log('v0 Error:', v0Error);
      }
    } else {
      const data = await response.json();
      console.log('\n✅ Search successful!');
      console.log('Response structure:', Object.keys(data));

      if (data.success === false) {
        console.log('❌ API returned success: false');
        console.log('Error:', data.error);
      } else if (data.data) {
        console.log(`\nFound ${data.data.length} results:`);
        data.data.slice(0, 5).forEach((result, i) => {
          console.log(`\n${i + 1}. ${result.title || 'No title'}`);
          console.log(`   URL: ${result.url}`);
          console.log(`   Source: ${result.source || 'Unknown'}`);
          if (result.markdown) {
            console.log(`   Content preview: ${result.markdown.substring(0, 100)}...`);
          }
        });
      } else if (data.results) {
        console.log(`\nFound ${data.results.length} results`);
      } else {
        console.log('Unexpected response structure:', JSON.stringify(data, null, 2).substring(0, 500));
      }
    }

  } catch (error) {
    console.error('❌ Error calling Firecrawl:', error.message);
  }

  // Also test if we can use other search alternatives
  console.log('\n\n🔍 Checking alternative search options...\n');

  // Check NewsAPI
  const NEWS_API_KEY = process.env.NEWS_API_KEY || process.env.NEWSAPI_KEY;
  console.log('NewsAPI Key present:', !!NEWS_API_KEY);

  if (NEWS_API_KEY) {
    try {
      const newsResponse = await fetch(
        `https://newsapi.org/v2/everything?q=Anthropic+Claude+AI&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`
      );

      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        console.log(`✅ NewsAPI working: Found ${newsData.totalResults} total results`);
      } else {
        console.log('❌ NewsAPI error:', newsResponse.statusText);
      }
    } catch (e) {
      console.log('❌ NewsAPI failed:', e.message);
    }
  }

  // Check if we should use Perplexity API instead
  const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY;
  console.log('Perplexity API Key present:', !!PERPLEXITY_KEY);

  if (PERPLEXITY_KEY) {
    console.log('\n🔍 Testing Perplexity API...');
    try {
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-small-online',
          messages: [
            {
              role: 'user',
              content: `Search for: ${testQuery}. Return the top 5 most relevant articles with titles, URLs, and brief descriptions.`
            }
          ]
        })
      });

      if (perplexityResponse.ok) {
        const perplexityData = await perplexityResponse.json();
        console.log('✅ Perplexity API working');
        console.log('Response preview:', perplexityData.choices?.[0]?.message?.content?.substring(0, 200));
      } else {
        console.log('❌ Perplexity error:', perplexityResponse.statusText);
      }
    } catch (e) {
      console.log('❌ Perplexity failed:', e.message);
    }
  }
}

testDirectFirecrawl();