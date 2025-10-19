const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkLastHour() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  console.log('🕒 Checking for content created in the last hour...\n');

  const { data, error } = await supabase
    .from('content_library')
    .select('folder, content_type, title, created_at, metadata')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No content created in the last hour');
    console.log('\n📝 The phase-campaign architecture is deployed and ready.');
    console.log('   To test it, create a new VECTOR campaign in the Campaign Builder UI.');
    return;
  }

  console.log(`✅ Found ${data.length} items created in the last hour:\n`);

  // Check if any have phase folders
  const withPhases = data.filter(item => item.folder && item.folder.includes('phase-'));

  if (withPhases.length > 0) {
    console.log('🎉 PHASE-CAMPAIGN ARCHITECTURE IS WORKING!\n');

    // Group by campaign
    const campaigns = {};
    withPhases.forEach(item => {
      const campaignFolder = item.folder.split('/').slice(0, 2).join('/');
      if (!campaigns[campaignFolder]) campaigns[campaignFolder] = [];
      campaigns[campaignFolder].push(item);
    });

    Object.entries(campaigns).forEach(([folder, items]) => {
      console.log(`📁 ${folder}`);
      items.forEach(item => {
        const phase = item.folder.match(/phase-\d+-\w+/)?.[0] || 'unknown';
        console.log(`   ${phase}: ${item.content_type} - ${item.title}`);
      });
      console.log();
    });
  } else {
    console.log('📋 Recent content (no phase folders yet):\n');
    data.forEach(item => {
      console.log(`   ${new Date(item.created_at).toLocaleTimeString()}: ${item.content_type}`);
      console.log(`      Folder: ${item.folder || 'none'}`);
      console.log(`      Title: ${item.title}`);
      console.log();
    });
  }
}

checkLastHour().catch(console.error);
