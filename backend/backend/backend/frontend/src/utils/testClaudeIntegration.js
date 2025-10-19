// Test utility to verify all Claude API integrations are working correctly
import API_BASE_URL from '../config/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const testClaudeIntegrations = async () => {
  console.log('🧪 Testing Claude Integrations with API:', API_BASE_URL);
  console.log('==========================================');
  
  const results = {
    passed: [],
    failed: [],
    total: 0
  };

  // Test endpoints that should work with Claude
  const tests = [
    {
      name: 'Content Generation',
      endpoint: '/content/ai-generate',
      method: 'POST',
      body: {
        type: 'press-release',
        prompt: 'Test content generation',
        tone: 'professional'
      }
    },
    {
      name: 'Crisis Advisor',
      endpoint: '/crisis/advisor',
      method: 'POST',
      body: {
        query: 'Test crisis advice',
        context: {
          crisisStatus: 'monitoring',
          severity: 'low'
        }
      }
    },
    {
      name: 'Campaign Strategic Report',
      endpoint: '/campaigns/generate-strategic-report',
      method: 'POST',
      body: {
        campaignType: 'product-launch',
        brief: 'Test campaign brief',
        targetAudience: 'Test audience',
        industry: 'Technology'
      }
    },
    {
      name: 'Media Discovery',
      endpoint: '/media/discover',
      method: 'POST',
      body: {
        searchQuery: 'technology journalists',
        location: 'National',
        publicationType: 'Tech Media'
      }
    },
    {
      name: 'Monitoring Analysis',
      endpoint: '/monitoring/chat-analyze',
      method: 'POST',
      body: {
        query: 'Create monitoring strategy for tech company',
        context: 'Brand monitoring'
      }
    }
  ];

  // Run all tests
  for (const test of tests) {
    results.total++;
    try {
      console.log(`\n📋 Testing: ${test.name}`);
      console.log(`   Endpoint: ${test.endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${test.endpoint}`, {
        method: test.method,
        headers: getAuthHeaders(),
        body: JSON.stringify(test.body)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const isPoweredByClaude = data.metadata?.powered_by === 'Claude AI';
        
        if (isPoweredByClaude) {
          console.log(`   ✅ PASS - Claude AI integration working`);
          results.passed.push({
            name: test.name,
            endpoint: test.endpoint,
            poweredBy: 'Claude AI',
            model: data.metadata?.model
          });
        } else {
          console.log(`   ⚠️  PASS - But using template/fallback, not Claude`);
          results.passed.push({
            name: test.name,
            endpoint: test.endpoint,
            poweredBy: data.metadata?.powered_by || 'Template'
          });
        }
      } else {
        console.log(`   ❌ FAIL - ${data.error || 'Unknown error'}`);
        results.failed.push({
          name: test.name,
          endpoint: test.endpoint,
          error: data.error || response.statusText
        });
      }
    } catch (error) {
      console.log(`   ❌ FAIL - ${error.message}`);
      results.failed.push({
        name: test.name,
        endpoint: test.endpoint,
        error: error.message
      });
    }
  }

  // Print summary
  console.log('\n==========================================');
  console.log('📊 TEST SUMMARY');
  console.log('==========================================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  const claudeTests = results.passed.filter(r => r.poweredBy === 'Claude AI');
  console.log(`🤖 Using Claude AI: ${claudeTests.length}`);
  console.log(`📝 Using Templates: ${results.passed.length - claudeTests.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => {
      console.log(`   - ${test.name}: ${test.error}`);
    });
  }
  
  if (claudeTests.length > 0) {
    console.log('\n🤖 Claude AI Powered Features:');
    claudeTests.forEach(test => {
      console.log(`   - ${test.name}${test.model ? ` (${test.model})` : ''}`);
    });
  }
  
  return results;
};

// Function to test a single component's API integration
export const testComponentAPI = async (componentName, endpoint, requestBody) => {
  console.log(`\n🧪 Testing ${componentName} API Integration`);
  console.log(`   API Base: ${API_BASE_URL}`);
  console.log(`   Endpoint: ${endpoint}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`   ✅ SUCCESS`);
      if (data.metadata?.powered_by) {
        console.log(`   Powered by: ${data.metadata.powered_by}`);
      }
      return { success: true, data };
    } else {
      console.log(`   ❌ FAILED: ${data.error || 'Unknown error'}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testClaudeIntegrations = testClaudeIntegrations;
  window.testComponentAPI = testComponentAPI;
  console.log('💡 Test functions available in console:');
  console.log('   - testClaudeIntegrations() : Test all Claude integrations');
  console.log('   - testComponentAPI(name, endpoint, body) : Test specific component');
}