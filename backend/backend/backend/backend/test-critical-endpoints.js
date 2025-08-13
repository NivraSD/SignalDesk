#!/usr/bin/env node

/**
 * CRITICAL ENDPOINTS TEST
 * Run this before EVERY deployment to ensure login and other critical features work
 * Usage: node test-critical-endpoints.js [production|local]
 */

const https = require('https');
const http = require('http');

const env = process.argv[2] || 'production';
const BASE_URL = env === 'local' 
  ? 'http://localhost:3000' 
  : 'https://signal-desk.vercel.app';

console.log(`\n🔍 Testing critical endpoints on ${BASE_URL}\n`);

// Color output helpers
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = [];

// HTTP request helper
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test functions
async function testLogin() {
  console.log('📍 Testing LOGIN endpoint...');
  totalTests++;
  
  try {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'demo@signaldesk.com',
        password: 'demo123'
      }
    });

    if (response.status === 200 && response.data.success && response.data.token) {
      console.log(green('  ✅ Login endpoint working'));
      console.log(`     Token received: ${response.data.token.substring(0, 20)}...`);
      passedTests++;
      return response.data.token;
    } else {
      throw new Error(`Invalid response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(red('  ❌ Login endpoint FAILED'));
    console.log(`     Error: ${error.message}`);
    failedTests.push('Login');
    return null;
  }
}

async function testAuthVerify(token) {
  console.log('\n📍 Testing AUTH VERIFY endpoint...');
  totalTests++;
  
  if (!token) {
    console.log(yellow('  ⚠️  Skipping - no auth token available'));
    return;
  }
  
  try {
    const response = await makeRequest('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 200 && (response.data.user || response.data.success)) {
      console.log(green('  ✅ Auth verify endpoint working'));
      if (response.data.user) {
        console.log(`     User: ${response.data.user.email}`);
      } else {
        console.log(`     User ID: ${response.data.userId}`);
      }
      passedTests++;
    } else {
      throw new Error(`Invalid response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(red('  ❌ Auth verify endpoint FAILED'));
    console.log(`     Error: ${error.message}`);
    failedTests.push('Auth Verify');
  }
}

async function testContentGeneration(token) {
  console.log('\n📍 Testing CONTENT GENERATION endpoint...');
  totalTests++;
  
  if (!token) {
    console.log(yellow('  ⚠️  Skipping - no auth token available'));
    return;
  }
  
  try {
    const response = await makeRequest('/api/content/ai-generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: {
        type: 'press-release',
        prompt: 'Test content generation',
        tone: 'professional'
      }
    });

    if (response.status === 200 && response.data.success && response.data.content) {
      console.log(green('  ✅ Content generation endpoint working'));
      console.log(`     AI Model: ${response.data.metadata?.ai_model || 'unknown'}`);
      console.log(`     Powered by: ${response.data.metadata?.powered_by || 'unknown'}`);
      passedTests++;
    } else {
      throw new Error(`Invalid response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(red('  ❌ Content generation endpoint FAILED'));
    console.log(`     Error: ${error.message}`);
    failedTests.push('Content Generation');
  }
}

async function testHealthCheck() {
  console.log('\n📍 Testing HEALTH CHECK endpoint...');
  totalTests++;
  
  try {
    const response = await makeRequest('/api/health');

    if (response.status === 200) {
      console.log(green('  ✅ Health check endpoint working'));
      passedTests++;
    } else {
      throw new Error(`Status ${response.status}`);
    }
  } catch (error) {
    console.log(red('  ❌ Health check endpoint FAILED'));
    console.log(`     Error: ${error.message}`);
    failedTests.push('Health Check');
  }
}

async function testProjectEndpoints(token) {
  console.log('\n📍 Testing PROJECT endpoints...');
  totalTests++;
  
  if (!token) {
    console.log(yellow('  ⚠️  Skipping - no auth token available'));
    return;
  }
  
  try {
    const response = await makeRequest('/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      console.log(green('  ✅ Projects endpoint working'));
      passedTests++;
    } else {
      throw new Error(`Status ${response.status}`);
    }
  } catch (error) {
    console.log(red('  ❌ Projects endpoint FAILED'));
    console.log(`     Error: ${error.message}`);
    failedTests.push('Projects');
  }
}

// Main test runner
async function runTests() {
  console.log('━'.repeat(50));
  console.log('🚀 CRITICAL ENDPOINTS TEST SUITE');
  console.log('━'.repeat(50));
  
  // Test login first (most critical)
  const token = await testLogin();
  
  // Test other endpoints
  await testAuthVerify(token);
  await testHealthCheck();
  await testProjectEndpoints(token);
  await testContentGeneration(token);
  
  // Summary
  console.log('\n' + '━'.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('━'.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${green(passedTests)}`);
  console.log(`Failed: ${red(failedTests.length)}`);
  
  if (failedTests.length > 0) {
    console.log(`\n${red('⚠️  FAILED TESTS:')}`);
    failedTests.forEach(test => {
      console.log(`  - ${test}`);
    });
    console.log(`\n${red('🛑 DO NOT DEPLOY! Critical endpoints are broken.')}`);
    process.exit(1);
  } else {
    console.log(`\n${green('✅ All critical endpoints are working! Safe to deploy.')}`);
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error(red(`\n❌ Test suite failed: ${error.message}`));
  process.exit(1);
});