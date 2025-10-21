// Test Claude API connection for all services
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('=== Claude API Connection Test ===\n');

// Check environment variables
console.log('1. Environment Variables Check:');
console.log('   ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
console.log('   CLAUDE_API_KEY exists:', !!process.env.CLAUDE_API_KEY);
console.log('   API Key length:', (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '').length);
console.log('   Claude Model:', process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001');

// Test Claude service initialization
console.log('\n2. Testing Claude Service Initialization:');
try {
  const claudeService = require('./config/claude');
  console.log('   ✅ Claude service initialized successfully');
  
  // Test a simple message
  console.log('\n3. Testing Claude API Call:');
  claudeService.sendMessage('Say "Hello, SignalDesk!" in exactly 3 words.')
    .then(response => {
      console.log('   ✅ Claude API responded successfully');
      console.log('   Response:', response.substring(0, 100));
      
      // Test each controller's Claude usage
      console.log('\n4. Testing Controller Integrations:');
      testControllers();
    })
    .catch(error => {
      console.error('   ❌ Claude API call failed:', error.message);
      console.error('   Error type:', error.constructor.name);
      if (error.status) console.error('   Status:', error.status);
      if (error.error) console.error('   Error details:', error.error);
    });
} catch (error) {
  console.error('   ❌ Failed to initialize Claude service:', error.message);
}

async function testControllers() {
  // Test Content Controller
  console.log('\n   Testing Content Controller:');
  try {
    const contentController = require('./src/controllers/contentController');
    console.log('   ✅ Content Controller loaded (uses claudeService)');
  } catch (error) {
    console.log('   ❌ Content Controller error:', error.message);
  }

  // Test Crisis Controller
  console.log('\n   Testing Crisis Controller:');
  try {
    const crisisController = require('./src/controllers/crisisController');
    console.log('   ✅ Crisis Controller loaded (uses claudeService)');
  } catch (error) {
    console.log('   ❌ Crisis Controller error:', error.message);
  }

  // Test Campaign Intelligence Controller
  console.log('\n   Testing Campaign Intelligence Controller:');
  try {
    const campaignController = require('./src/controllers/campaignIntelligenceController');
    console.log('   ✅ Campaign Intelligence Controller loaded (uses claudeService)');
  } catch (error) {
    console.log('   ❌ Campaign Intelligence Controller error:', error.message);
  }

  // Test Opportunity Controller
  console.log('\n   Testing Opportunity Controller:');
  try {
    const opportunityController = require('./src/controllers/opportunityController');
    console.log('   ✅ Opportunity Controller loaded (uses claudeService)');
  } catch (error) {
    console.log('   ❌ Opportunity Controller error:', error.message);
  }

  // Test Media Controller
  console.log('\n   Testing Media Controller:');
  try {
    const mediaController = require('./src/controllers/mediaController');
    console.log('   ✅ Media Controller loaded (uses claudeService)');
  } catch (error) {
    console.log('   ❌ Media Controller error:', error.message);
  }

  console.log('\n=== Test Complete ===');
  process.exit(0);
}