const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllStrategies() {
  try {
    // Get all strategies ordered by creation date
    const { data: strategies, error } = await supabase
      .from('niv_strategies')
      .select('id, title, created_at, framework_data, research_key_findings')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching strategies:', error);
      return;
    }

    console.log(`\n=== FOUND ${strategies?.length || 0} STRATEGIES ===\n`);

    strategies?.forEach((strategy, index) => {
      const createdAt = new Date(strategy.created_at);
      const now = new Date();
      const minutesAgo = Math.round((now - createdAt) / 1000 / 60);

      console.log(`\n--- Strategy ${index + 1} ---`);
      console.log(`ID: ${strategy.id}`);
      console.log(`Title: ${strategy.title?.substring(0, 60)}...`);
      console.log(`Created: ${strategy.created_at} (${minutesAgo} minutes ago)`);
      console.log(`Has framework_data: ${!!strategy.framework_data && Object.keys(strategy.framework_data).length > 0}`);

      if (strategy.framework_data && Object.keys(strategy.framework_data).length > 0) {
        console.log(`Framework data keys: ${Object.keys(strategy.framework_data).join(', ')}`);
        if (strategy.framework_data.proof_points) {
          console.log(`  - Proof points: ${strategy.framework_data.proof_points.length} items`);
        }
        if (strategy.framework_data.content_needs) {
          console.log(`  - Content needs: ${Object.keys(strategy.framework_data.content_needs).join(', ')}`);
        }
      }

      console.log(`Key findings: ${strategy.research_key_findings?.length || 0} items`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllStrategies();