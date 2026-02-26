#!/usr/bin/env node

/**
 * SignalDesk Deployment Verification Script
 * Run this after deployment to verify all services are working correctly
 * Usage: node verify-deployment.js [--production]
 */

const axios = require('axios');
const https = require('https');

// Configuration
const isProduction = process.argv.includes('--production');
const BASE_URL = isProduction 
  ? 'https://signaldesk-production.up.railway.app' 
  : 'http://localhost:3000';

const TEST_USER = {
  email: 'demo@signaldesk.com',
  password: 'demo123'
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results storage
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  
  log(`${icon} ${name}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
  
  if (status === 'pass') results.passed.push(name);
  else if (status === 'fail') results.failed.push({ name, details });
  else results.warnings.push({ name, details });
}

// Create axios instance with timeout
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

// Tests
async function testBasicConnectivity() {
  logSection('1. BASIC CONNECTIVITY');
  
  try {
    const response = await api.get('/');
    logTest('Root endpoint accessible', 'pass', `Version: ${response.data.version}`);
    return true;
  } catch (error) {
    logTest('Root endpoint accessible', 'fail', error.message);
    return false;
  }
}

async function testHealthEndpoints() {
  logSection('2. HEALTH CHECK ENDPOINTS');
  
  // Test quick status
  try {
    const response = await api.get('/api/health/status');
    const status = response.data.status === 'ok' ? 'pass' : 'warn';
    logTest('Health status endpoint', status, `Status: ${response.data.status}`);
    
    if (response.data.services) {
      Object.entries(response.data.services).forEach(([service, status]) => {
        const testStatus = status === 'ok' ? 'pass' : 'fail';
        logTest(`  - ${service} service`, testStatus, status);
      });
    }
  } catch (error) {
    logTest('Health status endpoint', 'fail', error.message);
  }
  
  // Test detailed health
  try {
    const response = await api.get('/api/health/detailed');
    logTest('Detailed health endpoint', 'pass');
    
    // Check Claude status
    const claude = response.data.services?.claude;
    if (claude) {
      if (claude.testResult?.isRealClaude) {
        logTest('Claude AI integration', 'pass', 'Real AI responses confirmed');
      } else if (claude.testResult?.isMockResponse) {
        logTest('Claude AI integration', 'fail', 'Returning mock responses - Check API key');
      } else {
        logTest('Claude AI integration', 'fail', claude.testResult?.error || 'Not working');
      }
      
      // Check API key configuration
      if (!claude.apiKeys?.ANTHROPIC_API_KEY?.exists) {
        logTest('ANTHROPIC_API_KEY', 'fail', 'Not set in environment');
      } else if (claude.apiKeys?.ANTHROPIC_API_KEY?.isPlaceholder) {
        logTest('ANTHROPIC_API_KEY', 'fail', 'Still using placeholder value');
      } else {
        logTest('ANTHROPIC_API_KEY', 'pass', `Key present (${claude.apiKeys.ANTHROPIC_API_KEY.length} chars)`);
      }
    }
    
    // Check database
    const db = response.data.services?.database;
    if (db) {
      if (db.connected) {
        logTest('Database connection', 'pass', `Response time: ${db.responseTime}`);
      } else {
        logTest('Database connection', 'fail', db.error || 'Connection failed');
      }
    }
    
    return response.data;
  } catch (error) {
    logTest('Detailed health endpoint', 'fail', error.message);
    return null;
  }
}

async function testAuthentication() {
  logSection('3. AUTHENTICATION');
  
  try {
    // Test login
    const loginResponse = await api.post('/api/auth/login', TEST_USER);
    
    if (loginResponse.data.success && loginResponse.data.token) {
      logTest('Login endpoint', 'pass', 'Demo user authenticated');
      
      // Store token for subsequent tests
      api.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.token}`;
      
      // Test token verification
      try {
        const verifyResponse = await api.get('/api/auth/verify');
        if (verifyResponse.data.success) {
          logTest('Token verification', 'pass');
          return loginResponse.data.token;
        } else {
          logTest('Token verification', 'fail', 'Invalid response');
        }
      } catch (error) {
        logTest('Token verification', 'fail', error.message);
      }
      
      return loginResponse.data.token;
    } else {
      logTest('Login endpoint', 'fail', 'Authentication failed');
      return null;
    }
  } catch (error) {
    logTest('Login endpoint', 'fail', error.message);
    return null;
  }
}

async function testClaudeEndpoints(token) {
  logSection('4. CLAUDE AI ENDPOINTS');
  
  if (!token) {
    logTest('Claude endpoints', 'skip', 'No authentication token');
    return;
  }
  
  // Test Claude test endpoint
  try {
    const response = await api.get('/api/claude-test');
    if (response.data.claudeIntegrationWorking) {
      logTest('Claude test endpoint', 'pass', 'Claude is working');
    } else {
      logTest('Claude test endpoint', 'fail', response.data.message);
      if (response.data.nextSteps) {
        console.log('\n   Next steps to fix:');
        response.data.nextSteps.forEach(step => console.log(`   ${step}`));
      }
    }
  } catch (error) {
    logTest('Claude test endpoint', 'fail', error.message);
  }
  
  // Test specific features
  const features = [
    { name: 'Crisis Management', endpoint: '/api/claude-test/crisis' },
    { name: 'Content Generation', endpoint: '/api/claude-test/content' },
    { name: 'Media List Builder', endpoint: '/api/claude-test/media' }
  ];
  
  for (const feature of features) {
    try {
      const response = await api.post(feature.endpoint);
      if (response.data.success && response.data.isRealResponse) {
        logTest(feature.name, 'pass', 'Real AI response');
      } else if (response.data.usingFallback) {
        logTest(feature.name, 'warn', 'Using fallback/mock data');
      } else {
        logTest(feature.name, 'fail', 'Not working');
      }
    } catch (error) {
      logTest(feature.name, 'fail', `Error: ${error.message}`);
    }
  }
}

