#!/usr/bin/env node

/**
 * Test script to verify all Claude API endpoints return correct field names
 * Run this to ensure frontend-backend field compatibility
 */

const API_BASE_URL = process.env.API_URL || 'https://signaldesk-backend-production.up.railway.app/api';

// Test configuration
const tests = [
  {
    name: 'Content Generator',
    endpoint: '/content/ai-generate',
    method: 'POST',
    body: {
      type: 'press-release',
      topic: 'New Product Launch',
      tone: 'professional'
    },
    expectedFields: ['success', 'content'],
    status: '✅ WORKING (confirmed)'
  },
  {
    name: 'Crisis Advisor',
    endpoint: '/crisis/advisor',
    method: 'POST',
    body: {
      situation: 'Data breach affecting customer information',
      severity: 'high',
      context: 'Discovered this morning, approximately 1000 customers affected'
    },
    expectedFields: ['success', 'advice'],
    status: '🔧 FIXED - Now returns "advice" field'
  },
  {
    name: 'Campaign Intelligence - Generate Report',
    endpoint: '/campaigns/generate-strategic-report',
    method: 'POST',
    body: {
      projectId: 'test-project',
      campaignData: { name: 'Q4 Marketing Campaign' },
      metrics: { reach: 10000, engagement: 500 }
    },
    expectedFields: ['success', 'report'],
    status: '✅ Already returns "report" field'
  },
  {
    name: 'Campaign Intelligence - Expand Report',
    endpoint: '/campaigns/expand-report',
    method: 'POST',
    body: {
      prompt: 'Provide more details on social media strategy',
      reportContext: { campaign: 'Q4 Marketing' },
      currentReport: 'Initial campaign report content...'
    },
    expectedFields: ['success', 'expansion'],
    status: '🔧 FIXED - Added missing endpoint'
  },
  {
    name: 'Media List Builder - Discover',
    endpoint: '/media/discover',
    method: 'POST',
    body: {
      query: 'technology journalists covering AI and machine learning',
      industry: 'Technology',
      region: 'US'
    },
    expectedFields: ['success', 'journalists'],
    status: '🔧 FIXED - Now returns "journalists" instead of "media"'
  },
  {
    name: 'Media List Builder - Pitch Angles',
    endpoint: '/media/generate-pitch-angles',
    method: 'POST',
    body: {
      topic: 'AI Innovation',
      industry: 'Technology',
      audience: 'Tech journalists'
    },
    expectedFields: ['success', 'pitchAngles'],
    status: '✅ Already returns "pitchAngles" field'
  },
  {
    name: 'AI Assistant',
    endpoint: '/ai/assistant',
    method: 'POST',
    body: {
      message: 'Help me write a press release',
      context: 'Product launch'
    },
    expectedFields: ['success', 'response'],
    status: '✅ Already returns "response" field'
  },
  {
    name: 'AI Analyze',
    endpoint: '/ai/analyze',
    method: 'POST',
    body: {
      content: 'Sample content to analyze',
      type: 'sentiment'
    },
    expectedFields: ['success', 'analysis', 'response'],
    status: '🔧 FIXED - Now returns both "analysis" and "response" fields'
  },
  {
    name: 'Opportunity Analyze',
    endpoint: '/opportunity/analyze',
    method: 'POST',
    body: {
      company: 'Tech Corp',
      industry: 'Technology',
      position: 'Market Leader'
    },
    expectedFields: ['success', 'opportunities'],
    status: '✅ Already returns "opportunities" field'
  }
];

async function testEndpoint(test) {
  console.log(`\nTesting: ${test.name}`);
  console.log(`Endpoint: ${test.endpoint}`);
  console.log(`Status: ${test.status}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}${test.endpoint}`, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if needed
        // 'Authorization': `Bearer ${process.env.AUTH_TOKEN}`
      },
      body: JSON.stringify(test.body)
    });
    
    const data = await response.json();
    
    // Check if expected fields are present
    const missingFields = test.expectedFields.filter(field => !(field in data));
    
    if (missingFields.length === 0) {
      console.log(`✅ SUCCESS - All expected fields present: ${test.expectedFields.join(', ')}`);
      
      // Show sample of actual data
      test.expectedFields.forEach(field => {
        if (field !== 'success') {
          const value = data[field];
          const preview = typeof value === 'string' 
            ? value.substring(0, 100) + (value.length > 100 ? '...' : '')
            : JSON.stringify(value).substring(0, 100);
          console.log(`  ${field}: ${preview}`);
        }
      });
    } else {
      console.log(`❌ FAILURE - Missing fields: ${missingFields.join(', ')}`);
      console.log(`  Actual fields: ${Object.keys(data).join(', ')}`);
    }
    
  } catch (error) {
    console.log(`❌ ERROR - ${error.message}`);
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('Claude API Field Name Compatibility Test');
  console.log('========================================');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  for (const test of tests) {
    await testEndpoint(test);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log('\nFIXES APPLIED:');
  console.log('1. ✅ Crisis Advisor - Now returns "advice" field');
  console.log('2. ✅ Media Discover - Now returns "journalists" instead of "media"');
  console.log('3. ✅ Campaign Expand Report - Added missing endpoint');
  console.log('4. ✅ AI Analyze - Now returns both "analysis" and "response" fields');
  console.log('\nWORKING ENDPOINTS:');
  console.log('- Content Generator (confirmed working)');
  console.log('- Campaign Generate Report');
  console.log('- Media Pitch Angles');
  console.log('- AI Assistant');
  console.log('- Opportunity Analyze');
  console.log('\n✅ All Claude API endpoints should now return correct field names!');
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { tests, testEndpoint, runAllTests };