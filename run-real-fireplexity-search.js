const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runRealFireplexitySearches() {
  console.log('🔍 Running REAL Fireplexity searches using our edge function...\n');

  // First, get the OpenAI discovery profile for keywords
  const { data: discovery, error: discoveryError } = await supabase
    .from('mcp_discovery')
    .select('*')
    .eq('organization_id', 'OpenAI')
    .single();

  if (discoveryError || !discovery) {
    console.error('Failed to get OpenAI discovery profile:', discoveryError);
    return;
  }

  console.log('✅ Found OpenAI discovery profile');
  console.log('   Keywords:', discovery.keywords.slice(0, 5).join(', '));
  console.log('   Competitors:', discovery.competition.direct_competitors.slice(0, 3).join(', '));

  // Create search queries based on discovery profile
  const searchQueries = [
    // Primary OpenAI search
    `OpenAI ${discovery.keywords[0]} latest news`,

    // Competitor comparison
    `${discovery.competition.direct_competitors[0]} vs ChatGPT competition`,

    // Key technology search
    `${discovery.keywords[1]} ${discovery.keywords[2]} developments`,

    // Regulatory search
    `AI regulation ${discovery.stakeholders.regulators[0]} OpenAI`,

    // Executive news
    `${discovery.stakeholders.executives[0]} OpenAI announcements`
  ];

  console.log('\n📋 Will search for:');
  searchQueries.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));

  for (const query of searchQueries) {
    console.log(`\n🔎 Searching: "${query}"`);

    try {
      // Call our Fireplexity edge function with service role key
      const response = await fetch(`${supabaseUrl}/functions/v1/niv-fireplexity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          query: query,
          module: 'intelligence',
          useCache: false // Force fresh search
        })
      });

      const responseText = await response.text();
      console.log('   Response status:', response.status);

      if (!response.ok) {
        console.log(`   ❌ Search failed: ${responseText}`);
        continue;
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.log('   ❌ Failed to parse response:', responseText);
        continue;
      }

      console.log(`   ✅ Search completed!`);
      console.log(`   Strategy: ${result.strategy}`);

      // Check what we got
      if (result.sources) {
        console.log(`   📄 Sources found: ${result.sources.length}`);
      }
      if (result.articles) {
        console.log(`   📰 Articles found: ${result.articles.length}`);
      }
      if (result.data) {
        console.log(`   📊 Data found:`, Object.keys(result.data));
      }

      // Store the search results in our table
      const { error: storeError } = await supabase
        .from('fireplexity_searches')
        .insert({
          organization_id: 'OpenAI',
          query: query,
          results: result,
          strategy: result.strategy || 'web_search',
          cached: result.cached || false
        });

      if (storeError) {
        console.log(`   ⚠️ Failed to store results:`, storeError.message);
      } else {
        console.log(`   💾 Results stored successfully!`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`   ❌ Error:`, error.message);
    }
  }

  // Verify what's stored
  console.log('\n\n📊 Checking stored search results...');
  const { data: searches, error: fetchError } = await supabase
    .from('fireplexity_searches')
    .select('query, strategy, created_at')
    .eq('organization_id', 'OpenAI')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!fetchError && searches) {
    console.log(`✅ Total searches stored: ${searches.length}`);
    searches.forEach(s => {
      console.log(`   - "${s.query.substring(0, 50)}..." (${s.strategy})`);
    });
  }

  console.log('\n✅ Complete! NIV can now query these stored search results.');
}

runRealFireplexitySearches();