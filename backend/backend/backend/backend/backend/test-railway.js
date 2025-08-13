// Test Railway deployment
const axios = require('axios');

const RAILWAY_URL = 'https://signaldesk-production.up.railway.app';

async function testRailway() {
  console.log('🧪 Testing Railway deployment...\n');
  
  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      url: '/api/health'
    },
    {
      name: 'Login',
      method: 'POST',
      url: '/api/auth/login',
      data: {
        email: 'demo@signaldesk.com',
        password: 'password'
      }
    },
    {
      name: 'Get Opportunities',
      method: 'GET',
      url: '/api/monitoring/v2/opportunities',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const config = {
        method: test.method,
        url: `${RAILWAY_URL}${test.url}`,
        headers: test.headers || {},
        data: test.data,
        timeout: 10000
      };
      
      const response = await axios(config);
      console.log(`✅ ${test.name}: SUCCESS`);
      
      if (test.name === 'Get Opportunities') {
        console.log(`   Found ${response.data.opportunities?.length || 0} opportunities`);
      }
      if (test.name === 'Health Check') {
        console.log(`   Status: ${response.data.status}`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED`);
      console.log(`   Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data).substring(0, 100)}`);
      }
    }
    console.log('');
  }
  
  console.log('✅ Test complete!');
}

testRailway();