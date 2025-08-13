const fetch = require('node-fetch');

// You need to get this from the browser console: localStorage.getItem('token')
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';

async function testMonitoring() {
  const API_URL = 'http://localhost:5001/api';
  
  console.log('Testing monitoring endpoints...\n');
  
  // Test 1: Simple test
  console.log('1. Testing simple endpoint...');
  try {
    const response = await fetch(`${API_URL}/monitoring/test-simple`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    const data = await response.json();
    console.log('Simple test:', data);
  } catch (error) {
    console.error('Simple test error:', error.message);
  }
  
  // Test 2: Test sentiment
  console.log('\n2. Testing hardcoded sentiment...');
  try {
    const response = await fetch(`${API_URL}/monitoring/test-sentiment`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    const data = await response.json();
    console.log('Sentiment test success:', data.success);
    if (data.parsed) {
      console.log('Sentiment:', data.parsed.sentiment);
      console.log('Score:', data.parsed.sentiment_score);
    }
  } catch (error) {
    console.error('Sentiment test error:', error.message);
  }
  
  // Test 3: Full analysis
  console.log('\n3. Testing full analysis...');
  try {
    const response = await fetch(`${API_URL}/monitoring/analyze-sentiment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "Test analysis text",
        source: "test",
        sentimentContext: {
          positiveScenarios: "test positive",
          negativeScenarios: "test negative"
        }
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Analysis error:', error.message);
  }
}

if (AUTH_TOKEN === 'YOUR_AUTH_TOKEN_HERE') {
  console.log('❌ Please set AUTH_TOKEN first!');
  console.log('1. Open browser console');
  console.log('2. Run: localStorage.getItem("token")');
  console.log('3. Copy the token and update AUTH_TOKEN in this script');
} else {
  testMonitoring();
}