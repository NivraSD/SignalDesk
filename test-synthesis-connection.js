const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
);

async function testSynthesisConnection() {
  console.log('🧪 Testing niv-campaign-research-synthesis connection...\n');

  // Test with minimal valid data
  const testData = {
    compiledResearch: {
      discovery: { organizationName: 'Test Org' },
      stakeholder: { results: [] },
      narrative: { results: [] },
      channel: { journalists: [] },
      historical: { results: [] }
    },
    campaignGoal: 'Test campaign',
    organizationContext: {
      name: 'Test Organization',
      industry: 'Technology'
    }
  };

  console.log('📤 Sending test request...');
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke('niv-campaign-research-synthesis', {
      body: testData
    });

    const duration = Date.now() - startTime;

    if (error) {
      console.error('❌ Error from Supabase client:');
      console.error('   Type:', error.name);
      console.error('   Message:', error.message);
      console.error('   Context:', error.context);
      console.error(`   Duration: ${duration}ms`);

      if (error.message.includes('Failed to send')) {
        console.log('\n💡 This error suggests:');
        console.log('   1. Network connectivity issue');
        console.log('   2. Edge Function is cold starting (first request can timeout)');
        console.log('   3. CORS issue (but less likely since it\'s same origin)');
        console.log('\n🔧 Try:');
        console.log('   1. Run this script again (warm start should work)');
        console.log('   2. Check if dev server is running: npm run dev');
        console.log('   3. Restart dev server to pick up environment variables');
      }
    } else {
      console.log(`✅ Success! Function responded in ${duration}ms`);
      console.log('\n📋 Response:');
      console.log('   Success:', data.success);
      console.log('   Has brief:', !!data.campaignIntelligenceBrief);
      console.log('   Stakeholders:', data.campaignIntelligenceBrief?.stakeholders?.length || 0);
      console.log('   Key insights:', data.campaignIntelligenceBrief?.keyInsights?.length || 0);
    }
  } catch (e) {
    console.error('❌ Unexpected error:', e.message);
  }
}

testSynthesisConnection().catch(console.error);
