const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndClearOpportunities() {
  // First, check what organizations we have
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('organization_id, organization_name, title')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.log('Error fetching opportunities:', error);
    return;
  }
  
  console.log('Current opportunities by organization:');
  const byOrg = {};
  opportunities.forEach(opp => {
    const key = opp.organization_id || 'null';
    if (!byOrg[key]) byOrg[key] = { name: opp.organization_name, count: 0, titles: [] };
    byOrg[key].count++;
    byOrg[key].titles.push(opp.title);
  });
  
  Object.entries(byOrg).forEach(([id, info]) => {
    console.log(`  Organization ID: ${id}, Name: ${info.name}, Count: ${info.count}`);
    console.log(`    Sample titles: ${info.titles.slice(0, 3).join(', ')}`);
  });
  
  // Clear Tesla opportunities
  const teslaOrgs = opportunities.filter(o => 
    o.organization_name && o.organization_name.toLowerCase().includes('tesla')
  );
  
  if (teslaOrgs.length > 0) {
    const teslaOrgIds = [...new Set(teslaOrgs.map(o => o.organization_id))];
    console.log(`\nClearing ${teslaOrgs.length} Tesla opportunities with org IDs: ${teslaOrgIds.join(', ')}`);
    
    for (const orgId of teslaOrgIds) {
      const { error: deleteError } = await supabase
        .from('opportunities')
        .delete()
        .eq('organization_id', orgId);
        
      if (deleteError) {
        console.log(`Error deleting Tesla opportunities for org ${orgId}:`, deleteError);
      } else {
        console.log(`Cleared opportunities for organization_id: ${orgId}`);
      }
    }
  } else {
    console.log('\nNo Tesla opportunities found to clear');
  }
  
  // Verify remaining
  const { data: remaining, error: remainError } = await supabase
    .from('opportunities')
    .select('organization_name')
    .limit(10);
    
  if (remaining) {
    console.log(`\nRemaining opportunities: ${remaining.length}`);
    const orgs = [...new Set(remaining.map(r => r.organization_name))];
    console.log(`Organizations: ${orgs.join(', ')}`);
  }
}

checkAndClearOpportunities();
