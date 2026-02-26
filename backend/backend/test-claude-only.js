require('dotenv').config();

console.log('Environment check:');
console.log('CLAUDE_API_KEY exists:', !!process.env.CLAUDE_API_KEY);
console.log('CLAUDE_MODEL:', process.env.CLAUDE_MODEL || 'Not set');
console.log('API Key starts with:', process.env.CLAUDE_API_KEY?.substring(0, 20) + '...');

const Anthropic = require('@anthropic-ai/sdk');

async function testDirect() {
  try {
    const client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    console.log('\nTesting Claude API directly...');
    
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: 'Say hello in one sentence.'
      }]
    });

    console.log('✅ Success! Claude said:', message.content[0].text);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Error type:', error.constructor.name);
    console.log('Status:', error.status);
    
    if (error.status === 401) {
      console.log('\n→ Your API key is invalid or not set correctly');
    } else if (error.status === 429) {
      console.log('\n→ Rate limit exceeded or out of credits');
    } else if (error.status === 400) {
      console.log('\n→ Bad request - check the model name or parameters');
    }
  }
}

testDirect();
