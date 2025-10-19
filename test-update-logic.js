const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function testUpdateLogic() {
  // Get an existing opportunity
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('*')
    .limit(1);

  if (error || !opportunities || opportunities.length === 0) {
    console.log('No opportunities found to test');
    return;
  }

  const opp = opportunities[0];
  console.log('\n🎯 Testing update logic with opportunity:');
  console.log('  ID:', opp.id);
  console.log('  Title:', opp.title);
  console.log('  Organization ID:', opp.organization_id);

  // Test the matching logic that intelligence-orchestrator-v2 uses
  console.log('\n🔍 Testing matching logic:');

  const { data: existing } = await supabase
    .from('opportunities')
    .select('id, data')
    .eq('organization_id', opp.organization_id)
    .eq('title', opp.title)
    .single();

  if (existing) {
    console.log('✅ Found opportunity using title + org_id match');
    console.log('  Matched ID:', existing.id);

    // Now try to update it with creative fields
    console.log('\n📝 Testing update with creative fields:');

    const updatedData = {
      ...existing.data,
      campaign_name: 'Test Campaign Name',
      creative_approach: 'Test creative approach for validation',
      playbook: {
        ...existing.data?.playbook,
        campaign_name: 'Test Campaign Name',
        creative_approach: 'Test creative approach for validation'
      }
    };

    const { error: updateError } = await supabase
      .from('opportunities')
      .update({ data: updatedData })
      .eq('id', existing.id);

    if (updateError) {
      console.log('❌ Update failed:', updateError);
    } else {
      console.log('✅ Update successful!');

      // Verify the update
      const { data: updated } = await supabase
        .from('opportunities')
        .select('data')
        .eq('id', existing.id)
        .single();

      if (updated?.data?.campaign_name === 'Test Campaign Name') {
        console.log('✅ Creative fields saved successfully in data column!');
        console.log('  Campaign name:', updated.data.campaign_name);
        console.log('  Creative approach:', updated.data.creative_approach?.substring(0, 50) + '...');
      } else {
        console.log('❌ Creative fields not found after update');
      }
    }
  } else {
    console.log('❌ Could not find opportunity using title + org_id match');
    console.log('   This is why the update is failing!');
  }
}

testUpdateLogic();