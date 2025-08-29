// SIMPLE ANALYSIS TEST
// Run this to test if analysis is working at all

(async function testSimpleAnalysis() {
  console.clear();
  console.log('🧪 TESTING SIMPLE ANALYSIS');
  console.log('=========================\n');
  
  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:5001/api';
  
  // Test 1: Direct fallback analysis
  console.log('1️⃣ Testing direct fallback analysis...');
  try {
    const response = await fetch(`${API_URL}/monitoring/test-direct-analysis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "Microsoft announces security breach affecting customers"
      })
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('✅ Fallback analysis works:', data.analysis);
    } else {
      console.error('❌ Fallback failed:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  // Test 2: Check backend logs
  console.log('\n2️⃣ To see what\'s happening in the backend:');
  console.log('   - Look at the terminal running npm run dev');
  console.log('   - Check for messages starting with ===');
  console.log('   - Look for "Claude response received"');
  console.log('   - Check if there are parsing errors');
  
  // Test 3: Try the main endpoint with minimal data
  console.log('\n3️⃣ Testing main endpoint with minimal data...');
  try {
    const response = await fetch(`${API_URL}/monitoring/analyze-sentiment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "Simple test",
        source: "test"
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success && data.analysis) {
      console.log('✅ Main endpoint works!');
      console.log('   Sentiment:', data.analysis.sentiment);
      console.log('   Score:', data.analysis.sentiment_score);
    } else {
      console.error('❌ Main endpoint failed:', data);
      console.log('\n⚠️  POSSIBLE ISSUES:');
      console.log('- Claude might be returning invalid JSON');
      console.log('- The prompt might be too complex');
      console.log('- Check backend logs for details');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n💡 WHAT\'S HAPPENING:');
  console.log('- RSS fetch is working correctly ✅');
  console.log('- Analysis is failing, likely due to Claude response parsing');
  console.log('- The system is trying to use fallback analysis');
  console.log('- Check backend terminal for detailed error messages');
})();