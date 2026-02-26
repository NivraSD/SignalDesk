const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkRegistry() {
  console.log('=== SOURCE REGISTRY ===\n');

  const { data: sources } = await supabase
    .from('source_registry')
    .select('id, source_name, source_url, monitor_method, monitor_config, active, tier, last_successful_scrape, consecutive_failures')
    .or('source_name.ilike.%Bloomberg%,source_name.ilike.%WSJ%,source_name.ilike.%Wall Street%,source_name.ilike.%Financial Times%,source_name.ilike.%FT %,source_name.ilike.%Reuters%');

  if (sources && sources.length > 0) {
    sources.forEach(s => {
      console.log(s.source_name);
      console.log('  Active:', s.active);
      console.log('  Tier:', s.tier);
      console.log('  Method:', s.monitor_method);
      console.log('  URL:', s.source_url);
      console.log('  RSS Config:', JSON.stringify(s.monitor_config));
      console.log('  Last success:', s.last_successful_scrape);
      console.log('  Failures:', s.consecutive_failures);
      console.log();
    });
  } else {
    console.log('No premium sources found in source_registry!');

    // List all sources
    const { data: allSources } = await supabase
      .from('source_registry')
      .select('source_name, active, monitor_method')
      .order('source_name');

    console.log('\nAll registered sources:');
    allSources?.forEach(s => console.log('  ' + (s.active ? '✓' : '✗') + ' ' + s.source_name + ' (' + s.monitor_method + ')'));
  }
}
checkRegistry();
