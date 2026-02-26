const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

async function testInfluenceMapperWithStoredData() {
  console.log('🔍 Fetching stored research and positioning data...\n');

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Get the most recent campaign builder session with research
  const { data: sessions, error: sessionError } = await supabase
    .from('campaign_builder_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (sessionError) {
    console.error('❌ Error fetching sessions:', sessionError);
    return;
  }

  console.log(`📊 Found ${sessions.length} recent sessions`);

  // Find one with research data
  let sessionWithResearch = null;
  for (const session of sessions) {
    if (session.research_findings && session.selected_positioning) {
      sessionWithResearch = session;
      console.log(`✅ Using session: ${session.id}`);
      console.log(`   Campaign: ${session.campaign_goal?.substring(0, 60)}`);
      console.log(`   Created: ${new Date(session.created_at).toLocaleString()}`);
      console.log(`   Research stakeholders: ${session.research_findings?.stakeholders?.length || 0}`);
      console.log(`   Positioning: ${session.selected_positioning?.name || 'N/A'}`);
      break;
    }
  }

  if (!sessionWithResearch) {
    console.error('❌ No session found with both research and positioning data');
    console.log('\nAvailable sessions:');
    sessions.forEach((s, i) => {
      console.log(`${i + 1}. ${s.id}: research=${!!s.research_findings}, positioning=${!!s.selected_positioning}`);
    });
    return;
  }

  console.log('\n🔧 Calling enrichment function...\n');

  // Call enrichment function with the stored data
  const enrichmentResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/niv-blueprint-enrichment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        researchData: sessionWithResearch.research_findings,
        selectedPositioning: sessionWithResearch.selected_positioning,
        campaignGoal: sessionWithResearch.campaign_goal,
        orgId: sessionWithResearch.org_id
      })
    }
  );

  if (!enrichmentResponse.ok) {
    const errorText = await enrichmentResponse.text();
    console.error('❌ Enrichment failed:', errorText);
    return;
  }

  const enrichmentData = await enrichmentResponse.json();
  console.log('✅ Enrichment complete:', {
    tier1Journalists: enrichmentData.metadata.tier1JournalistCount,
    knowledgeSources: enrichmentData.metadata.knowledgeSourceCount,
    influenceLeverTemplates: enrichmentData.enrichedData.influenceLeverTemplates?.length || 0
  });

  console.log('\n🎯 Calling pattern-selector...\n');

  // Call pattern selector
  const patternResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/mcp-pattern-selector`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        enrichedData: enrichmentData.enrichedData,
        campaignGoal: sessionWithResearch.campaign_goal
      })
    }
  );

  if (!patternResponse.ok) {
    const errorText = await patternResponse.text();
    console.error('❌ Pattern selector failed:', errorText);
    return;
  }

  const patternSelection = await patternResponse.json();
  console.log('✅ Pattern selected:', patternSelection.selectedPattern.pattern);

  console.log('\n🧠 Calling influence-mapper (THIS IS THE TEST)...\n');

  // Now call influence-mapper (THIS IS WHAT WE'RE TESTING)
  const influenceResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/mcp-influence-mapper`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        enrichedData: enrichmentData.enrichedData,
        patternSelection,
        campaignGoal: sessionWithResearch.campaign_goal
      })
    }
  );

  if (!influenceResponse.ok) {
    const errorText = await influenceResponse.text();
    console.error('❌ Influence mapper failed:', errorText);
    console.log('\n💡 Check logs.md for detailed error logs');
    return;
  }

  const influenceStrategies = await influenceResponse.json();

  console.log('\n✅ SUCCESS! Influence strategies generated:');
  console.log(`   Strategies: ${influenceStrategies.influenceStrategies?.length || 0}`);

  if (influenceStrategies.influenceStrategies && influenceStrategies.influenceStrategies.length > 0) {
    console.log('\n📋 Generated strategies:');
    influenceStrategies.influenceStrategies.forEach((strategy, i) => {
      console.log(`\n${i + 1}. ${strategy.stakeholder}`);
      console.log(`   Fear: ${strategy.psychologicalProfile?.primaryFear}`);
      console.log(`   Aspiration: ${strategy.psychologicalProfile?.primaryAspiration}`);
      console.log(`   Influence Levers: ${strategy.influenceLevers?.length || 0}`);
      console.log(`   Has 4-phase strategy: ${!!strategy.touchpointStrategy}`);
    });

    console.log('\n🎉 Full output:');
    console.log(JSON.stringify(influenceStrategies, null, 2));
  } else {
    console.log('\n⚠️ No strategies were generated');
    console.log('Response:', JSON.stringify(influenceStrategies, null, 2));
  }

  console.log('\n💡 TIP: Check logs.md for detailed debug output from the function');
}

testInfluenceMapperWithStoredData().catch(console.error);
