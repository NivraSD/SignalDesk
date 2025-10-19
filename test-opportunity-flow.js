// Test Opportunity Detector and Orchestrator Flow
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.R-iXo0w0h7G4-Nl9aMm5mJdqpEwVqCUj0N_gJXwTkRk';

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
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
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
        op.description?.includes('gap') || 
        op.description?.includes('coverage') ||
        op.description?.includes('Google') ||
        op.description?.includes('Daniela')
      );
      
      if (coverageRelatedOpps.length > 0) {
        console.log('✅ Coverage report is being used by detector');
        console.log('Coverage-related opportunities:', coverageRelatedOpps.length);
      } else {
        console.log('⚠️ No coverage-related opportunities detected');
      }
      
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
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
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
      } else {
        console.log('⚠️ Coverage report not in orchestrator response');
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
  console.log('Starting Opportunity Flow Tests...');
  console.log('Testing with coverage report to verify it flows through pipeline');
  
  // Test detector first
  const opportunities = await testOpportunityDetector();
  
  // Then test orchestrator with detector results
  const orchestratorResult = await testOpportunityOrchestrator(opportunities);
  
  console.log('\n=== Test Summary ===');
  if (opportunities.length > 0 && orchestratorResult?.success) {
    console.log('✅ Complete flow working: Detector → Orchestrator');
    console.log('✅ Data ready for UI display');
  } else {
    console.log('❌ Flow incomplete - check logs above');
  }
}

runTests().catch(console.error);
