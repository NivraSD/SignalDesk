const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNivSaveStrategy() {
  console.log('\n=== Testing NIV Strategy Save ===\n');

  const testStrategy = {
    organization_id: 'OpenAI', // Using string name like the flow does
    title: 'Test Strategy from NIV Flow',
    strategy_objective: 'Test the complete NIV to Memory Vault flow',
    strategy_approach: 'Direct database integration',
    strategy_key_messages: ['Integration works', 'UUID handling is fixed'],
    created_by: 'niv-test',
    status: 'draft'
  };

  console.log('📤 Sending strategy to Memory Vault edge function...');
  console.log('Organization ID (string):', testStrategy.organization_id);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-memory-vault?action=save`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ strategy: testStrategy })
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log('✅ Strategy saved successfully!');
      console.log('📋 Saved strategy:', result.data);
      console.log('🔑 Strategy ID:', result.data.id);
      console.log('🏢 Organization UUID:', result.data.organization_id);
    } else {
      console.log('❌ Failed to save strategy:', result.error);
    }
  } catch (error) {
    console.error('❌ Error calling Memory Vault:', error.message);
  }

  // Verify in database
  console.log('\n📊 Verifying in database...');
  const { data: strategies, error: fetchError } = await supabase
    .from('niv_strategies')
    .select('id, title, organization_id, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (!fetchError) {
    console.log('\nRecent strategies:');
    strategies?.forEach(s => {
      console.log(`  - ${s.title} (org: ${s.organization_id})`);
    });
  }
}

testNivSaveStrategy().catch(console.error);