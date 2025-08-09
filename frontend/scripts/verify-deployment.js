#!/usr/bin/env node

/**
 * SignalDesk Deployment Verification Script
 * Run this after deploying to Vercel to verify everything is working
 * Usage: node scripts/verify-deployment.js [frontend-url]
 */

const https = require('https');
const url = require('url');

// Configuration
const FRONTEND_URL = process.argv[2] || 'https://signaldesk-frontend-23tc8mlwq-nivra-sd.vercel.app';
const BACKEND_URL = 'https://signaldesk-production.up.railway.app/api';
const DEMO_EMAIL = 'demo@signaldesk.com';
const DEMO_PASSWORD = 'demo123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
let authToken = null;

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Test functions
async function testFrontendAccess() {
  console.log(`\n${colors.cyan}Testing Frontend Access...${colors.reset}`);
  testsRun++;
  
  try {
    const urlParts = url.parse(FRONTEND_URL);
    const response = await makeRequest({
      hostname: urlParts.hostname,
      path: '/',
      method: 'GET',
      headers: { 'User-Agent': 'SignalDesk-Verifier' }
    });
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ Frontend is accessible at ${FRONTEND_URL}${colors.reset}`);
      testsPassed++;
      return true;
    } else {
      console.log(`${colors.red}✗ Frontend returned status ${response.status}${colors.reset}`);
      testsFailed++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Failed to access frontend: ${error.message}${colors.reset}`);
    testsFailed++;
    return false;
  }
}

async function testManifest() {
  console.log(`\n${colors.cyan}Testing Manifest.json...${colors.reset}`);
  testsRun++;
  
  try {
    const urlParts = url.parse(FRONTEND_URL);
    const response = await makeRequest({
      hostname: urlParts.hostname,
      path: '/manifest.json',
      method: 'GET',
      headers: { 'User-Agent': 'SignalDesk-Verifier' }
    });
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ Manifest.json is accessible (Status: ${response.status})${colors.reset}`);
      testsPassed++;
      return true;
    } else {
      console.log(`${colors.red}✗ Manifest.json returned status ${response.status}${colors.reset}`);
      testsFailed++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Failed to access manifest.json: ${error.message}${colors.reset}`);
    testsFailed++;
    return false;
  }
}

