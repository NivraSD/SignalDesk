// Debug helper for sentiment context
// Copy and paste this into the browser console while on the AI Monitoring page

(async function debugSentimentContext() {
  console.log('=== SENTIMENT CONTEXT DEBUG HELPER ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No auth token found. Please log in first.');
    return;
  }
  
  const API_URL = 'http://localhost:5001/api';
  
  // Step 1: Check saved config
  console.log('\n1️⃣ Checking saved configuration...');
  try {
    const configResponse = await fetch(`${API_URL}/monitoring/config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const config = await configResponse.json();
    
    if (config && config.claude && config.claude.sentimentContext) {
      console.log('✅ Saved sentiment context found:');
      console.log('   Positive scenarios:', config.claude.sentimentContext.positiveScenarios?.substring(0, 100) + '...');
      console.log('   Negative scenarios:', config.claude.sentimentContext.negativeScenarios?.substring(0, 100) + '...');
      console.log('   Critical concerns:', config.claude.sentimentContext.criticalConcerns?.substring(0, 100) + '...');
    } else {
      console.log('⚠️ No sentiment context saved in config');
    }
  } catch (error) {
    console.error('❌ Failed to fetch config:', error);
  }
  
  // Step 2: Test with saved context
  console.log('\n2️⃣ Testing sentiment analysis with saved context...');
  const testText = "Our customer support team received praise for quickly resolving a data security concern.";
  try {
    const testResponse = await fetch(`${API_URL}/monitoring/test-sentiment-context`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: testText })
    });
    const testResult = await testResponse.json();
    
    if (testResult.success) {
      console.log('✅ Test completed:');
      console.log('   Sentiment:', testResult.parsed?.sentiment);
      console.log('   Score:', testResult.parsed?.sentiment_score);
      console.log('   Rationale:', testResult.parsed?.rationale);
      console.log('   Context used:', testResult.sentimentContext ? 'YES' : 'NO');
    } else {
      console.error('❌ Test failed:', testResult);
    }
  } catch (error) {
    console.error('❌ Test request failed:', error);
  }
  
  // Step 3: Test full analysis flow
  console.log('\n3️⃣ Testing full analysis flow with explicit context...');
  try {
    const analysisResponse = await fetch(`${API_URL}/monitoring/analyze-sentiment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: testText,
        source: 'debug-test',
        sentimentContext: {
          positiveScenarios: "Customer satisfaction, quick problem resolution, praise from customers",
          negativeScenarios: "Data security concerns, privacy issues, security vulnerabilities",
          criticalConcerns: "Data breaches, security incidents, customer data exposure"
        },
        brandContext: {
          customContext: "We are a company that prioritizes data security"
        }
      })
    });
    const analysisResult = await analysisResponse.json();
    
    if (analysisResult.success) {
      console.log('✅ Full analysis completed:');
      console.log('   Sentiment:', analysisResult.analysis?.sentiment);
      console.log('   Score:', analysisResult.analysis?.sentiment_score);
      console.log('   Rationale:', analysisResult.analysis?.rationale);
    } else {
      console.error('❌ Analysis failed:', analysisResult);
    }
  } catch (error) {
    console.error('❌ Analysis request failed:', error);
  }
  
  // Step 4: Check current React component state
  console.log('\n4️⃣ Checking React component state...');
  console.log('ℹ️ To check React state, run this in the console:');
  console.log('   React DevTools: Select AISentimentMonitor component');
  console.log('   Check: claudeConfig.sentimentContext');
  
  console.log('\n✅ Debug complete. Check the logs above for issues.');
})();