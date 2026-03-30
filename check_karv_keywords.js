const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkKARVKeywords() {
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, company_profile')
    .eq('name', 'KARV')
    .single();

  console.log('=== KARV KEYWORDS ===\n');

  const profile = org.company_profile || {};

  // Extract monitoring config keywords (the ones the selector actually uses)
  const monitoringKeywords = profile.monitoring_config?.keywords || [];

  console.log(`monitoring_config.keywords: ${monitoringKeywords.length} total`);
  console.log(JSON.stringify(monitoringKeywords, null, 2));

  // Get intelligence targets
  const { data: targets } = await supabase
    .from('intelligence_targets')
    .select('*')
    .eq('organization_id', org.id)
    .eq('active', true);

  console.log(`\n\nIntelligence Targets: ${targets?.length || 0} total\n`);
  targets?.forEach(t => {
    console.log(`- ${t.name} (${t.type}, priority: ${t.priority})`);
  });
}

checkKARVKeywords();
