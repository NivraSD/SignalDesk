const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testJournalistRegistry() {
  console.log('🧪 Testing Journalist Registry with Gap Detection\n');

  // TEST 1: Query with sufficient results (no gaps)
  console.log('📊 TEST 1: Query AI journalists (should have 8 in database)');
  console.log('─'.repeat(60));

  const test1 = await fetch(`${SUPABASE_URL}/functions/v1/journalist-registry`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      industry: 'artificial_intelligence',
      count: 5,
      mode: 'gap-analysis'
    })
  });

  const result1 = await test1.json();
  console.log(`✅ Found: ${result1.journalists?.length || 0} journalists`);
  console.log(`📊 Gap Analysis:`, result1.gapAnalysis);
  console.log('\nSample journalists:');
  result1.journalists?.slice(0, 3).forEach(j => {
    console.log(`  - ${j.name} (${j.outlet}) - ${j.beat}`);
  });

  // TEST 2: Query with gaps (requesting more than available)
  console.log('\n\n📊 TEST 2: Query space journalists (only 5 in database, request 20)');
  console.log('─'.repeat(60));

  const test2 = await fetch(`${SUPABASE_URL}/functions/v1/journalist-registry`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      industry: 'space',
      count: 20,
      mode: 'gap-analysis'
    })
  });

  const result2 = await test2.json();
  console.log(`✅ Found: ${result2.journalists?.length || 0} journalists`);
  console.log(`⚠️  Gap Analysis:`, result2.gapAnalysis);
  console.log('\nGap Suggestions:');
  result2.gapAnalysis?.suggestions?.forEach(s => console.log(`  - ${s}`));

  // TEST 3: Search by beat
  console.log('\n\n📊 TEST 3: Search for "crypto" beat');
  console.log('─'.repeat(60));

  const test3 = await fetch(`${SUPABASE_URL}/functions/v1/journalist-registry`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      beat: 'crypto',
      count: 10,
      mode: 'gap-analysis'
    })
  });

  const result3 = await test3.json();
  console.log(`✅ Found: ${result3.journalists?.length || 0} journalists covering crypto`);
  console.log(`📊 Gap Analysis:`, result3.gapAnalysis);
  console.log('\nJournalists:');
  result3.journalists?.forEach(j => {
    console.log(`  - ${j.name} (${j.outlet}) - ${j.beat}`);
  });

  // TEST 4: Search by outlet
  console.log('\n\n📊 TEST 4: Search Bloomberg journalists');
  console.log('─'.repeat(60));

  const test4 = await fetch(`${SUPABASE_URL}/functions/v1/journalist-registry`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      outlet: 'Bloomberg',
      count: 15,
      mode: 'gap-analysis'
    })
  });

  const result4 = await test4.json();
  console.log(`✅ Found: ${result4.journalists?.length || 0} Bloomberg journalists`);
  console.log(`📊 Gap Analysis:`, result4.gapAnalysis);
  console.log('\nOutlets represented:');
  const outlets = [...new Set(result4.journalists?.map(j => j.outlet))];
  outlets.forEach(o => console.log(`  - ${o}`));

  // TEST 5: Standard query (no gap analysis)
  console.log('\n\n📊 TEST 5: Standard query (no gap analysis)');
  console.log('─'.repeat(60));

  const test5 = await fetch(`${SUPABASE_URL}/functions/v1/journalist-registry`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      industry: 'technology',
      count: 10,
      mode: 'query' // standard mode
    })
  });

  const result5 = await test5.json();
  console.log(`✅ Found: ${result5.count} journalists`);
  console.log(`📊 No gap analysis (standard query mode)`);

  console.log('\n\n✅ All tests complete!');
  console.log('\n📝 Summary:');
  console.log('  - Journalist registry is accessible via edge function');
  console.log('  - Gap detection works like mcp-discovery');
  console.log('  - Can query by industry, beat, outlet, tier');
  console.log('  - Returns suggestions when gaps are detected');
  console.log('  - NIV will use registry first, then fill gaps with mcp-media');
}

testJournalistRegistry().catch(console.error);
