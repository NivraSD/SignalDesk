// Test the complete prediction flow
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

const supabase = createClient(supabaseUrl, supabaseKey);
const openaiOrgId = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff';

async function testFullFlow() {
  console.log('🧪 Testing Full Prediction Flow\n');
  console.log('=' .repeat(60));

  // Step 1: Run real-time intelligence monitor
  console.log('\n📡 Step 1: Running real-time intelligence monitor for OpenAI...');

  try {
    const rtResponse = await fetch(`${supabaseUrl}/functions/v1/real-time-intelligence-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        organization_name: 'OpenAI',
        time_window: '24hours',
        route_to_opportunities: false,
        route_to_crisis: true
      })
    });

    if (rtResponse.ok) {
      const rtData = await rtResponse.json();
      console.log('✅ Real-time intelligence completed');
      console.log(`   Articles analyzed: ${rtData.articles_analyzed || 0}`);
      console.log(`   Breaking summary: ${rtData.breaking_summary?.substring(0, 100) || 'None'}...`);
      console.log(`   Critical alerts: ${rtData.critical_alerts?.length || 0}`);
    } else {
      const error = await rtResponse.text();
      console.log('❌ Real-time intelligence failed:', error);
      return;
    }
  } catch (error) {
    console.log('❌ Error running real-time monitor:', error.message);
    return;
  }

  // Step 2: Check if intelligence data was saved
  console.log('\n📊 Step 2: Checking saved intelligence data...');

  const { data: briefs, error: briefsError } = await supabase
    .from('real_time_intelligence_briefs')
    .select('*')
    .eq('organization_id', 'OpenAI')
    .order('created_at', { ascending: false })
    .limit(1);

  if (briefsError) {
    console.log('❌ Error fetching briefs:', briefsError.message);
    return;
  }

  if (briefs && briefs.length > 0) {
    const brief = briefs[0];
    console.log('✅ Intelligence brief found');
    console.log(`   Created: ${brief.created_at}`);
    console.log(`   Events: ${Array.isArray(brief.events) ? brief.events.length : 0}`);
    console.log(`   Entities: ${Array.isArray(brief.entities) ? brief.entities.length : 0}`);
  } else {
    console.log('⚠️  No intelligence briefs found');
  }

  // Step 3: Run stakeholder pattern detector
  console.log('\n🎯 Step 3: Running stakeholder pattern detector...');

  try {
    const predictorResponse = await fetch(`${supabaseUrl}/functions/v1/stakeholder-pattern-detector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        organizationId: openaiOrgId
      })
    });

    if (predictorResponse.ok) {
      const predictorData = await predictorResponse.json();
      console.log('✅ Pattern detector completed');
      console.log(`   Success: ${predictorData.success}`);
      console.log(`   Predictions generated: ${predictorData.predictions_generated || 0}`);
      console.log(`   Stakeholders analyzed: ${predictorData.stakeholders_analyzed || 0}`);
      console.log(`   Events analyzed: ${predictorData.events_analyzed || 0}`);

      if (predictorData.predictions && predictorData.predictions.length > 0) {
        console.log('\n📊 Sample Predictions:');
        predictorData.predictions.slice(0, 3).forEach((pred, i) => {
          console.log(`\n   [${i + 1}] ${pred.stakeholder}`);
          console.log(`       Action: ${pred.action}`);
          console.log(`       Probability: ${(pred.probability * 100).toFixed(0)}%`);
          console.log(`       Confidence: ${pred.confidence}`);
          console.log(`       Timeframe: ${pred.timeframe}`);
        });
      } else {
        console.log('\n   Message: ' + (predictorData.message || 'No predictions generated'));
      }
    } else {
      const error = await predictorResponse.text();
      console.log('❌ Pattern detector failed:', error);
    }
  } catch (error) {
    console.log('❌ Error running pattern detector:', error.message);
  }

  // Step 4: Check predictions in database
  console.log('\n💾 Step 4: Checking predictions in database...');

  const { data: predictions, error: predsError } = await supabase
    .from('stakeholder_predictions')
    .select('*')
    .eq('organization_id', openaiOrgId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5);

  if (predsError) {
    console.log('❌ Error fetching predictions:', predsError.message);
  } else {
    console.log(`✅ Found ${predictions?.length || 0} active predictions in database`);

    if (predictions && predictions.length > 0) {
      predictions.forEach((p, i) => {
        console.log(`\n   [${i + 1}] ${p.stakeholder_name}`);
        console.log(`       ${p.predicted_action}`);
        console.log(`       ${(p.probability * 100).toFixed(0)}% confidence`);
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Full prediction flow test complete!\n');
}

testFullFlow().catch(console.error);
