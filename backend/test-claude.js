require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

async function testClaude() {
  try {
    console.log('Testing Claude with API key:', process.env.CLAUDE_API_KEY?.substring(0, 20) + '...');
    
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Say hello' }]
    });
    
    console.log('Claude responded:', response.content[0].text);
  } catch (error) {
    console.error('Claude error:', error.message);
  }
}

testClaude();
