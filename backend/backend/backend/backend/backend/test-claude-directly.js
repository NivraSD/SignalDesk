// Direct Claude API Test
const fetch = require('node-fetch');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'YOUR_API_KEY_HERE';

async function testClaude() {
    console.log('Testing Claude API directly...\n');
    
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 100,
                messages: [
                    {
                        role: 'user',
                        content: 'Say "Hello from SignalDesk" in exactly 5 words.'
                    }
                ]
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Claude API is working!');
            console.log('Response:', data.content[0].text);
        } else {
            console.log('❌ Claude API failed:');
            console.log('Status:', response.status);
            console.log('Error:', data);
        }
    } catch (error) {
        console.log('❌ Request failed:');
        console.log(error.message);
    }
}

testClaude();