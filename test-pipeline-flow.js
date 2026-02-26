const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testPipelineFlow() {
  console.log('Testing pipeline flow...\n');
  
  // 1. First check what's in the database
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('organization_id, title, created_at')
    .eq('organization_id', 'OpenAI')
    .order('created_at', { ascending: false })
    .limit(3);
    
  console.log(`Found ${opportunities?.length || 0} OpenAI opportunities in DB`);
  if (opportunities?.length > 0) {
    console.log('Latest:', opportunities[0].title);
  }
  
  // 2. Call intelligence-orchestrator-v2 directly
  console.log('\n📞 Calling intelligence-orchestrator-v2...');
  
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/intelligence-orchestrator-v2`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        organization_name: 'OpenAI',
        search_query: 'OpenAI',
        skip_monitoring: false,
        skip_enrichment: false,
        skip_synthesis: false,
        skip_opportunities: false
      })
    }
  );
  
  if (!response.ok) {
    console.error('❌ Failed:', response.status, await response.text());
    return;
  }
  
  const result = await response.json();
  console.log('✅ Response received');
  console.log('Keys:', Object.keys(result));
  
  if (result.opportunities) {
    console.log(`\n🎯 Opportunities: ${result.opportunities.length}`);
    result.opportunities.slice(0, 2).forEach(opp => {
      console.log(`  - ${opp.title}`);
    });
  }
  
  if (result.orchestrator_v2) {
    console.log(`\n🎨 Orchestrator V2 enhanced: ${result.orchestrator_v2.enhanced_opportunities?.length || 0} opportunities`);
  }
  
  // 3. Check if new opportunities were saved
  const { data: newOpps } = await supabase
    .from('opportunities')
    .select('organization_id, title, created_at')
    .eq('organization_id', 'OpenAI')
    .order('created_at', { ascending: false })
    .limit(3);
    
  console.log(`\n📊 After pipeline: ${newOpps?.length || 0} OpenAI opportunities in DB`);
  if (newOpps?.length > 0) {
    console.log('Latest:', newOpps[0].title);
  }
}

testPipelineFlow().catch(console.error);
