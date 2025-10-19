// Test script to verify all missing endpoints have been implemented
// This tests the comprehensive solution for 404 errors

const API_BASE_URL = process.env.API_BASE_URL || 'https://signaldesk-production-b876.up.railway.app/api';
console.log('🧪 Testing API endpoints at:', API_BASE_URL);

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 second timeout
  retryAttempts: 3,
  retryDelay: 2000
};

// Mock authentication token (you'll need a real one)
const AUTH_TOKEN = 'mock-token-for-testing'; // Replace with real token if needed

async function testEndpoint(name, endpoint, method = 'GET', body = null, expectedStatus = 200) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  for (let attempt = 1; attempt <= TEST_CONFIG.retryAttempts; attempt++) {
    try {
      console.log(`\n🔍 Testing: ${name}`);
      console.log(`   ${method} ${endpoint}`);
      
      const response = await fetch(url, options);
      
      if (response.status === 404) {
        console.log(`   ❌ FAILED: 404 Not Found`);
        return false;
      } else if (response.status === expectedStatus || (response.status >= 200 && response.status < 300)) {
        console.log(`   ✅ SUCCESS: ${response.status}`);
        return true;
      } else if (response.status === 401 && endpoint.includes('/media/') || endpoint.includes('/campaign/') || endpoint.includes('/ai/')) {
        console.log(`   ⚠️  AUTH REQUIRED: ${response.status} (Expected for protected routes)`);
        return true; // This is expected for auth-required endpoints
      } else {
        console.log(`   ⚠️  STATUS: ${response.status} (Attempt ${attempt}/${TEST_CONFIG.retryAttempts})`);
        if (attempt === TEST_CONFIG.retryAttempts) {
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.retryDelay));
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message} (Attempt ${attempt}/${TEST_CONFIG.retryAttempts})`);
      if (attempt === TEST_CONFIG.retryAttempts) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.retryDelay));
    }
  }
  return false;
}

async function runComprehensiveEndpointTest() {
  console.log('🚀 COMPREHENSIVE ENDPOINT TEST - Verifying all missing endpoints are now implemented');
  console.log('=' .repeat(80));
  
  const testResults = [];
  let totalTests = 0;
  let passedTests = 0;
  
  // ===== CRITICAL ENDPOINTS =====
  console.log('\n🔴 CRITICAL ENDPOINTS (Must Never Return 404)');
  
  const criticalEndpoints = [
    ['Login', '/auth/login', 'POST', { email: 'demo@signaldesk.com', password: 'demo123' }],
    ['Auth Verify', '/auth/verify', 'GET'],
    ['Projects List', '/projects', 'GET'],
  ];
  
  for (const [name, endpoint, method, body] of criticalEndpoints) {
    totalTests++;
    const result = await testEndpoint(name, endpoint, method, body);
    testResults.push({ name, endpoint, method, result, category: 'CRITICAL' });
    if (result) passedTests++;
  }
  
  // ===== MEDIA ENDPOINTS =====
  console.log('\n📰 MEDIA ENDPOINTS (Previously Missing)');
  
  const mediaEndpoints = [
    ['Media Discover', '/media/discover', 'POST', { query: 'technology', limit: 5 }],
    ['Generate Pitch Angles', '/media/generate-pitch-angles', 'POST', { announcement: 'Product launch', topic: 'Technology' }],
    ['Media-List Contacts', '/media-list/contacts', 'POST', { name: 'Test Reporter', email: 'test@example.com' }],
    ['Media Search Reporters', '/media/search-reporters', 'POST', { query: 'tech journalists' }],
    ['Media Lists', '/media/lists', 'GET'],
  ];
  
  for (const [name, endpoint, method, body] of mediaEndpoints) {
    totalTests++;
    const result = await testEndpoint(name, endpoint, method, body);
    testResults.push({ name, endpoint, method, result, category: 'MEDIA' });
    if (result) passedTests++;
  }
  
  // ===== CAMPAIGN ENDPOINTS =====
  console.log('\n📊 CAMPAIGN ENDPOINTS (Previously Missing)');
  
  const campaignEndpoints = [
    ['Generate Strategic Report', '/campaigns/generate-strategic-report', 'POST', { campaignType: 'product-launch', brief: 'New tech product' }],
    ['Campaign Insights', '/campaign/insights/123', 'GET'], // Note: singular 'campaign'
  ];
  
  for (const [name, endpoint, method, body] of campaignEndpoints) {
    totalTests++;
    const result = await testEndpoint(name, endpoint, method, body);
    testResults.push({ name, endpoint, method, result, category: 'CAMPAIGN' });
    if (result) passedTests++;
  }
  
  // ===== MEMORYVAULT ENDPOINTS =====
  console.log('\n🧠 MEMORYVAULT ENDPOINTS (Previously Missing)');
  
  const memoryvaultEndpoints = [
    ['Memory Vault Project GET', '/memoryvault/project?projectId=123', 'GET'],
    ['Memory Vault Project POST', '/memoryvault/project?projectId=123', 'POST', { title: 'Test Item', content: 'Test content' }],
    ['Project Memory Vault GET', '/projects/123/memoryvault', 'GET'],
    ['Project Memory Vault POST', '/projects/123/memoryvault', 'POST', { title: 'Test Item', content: 'Test content' }],
  ];
  
  for (const [name, endpoint, method, body] of memoryvaultEndpoints) {
    totalTests++;
    const result = await testEndpoint(name, endpoint, method, body);
    testResults.push({ name, endpoint, method, result, category: 'MEMORYVAULT' });
    if (result) passedTests++;
  }
  
  // ===== AI ENDPOINTS =====
  console.log('\n🤖 AI ENDPOINTS (Previously Missing)');
  
  const aiEndpoints = [
    ['AI Assistant', '/ai/assistant', 'POST', { message: 'Hello', context: 'testing' }],
    ['AI Analyze', '/ai/analyze', 'POST', { content: 'Sample content to analyze' }],
    ['Crisis Advisor', '/crisis/advisor', 'POST', { situation: 'Test crisis situation' }],
  ];
  
  for (const [name, endpoint, method, body] of aiEndpoints) {
    totalTests++;
    const result = await testEndpoint(name, endpoint, method, body);
    testResults.push({ name, endpoint, method, result, category: 'AI' });
    if (result) passedTests++;
  }
  
  // ===== REPORTS & MONITORING ENDPOINTS =====
  console.log('\n📋 REPORTS & MONITORING ENDPOINTS (Previously Missing)');
  
  const reportsEndpoints = [
    ['Generate Report', '/reports/generate', 'POST', { type: 'campaign-summary', projectId: '123' }],
    ['Monitoring Chat Analyze', '/monitoring/chat-analyze', 'POST', { query: 'brand monitoring', context: 'social media' }],
  ];
  
  for (const [name, endpoint, method, body] of reportsEndpoints) {
    totalTests++;
    const result = await testEndpoint(name, endpoint, method, body);
    testResults.push({ name, endpoint, method, result, category: 'REPORTS' });
    if (result) passedTests++;
  }
  
  // ===== PROXY ENDPOINTS =====
  console.log('\n🌐 PROXY ENDPOINTS (Previously Missing)');
  
  const proxyEndpoints = [
    ['Analyze Website', '/proxy/analyze-website', 'POST', { url: 'https://example.com', analysisType: 'general' }],
    ['PR Newswire', '/proxy/pr-newswire', 'POST', { keywords: 'technology', limit: 5 }],
    ['RSS Feeds', '/proxy/rss', 'POST', { feeds: ['tech-news'], keywords: 'innovation' }],
  ];
  
  for (const [name, endpoint, method, body] of proxyEndpoints) {
    totalTests++;
    const result = await testEndpoint(name, endpoint, method, body);
    testResults.push({ name, endpoint, method, result, category: 'PROXY' });
    if (result) passedTests++;
  }
  
  // ===== FINAL RESULTS =====
  console.log('\n' + '=' .repeat(80));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('=' .repeat(80));
  
  const categories = {};
  testResults.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = { passed: 0, total: 0 };
    }
    categories[test.category].total++;
    if (test.result) categories[test.category].passed++;
  });
  
  console.log('\nResults by Category:');
  Object.entries(categories).forEach(([category, stats]) => {
    const percentage = Math.round((stats.passed / stats.total) * 100);
    const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
    console.log(`${status} ${category}: ${stats.passed}/${stats.total} (${percentage}%)`);
  });
  
  console.log(`\n📈 OVERALL RESULTS: ${passedTests}/${totalTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! No more 404 errors expected.');
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} endpoints still need attention.`);
  }
  
  // Show failed tests
  const failedTests = testResults.filter(test => !test.result);
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`   ${test.method} ${test.endpoint} - ${test.name}`);
    });
  }
  
  console.log('\n✅ TEST COMPLETE');
  return { totalTests, passedTests, testResults };
}

// Run the test if this file is executed directly
if (require.main === module) {
  runComprehensiveEndpointTest()
    .then(results => {
      process.exit(results.passedTests === results.totalTests ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveEndpointTest, testEndpoint };