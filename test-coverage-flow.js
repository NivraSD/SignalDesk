const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

async function testCoverageFlow() {
  console.log('Testing Coverage Report Flow...\n');
  
  // Step 1: Get Monitor Stage 1 response with coverage report
  console.log('1️⃣ Testing Monitor Stage 1...');
  const monitorResponse = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({
      organization_name: "Tesla",
      profile: {
        organization_name: "Tesla",
        competition: {
          direct_competitors: ["Ford", "GM", "Toyota"]
        }
      }
    })
  });

  const monitorResult = await monitorResponse.json();
  const coverageReport = monitorResult.metadata?.coverage_report;
  
  if (coverageReport) {
    console.log('✅ Coverage report created!');
    console.log('   Context:', coverageReport.context);
    console.log('   Gaps:', Object.keys(coverageReport.gaps || {}));
    console.log('   Priority articles:', coverageReport.priorities?.length || 0);
  } else {
    console.log('❌ No coverage report found');
    return;
  }
  
  // Step 2: Pass to Relevance with coverage report
  console.log('\n2️⃣ Testing Monitor Stage 2 Relevance...');
  const relevanceResponse = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-2-relevance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({
      articles: monitorResult.articles || [],
      profile: monitorResult.metadata?.discovery_targets,
      organization_name: "Tesla",
      top_k: 30,
      coverage_report: coverageReport
    })
  });
  
  const relevanceResult = await relevanceResponse.json();
  const passedCoverageReport = relevanceResult.metadata?.coverage_report;
  
  if (passedCoverageReport) {
    console.log('✅ Coverage report passed through relevance!');
  } else {
    console.log('❌ Coverage report NOT passed through relevance');
  }
  
  // Step 3: Pass to Enrichment
  console.log('\n3️⃣ Testing Monitoring Stage 2 Enrichment...');
  const enrichmentResponse = await fetch(`${SUPABASE_URL}/functions/v1/monitoring-stage-2-enrichment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({
      articles: relevanceResult.findings || [],
      profile: monitorResult.metadata?.discovery_targets,
      organization_name: "Tesla",
      coverage_report: passedCoverageReport || coverageReport
    })
  });
  
  if (enrichmentResponse.ok) {
    const enrichmentResult = await enrichmentResponse.json();
    console.log('✅ Enrichment received coverage report and processed articles!');
    console.log('   Events extracted:', enrichmentResult.extracted_data?.events?.length || 0);
    console.log('   Entities found:', enrichmentResult.extracted_data?.entities?.length || 0);
    
    // Check if enrichment used the coverage report
    if (enrichmentResult.metadata?.coverage_context) {
      console.log('   Coverage context used:', enrichmentResult.metadata.coverage_context);
    }
  } else {
    console.log('❌ Enrichment failed:', enrichmentResponse.status);
  }
  
  console.log('\n✅ Coverage report flow test complete!');
}

testCoverageFlow().catch(console.error);