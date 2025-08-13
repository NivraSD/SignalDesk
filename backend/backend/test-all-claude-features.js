// Test all Claude-powered features in SignalDesk
const axios = require('axios');

// Use production API
const API_BASE = 'https://signaldesk-api-production.up.railway.app/api';

// Test credentials
const TEST_USER = {
  email: 'demo@signaldesk.com',
  password: 'demo123'
};

let authToken = null;

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function login() {
  try {
    console.log(`${colors.blue}Logging in...${colors.reset}`);
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log(`${colors.green}✓ Login successful${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Login failed: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testFeature(name, endpoint, method, data) {
  console.log(`\n${colors.blue}Testing ${name}...${colors.reset}`);
  
  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = method === 'POST' 
      ? await axios.post(`${API_BASE}${endpoint}`, data, config)
      : await axios.get(`${API_BASE}${endpoint}`, config);

    if (response.data) {
      console.log(`${colors.green}✓ ${name} is working${colors.reset}`);
      
      // Check if Claude response is present
      if (response.data.content || response.data.advice || response.data.analysis || response.data.brief) {
        console.log(`  Claude response received (length: ${JSON.stringify(response.data).length} chars)`);
      }
      return true;
    }
  } catch (error) {
    console.log(`${colors.red}✗ ${name} failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    if (error.response?.status === 500) {
      console.log(`  ${colors.yellow}Likely Claude integration issue${colors.reset}`);
    }
    return false;
  }
}

async function runTests() {
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}SignalDesk Claude Integration Test Suite${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);

  // Login first
  if (!await login()) {
    console.log(`${colors.red}Cannot proceed without authentication${colors.reset}`);
    return;
  }

  const results = {
    passed: 0,
    failed: 0,
    features: []
  };

  // Test 1: Content Generator
  const contentTest = await testFeature(
    'Content Generator',
    '/content/ai-generate',
    'POST',
    {
      prompt: 'Write a brief press release headline',
      type: 'press-release',
      projectId: 'test-project',
      companyName: 'Test Company',
      industry: 'Technology'
    }
  );
  results.features.push({ name: 'Content Generator', status: contentTest });
  contentTest ? results.passed++ : results.failed++;

  // Test 2: Crisis Advisor
  const crisisTest = await testFeature(
    'Crisis Advisor',
    '/crisis/advisor',
    'POST',
    {
      query: 'What should I do first in a data breach?',
      context: {
        scenario: 'data-breach',
        crisisStatus: 'active',
        projectName: 'Test Project'
      }
    }
  );
  results.features.push({ name: 'Crisis Advisor', status: crisisTest });
  crisisTest ? results.passed++ : results.failed++;

  // Test 3: Campaign Intelligence
  const campaignTest = await testFeature(
    'Campaign Intelligence',
    '/campaigns/intelligence/market-analysis',
    'POST',
    {
      brief: 'Product launch campaign for AI software',
      campaignType: 'product-launch'
    }
  );
  results.features.push({ name: 'Campaign Intelligence', status: campaignTest });
  campaignTest ? results.passed++ : results.failed++;

  // Test 4: Opportunity Engine
  const opportunityTest = await testFeature(
    'Opportunity Engine',
    '/opportunity/analyze-position',
    'POST',
    {
      company: 'Test Company',
      industry: 'Technology',
      competitors: ['Competitor A', 'Competitor B'],
      currentInitiatives: ['AI development', 'Cloud expansion']
    }
  );
  results.features.push({ name: 'Opportunity Engine', status: opportunityTest });
  opportunityTest ? results.passed++ : results.failed++;

  // Test 5: Media List Builder
  const mediaTest = await testFeature(
    'Media List Builder',
    '/media/search-multi',
    'POST',
    {
      query: 'technology journalists',
      mode: 'smart',
      projectContext: {
        industry: 'Technology',
        projectName: 'Test Project'
      }
    }
  );
  results.features.push({ name: 'Media List Builder', status: mediaTest });
  mediaTest ? results.passed++ : results.failed++;

  // Print summary
  console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}Test Summary${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  
  results.features.forEach(feature => {
    const status = feature.status 
      ? `${colors.green}✓ PASS${colors.reset}` 
      : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`${feature.name}: ${status}`);
  });

  console.log(`\n${colors.blue}Results:${colors.reset}`);
  console.log(`  Passed: ${colors.green}${results.passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${results.failed}${colors.reset}`);
  console.log(`  Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  if (results.failed > 0) {
    console.log(`\n${colors.yellow}⚠ Some Claude features are not working properly${colors.reset}`);
    console.log(`${colors.yellow}Check the backend logs for detailed error messages${colors.reset}`);
  } else {
    console.log(`\n${colors.green}✅ All Claude features are working!${colors.reset}`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite failed: ${error.message}${colors.reset}`);
  process.exit(1);
});