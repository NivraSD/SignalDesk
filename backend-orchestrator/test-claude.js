// Test Claude API key
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

console.log('Testing Claude API with key:', CLAUDE_API_KEY?.substring(0, 20) + '...');

async function testClaude() {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [
          { role: 'user', content: 'Say "Hello, I am Claude and I am working!" in exactly those words.' }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Claude API is working!');
      console.log('Response:', data.content[0].text);
    } else {
      const error = await response.text();
      console.error('❌ Claude API error:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Failed to call Claude:', error.message);
  }
}

testClaude();