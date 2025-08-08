/**
 * Test Script for All Claude-Integrated Endpoints
 * Run with: node test-claude-endpoints.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001/api';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token

// Test data
const testData = {
  crisis: {
    query: "We just discovered a data breach affecting 10,000 customers. What should we do immediately?",
    context: {
      crisisStatus: "active",
      projectName: "TestCorp",
      industry: "Technology"
    }
  },
  campaign: {
    campaignType: "launch",
    campaignCategory: "product",
    brief: "Launching a new AI-powered analytics platform for enterprise customers",
    includeBrief: true
  },
  media: {
    query: "AI technology innovation startups",
    limit: 10
  },
  stakeholder: {
    company: "TestCorp",
    url: "https://testcorp.com",
    strategicGoals: "Expand market share in AI analytics",
    priorityStakeholders: "investors, customers, employees"
  },
  opportunity: {
    organization: {
      name: "TestCorp",
      industry: "Technology",
      size: "500-1000 employees"
    },
    currentState: {
      strengths: ["Strong AI technology", "Good team"],
      weaknesses: ["Limited market presence"],
      recentWins: ["Secured Series B funding"],
      challenges: ["Competition from big tech"]
    },
    marketContext: {
      trends: ["AI boom", "Enterprise digital transformation"],
      competitorActions: ["Competitor launched similar product"],
      upcomingEvents: ["Tech conference next month"]
    }
  },
  intelligence: {
    query: "What are the top 3 strategic priorities for a mid-size AI company in the current market?",
    context: {
      company: "TestCorp",
      industry: "AI/Technology"
    },
    dataPoints: {
      marketGrowth: "25% YoY",
      competitorCount: 15
    }
  }
};

// Helper function to make API calls
async function testEndpoint(name, method, endpoint, data) {
  console.log(`\n🔍 Testing ${name}...`);
  console.log(`   Endpoint: ${method.toUpperCase()} ${endpoint}`);
  
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data,
      timeout: 30000 // 30 second timeout for Claude calls
    };
    
    const response = await axios(config);
    
    if (response.data.success) {
      console.log(`   ✅ SUCCESS`);
      console.log(`   Response keys:`, Object.keys(response.data));
      
      // Check for expected fields
      const expectedFields = {
        'Crisis Advisor': ['advice', 'response'],
        'Campaign Strategy': ['report'],
        'Media Discovery': ['journalists'],
        'Stakeholder Suggestions': ['suggestions'],
        'Opportunity Analysis': ['analysis'],
        'Intelligence Query': ['intelligence']
      };
      
      const expected = expectedFields[name];
      if (expected) {
        const hasFields = expected.filter(field => response.data[field]);
        if (hasFields.length > 0) {
          console.log(`   ✅ Has expected fields:`, hasFields.join(', '));
        } else {
          console.log(`   ⚠️  Missing expected fields:`, expected.join(', '));
        }
      }
      
      return { success: true, endpoint, response: response.data };
    } else {
      console.log(`   ❌ FAILED - Response indicates failure`);
      return { success: false, endpoint, error: 'Response success=false' };
    }
  } catch (error) {
    console.log(`   ❌ FAILED`);
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    if (error.response?.status === 404) {
      console.log(`   ⚠️  Endpoint not found - may need to be registered`);
    }
    return { 
      success: false, 
      endpoint, 
      error: error.response?.data?.error || error.message,
      status: error.response?.status 
    };
  }
}

// Main test function
async function runTests() {
  console.log('🚀 SignalDesk Claude Integration Test Suite');
  console.log('==========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Note: Make sure to set AUTH_TOKEN before running\n`);
  
  const results = [];
  
  // Test Content Generator (known working)
  results.push(await testEndpoint(
    'Content Generator (Control)',
    'post',
    '/content/ai-generate',
    {
      prompt: "Write a brief press release headline",
      type: "press-release",
      companyName: "TestCorp",
      industry: "Technology"
    }
  ));
  
  // Test Crisis Advisor
  results.push(await testEndpoint(
    'Crisis Advisor',
    'post',
    '/crisis/advisor',
    testData.crisis
  ));
  
  // Test Campaign Intelligence
  results.push(await testEndpoint(
    'Campaign Strategy',
    'post',
    '/campaigns/generate-strategic-report',
    testData.campaign
  ));
  
  // Test Media Discovery
  results.push(await testEndpoint(
    'Media Discovery',
    'post',
    '/media/discover',
    testData.media
  ));
  
  // Test Stakeholder Intelligence
  results.push(await testEndpoint(
    'Stakeholder Suggestions',
    'post',
    '/stakeholder-intelligence/suggestions',
    testData.stakeholder
  ));
  
  // Test Opportunity Engine
  results.push(await testEndpoint(
    'Opportunity Analysis',
    'post',
    '/opportunity/analyze-position',
    testData.opportunity
  ));
  
  // Test Enhanced Intelligence Dashboard
  results.push(await testEndpoint(
    'Intelligence Query',
    'post',
    '/enhanced/intelligence/query',
    testData.intelligence
  ));
  
  // Summary
  console.log('\n==========================================');
  console.log('📊 TEST SUMMARY');
  console.log('==========================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Endpoints:');
    failed.forEach(f => {
      console.log(`   - ${f.endpoint}: ${f.error} ${f.status ? `(${f.status})` : ''}`);
    });
  }
  
  if (successful.length === results.length) {
    console.log('\n🎉 All Claude endpoints are working correctly!');
  } else {
    console.log('\n⚠️  Some endpoints need attention. Check the details above.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint };