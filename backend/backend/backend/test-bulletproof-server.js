#!/usr/bin/env node

// Test script for the bulletproof SignalDesk server
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
console.log('🧪 Testing SignalDesk API at:', BASE_URL);

async function testAPI() {
  const tests = [];
  
  // Test 1: Root endpoint
  tests.push({
    name: 'Root endpoint',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/`);
      return response.status === 200 && response.data.message;
    }
  });

  // Test 2: Health check
  tests.push({
    name: 'Health check',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/api/health`);
      return response.status === 200 && response.data.status === 'ok';
    }
  });

  // Test 3: CORS test
  tests.push({
    name: 'CORS test',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/api/test`, {
        headers: {
          'Origin': 'http://localhost:3001'
        }
      });
      return response.status === 200 && response.data.success;
    }
  });

  // Test 4: Demo user login with demo123
  tests.push({
    name: 'Demo user login (demo123)',
    test: async () => {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'demo@signaldesk.com',
        password: 'demo123'
      });
      return response.status === 200 && response.data.success && response.data.token;
    }
  });

  // Test 5: Demo user login with password
  tests.push({
    name: 'Demo user login (password)',
    test: async () => {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'demo@signaldesk.com',
        password: 'password'
      });
      return response.status === 200 && response.data.success && response.data.token;
    }
  });

  // Test 6: Get token and verify
  let authToken = null;
  tests.push({
    name: 'Token verification',
    test: async () => {
      // First get token
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'demo@signaldesk.com',
        password: 'demo123'
      });
      
      authToken = loginResponse.data.token;
      
      // Then verify it
      const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      return verifyResponse.status === 200 && verifyResponse.data.valid;
    }
  });

  // Test 7: Get projects (should work even without auth due to fallbacks)
  tests.push({
    name: 'Get projects',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/api/projects`, {
        headers: authToken ? {
          'Authorization': `Bearer ${authToken}`
        } : {}
      });
      return response.status === 200 && response.data.success;
    }
  });

  // Test 8: Get todos (should work even without auth due to fallbacks)
  tests.push({
    name: 'Get todos',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/api/todos`, {
        headers: authToken ? {
          'Authorization': `Bearer ${authToken}`
        } : {}
      });
      return response.status === 200 && response.data.success;
    }
  });

  // Run all tests
  let passed = 0;
  let failed = 0;

  console.log('\n🏁 Running tests...\n');

  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.log(`❌ ${name} - Test condition failed`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${name} - ${error.response?.status || error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Server is bulletproof! 🎉');
  } else {
    console.log('⚠️  Some tests failed. Check the server configuration.');
  }

  return failed === 0;
}

// Run tests if called directly
if (require.main === module) {
  testAPI().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testAPI };