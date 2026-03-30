// Run this in browser console to test the backend directly
(async () => {
  const token = localStorage.getItem('token');
  console.log('Testing backend sentiment analysis...\n');
  
  // Test 1: Simple endpoint
  console.log('1. Testing simple endpoint...');
  try {
    const response = await fetch('http://localhost:5001/api/monitoring/test-simple', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Simple test status:', response.status);
    const data = await response.json();
    console.log('Simple test response:', data);
  } catch (error) {
    console.error('Simple test error:', error);
  }
  
  // Test 2: Direct Claude test
  console.log('\n2. Testing Claude connection...');
  try {
    const response = await fetch('http://localhost:5001/api/monitoring/test-claude', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Claude test status:', response.status);
    const data = await response.json();
    console.log('Claude test response:', data);
  } catch (error) {
    console.error('Claude test error:', error);
  }
  
  // Test 3: Sentiment with minimal data
  console.log('\n3. Testing sentiment with minimal data...');
  try {
    const response = await fetch('http://localhost:5001/api/monitoring/analyze-sentiment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "This is a simple test",
        source: "test"
      })
    });
    console.log('Minimal sentiment status:', response.status);
    const data = await response.json();
    console.log('Minimal sentiment response:', data);
  } catch (error) {
    console.error('Minimal sentiment error:', error);
  }
  
  // Test 4: Check backend logs
  console.log('\n4. To check backend logs:');
  console.log('- Look at the terminal where you ran "npm run dev"');
  console.log('- You should see detailed logging for each request');
  console.log('- Look for "=== BACKEND:" prefixed messages');
})();