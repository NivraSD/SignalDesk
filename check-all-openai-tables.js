const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function findOpenAIData() {
  console.log('🔍 Searching for OpenAI data across all tables...\n');

  // List of potential tables
  const tables = [
    'mcp_discovery',
    'discovery',
    'discovery_results',
    'organization_profiles',
    'profiles',
    'organizations',
    'company_profiles',
    'intelligence',
    'opportunities'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .or('organization_name.ilike.%OpenAI%,organization_id.ilike.%OpenAI%,organization.ilike.%OpenAI%,name.ilike.%OpenAI%,company.ilike.%OpenAI%')
        .limit(1);

      if (!error && data && data.length > 0) {
        console.log(`✅ Found OpenAI data in table: ${table}`);
        console.log('Sample record fields:', Object.keys(data[0]).join(', '));

        // Show relevant fields
        const record = data[0];
        if (record.organization_name) console.log(`  Organization: ${record.organization_name}`);
        if (record.competition) console.log(`  Has competition data: Yes`);
        if (record.competitors) console.log(`  Has competitors data: Yes`);
        if (record.keywords) console.log(`  Has keywords: Yes`);
        if (record.stakeholders) console.log(`  Has stakeholders: Yes`);
        console.log('');
      }
    } catch (e) {
      // Table doesn't exist, skip
    }
  }

  // Also check if we have any saved searches
  try {
    const { data: searches } = await supabase
      .from('fireplexity_searches')
      .select('id, query, created_at')
      .or('query.ilike.%OpenAI%')
      .limit(5);

    if (searches && searches.length > 0) {
      console.log('📚 Found existing Fireplexity searches for OpenAI:');
      searches.forEach(s => {
        console.log(`  - "${s.query}" (${new Date(s.created_at).toLocaleDateString()})`);
      });
    }
  } catch (e) {
    // No searches table
  }
}

findOpenAIData();