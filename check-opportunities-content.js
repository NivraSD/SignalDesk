const https = require('https');

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM";

const options = {
  hostname: 'zskaxjtyuaqazydouifp.supabase.co',
  path: '/rest/v1/opportunities?order=created_at.desc&limit=10',
  method: 'GET',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const opportunities = JSON.parse(data);
      console.log(`\n=== LATEST OPPORTUNITIES (${opportunities.length} total) ===\n`);
      
      opportunities.forEach((opp, i) => {
        console.log(`${i+1}. Title: "${opp.title}"`);
        console.log(`   Type: ${opp.opportunity_type}`);
        console.log(`   Urgency: ${opp.urgency}`);
        console.log(`   Organization: ${opp.organization_name} (ID: ${opp.organization_id})`);
        console.log(`   Description: ${opp.description?.substring(0, 150)}...`);
        
        // Check if it's real or generic
        if (opp.title === "Immediate Action Required" || 
            opp.title?.includes("opportunity") || 
            !opp.organization_name || 
            opp.organization_name === "Unknown") {
          console.log(`   ⚠️  GENERIC/FALLBACK OPPORTUNITY DETECTED`);
        }
        console.log('');
      });
      
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
});

req.on('error', console.error);
req.end();
