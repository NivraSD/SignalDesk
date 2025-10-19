const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createOpenAIOrg() {
  console.log('\n=== Creating OpenAI Organization ===\n');

  // First check if it exists
  const { data: existing, error: checkError } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'OpenAI')
    .single();

  if (existing) {
    console.log('✅ OpenAI org already exists:', existing.id);
    return;
  }

  // Create OpenAI org
  const { data: openaiOrg, error: createError } = await supabase
    .from('organizations')
    .insert({
      name: 'OpenAI'
    })
    .select()
    .single();

  if (createError) {
    console.log('❌ Error creating OpenAI org:', createError.message);
  } else {
    console.log('✅ OpenAI org created:', openaiOrg.id);
    console.log('📋 Organization details:', openaiOrg);
  }

  // List all orgs
  const { data: allOrgs, error: listError } = await supabase
    .from('organizations')
    .select('id, name')
    .order('name');

  if (!listError) {
    console.log('\n📊 All organizations:');
    allOrgs.forEach(org => {
      console.log(`  - ${org.name}: ${org.id}`);
    });
  }
}

createOpenAIOrg().catch(console.error);