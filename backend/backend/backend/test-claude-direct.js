// Test Claude features directly without diagnostics endpoint
const axios = require('axios');

const API_BASE = 'https://signaldesk-api-production.up.railway.app/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'demo@signaldesk.com',
      password: 'demo123'
    });
    return response.data.token;
  } catch (error) {
    log(`Login failed: ${error.message}`, 'red');
    return null;
  }
}

async function testContentGenerator(token) {
  log('\n📝 Testing Content Generator...', 'blue');
  try {
    const response = await axios.post(
      `${API_BASE}/content/ai-generate`,
      {
        prompt: 'Write a one-sentence press release headline about AI innovation',
        type: 'press-release',
        companyName: 'SignalDesk',
        industry: 'Technology'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data.content) {
      log('✅ Content Generator WORKING', 'green');
      log(`   Response: ${response.data.content.substring(0, 100)}...`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Content Generator FAILED: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testCrisisAdvisor(token) {
  log('\n🚨 Testing Crisis Advisor...', 'blue');
  try {
    const response = await axios.post(
      `${API_BASE}/crisis/advisor`,
      {
        query: 'What are the first 3 steps in a data breach?',
        context: {
          scenario: 'data-breach',
          crisisStatus: 'active'
        }
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data.advice) {
      log('✅ Crisis Advisor WORKING', 'green');
      const adviceText = typeof response.data.advice === 'string' 
        ? response.data.advice 
        : JSON.stringify(response.data.advice);
      log(`   Response: ${adviceText.substring(0, 100)}...`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Crisis Advisor FAILED: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testCampaignIntelligence(token) {
  log('\n📊 Testing Campaign Intelligence...', 'blue');
  try {
    const response = await axios.post(
      `${API_BASE}/campaigns/generate-market-analysis`,
      {
        brief: 'AI software product launch for enterprises',
        campaignType: 'product-launch'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data.analysis || response.data.success) {
      log('✅ Campaign Intelligence WORKING', 'green');
      const preview = JSON.stringify(response.data).substring(0, 100);
      log(`   Response: ${preview}...`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Campaign Intelligence FAILED: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.status === 500) {
      log('   This was the feature with the syntax error we fixed', 'yellow');
    }
    return false;
  }
}

async function testOpportunityEngine(token) {
  log('\n💡 Testing Opportunity Engine...', 'blue');
  try {
    const response = await axios.post(
      `${API_BASE}/opportunity/analyze-position`,
      {
        company: 'Tech Startup',
        industry: 'Technology',
        competitors: ['Microsoft', 'Google'],
        currentInitiatives: ['AI development']
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data.analysis || response.data.strengths) {
      log('✅ Opportunity Engine WORKING', 'green');
      const preview = JSON.stringify(response.data).substring(0, 100);
      log(`   Response: ${preview}...`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Opportunity Engine FAILED: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testMediaListBuilder(token) {
  log('\n📰 Testing Media List Builder...', 'blue');
  try {
    const response = await axios.post(
      `${API_BASE}/media/discover`,
      {
        query: 'AI technology journalists',
        industry: 'Technology'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data) {
      log('✅ Media List Builder WORKING', 'green');
      const preview = JSON.stringify(response.data).substring(0, 100);
      log(`   Response: ${preview}...`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Media List Builder FAILED: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('🚀 SignalDesk Claude Integration Test', 'blue');
  log('=====================================\n', 'blue');
  
  // Login
  log('🔐 Logging in...', 'yellow');
  const token = await login();
  if (!token) {
    log('Cannot proceed without authentication', 'red');
    return;
  }
  log('✅ Logged in successfully', 'green');
  
  // Run tests
  const results = {
    contentGenerator: await testContentGenerator(token),
    crisisAdvisor: await testCrisisAdvisor(token),
    campaignIntelligence: await testCampaignIntelligence(token),
    opportunityEngine: await testOpportunityEngine(token),
    mediaListBuilder: await testMediaListBuilder(token)
  };
  
  // Summary
  log('\n=====================================', 'blue');
  log('📊 Test Summary', 'blue');
  log('=====================================\n', 'blue');
  
  const working = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([feature, status]) => {
    const icon = status ? '✅' : '❌';
    const color = status ? 'green' : 'red';
    log(`${icon} ${feature}: ${status ? 'WORKING' : 'FAILED'}`, color);
  });
  
  log(`\n📈 Overall: ${working}/${total} features working (${Math.round(working/total * 100)}%)`, 
      working === total ? 'green' : 'yellow');
  
  if (working === total) {
    log('\n🎉 All Claude features are working perfectly!', 'green');
  } else if (results.campaignIntelligence === false) {
    log('\n⚠️  Campaign Intelligence fix may not be deployed yet', 'yellow');
    log('The deployment might still be in progress', 'yellow');
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test failed: ${error.message}`, 'red');
  process.exit(1);
});