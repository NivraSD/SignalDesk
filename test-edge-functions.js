// Test Script for Edge Functions
// Run this with: node test-edge-functions.js

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';

// Test organization data
const testOrganization = {
  id: 'openai',
  name: 'OpenAI',
  industry: 'Artificial Intelligence',
  keywords: ['AI', 'ChatGPT', 'GPT-4'],
  competitors: ['Anthropic', 'Google DeepMind', 'Microsoft'],
  stakeholders: {
    media: ['TechCrunch', 'The Verge', 'Wired'],
    regulators: ['FTC', 'EU Commission'],
    analysts: ['Gartner', 'Forrester']
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

async function testEdgeFunction(name, endpoint, payload) {
  console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
  console.log(`Endpoint: ${SUPABASE_URL}/functions/v1/${endpoint}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok && data.success !== false) {
      console.log(`${colors.green}✅ SUCCESS${colors.reset}`);
      console.log('Response preview:', JSON.stringify(data).substring(0, 200) + '...');
      return { success: true, data };
    } else {
      console.log(`${colors.red}❌ FAILED${colors.reset}`);
      console.log('Error:', data.error || 'Unknown error');
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR${colors.reset}`);
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`${colors.yellow}========================================`);
  console.log('🧪 SIGNALDESK EDGE FUNCTION TEST SUITE');
  console.log(`========================================${colors.reset}`);
  console.log(`\nTesting against: ${SUPABASE_URL}`);
  console.log(`Organization: ${testOrganization.name}`);
  
  const results = [];
  
  // Test 1: Intelligence Collection
  results.push(await testEdgeFunction(
    'Intelligence Collection V1',
    'intelligence-collection-v1',
    { 
      organization: testOrganization,
      options: { maxResults: 5 }
    }
  ));
  
  // Test 2: News Intelligence
  results.push(await testEdgeFunction(
    'News Intelligence',
    'news-intelligence',
    {
      method: 'gather',
      params: { organization: testOrganization }
    }
  ));
  
  // Test 3: Competitor Intelligence
  results.push(await testEdgeFunction(
    'Competitor Intelligence',
    'intelligence-stage-1-competitors',
    {
      organization: testOrganization,
      competitors: testOrganization.competitors.slice(0, 2)
    }
  ));
  
  // Test 4: Media Intelligence
  results.push(await testEdgeFunction(
    'Media Intelligence',
    'intelligence-stage-2-media',
    {
      organization: testOrganization,
      media: testOrganization.stakeholders.media
    }
  ));
  
  // Test 5: Synthesis (with minimal data)
  results.push(await testEdgeFunction(
    'Intelligence Synthesis V4',
    'intelligence-synthesis-v4',
    {
      organization: testOrganization,
      intelligence: {
        entity_actions: { all: [] },
        topic_trends: { all: [] }
      }
    }
  ));
  
  // Test 6: Reddit Intelligence (if configured)
  results.push(await testEdgeFunction(
    'Reddit Intelligence',
    'reddit-intelligence',
    {
      method: 'gather',
      params: { organization: testOrganization }
    }
  ));
  
  // Summary
  console.log(`\n${colors.yellow}========================================`);
  console.log('📊 TEST SUMMARY');
  console.log(`========================================${colors.reset}`);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`${colors.green}✅ Successful: ${successful}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  
  if (failed > 0) {
    console.log(`\n${colors.yellow}Note: Some functions may require API keys (Twitter, Reddit) or specific configuration.${colors.reset}`);
  }
  
  if (successful > 3) {
    console.log(`\n${colors.green}🎉 Core functions are working! You can proceed with testing in the UI.${colors.reset}`);
  }
}

// Run tests
runTests().catch(console.error);