// PRODUCTION DEBUG TEST - SignalDesk Critical Issues
// This script tests the exact API flow that's failing in production

const API_BASE_URL = 'https://signaldesk-production.up.railway.app/api';

console.log('🔍 PRODUCTION DEBUG TEST - SignalDesk API');
console.log('Testing API URL:', API_BASE_URL);

// Test 1: Basic Health Check
async function testHealthCheck() {
  console.log('\n1️⃣ Testing Health Check...');
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health Check Status:', response.status);
    console.log('📋 Health Data:', data);
    return response.ok;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

// Test 2: Authentication Test (without login)
async function testAuthRequirement() {
  console.log('\n2️⃣ Testing Content Generation Auth Requirement...');
  try {
    const response = await fetch(`${API_BASE_URL}/content/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'press-release',
        formData: { headline: 'Test Headline' }
      })
    });
    
    console.log('📡 Content Generate Status:', response.status);
    const data = await response.text();
    console.log('📋 Response Data:', data.substring(0, 200) + '...');
    
    if (response.status === 401) {
      console.log('🔐 Authentication required as expected');
    } else if (response.status === 404) {
      console.log('❌ CRITICAL: Content generation endpoint not found');
    } else {
      console.log('⚠️ Unexpected response status');
    }
  } catch (error) {
    console.error('❌ Content Generation Test Failed:', error.message);
  }
}

// Test 3: AI Chat Endpoint Test
async function testAIChatEndpoint() {
  console.log('\n3️⃣ Testing AI Chat Endpoint...');
  try {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Test message'
      })
    });
    
    console.log('🤖 AI Chat Status:', response.status);
    const data = await response.text();
    console.log('📋 AI Response Data:', data.substring(0, 200) + '...');
    
    if (response.status === 401) {
      console.log('🔐 Authentication required for AI chat');
    } else if (response.status === 404) {
      console.log('❌ CRITICAL: AI chat endpoint not found');
    }
  } catch (error) {
    console.error('❌ AI Chat Test Failed:', error.message);
  }
}

// Test 4: Available Routes Discovery
async function discoverRoutes() {
  console.log('\n4️⃣ Discovering Available Routes...');
  const commonRoutes = [
    '/content/generate',
    '/content/ai-generate', 
    '/ai/chat',
    '/auth/login',
    '/projects',
    '/monitoring/config'
  ];
  
  for (const route of commonRoutes) {
    try {
      const response = await fetch(`${API_BASE_URL}${route}`, {
        method: 'GET'
      });
      console.log(`📍 ${route}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`📍 ${route}: CONNECTION ERROR`);
    }
  }
}

// Test 5: Demo Login Test (using credentials from API root)
async function testDemoLogin() {
  console.log('\n5️⃣ Testing Demo Login...');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@signaldesk.com',
        password: 'demo123'
      })
    });
    
    console.log('🔑 Demo Login Status:', response.status);
    const data = await response.json();
    console.log('📋 Login Response:', data);
    
    if (response.ok && data.token) {
      console.log('✅ Demo login successful, token received');
      return data.token;
    } else {
      console.log('❌ Demo login failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Demo Login Failed:', error.message);
    return null;
  }
}

// Test 6: Authenticated Content Generation
async function testAuthenticatedContentGeneration(token) {
  console.log('\n6️⃣ Testing Authenticated Content Generation...');
  if (!token) {
    console.log('⏭️ Skipping - no auth token available');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/content/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'press-release',
        formData: {
          headline: 'TEST: Production Debug Press Release',
          announcement: 'Testing production API functionality'
        },
        tone: 'professional',
        companyName: 'Test Company',
        industry: 'technology'
      })
    });
    
    console.log('📰 Authenticated Content Status:', response.status);
    const data = await response.json();
    console.log('📋 Content Response Type:', typeof data);
    console.log('📋 Content Response Keys:', Object.keys(data || {}));
    
    if (data.content) {
      console.log('✅ Content generated successfully');
      console.log('📝 Content Preview:', data.content.substring(0, 150) + '...');
    } else if (data.message) {
      console.log('💬 Received message instead of content:', data.message.substring(0, 150) + '...');
      console.log('❌ CRITICAL: This is the reported issue - getting chat messages instead of content');
    } else {
      console.log('⚠️ Unexpected response format');
    }
    
  } catch (error) {
    console.error('❌ Authenticated Content Generation Failed:', error.message);
  }
}

// Run All Tests
async function runAllTests() {
  console.log('🚀 Starting Production Debug Tests...\n');
  
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('❌ Health check failed, stopping tests');
    return;
  }
  
  await testAuthRequirement();
  await testAIChatEndpoint();
  await discoverRoutes();
  
  const token = await testDemoLogin();
  await testAuthenticatedContentGeneration(token);
  
  console.log('\n🏁 Production Debug Tests Complete');
  console.log('=====================================');
}

// Execute if running directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.runProductionTests = runAllTests;
  console.log('🌐 Run window.runProductionTests() in browser console');
}