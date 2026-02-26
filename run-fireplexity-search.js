const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.gJ5X9LQqR3oGxRv4NCA7l-gDL3EQlFqG0OWU-oYRJE0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

// Use service role for storing results
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFireplexitySearches() {
  console.log('🔍 Running Fireplexity searches for OpenAI topics...\n');

  // Define search queries based on OpenAI discovery profile
  const searchQueries = [
    // Core OpenAI searches
    { query: 'OpenAI latest news GPT-5 development', module: 'intelligence' },
    { query: 'ChatGPT enterprise adoption competitors', module: 'opportunities' },
    { query: 'Sam Altman OpenAI announcements', module: 'intelligence' },

    // Competitor searches
    { query: 'Anthropic Claude vs ChatGPT comparison', module: 'intelligence' },
    { query: 'Google DeepMind Gemini AI competition', module: 'intelligence' },
    { query: 'Microsoft AI Copilot OpenAI partnership', module: 'opportunities' },

    // Regulatory and safety
    { query: 'AI regulation FTC investigation OpenAI', module: 'intelligence' },
    { query: 'AI safety alignment OpenAI research', module: 'intelligence' },
    { query: 'EU AI Act foundation models GPT', module: 'intelligence' },

    // Market and opportunities
    { query: 'generative AI market growth 2025', module: 'opportunities' },
    { query: 'OpenAI valuation funding rounds', module: 'opportunities' },
    { query: 'AI agents autonomous systems trends', module: 'opportunities' }
  ];

  console.log(`📋 Will search for ${searchQueries.length} topics\n`);

  for (const searchConfig of searchQueries) {
    console.log(`\n🔎 Searching: "${searchConfig.query}"`);
    console.log(`   Module: ${searchConfig.module}`);

    try {
      // Call the Fireplexity edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/niv-fireplexity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          query: searchConfig.query,
          module: searchConfig.module,
          useCache: false, // Force fresh search
          context: {
            organization: 'OpenAI'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Search failed: ${response.status} - ${errorText}`);
        continue;
      }

      const result = await response.json();
      console.log(`   ✅ Search completed!`);
      console.log(`   Strategy used: ${result.strategy}`);

      // Store the search results in fireplexity_searches table
      const { error: storeError } = await supabase
        .from('fireplexity_searches')
        .insert({
          organization_id: 'OpenAI',
          query: searchConfig.query,
          results: result,
          strategy: result.strategy || 'unknown',
          cached: false
        });

      if (storeError) {
        console.log(`   ⚠️ Failed to store results: ${storeError.message}`);
      } else {
        console.log(`   💾 Results stored in database`);
      }

      // Log summary of results
      if (result.summary) {
        console.log(`   📝 Summary: ${result.summary.substring(0, 150)}...`);
      } else if (result.sources?.length > 0) {
        console.log(`   📄 Found ${result.sources.length} sources`);
      } else if (result.articles?.length > 0) {
        console.log(`   📰 Found ${result.articles.length} articles`);
      } else if (result.opportunities?.length > 0) {
        console.log(`   💡 Found ${result.opportunities.length} opportunities`);
      }

      // Small delay between searches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Verify stored results
  console.log('\n\n📊 Verifying stored search results...');
  const { data: searches, error: fetchError } = await supabase
    .from('fireplexity_searches')
    .select('*')
    .eq('organization_id', 'OpenAI')
    .order('created_at', { ascending: false })
    .limit(5);

  if (fetchError) {
    console.log('❌ Failed to fetch stored searches:', fetchError);
  } else {
    console.log(`✅ Found ${searches.length} recent searches in database`);
    searches.forEach(search => {
      console.log(`   - "${search.query.substring(0, 50)}..." (${search.strategy})`);
    });
  }

  console.log('\n\n🎉 Fireplexity search complete!');
  console.log('Now NIV can access these real search results when you ask questions about:');
  console.log('  - OpenAI and GPT-5 development');
  console.log('  - Competition with Anthropic, Google, etc.');
  console.log('  - AI regulation and safety');
  console.log('  - Market opportunities');
}

runFireplexitySearches();