const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.s1q7bR9PxK5vQgVjmGXKP_5_YkvH4En9pssYvLcCFy0';

async function testCreativeOpportunitiesPipeline() {
  console.log('\n🚀 Testing Creative Opportunities Pipeline...\n');

  try {
    // Step 1: Call intelligence-orchestrator-v2 with test data
    console.log('📡 Calling intelligence-orchestrator-v2...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-orchestrator-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        organization_id: 'test-org-creative',
        organization_name: 'Tesla',
        organization: { name: 'Tesla' },
        // Skip early stages for testing
        skip_enrichment: false,
        skip_opportunity_engine: false,
        articles_limit: 50
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Pipeline failed:', result);
      return;
    }

    console.log('\n✅ Pipeline completed successfully!\n');

    // Check if opportunities have creative fields
    if (result.opportunities && result.opportunities.length > 0) {
      console.log(`📊 Found ${result.opportunities.length} opportunities\n`);

      result.opportunities.forEach((opp, index) => {
        console.log(`\n🎯 Opportunity ${index + 1}:`);
        console.log(`   Title: ${opp.title}`);
        console.log(`   Score: ${opp.score}`);
        console.log(`   Urgency: ${opp.urgency}`);

        // Check for creative fields
        const hasCampaignName = opp.campaign_name || opp.data?.campaign_name;
        const hasCreativeApproach = opp.creative_approach || opp.data?.creative_approach;

        if (hasCampaignName || hasCreativeApproach) {
          console.log(`   ✨ CREATIVE FIELDS FOUND:`);
          if (hasCampaignName) {
            console.log(`      📢 Campaign: ${opp.campaign_name || opp.data?.campaign_name}`);
          }
          if (hasCreativeApproach) {
            console.log(`      🎨 Approach: ${opp.creative_approach || opp.data?.creative_approach}`);
          }
        } else {
          console.log(`   ⚠️  NO CREATIVE FIELDS - Using fallback values`);
        }
      });

      // Summary
      const withCreative = result.opportunities.filter(o =>
        (o.campaign_name || o.data?.campaign_name) &&
        (o.creative_approach || o.data?.creative_approach)
      ).length;

      console.log('\n' + '='.repeat(60));
      console.log(`📈 SUMMARY:`);
      console.log(`   Total Opportunities: ${result.opportunities.length}`);
      console.log(`   With Creative Fields: ${withCreative}`);
      console.log(`   Missing Creative: ${result.opportunities.length - withCreative}`);

      if (withCreative === 0) {
        console.log('\n⚠️  WARNING: No opportunities have creative fields!');
        console.log('   This means orchestrator-v2 creative enhancement is not working.');
      } else if (withCreative < result.opportunities.length) {
        console.log('\n⚠️  WARNING: Some opportunities are missing creative fields.');
      } else {
        console.log('\n✅ SUCCESS: All opportunities have creative fields!');
      }

    } else {
      console.log('❌ No opportunities returned from pipeline');
    }

    // Also check what's in the database
    console.log('\n' + '='.repeat(60));
    console.log('📊 Checking database for comparison...\n');

    const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/opportunities?organization_id=eq.Tesla&select=*&limit=5`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    const dbOpps = await dbResponse.json();

    if (dbOpps && dbOpps.length > 0) {
      console.log(`Found ${dbOpps.length} opportunities in database:`);

      dbOpps.forEach((opp, index) => {
        const hasCampaignName = opp.data?.campaign_name;
        const hasCreativeApproach = opp.data?.creative_approach;

        console.log(`\n   DB Opportunity ${index + 1}: ${opp.title}`);
        if (hasCampaignName || hasCreativeApproach) {
          console.log(`      ✅ Has creative fields in DB`);
        } else {
          console.log(`      ❌ Missing creative fields in DB`);
        }
      });
    } else {
      console.log('No opportunities found in database');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCreativeOpportunitiesPipeline();