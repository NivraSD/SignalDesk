const axios = require('axios');

async function testAPI() {
  const API_URL = 'http://localhost:5001';
  
  console.log('🧪 Testing SignalDesk API...\n');
  
  try {
    // 1. Test Login
    console.log('1. Testing Login...');
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'demo@signaldesk.com',
      password: 'password'
    });
    const token = loginRes.data.token;
    console.log('✅ Login successful! Token:', token.substring(0, 20) + '...');
    
    // 2. Test Projects
    console.log('\n2. Testing Projects...');
    const projectsRes = await axios.get(`${API_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (projectsRes.data.success && projectsRes.data.projects) {
      console.log('✅ Projects fetched:', projectsRes.data.projects.length, 'projects');
      projectsRes.data.projects.forEach(p => {
        console.log(`   - ${p.name} (${p.status})`);
      });
    } else {
      console.log('❌ Projects fetch failed:', projectsRes.data);
    }
    
    // 3. Test AI Assistant
    console.log('\n3. Testing AI Assistant...');
    try {
      const aiRes = await axios.post(`${API_URL}/api/assistant/chat`, {
        message: 'Hello Claude, can you help me write a press release?',
        projectId: '1'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (aiRes.data.response) {
        console.log('✅ AI Response:', aiRes.data.response.substring(0, 100) + '...');
      } else {
        console.log('⚠️  AI Response format unexpected:', aiRes.data);
      }
    } catch (err) {
      console.log('⚠️  AI Assistant error:');
      console.log('   Status:', err.response?.status);
      console.log('   Message:', err.response?.data?.message || err.message);
      if (err.response?.status === 500) {
        console.log('   💡 Check if CLAUDE_API_KEY is correctly set in .env');
      }
    }
    
    console.log('\n✅ API testing complete!');
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testAPI();
