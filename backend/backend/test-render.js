// Test Render deployment
const axios = require('axios');

// UPDATE THIS URL after Render gives you one
// It will be something like: https://signaldesk-backend-xxxx.onrender.com
const RENDER_URL = 'https://YOUR-APP-NAME.onrender.com';

async function testRender() {
  console.log('🧪 Testing Render deployment...\n');
  
  if (RENDER_URL.includes('YOUR-APP-NAME')) {
    console.log('⚠️  Please update RENDER_URL with your actual Render URL');
    console.log('You\'ll find it in the Render dashboard after deployment');
    return;
  }
  
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
        url: `${RENDER_URL}${test.url}`,
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
    }
    console.log('');
  }
  
  console.log('✅ Test complete!');
}

testRender();