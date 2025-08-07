// COMPREHENSIVE FIX AND TEST SCRIPT
// Run this in browser console to fix and test the monitoring system

(async function fixAndTest() {
  console.clear();
  console.log('🔧 FIXING AND TESTING MONITORING SYSTEM');
  console.log('=====================================\n');
  
  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:5001/api';
  
  // Step 1: Clear and set proper configuration
  console.log('1️⃣ SETTING UP PROPER CONFIGURATION...');
  
  // Clear old data
  localStorage.removeItem('aiMonitorConfig');
  localStorage.removeItem('aiMonitorMentions');
  
  // Create proper config
  const properConfig = {
    dataSource: {
      sourceType: "aggregator", // NOT "demo"!
      monitoringKeywords: ["Microsoft", "AI", "technology"],
      keywords: ["Microsoft", "AI", "technology"], // Both for compatibility
      aggregatorConfig: {
        sourceTypes: ["tech", "business", "pr"], // RSS categories
        updateInterval: "realtime"
      }
    },
    claude: {
      enabled: true,
      sentimentContext: {
        positiveScenarios: "Innovation, new product launches, customer satisfaction, market growth, successful partnerships",
        negativeScenarios: "Security vulnerabilities, data breaches, customer complaints, lawsuits, regulatory issues",
        criticalConcerns: "Major data breach, executive scandal, product recall, financial fraud"
      },
      brandContext: {
        companyName: "Test Company",
        industry: "Technology"
      }
    }
  };
  
  // Save to backend
  console.log('Saving configuration to backend...');
  try {
    const saveResponse = await fetch(`${API_URL}/monitoring/config`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(properConfig)
    });
    
    if (saveResponse.ok) {
      console.log('✅ Configuration saved');
    } else {
      console.error('❌ Failed to save config:', await saveResponse.text());
    }
  } catch (error) {
    console.error('❌ Save error:', error);
  }
  
  // Step 2: Test RSS fetch with real data
  console.log('\n2️⃣ TESTING RSS FETCH (REAL DATA)...');
  try {
    const response = await fetch(`${API_URL}/monitoring/fetch-rss`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        keywords: ["Microsoft", "AI", "technology"] 
      })
    });
    
    const data = await response.json();
    if (data.success && data.mentions && data.mentions.length > 0) {
      console.log('✅ RSS fetch successful');
      console.log(`   Found ${data.mentions.length} real mentions`);
      console.log('   Sample mentions:');
      data.mentions.slice(0, 3).forEach((m, i) => {
        console.log(`   ${i+1}. ${m.title || m.content.substring(0, 80)}...`);
        console.log(`      Source: ${m.source}`);
      });
    } else {
      console.error('❌ No RSS mentions found');
    }
  } catch (error) {
    console.error('❌ RSS fetch error:', error);
  }
  
  // Step 3: Test sentiment analysis with context
  console.log('\n3️⃣ TESTING SENTIMENT ANALYSIS...');
  const testTexts = [
    "Microsoft announces major security vulnerability affecting millions of users",
    "Microsoft launches innovative AI product that revolutionizes productivity",
    "Microsoft faces customer complaints about recent update issues"
  ];
  
  for (const text of testTexts) {
    console.log(`\n   Testing: "${text.substring(0, 60)}..."`);
    try {
      const response = await fetch(`${API_URL}/monitoring/analyze-sentiment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          source: "test",
          sentimentContext: properConfig.claude.sentimentContext,
          brandContext: properConfig.claude.brandContext
        })
      });
      
      const data = await response.json();
      if (data.success && data.analysis) {
        console.log(`   ✅ Sentiment: ${data.analysis.sentiment} (${data.analysis.sentiment_score})`);
        console.log(`   Rationale: ${data.analysis.rationale}`);
      } else {
        console.error('   ❌ Analysis failed:', data);
      }
    } catch (error) {
      console.error('   ❌ Error:', error);
    }
  }
  
  console.log('\n=====================================');
  console.log('📋 WHAT TO DO NEXT:\n');
  console.log('1. REFRESH THE PAGE (Important!)');
  console.log('2. Go to AI Monitoring');
  console.log('3. Check Data Sources tab:');
  console.log('   - Should show "RSS Feeds" selected (not Demo)');
  console.log('   - Keywords should be: Microsoft, AI, technology');
  console.log('   - RSS categories should be checked');
  console.log('4. Check AI Config tab:');
  console.log('   - Sentiment scenarios should be populated');
  console.log('5. In Live Feed:');
  console.log('   - Click "Fetch Mentions" - should get REAL RSS data');
  console.log('   - Click "Analyze All" - should use your sentiment context');
  console.log('\n⚠️  IMPORTANT: The page must be refreshed for changes to take effect!');
})();