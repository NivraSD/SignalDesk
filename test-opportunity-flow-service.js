// Test Opportunity Detector and Orchestrator Flow with Service Role
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

// Mock enriched data with coverage report
const mockEnrichedData = {
  organization_name: "Anthropic",
  organization_id: "1",
  articles: [
    {
      title: "Anthropic Launches Claude 3.5",
      content: "Major AI advancement...",
      relevance_score: 0.95
    }
  ],
  profile: {
    competitors: ["OpenAI", "Google"],
    stakeholders: ["Dario Amodei", "Daniela Amodei"],
    topics: ["AI Safety", "Constitutional AI"]
  }
};

const mockCoverageReport = {
  assessment: "Coverage analysis complete",
  found_targets: {
    competitors: ["OpenAI"],
    stakeholders: ["Dario Amodei"],
    topics: ["AI Safety"]
  },
  gaps: {
    competitors: ["Google"],
    stakeholders: ["Daniela Amodei"],
    topics: ["Constitutional AI"]
  },
  priority_actions: [
    "Search for Google AI developments",
    "Find articles about Daniela Amodei",
    "Research Constitutional AI updates"
  ]
};

const mockSynthesis = {
  synthesis: "Executive synthesis of Anthropic's market position..."
};

async function testOpportunityDetector() {
  console.log('\n=== Testing Opportunity Detector ===');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        organization_id: "1",
        organization_name: "Anthropic",
        enriched_data: mockEnrichedData,
        executive_synthesis: mockSynthesis,
        profile: mockEnrichedData.profile,
        coverage_report: mockCoverageReport
      })
    });

    console.log('Detector Response Status:', response.status);
    const result = await response.json();
    
    if (result.opportunities) {
      console.log('✅ Detector received data successfully');
      console.log('Opportunities detected:', result.opportunities.length);
      
      // Check if coverage report influenced opportunities
      const coverageRelatedOpps = result.opportunities.filter(op => 
        op.description?.toLowerCase().includes('gap') || 
        op.description?.toLowerCase().includes('coverage') ||
        op.description?.includes('Google') ||
        op.description?.includes('Daniela') ||
        op.title?.toLowerCase().includes('gap')
      );
      
      if (coverageRelatedOpps.length > 0) {
        console.log('✅ Coverage report is being used by detector');
        console.log('Coverage-related opportunities:', coverageRelatedOpps.length);
        console.log('Sample coverage opportunity:', coverageRelatedOpps[0].title);
      } else {
        console.log('⚠️ No coverage-related opportunities detected');
        if (result.opportunities.length > 0) {
          console.log('Sample opportunity:', result.opportunities[0].title);
        }
      }
      
      // Log if coverage report was received
      console.log('Coverage report received by detector:', result.coverage_report ? '✅ Yes' : '❌ No');
      
      return result.opportunities;
    } else {
      console.log('❌ No opportunities in detector response');
      console.log('Response:', JSON.stringify(result, null, 2));
      return [];
    }
  } catch (error) {
    console.error('❌ Detector error:', error.message);
    return [];
  }
}

async function testOpportunityOrchestrator(opportunities) {
  console.log('\n=== Testing Opportunity Orchestrator ===');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/opportunity-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        organization_id: "1",
        organization_name: "Anthropic",
        opportunities: opportunities || [],
        enriched_data: mockEnrichedData,
        executive_synthesis: mockSynthesis,
        coverage_report: mockCoverageReport
      })
    });

    console.log('Orchestrator Response Status:', response.status);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Orchestrator received data successfully');
      console.log('Processed opportunities:', result.data?.opportunities?.length || 0);
      
      // Check if coverage report is included in response
      if (result.data?.coverage_report) {
        console.log('✅ Coverage report passed through orchestrator');
        console.log('Coverage gaps identified:', Object.keys(result.data.coverage_report.gaps || {}).join(', '));
      } else {
        console.log('⚠️ Coverage report not in orchestrator response');
      }
      
      // Check if opportunities mention gaps
      if (result.data?.opportunities?.length > 0) {
        const gapOpportunities = result.data.opportunities.filter(op =>
          op.description?.toLowerCase().includes('gap') ||
          op.title?.toLowerCase().includes('gap')
        );
        
        if (gapOpportunities.length > 0) {
          console.log('✅ Gap-based opportunities created:', gapOpportunities.length);
        }
      }
      
      return result;
    } else {
      console.log('❌ Orchestrator processing failed');
      console.log('Response:', JSON.stringify(result, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Orchestrator error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('Starting Opportunity Flow Tests with Service Role...');
  console.log('Testing with coverage report to verify it flows through pipeline');
  
  // Test detector first
  const opportunities = await testOpportunityDetector();
  
  // Then test orchestrator with detector results
  const orchestratorResult = await testOpportunityOrchestrator(opportunities);
  
  console.log('\n=== Test Summary ===');
  if (opportunities.length > 0 && orchestratorResult?.success) {
    console.log('✅ Complete flow working: Detector → Orchestrator');
    console.log('✅ Data ready for UI display');
    console.log(`✅ ${opportunities.length} opportunities detected and processed`);
  } else {
    console.log('❌ Flow incomplete - check logs above');
  }
}

runTests().catch(console.error);
