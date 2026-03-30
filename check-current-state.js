const https = require('https');

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM";

// Check latest opportunities
const options = {
  hostname: 'zskaxjtyuaqazydouifp.supabase.co',
  path: '/rest/v1/opportunities?order=created_at.desc&limit=6',
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
      console.log(`\n=== CURRENT OPPORTUNITIES IN DB ===`);
      console.log(`Found ${opportunities.length} opportunities\n`);
      
      opportunities.forEach((opp, i) => {
        console.log(`${i+1}. Title: "${opp.title}"`);
        console.log(`   Org ID: ${opp.organization_id}`);
        console.log(`   Urgency: ${opp.urgency}`);
        console.log(`   Description: ${opp.description?.substring(0, 100)}...`);
        console.log('');
      });
      
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
});

req.on('error', console.error);
req.end();
