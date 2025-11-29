const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkKARVProfile() {
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'KARV')
    .single();

  console.log('=== KARV ORGANIZATION ===\n');
  console.log('ID:', org.id);
  console.log('Name:', org.name);
  console.log('Industry:', org.industry);
  console.log('\n=== COMPANY PROFILE ===\n');
  console.log(JSON.stringify(org.company_profile, null, 2));

  // Get intelligence targets
  const { data: targets } = await supabase
    .from('intelligence_targets')
    .select('*')
    .eq('organization_id', org.id)
    .eq('active', true);

  console.log('\n\n=== INTELLIGENCE TARGETS ===');
  console.log(`Total: ${targets?.length || 0}\n`);
  targets?.forEach(t => {
    console.log(`- ${t.name} (${t.type})`);
  });
}

checkKARVProfile();
