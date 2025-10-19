// FINAL DEBUG SCRIPT FOR SENTIMENT CONTEXT
// Copy and run this entire script in the browser console

(async function debugSentimentContext() {
  console.clear();
  console.log('🔍 SENTIMENT CONTEXT DEBUGGING SCRIPT');
  console.log('=====================================\n');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No auth token found. Please log in first.');
    return;
  }
  
  const API_URL = 'http://localhost:5001/api';
  
  // Step 1: Test basic connectivity
  console.log('1️⃣ Testing basic connectivity...');
  try {
    const response = await fetch(`${API_URL}/monitoring/test-simple`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      console.log('✅ Backend is responding');
    } else {
      console.error('❌ Backend returned:', response.status);
      return;
    }
  } catch (error) {
    console.error('❌ Cannot connect to backend:', error.message);
    return;
  }
  
  // Step 2: Test Claude connection
  console.log('\n2️⃣ Testing Claude connection...');
  try {
    const response = await fetch(`${API_URL}/monitoring/test-claude`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      console.log('✅ Claude is connected');
    } else {
      console.error('❌ Claude test failed:', data);
      return;
    }
  } catch (error) {
    console.error('❌ Claude test error:', error);
  }
  
  // Step 3: Test simple sentiment analysis
  console.log('\n3️⃣ Testing simple sentiment analysis...');
  try {
    const response = await fetch(`${API_URL}/monitoring/analyze-sentiment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "This is a simple test",
        source: "debug"
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Simple analysis works');
      console.log('   Sentiment:', data.analysis?.sentiment);
      console.log('   Score:', data.analysis?.sentiment_score);
    } else {
      console.error('❌ Simple analysis failed:', data);
      console.log('\n⚠️  TROUBLESHOOTING:');
      console.log('1. Check the terminal where you ran "npm run dev"');
      console.log('2. Look for error messages starting with "==="');
      console.log('3. If you see database errors, the analysis might be working but failing to save');
      return;
    }
  } catch (error) {
    console.error('❌ Analysis request failed:', error);
  }
  
  // Step 4: Test with sentiment context
  console.log('\n4️⃣ Testing with custom sentiment context...');
  const testText = "Our customer support team received praise for quickly resolving a data security concern.";
  try {
    const response = await fetch(`${API_URL}/monitoring/analyze-sentiment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: testText,
        source: "debug-context",
        sentimentContext: {
          positiveScenarios: "Customer satisfaction, quick problem resolution, praise from customers",
          negativeScenarios: "Data security concerns, privacy issues, security vulnerabilities",
          criticalConcerns: "Data breaches, security incidents, customer data exposure"
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Context analysis works');
      console.log('   Text:', testText.substring(0, 50) + '...');
      console.log('   Sentiment:', data.analysis?.sentiment);
      console.log('   Score:', data.analysis?.sentiment_score);
      console.log('   Rationale:', data.analysis?.rationale);
      
      if (data.analysis?.sentiment === 'negative' && data.analysis?.sentiment_score < 0) {
        console.log('\n🎉 SUCCESS! The sentiment context is being used correctly.');
        console.log('   The text mentions "data security concern" which was identified as negative.');
      } else {
        console.log('\n⚠️  The analysis completed but might not be using the context properly.');
      }
    } else {
      console.error('❌ Context analysis failed:', data);
    }
  } catch (error) {
    console.error('❌ Context analysis error:', error);
  }
  
  // Step 5: Check saved configuration
  console.log('\n5️⃣ Checking saved configuration...');
  try {
    const response = await fetch(`${API_URL}/monitoring/config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const config = await response.json();
    
    if (config && config.claude && config.claude.sentimentContext) {
      console.log('✅ Saved configuration found');
      const ctx = config.claude.sentimentContext;
      console.log('   Has positive scenarios:', !!ctx.positiveScenarios);
      console.log('   Has negative scenarios:', !!ctx.negativeScenarios);
      console.log('   Has critical concerns:', !!ctx.criticalConcerns);
    } else {
      console.log('⚠️  No saved sentiment context found');
      console.log('   Go to AI Config tab and save your sentiment scenarios');
    }
  } catch (error) {
    console.error('❌ Config check error:', error);
  }
  
  console.log('\n=====================================');
  console.log('📋 SUMMARY:');
  console.log('- If all tests passed, the system is working correctly');
  console.log('- If you see database errors, the analysis works but saving fails');
  console.log('- Check the backend terminal for detailed error messages');
  console.log('- Make sure to save your sentiment context in the AI Config tab');
  
  console.log('\n💡 TO TEST IN THE UI:');
  console.log('1. Go to AI Config tab');
  console.log('2. Enter positive/negative scenarios');
  console.log('3. Click "Save AI Configuration"');
  console.log('4. Go to Live Feed tab');
  console.log('5. Fetch and analyze mentions');
  console.log('6. Check if sentiment matches your configured scenarios');
})();