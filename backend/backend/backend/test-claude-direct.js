require('dotenv').config();
const claudeService = require('./config/claude');

async function testClaude() {
  console.log('Testing Claude directly...');
  console.log('API Key exists:', !!process.env.CLAUDE_API_KEY);
  
  try {
    // Test 1: Simple test
    console.log('\n1. Testing simple message...');
    const simpleResponse = await claudeService.sendMessage('Say "hello world"');
    console.log('Simple response:', simpleResponse);
    
    // Test 2: JSON response
    console.log('\n2. Testing JSON response...');
    const jsonResponse = await claudeService.sendMessage('Return this exact JSON: {"test": "success", "value": 123}');
    console.log('JSON response:', jsonResponse);
    
    // Test 3: Sentiment analysis
    console.log('\n3. Testing sentiment analysis...');
    const sentimentPrompt = `Analyze this text for sentiment: "Data security concern mentioned"
    
Return ONLY this JSON:
{
  "sentiment": "negative",
  "sentiment_score": -60,
  "rationale": "Contains security concern"
}`;
    
    const sentimentResponse = await claudeService.sendMessage(sentimentPrompt);
    console.log('Sentiment response:', sentimentResponse);
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testClaude();