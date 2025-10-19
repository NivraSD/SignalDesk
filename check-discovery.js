const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkDiscoveryResults() {
  // Check various table names for discovery/profile data
  const tables = [
    'mcp_discovery',
    'discovery',
    'discovery_results',
    'organization_profiles',
    'profiles',
    'organizations',
    'company_profiles'
  ];

  console.log('Checking for MCP Discovery results for OpenAI:');
  console.log('=====================================');

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .or('organization_name.ilike.%OpenAI%,organization_id.eq.OpenAI,name.ilike.%OpenAI%')
        .limit(1);

      if (!error && data && data.length > 0) {
        console.log('✅ Found OpenAI data in table: ' + table);
        console.log('  Fields: ' + Object.keys(data[0]).join(', '));

        // Show key discovery fields if they exist
        const profile = data[0];
        if (profile.competitors || profile.competition) {
          console.log('\n📊 Competition Data:');
          const comp = profile.competitors || profile.competition;
          if (comp.direct_competitors) console.log('  Direct: ' + comp.direct_competitors.slice(0, 3).join(', '));
          if (comp.indirect_competitors) console.log('  Indirect: ' + comp.indirect_competitors.slice(0, 3).join(', '));
        }

        if (profile.keywords) {
          console.log('\n🔑 Keywords:');
          console.log('  ' + (Array.isArray(profile.keywords) ? profile.keywords : Object.keys(profile.keywords)).slice(0, 5).join(', '));
        }

        if (profile.stakeholders) {
          console.log('\n👥 Stakeholders:');
          const stake = profile.stakeholders;
          if (stake.regulators) console.log('  Regulators: ' + stake.regulators.slice(0, 3).join(', '));
          if (stake.executives) console.log('  Executives: ' + stake.executives.slice(0, 3).join(', '));
        }

        if (profile.monitoring_config) {
          console.log('\n📡 Monitoring Config:');
          if (profile.monitoring_config.keywords) {
            console.log('  Keywords: ' + profile.monitoring_config.keywords.slice(0, 5).join(', '));
          }
        }

        // Show full profile for debugging
        console.log('\n📄 Full Profile (truncated):');
        console.log(JSON.stringify(profile, null, 2).substring(0, 2000));

        return profile;
      }
    } catch (e) {
      // Table doesn't exist, continue
    }
  }

  console.log('\n❌ No MCP Discovery results found for OpenAI');
  console.log('   Will need to run discovery first or use default search terms');
}

checkDiscoveryResults();