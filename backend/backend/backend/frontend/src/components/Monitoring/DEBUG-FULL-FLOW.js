// DEBUG SCRIPT: Full monitoring flow analysis
// Run this in browser console to see what's happening

(async function debugFullFlow() {
  console.clear();
  console.log('🔍 FULL MONITORING FLOW DEBUG');
  console.log('=============================\n');
  
  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:5001/api';
  
  // Step 1: Check saved configuration
  console.log('1️⃣ CHECKING SAVED CONFIGURATION...');
  let savedConfig = null;
  try {
    const response = await fetch(`${API_URL}/monitoring/config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    savedConfig = await response.json();
    
    if (savedConfig) {
      console.log('✅ Found saved config');
      console.log('   Keywords:', savedConfig.dataSource?.keywords);
      console.log('   Has Claude config:', !!savedConfig.claude);
      console.log('   Has sentiment context:', !!savedConfig.claude?.sentimentContext);
      
      if (savedConfig.claude?.sentimentContext) {
        const ctx = savedConfig.claude.sentimentContext;
        console.log('   Positive scenarios:', ctx.positiveScenarios?.substring(0, 50) + '...');
        console.log('   Negative scenarios:', ctx.negativeScenarios?.substring(0, 50) + '...');
      }
    } else {
      console.log('⚠️  No saved configuration found');
    }
  } catch (error) {
    console.error('❌ Error loading config:', error);
  }
  
  // Step 2: Test RSS fetch with keywords
  console.log('\n2️⃣ TESTING RSS FETCH...');
  const testKeywords = savedConfig?.dataSource?.keywords || ['Microsoft'];
  console.log('   Using keywords:', testKeywords);
  
  try {
    const response = await fetch(`${API_URL}/monitoring/fetch-rss`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ keywords: testKeywords })
    });
    
    const data = await response.json();
    if (data.success && data.mentions) {
      console.log('✅ RSS fetch successful');
      console.log('   Found mentions:', data.mentions.length);
      if (data.mentions.length > 0) {
        console.log('   First mention:', {
          title: data.mentions[0].title,
          source: data.mentions[0].source,
          content: data.mentions[0].content?.substring(0, 100) + '...'
        });
      }
    } else {
      console.log('❌ RSS fetch failed:', data);
    }
  } catch (error) {
    console.error('❌ RSS fetch error:', error);
  }
  
  // Step 3: Test sentiment analysis with context
  console.log('\n3️⃣ TESTING SENTIMENT ANALYSIS...');
  const testText = "Microsoft announces new security features to protect customer data from breaches";
  
  try {
    const response = await fetch(`${API_URL}/monitoring/analyze-sentiment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: testText,
        source: "debug-test",
        sentimentContext: savedConfig?.claude?.sentimentContext || {
          positiveScenarios: "New features, innovation, customer protection",
          negativeScenarios: "Security concerns, data breaches, vulnerabilities",
          criticalConcerns: "Actual data breach, customer data exposed"
        }
      })
    });
    
    const data = await response.json();
    if (data.success && data.analysis) {
      console.log('✅ Analysis successful');
      console.log('   Text:', testText);
      console.log('   Sentiment:', data.analysis.sentiment);
      console.log('   Score:', data.analysis.sentiment_score);
      console.log('   Rationale:', data.analysis.rationale);
    } else {
      console.log('❌ Analysis failed:', data);
    }
  } catch (error) {
    console.error('❌ Analysis error:', error);
  }
  
  // Step 4: Check React component state
  console.log('\n4️⃣ CHECKING REACT COMPONENT STATE...');
  console.log('To check current state in React DevTools:');
  console.log('1. Open React DevTools');
  console.log('2. Find AISentimentMonitor component');
  console.log('3. Check these state values:');
  console.log('   - dataSourceConfig.monitoringKeywords');
  console.log('   - searchKeywords');
  console.log('   - claudeConfig.sentimentContext');
  
  // Step 5: Test the full flow
  console.log('\n5️⃣ TESTING FULL FLOW...');
  console.log('1. Keywords from config:', savedConfig?.dataSource?.keywords);
  console.log('2. These should be used for RSS filtering');
  console.log('3. Sentiment context should be:', savedConfig?.claude?.sentimentContext ? 'Present' : 'Missing');
  console.log('4. Analysis should use this context');
  
  console.log('\n🔧 COMMON ISSUES:');
  console.log('- Keywords saved as "keywords" but component uses "monitoringKeywords"');
  console.log('- RSS fetch may be using different keywords than displayed');
  console.log('- Sentiment context may not be passed correctly to analysis');
  
  console.log('\n💡 TO FIX:');
  console.log('1. Clear local storage: localStorage.removeItem("aiMonitorConfig")');
  console.log('2. Refresh the page');
  console.log('3. Re-enter keywords in Data Sources tab');
  console.log('4. Re-enter sentiment context in AI Config tab');
  console.log('5. Save both configurations');
  console.log('6. Test again');
})();