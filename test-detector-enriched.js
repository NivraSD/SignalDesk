// Test Opportunity Detector with Proper Enriched Data Structure
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

// Properly structured enriched data matching what the detector expects
const mockEnrichedData = {
  organization_name: "Anthropic",
  organization_id: "1",
  
  // This is what the detector looks for
  organized_intelligence: {
    events: [
      {
        type: "workforce",
        description: "OpenAI experiences significant layoffs in research division",
        date: "2025-01-10",
        impact: "high"
      },
      {
        type: "regulatory",
        description: "New AI regulation requires transparency in model training",
        date: "2025-01-09",
        impact: "medium"
      },
      {
        type: "acquisition",
        description: "Google acquires AI startup for 500M",
        date: "2025-01-08",
        impact: "high"
      },
      {
        type: "crisis",
        description: "ChatGPT experiences major outage affecting millions",
        date: "2025-01-07",
        impact: "high"
      }
    ],
    entities: {
      companies: ["OpenAI", "Google", "Microsoft", "Anthropic"],
      people: ["Sam Altman", "Dario Amodei", "Sundar Pichai"]
    },
    topic_clusters: [
      {
        theme: "AI Safety Concerns",
        article_count: 15,
        count: 15
      },
      {
        theme: "LLM Competition",
        article_count: 12,
        count: 12
      },
      {
        theme: "Regulatory Compliance",
        article_count: 8,
        count: 8
      }
    ],
    quotes: [
      {
        text: "The industry is moving too fast without proper safety measures",
        speaker: "Industry Expert",
        context: "AI Safety Summit"
      }
    ]
  },
  
  // Alternative path the detector checks
  extracted_data: {
    events: [
      {
        type: "competitor_negative",
        description: "OpenAI faces criticism over safety practices",
        date: "2025-01-10"
      }
    ]
  },
  
  // Profile with strengths/weaknesses
  profile: {
    strengths: ["Constitutional AI", "Safety-first approach", "Enterprise focus"],
    weaknesses: ["Market share", "Consumer awareness"],
    competitors: ["OpenAI", "Google", "Microsoft"],
    stakeholders: ["Dario Amodei", "Daniela Amodei"],
    topics: ["AI Safety", "Constitutional AI", "Enterprise AI"]
  }
};

const mockSynthesis = {
  synthesis: "Executive synthesis showing Anthropic's strong position in AI safety..."
};

async function testOpportunityDetector() {
  console.log('\n=== Testing Opportunity Detector with Proper Data ===');
  
  try {
    const response = await fetch(SUPABASE_URL + '/functions/v1/mcp-opportunity-detector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        organization_id: "1",
        organization_name: "Anthropic",
        enriched_data: mockEnrichedData,
        executive_synthesis: mockSynthesis,
        profile: mockEnrichedData.profile
      })
    });

    console.log('Response Status:', response.status);
    const result = await response.json();
    
    if (result.opportunities && result.opportunities.length > 0) {
      console.log('✅ Opportunities detected:', result.opportunities.length);
      
      // Show sample opportunities
      result.opportunities.slice(0, 3).forEach((opp, idx) => {
        console.log('\nOpportunity ' + (idx + 1) + ':');
        console.log('  Title: ' + opp.title);
        console.log('  Category: ' + opp.category);
        console.log('  Urgency: ' + opp.urgency);
        console.log('  Score: ' + opp.score);
        console.log('  PR Angle: ' + opp.pr_angle);
      });
      
      // Check for specific patterns
      const competitorOpps = result.opportunities.filter(o => 
        o.pattern_matched && o.pattern_matched.includes('Competitor')
      );
      const regulatoryOpps = result.opportunities.filter(o => 
        o.pattern_matched && o.pattern_matched.includes('Regulatory')
      );
      
      console.log('\n📊 Pattern Analysis:');
      console.log('  Competitor opportunities: ' + competitorOpps.length);
      console.log('  Regulatory opportunities: ' + regulatoryOpps.length);
      
      return result.opportunities;
    } else {
      console.log('❌ No opportunities detected');
      console.log('Response:', JSON.stringify(result, null, 2));
      return [];
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

async function testOpportunityOrchestrator(opportunities) {
  console.log('\n=== Testing Opportunity Orchestrator ===');
  
  try {
    const response = await fetch(SUPABASE_URL + '/functions/v1/opportunity-orchestrator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        organization_id: "1",
        organization_name: "Anthropic",
        detected_opportunities: opportunities, // Pass detected opportunities
        enriched_data: mockEnrichedData,
        executive_synthesis: mockSynthesis,
        profile: mockEnrichedData.profile
      })
    });

    console.log('Response Status:', response.status);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Orchestrator processed successfully');
      console.log('Opportunities saved:', result.data && result.data.opportunities ? result.data.opportunities.length : 0);
      return result;
    } else {
      console.log('❌ Orchestrator failed');
      console.log('Response:', JSON.stringify(result, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('Testing Opportunity Detection with Proper Enriched Data Structure');
  console.log('This should generate opportunities from:');
  console.log('- Competitor problems (OpenAI layoffs, criticism)');
  console.log('- Regulatory changes');
  console.log('- Market disruptions');
  console.log('- High media interest topics');
  
  // Test detector
  const opportunities = await testOpportunityDetector();
  
  // Test orchestrator
  if (opportunities.length > 0) {
    await testOpportunityOrchestrator(opportunities);
  }
  
  console.log('\n=== Test Summary ===');
  if (opportunities.length > 0) {
    console.log('✅ Successfully detected ' + opportunities.length + ' opportunities from enriched data');
    console.log('✅ System is working correctly without coverage report');
  } else {
    console.log('❌ No opportunities detected - check detector logic');
  }
}

runTests().catch(console.error);
