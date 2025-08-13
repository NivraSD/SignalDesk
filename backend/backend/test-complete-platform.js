// Test COMPLETE SignalDesk Platform on Railway
const axios = require('axios');

const RAILWAY_URL = 'https://signaldesk-production.up.railway.app';
let authToken = null;

async function testCompletePlatform() {
  console.log('🧪 Testing COMPLETE SignalDesk Platform...\n');
  console.log('URL:', RAILWAY_URL);
  console.log('=' .repeat(50));
  
  const tests = [
    // 1. Health Check
    {
      name: '1. Health Check',
      method: 'GET',
      endpoint: '/api/health',
      expectedStatus: 200
    },
    
    // 2. User Authentication
    {
      name: '2. User Login',
      method: 'POST',
      endpoint: '/api/auth/login',
      data: {
        email: 'demo@signaldesk.com',
        password: 'password'
      },
      expectedStatus: 200,
      saveToken: true
    },
    
    // 3. Monitoring Endpoints
    {
      name: '3. Get Opportunities',
      method: 'GET',
      endpoint: '/api/monitoring/v2/opportunities',
      requiresAuth: true,
      expectedStatus: 200
    },
    
    {
      name: '4. Get Monitoring Status',
      method: 'GET',
      endpoint: '/api/monitoring/v2/status',
      requiresAuth: true,
      expectedStatus: 200
    },
    
    // 4. Campaign Management
    {
      name: '5. Get Campaigns',
      method: 'GET',
      endpoint: '/api/campaigns',
      requiresAuth: true,
      expectedStatus: 200
    },
    
    // 5. Project Management
    {
      name: '6. Get Projects',
      method: 'GET',
      endpoint: '/api/projects',
      requiresAuth: true,
      expectedStatus: 200
    },
    
    // 6. Intelligence
    {
      name: '7. Get Intelligence Findings',
      method: 'GET',
      endpoint: '/api/intelligence/findings',
      requiresAuth: true,
      expectedStatus: 200
    },
    
    // 7. Content
    {
      name: '8. Get Content Library',
      method: 'GET',
      endpoint: '/api/content',
      requiresAuth: true,
      expectedStatus: 200
    },
    
    // 8. Orchestrator
    {
      name: '9. Get Orchestration Flows',
      method: 'GET',
      endpoint: '/api/orchestrator/flows',
      requiresAuth: true,
      expectedStatus: 200
    },
    
    // 9. Analytics
    {
      name: '10. Get Analytics',
      method: 'GET',
      endpoint: '/api/analytics/events',
      requiresAuth: true,
      expectedStatus: 200
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: `${RAILWAY_URL}${test.endpoint}`,
        timeout: 10000
      };
      
      if (test.data) {
        config.data = test.data;
      }
      
      if (test.requiresAuth && authToken) {
        config.headers = {
          'Authorization': `Bearer ${authToken}`
        };
      }
      
      const response = await axios(config);
      
      if (test.saveToken && response.data.token) {
        authToken = response.data.token;
      }
      
      console.log(`✅ ${test.name}: PASSED`);
      
      // Show relevant data
      if (test.name.includes('Login')) {
        console.log(`   User: ${response.data.user?.email}`);
      } else if (test.name.includes('Opportunities')) {
        console.log(`   Opportunities: ${response.data.opportunities?.length || 0}`);
      } else if (test.name.includes('Status')) {
        console.log(`   Monitoring: ${response.data.monitoring ? 'Active' : 'Inactive'}`);
      }
      
      passed++;
      
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED`);
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`   Error: Server not responding`);
      } else if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.message || error.message}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
      
      failed++;
    }
    
    console.log('');
  }
  
  console.log('=' .repeat(50));
  console.log('📊 Test Results:');
  console.log(`   Passed: ${passed}/${tests.length}`);
  console.log(`   Failed: ${failed}/${tests.length}`);
  
  if (passed === tests.length) {
    console.log('\n🎉 ALL TESTS PASSED! Platform is fully operational!');
  } else if (passed > 0) {
    console.log('\n⚠️  Some tests passed. Platform is partially operational.');
  } else {
    console.log('\n❌ All tests failed. Check deployment logs.');
  }
}

testCompletePlatform().catch(console.error);