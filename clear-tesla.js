const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearTeslaAndCheckAll() {
  // Get all opportunities
  const { data: all, error } = await supabase
    .from('opportunities')
    .select('organization_id, title')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.log('Error:', error);
    return;
  }
  
  console.log('Total opportunities:', all.length);
  
  // Group by organization_id
  const byOrg = {};
  all.forEach(opp => {
    const orgId = opp.organization_id || 'null';
    if (!byOrg[orgId]) byOrg[orgId] = [];
    byOrg[orgId].push(opp.title);
  });
  
  console.log('\nOpportunities by organization_id:');
  Object.entries(byOrg).forEach(([id, titles]) => {
    console.log(`  ${id}: ${titles.length} opportunities`);
    console.log(`    Sample: ${titles[0]}`);
  });
  
  // Clear Tesla opportunities
  console.log('\nClearing Tesla opportunities...');
  const { error: deleteError, count } = await supabase
    .from('opportunities')
    .delete()
    .eq('organization_id', 'Tesla')
    .select('count');
    
  if (deleteError) {
    console.log('Error deleting:', deleteError);
  } else {
    console.log('Deleted Tesla opportunities');
  }
  
  // Check what's left
  const { data: remaining } = await supabase
    .from('opportunities')
    .select('organization_id, title')
    .limit(5);
    
  console.log('\nRemaining opportunities:');
  remaining?.forEach(opp => {
    console.log(`  [${opp.organization_id}] ${opp.title}`);
  });
}

clearTeslaAndCheckAll();