async function testCriticalRoutes(token) {
  logSection('5. CRITICAL FEATURE ROUTES');
  
  if (!token) {
    logTest('Critical routes', 'skip', 'No authentication token');
    return;
  }
  
  const routes = [
    {
      name: 'Crisis Advisor',
      method: 'POST',
      path: '/api/crisis/advisor',
      data: { query: 'Test crisis', context: {} }
    },
    {
      name: 'Content AI Generate',
      method: 'POST',
      path: '/api/content/ai-generate',
      data: { prompt: 'Test content', type: 'general' }
    },
    {
      name: 'Media Search',
      method: 'POST',
      path: '/api/media/search-reporters',
      data: { topic: 'technology', limit: 1 }
    },
    {
      name: 'Campaign Analysis',
      method: 'POST',
      path: '/api/campaigns/analyze',
      data: { campaignType: 'test', goals: 'test' }
    }
  ];
  
  for (const route of routes) {
    try {
      const response = await api({
        method: route.method,
        url: route.path,
        data: route.data
      });
      
      if (response.data.success) {
        // Check if response contains real data or mock
        const responseStr = JSON.stringify(response.data);
        if (responseStr.includes('mock') || responseStr.includes('fallback')) {
          logTest(route.name, 'warn', 'Returns mock data');
        } else {
          logTest(route.name, 'pass', 'Working with real data');
        }
      } else {
        logTest(route.name, 'fail', 'Request failed');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        logTest(route.name, 'fail', 'Route not found (404)');
      } else {
        logTest(route.name, 'fail', error.message);
      }
    }
  }
}

async function generateReport() {
  logSection('DEPLOYMENT VERIFICATION REPORT');
  
  const total = results.passed.length + results.failed.length + results.warnings.length;
  const passRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;
  
  console.log('\n📊 Summary:');
  log(`  ✅ Passed: ${results.passed.length}`, colors.green);
  log(`  ⚠️  Warnings: ${results.warnings.length}`, colors.yellow);
  log(`  ❌ Failed: ${results.failed.length}`, colors.red);
  console.log(`  📈 Pass Rate: ${passRate}%`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => {
      log(`  - ${test.name}`, colors.red);
      if (test.details) console.log(`    ${test.details}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(test => {
      log(`  - ${test.name}`, colors.yellow);
      if (test.details) console.log(`    ${test.details}`);
    });
  }
  
  // Critical issues
  console.log('\n🔧 Action Items:');
  
  const hasClaude = results.passed.some(test => test.includes('Claude') || test.includes('ANTHROPIC'));
  if (!hasClaude) {
    log('  1. CRITICAL: Set ANTHROPIC_API_KEY in Railway environment variables', colors.red);
    console.log('     - Go to Railway Dashboard > Variables');
    console.log('     - Add ANTHROPIC_API_KEY with your key from https://console.anthropic.com/');
    console.log('     - Redeploy the service');
  }
  
  const hasDb = results.passed.some(test => test.includes('Database'));
  if (!hasDb) {
    log('  2. CRITICAL: Database connection failed', colors.red);
    console.log('     - Check DATABASE_URL in Railway environment');
    console.log('     - Verify PostgreSQL service is running');
  }
  
  if (results.warnings.length > 0) {
    log('  3. WARNING: Some features using mock data', colors.yellow);
    console.log('     - This usually means Claude API key is not configured');
  }
  
  // Overall status
  console.log('\n' + '='.repeat(60));
  if (results.failed.length === 0 && results.warnings.length === 0) {
    log('🎉 DEPLOYMENT VERIFICATION: PASSED', colors.bright + colors.green);
    log('All systems operational!', colors.green);
  } else if (results.failed.length === 0) {
    log('⚠️  DEPLOYMENT VERIFICATION: PASSED WITH WARNINGS', colors.bright + colors.yellow);
    log('System operational but some features degraded', colors.yellow);
  } else {
    log('❌ DEPLOYMENT VERIFICATION: FAILED', colors.bright + colors.red);
    log('Critical issues detected - immediate action required', colors.red);
  }
  console.log('='.repeat(60));
  
  // Exit code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Main execution
async function main() {
  console.clear();
  log('🚀 SignalDesk Deployment Verification', colors.bright + colors.blue);
  log(`📍 Testing: ${BASE_URL}`, colors.cyan);
  log(`🔧 Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`, colors.cyan);
  
  // Run tests in sequence
  const canConnect = await testBasicConnectivity();
  
  if (!canConnect) {
    log('\n❌ Cannot connect to server. Aborting tests.', colors.red);
    if (isProduction) {
      console.log('\nTroubleshooting steps:');
      console.log('1. Check if Railway deployment is active');
      console.log('2. Verify the URL is correct');
      console.log('3. Check Railway logs for errors');
    } else {
      console.log('\nMake sure the server is running locally with: npm start');
    }
    process.exit(1);
  }
  
  const healthData = await testHealthEndpoints();
  const token = await testAuthentication();
  await testClaudeEndpoints(token);
  await testCriticalRoutes(token);
  
  // Generate final report
  await generateReport();
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});

// Run the verification
main().catch(error => {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
});