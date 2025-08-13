/**
 * Test that opportunities are actually being returned
 */

const axios = require('axios');

async function testOpportunities() {
  try {
    // Test without auth first
    console.log('Testing opportunities endpoint...\n');
    
    const response = await axios.get('http://localhost:5001/api/monitoring/v2/opportunities', {
      params: {
        status: 'pending',
        limit: 5
      },
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Opportunities found:', response.data.opportunities?.length || 0);
    
    if (response.data.opportunities && response.data.opportunities.length > 0) {
      console.log('\n=== FIRST OPPORTUNITY ===');
      const opp = response.data.opportunities[0];
      console.log('Pattern:', opp.pattern_name);
      console.log('Title:', opp.title);
      console.log('Score:', opp.score);
      console.log('Urgency:', opp.urgency);
      console.log('Confidence:', opp.confidence);
      console.log('Source:', opp.source_data?.source || 'Unknown');
      
      console.log('\n=== ALL PATTERNS FOUND ===');
      const patterns = {};
      response.data.opportunities.forEach(o => {
        patterns[o.pattern_name] = (patterns[o.pattern_name] || 0) + 1;
      });
      Object.entries(patterns).forEach(([pattern, count]) => {
        console.log(`${pattern}: ${count}`);
      });
    } else {
      console.log('\n❌ No opportunities returned!');
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testOpportunities();