async function testBackendHealth() {
  console.log(`\n${colors.cyan}Testing Backend Health...${colors.reset}`);
  testsRun++;
  
  try {
    const urlParts = url.parse(BACKEND_URL);
    const response = await makeRequest({
      hostname: urlParts.hostname,
      path: '/api/health',
      method: 'GET',
      headers: { 
        'User-Agent': 'SignalDesk-Verifier',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ Backend is healthy${colors.reset}`);
      console.log(`  Database: ${response.data.database || 'N/A'}`);
      console.log(`  Claude API: ${response.data.claudeApi || 'N/A'}`);
      testsPassed++;
      return true;
    } else {
      console.log(`${colors.red}✗ Backend health check failed (Status: ${response.status})${colors.reset}`);
      testsFailed++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Failed to connect to backend: ${error.message}${colors.reset}`);
    testsFailed++;
    return false;
  }
}

async function testCORS() {
  console.log(`\n${colors.cyan}Testing CORS Configuration...${colors.reset}`);
  testsRun++;
  
  try {
    const urlParts = url.parse(BACKEND_URL);
    const response = await makeRequest({
      hostname: urlParts.hostname,
      path: '/api/test',
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
    };
    
    if (corsHeaders['Access-Control-Allow-Origin']) {
      console.log(`${colors.green}✓ CORS is properly configured${colors.reset}`);
      console.log(`  Allow-Origin: ${corsHeaders['Access-Control-Allow-Origin']}`);
      console.log(`  Allow-Methods: ${corsHeaders['Access-Control-Allow-Methods']}`);
      testsPassed++;
      return true;
    } else {
      console.log(`${colors.red}✗ CORS headers not found${colors.reset}`);
      testsFailed++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ CORS test failed: ${error.message}${colors.reset}`);
    testsFailed++;
    return false;
  }
}

async function testLogin() {
  console.log(`\n${colors.cyan}Testing Authentication...${colors.reset}`);
  testsRun++;
  
  try {
    const urlParts = url.parse(BACKEND_URL);
    const postData = JSON.stringify({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD
    });
    
    const response = await makeRequest({
      hostname: urlParts.hostname,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Origin': FRONTEND_URL
      }
    }, postData);
    
    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      console.log(`${colors.green}✓ Login successful${colors.reset}`);
      console.log(`  User: ${response.data.user.email}`);
      console.log(`  Token: ${authToken.substring(0, 20)}...`);
      testsPassed++;
      return true;
    } else {
      console.log(`${colors.red}✗ Login failed (Status: ${response.status})${colors.reset}`);
      if (response.data.error) {
        console.log(`  Error: ${response.data.error}`);
      }
      testsFailed++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Login test failed: ${error.message}${colors.reset}`);
    testsFailed++;
    return false;
  }
}

async function testProtectedEndpoint() {
  if (!authToken) {
    console.log(`\n${colors.yellow}⚠ Skipping protected endpoint test (no auth token)${colors.reset}`);
    return false;
  }
  
  console.log(`\n${colors.cyan}Testing Protected Endpoints...${colors.reset}`);
  testsRun++;
  
  try {
    const urlParts = url.parse(BACKEND_URL);
    const response = await makeRequest({
      hostname: urlParts.hostname,
      path: '/api/projects',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      }
    });
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ Protected endpoints are accessible${colors.reset}`);
      console.log(`  Projects endpoint returned: ${Array.isArray(response.data) ? response.data.length : 0} items`);
      testsPassed++;
      return true;
    } else {
      console.log(`${colors.red}✗ Protected endpoint returned status ${response.status}${colors.reset}`);
      testsFailed++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Protected endpoint test failed: ${error.message}${colors.reset}`);
    testsFailed++;
    return false;
  }
}

async function testEnvironmentVariables() {
  console.log(`\n${colors.cyan}Checking Environment Configuration...${colors.reset}`);
  
  console.log(`\n${colors.blue}Frontend Configuration:${colors.reset}`);
  console.log(`  URL: ${FRONTEND_URL}`);
  console.log(`  Expected API URL env var: REACT_APP_API_URL=${BACKEND_URL}`);
  
  console.log(`\n${colors.blue}Backend Configuration:${colors.reset}`);
  console.log(`  URL: ${BACKEND_URL}`);
  console.log(`  Required env vars:`);
  console.log(`    - ANTHROPIC_API_KEY (for AI features)`);
  console.log(`    - DATABASE_URL (for PostgreSQL)`);
  console.log(`    - JWT_SECRET (for authentication)`);
  
  console.log(`\n${colors.blue}Vercel Settings:${colors.reset}`);
  console.log(`  1. Go to: https://vercel.com/dashboard`);
  console.log(`  2. Select your SignalDesk project`);
  console.log(`  3. Go to Settings -> Environment Variables`);
  console.log(`  4. Ensure REACT_APP_API_URL is set to: ${BACKEND_URL}`);
  
  return true;
}

// Main execution
async function runTests() {
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bright}SignalDesk Deployment Verification${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`\nFrontend URL: ${colors.cyan}${FRONTEND_URL}${colors.reset}`);
  console.log(`Backend URL: ${colors.cyan}${BACKEND_URL}${colors.reset}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Run tests
  await testFrontendAccess();
  await testManifest();
  await testBackendHealth();
  await testCORS();
  await testLogin();
  await testProtectedEndpoint();
  await testEnvironmentVariables();
  
  // Summary
  console.log(`\n${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bright}Test Summary${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`Total Tests: ${testsRun}`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  
  if (testsFailed === 0) {
    console.log(`\n${colors.bright}${colors.green}✓ All tests passed! Deployment is working correctly.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bright}${colors.red}✗ Some tests failed. Please check the errors above.${colors.reset}`);
    console.log(`\n${colors.yellow}Common fixes:${colors.reset}`);
    console.log(`1. Ensure environment variables are set in Vercel dashboard`);
    console.log(`2. Redeploy the frontend after updating vercel.json`);
    console.log(`3. Check that the Railway backend is running`);
    console.log(`4. Verify CORS settings in backend/index.js`);
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});

// Run the tests
runTests();