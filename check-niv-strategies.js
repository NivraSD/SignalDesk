const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNivStrategies() {
  console.log('Checking NIV strategies in Memory Vault...\n');

  // Get recent strategies
  const { data, error } = await supabase
    .from('niv_strategies')
    .select('id, created_at, organization_id, status, strategy_objective, framework_data')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching strategies:', error);
    return;
  }

  console.log(`Found ${data?.length || 0} recent strategies:\n`);

  data?.forEach((strategy, index) => {
    console.log(`${index + 1}. Strategy ID: ${strategy.id}`);
    console.log(`   Created: ${new Date(strategy.created_at).toLocaleString()}`);
    console.log(`   Organization ID: ${strategy.organization_id}`);
    console.log(`   Status: ${strategy.status || 'N/A'}`);

    if (strategy.strategy_objective) {
      console.log(`   Objective: ${strategy.strategy_objective.substring(0, 100)}...`);
    }

    if (strategy.framework_data && Object.keys(strategy.framework_data).length > 0) {
      console.log(`   Framework Data: ${JSON.stringify(strategy.framework_data).substring(0, 100)}...`);
    }

    // Check if it was created recently (last 5 minutes)
    const createdAt = new Date(strategy.created_at);
    const now = new Date();
    const minutesAgo = (now - createdAt) / 1000 / 60;

    if (minutesAgo < 5) {
      console.log(`   ⚡ RECENT: Created ${minutesAgo.toFixed(1)} minutes ago`);
    }

    console.log('');
  });

  // Check for any strategies created in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const { data: recentData, error: recentError } = await supabase
    .from('niv_strategies')
    .select('id, created_at')
    .gte('created_at', oneHourAgo.toISOString())
    .order('created_at', { ascending: false });

  if (!recentError && recentData) {
    console.log(`\n📊 Strategies created in last hour: ${recentData.length}`);
    if (recentData.length > 0) {
      console.log('Most recent:', new Date(recentData[0].created_at).toLocaleString());
    }
  }
}

checkNivStrategies().catch(console.error);