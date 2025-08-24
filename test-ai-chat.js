// Test AI Chat specifically to identify the "restart after 2 messages" issue

const API_BASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1';

async function testAIChatFlow() {
  console.log('🤖 Testing AI Chat Flow - "Restart after 2 messages" issue\n');
  
  // Login first
  console.log('1️⃣ Getting authentication token...');
  const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@signaldesk.com',
      password: 'demo123'
    })
  });
  
  const loginData = await loginResponse.json();
  if (!loginData.token) {
    console.log('❌ Login failed, cannot test chat');
    return;
  }
  
  console.log('✅ Authentication successful\n');
  
  // Test multiple messages to reproduce the "restart after 2 messages" issue
  const messages = [
    'Hello, this is message 1',
    'This is message 2 - the issue should occur after this',
    'Message 3 - does the chat restart here?',
    'Message 4 - testing continued conversation'
  ];
  
  for (let i = 0; i < messages.length; i++) {
    console.log(`${i + 1}️⃣ Sending message ${i + 1}: "${messages[i]}"`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({
          message: messages[i],
          projectId: null
        })
      });
      
      console.log(`   📡 Response Status: ${response.status}`);
      
      const data = await response.json();
      console.log(`   📋 Response Keys: ${Object.keys(data || {}).join(', ')}`);
      
      if (data.message) {
        console.log(`   💬 AI Response: "${data.message.substring(0, 100)}..."`);
      } else if (data.error) {
        console.log(`   ❌ Error: ${data.error}`);
      } else {
        console.log(`   ⚠️  Unexpected response format:`, data);
      }
      
      // Check for session/conversation reset indicators
      if (data.conversationReset || data.sessionRestart) {
        console.log(`   🔄 CONVERSATION RESET DETECTED!`);
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    console.log(''); // spacing
    
    // Wait between messages to simulate real usage
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🏁 AI Chat Flow Test Complete');
}

// Test AI Content Generation specifically 
async function testAIContentGeneration() {
  console.log('\n🎨 Testing AI Content Generation - "Returns chat messages instead of content" issue\n');
  
  // Login first
  const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@signaldesk.com',
      password: 'demo123'
    })
  });
  
  const loginData = await loginResponse.json();
  if (!loginData.token) {
    console.log('❌ Login failed, cannot test content generation');
    return;
  }
  
  // Test the AI-generate endpoint specifically (this might be the issue)
  console.log('1️⃣ Testing /content/ai-generate endpoint...');
  try {
    const response = await fetch(`${API_BASE_URL}/content/ai-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        prompt: 'Write a press release about our new AI-powered platform',
        type: 'press-release',
        tone: 'professional',
        companyName: 'Test Company',
        industry: 'technology'
      })
    });
    
    console.log(`📡 AI Generate Status: ${response.status}`);
    const data = await response.json();
    console.log(`📋 Response Keys: ${Object.keys(data || {}).join(', ')}`);
    
    if (data.content) {
      console.log('✅ Proper content returned');
      console.log(`📝 Content Type: ${typeof data.content}`);
      console.log(`📝 Content Preview: "${data.content.substring(0, 200)}..."`);
    } else if (data.message) {
      console.log('❌ ISSUE FOUND: Returned message instead of content');
      console.log(`💬 Message: "${data.message.substring(0, 200)}..."`);
    } else {
      console.log('⚠️  Unexpected response format:', data);
    }
    
  } catch (error) {
    console.log(`❌ AI Content Generation failed: ${error.message}`);
  }
  
  console.log('\n🏁 AI Content Generation Test Complete');
}

// Run both tests
async function runTests() {
  try {
    await testAIChatFlow();
    await testAIContentGeneration();
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

runTests();