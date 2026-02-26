const axios = require('axios');

async function testAI() {
  try {
    // First login
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'demo@signaldesk.com',
      password: 'password'
    });
    
    const token = loginRes.data.token;
    
    // Test AI
    console.log('Sending message to AI...');
    const aiRes = await axios.post('http://localhost:5001/api/assistant/chat', {
      message: 'Hello Claude, please introduce yourself in one sentence.',
      projectId: '1'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('AI Response:', aiRes.data.response);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAI();
