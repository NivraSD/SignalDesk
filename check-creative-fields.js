const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkCreativeFields() {
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, title, data')
    .limit(10)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== Checking Creative Fields in Database ===\n');

  if (!data || data.length === 0) {
    console.log('No opportunities found in database');
    return;
  }

  data.forEach((opp, index) => {
    console.log(`\nOpportunity ${index + 1}:`);
    console.log(`  Title: ${opp.title}`);

    // Check top-level fields (shouldn't exist but check anyway)
    const hasTopLevelCampaign = false; // opp.campaign_name;
    const hasTopLevelApproach = false; // opp.creative_approach;

    // Check data.* fields
    const hasDataCampaign = opp.data?.campaign_name;
    const hasDataApproach = opp.data?.creative_approach;

    if (hasTopLevelCampaign || hasTopLevelApproach || hasDataCampaign || hasDataApproach) {
      console.log('  ✅ HAS CREATIVE FIELDS:');
      if (hasTopLevelCampaign) {
        console.log(`    📢 Campaign (top-level): ${opp.campaign_name}`);
      }
      if (hasTopLevelApproach) {
        console.log(`    🎨 Approach (top-level): ${opp.creative_approach}`);
      }
      if (hasDataCampaign) {
        console.log(`    📢 Campaign (data.*): ${opp.data.campaign_name}`);
      }
      if (hasDataApproach) {
        console.log(`    🎨 Approach (data.*): ${opp.data.creative_approach}`);
      }
    } else {
      console.log('  ❌ NO CREATIVE FIELDS FOUND');
      // Check if there's a playbook with campaign info
      if (opp.data?.playbook?.campaign_name) {
        console.log(`    💡 Found in playbook: ${opp.data.playbook.campaign_name}`);
      }
    }
  });

  // Summary
  const withCreative = data.filter(o =>
    o.data?.campaign_name ||
    o.data?.creative_approach
  ).length;

  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${data.length}, With Creative: ${withCreative}, Missing: ${data.length - withCreative}`);

  if (withCreative === 0) {
    console.log('\n⚠️  WARNING: No opportunities in DB have creative fields!');
    console.log('This means the update from orchestrator-v2 is not working.');
  } else if (withCreative < data.length) {
    console.log('\n⚠️  Some opportunities are missing creative fields.');
  } else {
    console.log('\n✅ All opportunities have creative fields!');
  }
}

checkCreativeFields();