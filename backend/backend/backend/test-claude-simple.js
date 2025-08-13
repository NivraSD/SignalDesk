require('dotenv').config();
const ClaudeService = require('./config/claude');

async function test() {
  console.log('Testing Claude...');
  console.log('API Key exists:', !!process.env.CLAUDE_API_KEY);
  console.log('API Key starts with:', process.env.CLAUDE_API_KEY?.substring(0, 10) + '...');
  
  try {
    const response = await ClaudeService.generateContent('Say "Hello, I am working!"');
    console.log('Success! Response:', response);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

test();
