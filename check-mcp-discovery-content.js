const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkMcpDiscoveryContent() {
  console.log('🔍 Checking mcp_discovery table contents...\n');

  // First, check if table exists and what's in it
  const { data, error } = await supabase
    .from('mcp_discovery')
    .select('*')
    .limit(5);

  if (error) {
    console.log('❌ Error accessing mcp_discovery:', error.message);
    return;
  }

  console.log(`📊 Found ${data?.length || 0} records in mcp_discovery table\n`);

  if (data && data.length > 0) {
    // Show first record structure
    console.log('📋 Sample record fields:', Object.keys(data[0]).join(', '));
    console.log('\n');

    // Show each organization's key data
    data.forEach((record, i) => {
      console.log(`${i + 1}. Organization: ${record.organization_name || record.organization_id || 'Unknown'}`);

      // Show competition data
      if (record.competition) {
        console.log('   Competition:');
        if (record.competition.direct_competitors) {
          console.log(`     - Direct: ${record.competition.direct_competitors.slice(0, 3).join(', ')}...`);
        }
        if (record.competition.indirect_competitors) {
          console.log(`     - Indirect: ${record.competition.indirect_competitors.slice(0, 3).join(', ')}...`);
        }
      }

      // Show keywords
      if (record.keywords) {
        console.log(`   Keywords: ${(Array.isArray(record.keywords) ? record.keywords : Object.values(record.keywords)).slice(0, 5).join(', ')}...`);
      }

      // Show monitoring config
      if (record.monitoring_config) {
        console.log('   Monitoring Config:');
        if (record.monitoring_config.keywords) {
          console.log(`     - Keywords: ${record.monitoring_config.keywords.slice(0, 3).join(', ')}...`);
        }
        if (record.monitoring_config.topics) {
          console.log(`     - Topics: ${record.monitoring_config.topics.slice(0, 3).join(', ')}...`);
        }
      }

      // Show intelligence context
      if (record.intelligence_context) {
        console.log('   Intelligence Context:');
        if (record.intelligence_context.monitoring_prompt) {
          console.log(`     - Prompt: "${record.intelligence_context.monitoring_prompt.substring(0, 100)}..."`);
        }
        if (record.intelligence_context.topics) {
          console.log(`     - Topics: ${record.intelligence_context.topics.join(', ')}`);
        }
      }

      console.log('');
    });

    // Check specifically for OpenAI
    console.log('🔍 Searching for OpenAI profile...');
    const { data: openaiData } = await supabase
      .from('mcp_discovery')
      .select('*')
      .or('organization_name.ilike.%OpenAI%,organization_id.ilike.%OpenAI%')
      .single();

    if (openaiData) {
      console.log('✅ Found OpenAI profile!');
      console.log('\n📄 OpenAI Discovery Profile:');
      console.log(JSON.stringify(openaiData, null, 2).substring(0, 2000));
    } else {
      console.log('❌ No OpenAI profile found in mcp_discovery');
    }
  }

  // Also check what Fireplexity searches exist
  console.log('\n📚 Recent Fireplexity searches:');
  const { data: searches } = await supabase
    .from('fireplexity_searches')
    .select('id, query, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (searches) {
    searches.forEach(s => {
      const date = new Date(s.created_at);
      console.log(`  - "${s.query.substring(0, 60)}..." (${date.toLocaleDateString()} ${date.toLocaleTimeString()})`);
    });
  }
}

checkMcpDiscoveryContent();