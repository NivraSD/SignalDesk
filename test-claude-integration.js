// test-claude-integration.js
// Run this from your backend directory: node test-claude-integration.js

require('dotenv').config();

console.log('=== SignalDesk Claude Integration Test ===\n');

// Step 1: Check environment
console.log('1. Environment Check:');
console.log('   - API Key exists:', !!process.env.CLAUDE_API_KEY);
console.log('   - Model:', process.env.CLAUDE_MODEL);
console.log('   - Port:', process.env.PORT);

// Step 2: Test Claude service
const claudeService = require('./config/claude');

async function runTests() {
  console.log('\n2. Testing Basic Claude Connection:');
  try {
    const response = await claudeService.sendMessage('Say "Hello from SignalDesk!" in exactly 5 words.');
    console.log('   ✅ Basic test passed:', response);
  } catch (error) {
    console.error('   ❌ Basic test failed:', error.message);
    return;
  }

  console.log('\n3. Testing Long Content Generation:');
  try {
    const prompt = 'Write a 3-sentence executive summary about the importance of PR in modern business.';
    const response = await claudeService.sendMessage(prompt);
    console.log('   ✅ Content generation passed');
    console.log('   Response length:', response.length, 'characters');
    console.log('   Preview:', response.substring(0, 100) + '...');
  } catch (error) {
    console.error('   ❌ Content generation failed:', error.message);
  }

  console.log('\n4. Testing Campaign-Style Content:');
  try {
    const campaignPrompt = `Generate a brief PR campaign outline for a tech startup launching a new AI product. Include:
    1. Campaign objective
    2. Target audience
    3. Key message
    4. One main tactic
    Keep it under 150 words.`;
    
    const response = await claudeService.sendMessage(campaignPrompt);
    console.log('   ✅ Campaign content passed');
    console.log('   Generated outline:\n');
    console.log(response);
  } catch (error) {
    console.error('   ❌ Campaign content failed:', error.message);
  }

  console.log('\n=== Test Complete ===');
  console.log('\nNext steps:');
  console.log('1. If all tests passed, restart your server: npm run dev');
  console.log('2. Test Campaign Intelligence in the browser');
  console.log('3. Verify other features still work\n');
}

runTests().catch(console.error);
