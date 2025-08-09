#!/usr/bin/env node

/**
 * Test script for Railway SignalDesk backend login
 * Tests both production Railway URL and local development
 */

const RAILWAY_URL = 'https://signaldesk-production.up.railway.app';
const LOCAL_URL = 'http://localhost:3000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test credentials
const TEST_CREDENTIALS = {
  demo: {
    email: 'demo@signaldesk.com',
    password: 'Demo123'
  },
  invalid: {
    email: 'invalid@test.com',
    password: 'wrongpassword'
  }
};

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      networkError: true
    };
  }
}

// Test health endpoint
async function testHealth(baseUrl) {
  console.log(`\n${colors.cyan}Testing health endpoint...${colors.reset}`);
  
  const response = await makeRequest(`${baseUrl}/api/health`);
  
  if (response.ok) {
    console.log(`${colors.green}✓ Health check passed${colors.reset}`);
    console.log(`  Status: ${response.data.status}`);
    console.log(`  Environment: ${response.data.environment}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Health check failed${colors.reset}`);
    console.log(`  Status: ${response.status} ${response.statusText}`);
    if (response.error) {
      console.log(`  Error: ${response.error}`);
    }
    return false;
  }
}

// Test login endpoint
async function testLogin(baseUrl, credentials, description) {
  console.log(`\n${colors.cyan}Testing login: ${description}${colors.reset}`);
  console.log(`  Email: ${credentials.email}`);
  console.log(`  Password: ${credentials.password.replace(/./g, '*')}`);
  
  const response = await makeRequest(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  
  if (response.networkError) {
    console.log(`${colors.red}✗ Network error: ${response.error}${colors.reset}`);
    return null;
  }
  
  if (response.ok) {
    console.log(`${colors.green}✓ Login successful${colors.reset}`);
    if (response.data.token) {
      console.log(`  Token: ${response.data.token.substring(0, 20)}...`);
    }
    if (response.data.user) {
      console.log(`  User: ${response.data.user.email} (${response.data.user.name})`);
    }
    if (response.data.message) {
      console.log(`  Message: ${response.data.message}`);
    }
    return response.data.token;
  } else {
    console.log(`${colors.red}✗ Login failed${colors.reset}`);
    console.log(`  Status: ${response.status} ${response.statusText}`);
    if (response.data.error) {
      console.log(`  Error: ${response.data.error}`);
    }
    if (response.data.raw) {
      console.log(`  Raw response: ${response.data.raw.substring(0, 200)}`);
    }
    return null;
  }
}

// Test token verification
async function testVerify(baseUrl, token) {
  console.log(`\n${colors.cyan}Testing token verification...${colors.reset}`);
  
  const response = await makeRequest(`${baseUrl}/api/auth/verify`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    console.log(`${colors.green}✓ Token is valid${colors.reset}`);
    if (response.data.user) {
      console.log(`  User: ${response.data.user.email}`);
    }
    return true;
  } else {
    console.log(`${colors.red}✗ Token verification failed${colors.reset}`);
    console.log(`  Status: ${response.status}`);
    if (response.data.error) {
      console.log(`  Error: ${response.data.error}`);
    }
    return false;
  }
}

// Test Claude AI endpoint (if token is valid)
async function testClaude(baseUrl, token) {
  console.log(`\n${colors.cyan}Testing Claude AI integration...${colors.reset}`);
  
  const testPrompt = {
    prompt: "Hello Claude, are you working?",
    context: "Testing SignalDesk integration"
  };
  
  const response = await makeRequest(`${baseUrl}/api/content/ai-generate-claude`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(testPrompt)
  });
  
  if (response.ok) {
    console.log(`${colors.green}✓ Claude AI is responding${colors.reset}`);
    if (response.data.content) {
      console.log(`  Response: ${response.data.content.substring(0, 100)}...`);
    }
    return true;
  } else {
    console.log(`${colors.yellow}⚠ Claude AI endpoint not responding${colors.reset}`);
    console.log(`  Status: ${response.status}`);
    if (response.data.error) {
      console.log(`  Error: ${response.data.error}`);
    }
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.magenta}SignalDesk Railway Login Test Suite${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  
  // Test Railway deployment
  console.log(`\n${colors.blue}Testing Railway Deployment${colors.reset}`);
  console.log(`URL: ${RAILWAY_URL}`);
  
  const railwayHealthy = await testHealth(RAILWAY_URL);
  
  if (railwayHealthy) {
    // Test demo user login
    const demoToken = await testLogin(RAILWAY_URL, TEST_CREDENTIALS.demo, 'Demo User');
    
    if (demoToken) {
      await testVerify(RAILWAY_URL, demoToken);
      await testClaude(RAILWAY_URL, demoToken);
    }
    
    // Test invalid login
    await testLogin(RAILWAY_URL, TEST_CREDENTIALS.invalid, 'Invalid Credentials');
  } else {
    console.log(`${colors.red}Skipping login tests - backend not healthy${colors.reset}`);
  }
  
  // Summary
  console.log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.magenta}Test Summary${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  
  if (railwayHealthy) {
    console.log(`${colors.green}✓ Railway backend is operational${colors.reset}`);
    console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
    console.log('1. Run the SQL commands in add-demo-user.sql to add demo user to database');
    console.log('2. Check Railway logs: railway logs --service=signaldesk');
    console.log('3. Verify DATABASE_URL is set in Railway environment variables');
    console.log('4. Ensure ANTHROPIC_API_KEY is set for Claude AI features');
  } else {
    console.log(`${colors.red}✗ Railway backend is not responding${colors.reset}`);
    console.log(`\n${colors.yellow}Troubleshooting:${colors.reset}`);
    console.log('1. Check deployment status: railway status');
    console.log('2. View logs: railway logs --service=signaldesk');
    console.log('3. Restart service: railway restart');
    console.log('4. Check environment variables: railway variables');
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite error: ${error.message}${colors.reset}`);
  process.exit(1);
});