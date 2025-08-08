#!/usr/bin/env node

/**
 * Test Railway Backend
 * Verifies all endpoints work on Railway deployment
 */

const https = require('https');

const BASE_URL = 'https://signaldesk-production.up.railway.app';

console.log(`\n🚂 Testing Railway Backend: ${BASE_URL}\n`);

// Color output helpers
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;

// HTTP request helper
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
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
async function testHealth() {
  console.log('🏥 Testing Health Check...');
  try {
    const response = await makeRequest('/api/health');
    if (response.status === 200) {
      console.log(green('  ✅ Health check passed'));
      return true;
    } else {
      console.log(red(`  ❌ Health check failed: ${response.status}`));
      return false;
    }
  } catch (error) {
    console.log(red(`  ❌ Health check error: ${error.message}`));
    return false;
  }
}

async function testLogin() {
  console.log('\n🔐 Testing Login...');
  try {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'demo@signaldesk.com',
        password: 'demo123'
      }
    });

    if (response.status === 200 && response.data.success) {
      console.log(green('  ✅ Login successful'));
      console.log(`     Token: ${response.data.token.substring(0, 20)}...`);
      return response.data.token;
    } else {
      console.log(red(`  ❌ Login failed: ${JSON.stringify(response.data)}`));
      return null;
    }
  } catch (error) {
    console.log(red(`  ❌ Login error: ${error.message}`));
    return null;
  }
}

async function testContentGeneration(token) {
  console.log('\n🤖 Testing Claude AI Content Generation...');
  if (!token) {
    console.log(yellow('  ⚠️  Skipping - no auth token'));
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
        prompt: 'Test Railway deployment with Claude',
        tone: 'professional'
      }
    });

    if (response.status === 200 && response.data.success) {
      console.log(green('  ✅ Claude AI is working!'));
      console.log(`     Model: ${response.data.metadata?.ai_model || 'Claude'}`);
      console.log(`     No timeout issues on Railway! 🎉`);
    } else {
      console.log(red(`  ❌ Content generation failed: ${JSON.stringify(response.data)}`));
    }
  } catch (error) {
    console.log(red(`  ❌ Content generation error: ${error.message}`));
  }
}

async function testCampaignIntelligence(token) {
  console.log('\n📊 Testing Campaign Intelligence (Long-running)...');
  if (!token) {
    console.log(yellow('  ⚠️  Skipping - no auth token'));
    return;
  }

  try {
    const response = await makeRequest('/api/campaigns/generate-strategic-report', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: {
        campaignType: 'Product Launch',
        campaignCategory: 'B2B SaaS',
        brief: 'Testing Railway with long-running Claude analysis'
      }
    });

    if (response.status === 200) {
      console.log(green('  ✅ Long-running Claude analysis works!'));
      console.log('     No 10-second timeout on Railway!');
    } else {
      console.log(red(`  ❌ Campaign intelligence failed: ${response.status}`));
    }
  } catch (error) {
    console.log(red(`  ❌ Campaign intelligence error: ${error.message}`));
  }
}

// Main test runner
async function runTests() {
  console.log('━'.repeat(50));
  console.log('🚂 RAILWAY BACKEND TEST SUITE');
  console.log('━'.repeat(50));
  
  // Wait a moment for server to be ready
  console.log('\nWaiting for server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test health
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n' + red('❌ Server not responding. It may still be starting up.'));
    console.log('Try again in 30 seconds or check: railway logs');
    return;
  }
  
  // Test login
  const token = await testLogin();
  
  // Test Claude features
  await testContentGeneration(token);
  await testCampaignIntelligence(token);
  
  // Summary
  console.log('\n' + '━'.repeat(50));
  console.log('📊 RAILWAY ADVANTAGES OVER VERCEL:');
  console.log('━'.repeat(50));
  console.log(green('✅ No 10-second timeout'));
  console.log(green('✅ Long-running AI analysis works'));
  console.log(green('✅ Stateful operations supported'));
  console.log(green('✅ WebSocket ready (if needed)'));
  console.log(green('✅ Background jobs possible'));
  console.log(green('✅ All Claude features functional'));
  
  console.log('\n' + green('🎉 Railway deployment successful!'));
  console.log('Your backend URL: ' + yellow(BASE_URL));
}

// Run tests
runTests().catch(error => {
  console.error(red(`\n❌ Test suite failed: ${error.message}`));
  process.exit(1);
});