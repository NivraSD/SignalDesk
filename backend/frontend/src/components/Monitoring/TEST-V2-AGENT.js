// TEST THE NEW AGENT-BASED MONITORING SYSTEM
// Run this in the browser console

(async function testV2Agent() {
  console.clear();
  console.log('🤖 TESTING V2 AGENT-BASED MONITORING');
  console.log('====================================\n');
  
  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:5001/api';
  
  // Test 1: Fetch mentions with natural language config
  console.log('1️⃣ FETCHING MENTIONS WITH AGENT CONFIG...');
  
  const fetchRequest = {
    keywords: 'Microsoft, Amazon, security, AI',
    sources: {
      rss: true,
      websites: false,
      social: false
    },
    websites: [],
    agentInstructions: `Monitor for security issues and AI developments.
Focus on major tech companies like Microsoft and Amazon.
I'm particularly interested in:
- Data breaches or security vulnerabilities
- AI product launches and innovations
- Major business developments
- Customer sentiment and complaints`
  };
  
  try {
    const response = await fetch(`${API_URL}/monitoring/fetch-mentions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fetchRequest)
    });
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.mentions?.length || 0} mentions`);
    
    if (data.mentions && data.mentions.length > 0) {
      console.log('Sample mention:', {
        title: data.mentions[0].title,
        source: data.mentions[0].source,
        content: data.mentions[0].content.substring(0, 100) + '...'
      });
      
      // Test 2: Analyze with agent
      console.log('\n2️⃣ ANALYZING WITH AGENT INSTRUCTIONS...');
      
      const analyzeRequest = {
        mentions: data.mentions.slice(0, 3), // Analyze first 3
        agentInstructions: fetchRequest.agentInstructions
      };
      
      const analyzeResponse = await fetch(`${API_URL}/monitoring/analyze-with-agent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analyzeRequest)
      });
      
      const analysisData = await analyzeResponse.json();
      console.log('✅ Analysis complete');
      
      if (analysisData.results) {
        analysisData.results.forEach((result, idx) => {
          console.log(`\n📊 Analysis ${idx + 1}:`);
          console.log('Sentiment:', result.analysis.sentiment);
          console.log('Urgency:', result.analysis.urgency);
          console.log('Summary:', result.analysis.summary);
          console.log('Action:', result.analysis.action_required || 'None');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n🎯 KEY IMPROVEMENTS IN V2:');
  console.log('✅ Single unified configuration');
  console.log('✅ Natural language agent instructions');
  console.log('✅ Agent understands your business context');
  console.log('✅ Consistent analysis based on YOUR instructions');
  console.log('✅ No complex tabs or configurations');
  
  console.log('\n💡 HOW IT WORKS:');
  console.log('1. Tell the agent what to monitor in plain English');
  console.log('2. Agent fetches and filters content based on your needs');
  console.log('3. Analysis is done according to YOUR specific instructions');
  console.log('4. Results are tailored to your business context');
})();