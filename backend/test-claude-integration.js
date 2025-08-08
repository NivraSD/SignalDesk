// Test script for Claude API integration
// Run this to verify all Claude features are working

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-test-token-here';

// Test data
const testCases = [
  {
    name: 'Crisis Advisor',
    endpoint: '/crisis/advisor',
    method: 'POST',
    data: {
      query: 'Our company website has been hacked and customer data may be compromised. What should we do?',
      conversationHistory: [],
      context: {
        company: 'TestCorp',
        industry: 'Technology'
      }
    }
  },
  {
    name: 'Campaign Strategy',
    endpoint: '/campaigns/strategy',
    method: 'POST',
    data: {
      campaignType: 'Product Launch',
      objectives: 'Generate awareness for new AI tool',
      targetAudience: 'Tech professionals and developers',
      budget: '$50,000',
      timeline: '3 months'
    }
  },
  {
    name: 'AI Reporter Discovery',
    endpoint: '/media/ai-discover-reporters',
    method: 'POST',
    data: {
      topic: 'AI and machine learning',
      announcement: 'New AI tool for developers',
      targetPublications: ['TechCrunch', 'Wired'],
      geographic: 'National'
    }
  }
];

// Test function
async function testEndpoint(testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`   Endpoint: ${testCase.endpoint}`);
    
    const config = {
      method: testCase.method,
      url: `${API_BASE_URL}${testCase.endpoint}`,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: testCase.data
    };
    
    const response = await axios(config);
    
    if (response.data.success) {
      console.log(`   ✅ SUCCESS`);
      console.log(`   Response has:`, Object.keys(response.data).join(', '));
    } else {
      console.log(`   ❌ FAILED: Response not successful`);
    }
    
    return { success: true, testCase: testCase.name };
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error:`, error.response.data);
    }
    return { success: false, testCase: testCase.name, error: error.message };
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Claude Integration Tests');
  console.log('================================');
  console.log(`API URL: ${API_BASE_URL}`);
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testEndpoint(testCase);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n================================');
  console.log('📊 Test Summary');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => \!r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint };
EOF < /dev/null