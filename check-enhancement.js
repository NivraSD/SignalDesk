const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEnhancement() {
  const { data, error } = await supabase
    .from('opportunities')
    .select('title, data')
    .eq('organization_id', 'OpenAI')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data[0]) {
    const opp = data[0];
    console.log('Opportunity:', opp.title);
    console.log('\nData fields present:');
    const fields = Object.keys(opp.data || {});
    fields.forEach(f => console.log('  -', f));

    // Check for orchestrator-v2 enhancement fields
    console.log('\nEnhancement check:');
    console.log('  Has playbook:', Boolean(opp.data.playbook));
    console.log('  Has action_items:', Boolean(opp.data.action_items));
    console.log('  Has success_metrics:', Boolean(opp.data.success_metrics));
    console.log('  Has creative_approach:', Boolean(opp.data.creative_approach));
    console.log('  Has campaign_name:', Boolean(opp.data.campaign_name));
  } else {
    console.log('No OpenAI opportunities found');
  }
}

checkEnhancement().catch(console.error);
