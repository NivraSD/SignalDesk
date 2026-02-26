const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

async function clearOpportunitiesByOrg(orgName) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // If no org specified, show all unique org IDs
  if (!orgName) {
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('organization_id');

    const uniqueOrgs = [...new Set(opportunities?.map(o => o.organization_id) || [])];
    console.log('📊 Organizations with opportunities:');
    uniqueOrgs.forEach(org => console.log(`  - ${org}`));
    console.log('\nUsage: node clear-opportunities-by-org.js <org_name>');
    console.log('Example: node clear-opportunities-by-org.js Tesla');
    return;
  }

  console.log(`🗑️ Clearing opportunities for organization: ${orgName}`);

  const { data: deleted, error } = await supabase
    .from('opportunities')
    .delete()
    .eq('organization_id', orgName)
    .select();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Deleted ${deleted?.length || 0} opportunities for ${orgName}`);
  }

  // Show remaining opportunities count
  const { data: remaining } = await supabase
    .from('opportunities')
    .select('id');

  console.log(`📊 Total remaining opportunities: ${remaining?.length || 0}`);
}

// Get org name from command line
const orgName = process.argv[2];
clearOpportunitiesByOrg(orgName).catch(console.error);