const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMemoryVaultData() {
  try {
    // Get the most recent strategy
    const { data: strategies, error } = await supabase
      .from('niv_strategies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching strategies:', error);
      return;
    }

    if (strategies && strategies.length > 0) {
      const strategy = strategies[0];
      console.log('\n=== MOST RECENT STRATEGY ===\n');
      console.log('ID:', strategy.id);
      console.log('Title:', strategy.title);
      console.log('Created:', strategy.created_at);
      console.log('\n=== STANDARD FIELDS ===\n');
      console.log('Objective:', strategy.strategy_objective);
      console.log('Approach:', strategy.strategy_approach);
      console.log('Key Messages:', strategy.strategy_key_messages);
      console.log('Urgency:', strategy.strategy_urgency_level);

      console.log('\n=== RESEARCH FIELDS ===\n');
      console.log('Key Findings:', strategy.research_key_findings);
      console.log('Research Sources:', strategy.research_sources?.length || 0, 'sources');

      console.log('\n=== FRAMEWORK DATA ===\n');
      if (strategy.framework_data) {
        console.log('Has framework_data:', true);
        console.log('Framework data keys:', Object.keys(strategy.framework_data));
        console.log('Proof Points:', strategy.framework_data.proof_points);
        console.log('Content Needs:', strategy.framework_data.content_needs);
        console.log('Media Targets:', strategy.framework_data.media_targets);
        console.log('Timeline Execution:', strategy.framework_data.timeline_execution);
      } else {
        console.log('Has framework_data:', false);
      }

      console.log('\n=== WORKFLOW FLAGS ===\n');
      console.log('Campaign Intelligence:', strategy.workflow_campaign_intelligence);
      console.log('Content Generation:', strategy.workflow_content_generation);
      console.log('Strategic Planning:', strategy.workflow_strategic_planning);
      console.log('Media Outreach:', strategy.workflow_media_outreach);
    } else {
      console.log('No strategies found in database');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkMemoryVaultData();