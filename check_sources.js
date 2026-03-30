const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function getSources() {
  const { data, error } = await supabase
    .from('source_registry')
    .select('source_name, tier, industries')
    .eq('active', true)
    .order('source_name');

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log('=== ALL ' + data.length + ' ACTIVE SOURCES ===\n');

  data.forEach(s => {
    const industries = s.industries && s.industries.length > 0 ? s.industries.join(', ') : 'NONE';
    console.log(s.source_name + ' | Tier ' + s.tier + ' | [' + industries + ']');
  });

  // Count sources with no industries
  const noIndustries = data.filter(s => !s.industries || s.industries.length === 0);
  console.log('\n=== ' + noIndustries.length + ' SOURCES WITH NO INDUSTRIES ===');
  noIndustries.forEach(s => console.log('  - ' + s.source_name));
}
getSources();
