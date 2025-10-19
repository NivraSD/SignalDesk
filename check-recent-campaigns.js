const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkRecentCampaigns() {
  console.log('🔍 Checking for recent phase-campaign generations...\n');

  // Get the most recent campaign folders
  const { data: recent, error } = await supabase
    .from('content_library')
    .select('folder, content_type, title, created_at, metadata')
    .like('folder', 'campaigns/%')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!recent || recent.length === 0) {
    console.log('⚠️  No campaign folders found yet');
    console.log('\n📝 To test the phase-campaign architecture:');
    console.log('   1. Go to Campaign Builder UI');
    console.log('   2. Create a new VECTOR campaign');
    console.log('   3. Complete research → positioning → blueprint');
    console.log('   4. Click "Execute Campaign"');
    console.log('   5. Run this script again to see results!');
    return;
  }

  // Group by campaign folder
  const campaigns = {};
  recent.forEach(item => {
    if (!item.folder) return;

    const campaignFolder = item.folder.split('/').slice(0, 2).join('/');
    if (!campaigns[campaignFolder]) {
      campaigns[campaignFolder] = {
        phases: {},
        rootItems: [],
        mostRecent: item.created_at
      };
    }

    campaigns[campaignFolder].mostRecent = item.created_at;

    const phaseMatch = item.folder.match(/phase-(\d+)-(\w+)/);
    if (phaseMatch) {
      const phaseKey = `phase-${phaseMatch[1]}-${phaseMatch[2]}`;
      if (!campaigns[campaignFolder].phases[phaseKey]) {
        campaigns[campaignFolder].phases[phaseKey] = [];
      }
      campaigns[campaignFolder].phases[phaseKey].push(item);
    } else {
      campaigns[campaignFolder].rootItems.push(item);
    }
  });

  // Sort campaigns by most recent
  const sortedCampaigns = Object.entries(campaigns)
    .sort((a, b) => new Date(b[1].mostRecent) - new Date(a[1].mostRecent));

  console.log(`✅ Found ${sortedCampaigns.length} campaigns with phase-based organization\n`);
  console.log('=' .repeat(80) + '\n');

  // Show top 3 most recent campaigns
  sortedCampaigns.slice(0, 3).forEach(([folder, data], idx) => {
    const phaseCount = Object.keys(data.phases).length;
    const totalItems = data.rootItems.length + Object.values(data.phases).flat().length;

    console.log(`📁 Campaign ${idx + 1}: ${folder}`);
    console.log(`   🕒 Created: ${new Date(data.mostRecent).toLocaleString()}`);
    console.log(`   📊 ${phaseCount} phases, ${totalItems} total items\n`);

    // Show root items (blueprint, research)
    if (data.rootItems.length > 0) {
      console.log('   📄 Root Documents:');
      data.rootItems.forEach(item => {
        console.log(`      • ${item.content_type}: ${item.title}`);
      });
      console.log();
    }

    // Show phases with content
    if (phaseCount > 0) {
      console.log('   📂 Phase Structure:');
      Object.entries(data.phases)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([phase, items]) => {
          console.log(`\n      Phase: ${phase} (${items.length} items)`);

          // Group by content type
          const byType = items.reduce((acc, item) => {
            if (!acc[item.content_type]) acc[item.content_type] = [];
            acc[item.content_type].push(item);
            return acc;
          }, {});

          Object.entries(byType).forEach(([type, typeItems]) => {
            console.log(`         ${type}: ${typeItems.length}`);
            typeItems.slice(0, 2).forEach(item => {
              const stakeholder = item.metadata?.stakeholder || 'general';
              console.log(`            - ${stakeholder}`);
            });
            if (typeItems.length > 2) {
              console.log(`            ... +${typeItems.length - 2} more`);
            }
          });
        });
    }

    console.log('\n' + '=' .repeat(80) + '\n');
  });

  // Summary
  const totalPhases = sortedCampaigns.reduce((sum, [, data]) =>
    sum + Object.keys(data.phases).length, 0
  );
  const totalContent = sortedCampaigns.reduce((sum, [, data]) =>
    sum + data.rootItems.length + Object.values(data.phases).flat().length, 0
  );

  console.log('📊 SUMMARY');
  console.log(`   Total campaigns: ${sortedCampaigns.length}`);
  console.log(`   Total phases: ${totalPhases}`);
  console.log(`   Total content pieces: ${totalContent}`);
  console.log(`   Average per campaign: ${(totalContent / sortedCampaigns.length).toFixed(1)} pieces`);

  // Check if architecture is being used
  const hasPhases = totalPhases > 0;
  if (hasPhases) {
    console.log('\n✅ Phase-campaign architecture is WORKING!');
    console.log('   Content is being organized by phases with folder hierarchy.');
  } else {
    console.log('\n⚠️  No phase folders detected yet');
    console.log('   Generate a new VECTOR campaign to test the phase-campaign architecture.');
  }
}

checkRecentCampaigns().catch(console.error);
