const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkSchema() {
  // First, check if we have any opportunities
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('*')
    .limit(3);

  if (error) {
    console.error('Error fetching opportunities:', error);
    return;
  }

  if (opportunities && opportunities.length > 0) {
    console.log('\n=== Checking ALL Opportunities for Creative Fields ===\n');

    let anyHaveCreative = false;

    opportunities.forEach((opp, index) => {
      console.log(`\n--- Opportunity ${index + 1}: ${opp.title.substring(0, 50)}...`);

      // Check all possible locations for creative fields
      const locations = [
        { path: 'campaign_name', value: opp.campaign_name },
        { path: 'creative_approach', value: opp.creative_approach },
        { path: 'data.campaign_name', value: opp.data?.campaign_name },
        { path: 'data.creative_approach', value: opp.data?.creative_approach },
        { path: 'data.playbook.campaign_name', value: opp.data?.playbook?.campaign_name },
        { path: 'data.playbook.creative_approach', value: opp.data?.playbook?.creative_approach }
      ];

      let foundInThisOpp = false;
      locations.forEach(loc => {
        if (loc.value && loc.value !== 'NOT FOUND') {
          console.log(`  ✅ Found at ${loc.path}: "${loc.value}"`);
          foundInThisOpp = true;
          anyHaveCreative = true;
        }
      });

      if (!foundInThisOpp) {
        console.log('  ❌ No creative fields found in any location');

        // Show what fields DO exist in data
        if (opp.data) {
          console.log('  Available data fields:', Object.keys(opp.data).join(', '));
          if (opp.data.playbook) {
            console.log('  Available playbook fields:', Object.keys(opp.data.playbook).join(', '));
          }
        }
      }
    });

    console.log('\n' + '='.repeat(60));
    if (anyHaveCreative) {
      console.log('✅ SOME opportunities have creative fields stored!');
    } else {
      console.log('❌ NO opportunities have creative fields in the database!');
      console.log('\nThis means either:');
      console.log('1. The orchestrator-v2 update is failing');
      console.log('2. The fields are being stored somewhere else');
      console.log('3. The opportunities were created before creative enhancement was added');
    }

    // Show the first opportunity's full data structure for debugging
    console.log('\n=== Full Structure of First Opportunity ===');
    console.log(JSON.stringify(opportunities[0], null, 2));

  } else {
    console.log('No opportunities found in database');
  }
}

checkSchema();