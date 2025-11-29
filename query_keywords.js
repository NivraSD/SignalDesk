const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkKeywords() {
  const { data: org, error } = await supabase
    .from('organizations')
    .select('id, name, industry, company_profile')
    .eq('id', '29a1be32-5692-473b-8c05-5dd57764f328')
    .maybeSingle();

  if (error || !org) {
    console.error('Error:', error);
    return;
  }

  const profileData = org.company_profile || {};

  console.log('=== MONITORING CONFIG KEYWORDS ===');
  console.log(profileData.monitoring_config?.keywords);

  console.log('\n=== COMPETITION ===');
  console.log('Direct:', profileData.competition?.direct_competitors);
  console.log('Indirect:', profileData.competition?.indirect_competitors);
  console.log('Emerging:', profileData.competition?.emerging_threats);

  console.log('\n=== STAKEHOLDERS ===');
  console.log('Regulators:', profileData.stakeholders?.regulators);
  console.log('Investors:', profileData.stakeholders?.major_investors);
  console.log('Customers:', profileData.stakeholders?.major_customers);

  console.log('\n=== TOPICS ===');
  console.log(profileData.topics);
}

checkKeywords().catch(console.error);
