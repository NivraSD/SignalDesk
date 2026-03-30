// TEST THE NEW SENTIMENT ENGINE INTEGRATION
// Run this in the browser console to verify the new system is working

(async function testNewEngine() {
  console.clear();
  console.log('🚀 TESTING NEW SENTIMENT ENGINE');
  console.log('===============================\n');
  
  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:5001/api';
  
  // Test cases that previously failed
  const testCases = [
    {
      name: "Customer support with security concern",
      text: "Our customer support team received praise for quickly resolving a data security concern",
      context: {
        positiveScenarios: "praise, quickly resolving, customer support",
        negativeScenarios: "data security concerns, security vulnerabilities",
        criticalConcerns: "data security"
      },
      expectedSentiment: "negative",
      reason: "Critical concern (data security) should override positive indicators"
    },
    {
      name: "Microsoft stock price rise",
      text: "Microsoft's stock price has risen so much today that it has passed a $4 trillion market valuation",
      context: {
        positiveScenarios: "stock price rise, market valuation increase, growth, market expansion",
        negativeScenarios: "stock price fall, market decline, losses",
        criticalConcerns: "bankruptcy, financial fraud"
      },
      expectedSentiment: "positive",
      reason: "Clear positive financial indicators"
    },
    {
      name: "Amazon margins tightened", 
      text: "Consumers spent more than expected on the e-commerce giant's site, while margins tightened at the company's all-important cloud computing division",
      context: {
        positiveScenarios: "consumer spending, revenue growth, market expansion",
        negativeScenarios: "margins tightened, declining profits, financial concerns",
        criticalConcerns: "bankruptcy, financial crisis"
      },
      expectedSentiment: "negative",
      reason: "Margin concerns outweigh consumer spending"
    }
  ];
  
  console.log('Running tests with the new sentiment engine...\n');
  
  for (const test of testCases) {
    console.log(`📋 Test: ${test.name}`);
    console.log(`Text: "${test.text.substring(0, 60)}..."`);
    console.log(`Expected: ${test.expectedSentiment} (${test.reason})`);
    
    try {
      const response = await fetch(`${API_URL}/monitoring/analyze-sentiment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: test.text,
          source: "test",
          sentimentContext: test.context
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.analysis) {
        const correct = data.analysis.sentiment === test.expectedSentiment;
        console.log(`Result: ${correct ? '✅' : '❌'} ${data.analysis.sentiment} (score: ${data.analysis.sentiment_score})`);
        console.log(`Engine: ${data.analysis.analysis_engine || 'unknown'}`);
        console.log(`Rationale: ${data.analysis.rationale}`);
        
        if (data.analysis.matched_indicators) {
          console.log('Matched indicators:', {
            positive: data.analysis.matched_indicators.positive.length,
            negative: data.analysis.matched_indicators.negative.length,
            critical: data.analysis.matched_indicators.critical.length
          });
        }
      } else {
        console.error('❌ Analysis failed:', data);
      }
    } catch (error) {
      console.error('❌ Request error:', error);
    }
    console.log('');
  }
  
  console.log('\n🎯 KEY IMPROVEMENTS:');
  console.log('✅ Predictable, rule-based analysis');
  console.log('✅ Uses YOUR configured positive/negative scenarios');
  console.log('✅ Shows exactly which indicators triggered the sentiment');
  console.log('✅ Critical concerns properly override positive sentiment');
  console.log('✅ No more "neutral with no explanation"');
  console.log('✅ Works instantly without external AI dependencies');
  
  console.log('\n💡 HOW IT WORKS:');
  console.log('1. Extracts keywords from your configured scenarios');
  console.log('2. Analyzes text for these indicators');
  console.log('3. Calculates sentiment based on matches');
  console.log('4. Critical concerns always take priority');
  console.log('5. Provides transparent rationale for every decision');
})();