const https = require('https');

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM";

// Get recent opportunities
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
      console.log(`\n=== FOUND ${opportunities.length} OPPORTUNITIES ===\n`);
      
      // Group by organization
      const byOrg = {};
      opportunities.forEach(opp => {
        const org = opp.organization_name || 'Unknown';
        if (!byOrg[org]) byOrg[org] = [];
        byOrg[org].push(opp);
      });
      
      Object.entries(byOrg).forEach(([org, opps]) => {
        console.log(`\n${org}: ${opps.length} opportunities`);
        opps.slice(0, 3).forEach(opp => {
          console.log(`  - ${opp.title || 'No title'}`);
          console.log(`    Created: ${opp.created_at}`);
          console.log(`    Pipeline: ${opp.pipeline_run_id || 'No pipeline ID'}`);
        });
      });
      
      // Check for duplicates or old data
      const titles = opportunities.map(o => o.title);
      const uniqueTitles = [...new Set(titles)];
      if (titles.length !== uniqueTitles.length) {
        console.log(`\n⚠️  DUPLICATES FOUND: ${titles.length - uniqueTitles.length} duplicate opportunities`);
      }
      
    } catch (e) {
      console.error('Error:', e.message);
      console.log('Response:', data.substring(0, 500));
    }
  });
});

req.on('error', console.error);
req.end();
