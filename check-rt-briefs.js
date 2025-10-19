const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkBriefs() {
  console.log('🔍 Checking real_time_intelligence_briefs...\n');

  const { data, error, count } = await supabase
    .from('real_time_intelligence_briefs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Found ${count} briefs\n`);

  if (data && data.length > 0) {
    console.log('📊 Latest briefs:');
    data.forEach((brief, i) => {
      console.log(`\n[${i + 1}] ${brief.organization_name || 'N/A'}`);
      console.log(`    Created: ${brief.created_at}`);
      console.log(`    Articles: ${brief.articles_analyzed || 0}`);
      console.log(`    Has events: ${brief.events ? 'yes' : 'no'}`);
      console.log(`    Has entities: ${brief.entities ? 'yes' : 'no'}`);
      if (brief.events && Array.isArray(brief.events)) {
        console.log(`    Events count: ${brief.events.length}`);
        if (brief.events.length > 0) {
          console.log(`    Sample event: ${JSON.stringify(brief.events[0]).substring(0, 100)}...`);
        }
      }
    });
  } else {
    console.log('\n⚠️  No briefs found - run the real-time monitor first');
  }
}

checkBriefs().catch(console.error);
