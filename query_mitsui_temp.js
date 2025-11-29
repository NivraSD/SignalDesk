const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkProfile() {
  const { data: org, error } = await supabase
    .from('organizations')
    .select('id, name, industry, company_profile')
    .eq('id', '29a1be32-5692-473b-8c05-5dd57764f328')
    .maybeSingle();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== ORGANIZATION DATA ===');
  console.log('ID:', org.id);
  console.log('Name:', org.name);
  console.log('Industry:', org.industry);

  console.log('\n=== COMPANY_PROFILE KEYS ===');
  console.log(Object.keys(org.company_profile || {}));

  console.log('\n=== COMPANY_PROFILE STRUCTURE ===');
  console.log(JSON.stringify(org.company_profile, null, 2));
}

checkProfile().catch(console.error);
