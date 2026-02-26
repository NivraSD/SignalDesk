const https = require('https');

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM";

// Get ALL intelligence records
const options = {
  hostname: 'zskaxjtyuaqazydouifp.supabase.co',
  path: '/rest/v1/intelligence?order=created_at.desc&limit=5',
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
      const result = JSON.parse(data);
      console.log(`\n=== FOUND ${result.length} INTELLIGENCE RECORDS ===\n`);
      
      result.forEach((intel, idx) => {
        console.log(`\n--- Record ${idx + 1} ---`);
        console.log('ID:', intel.id);
        console.log('Organization ID:', intel.organization_id);
        console.log('Organization Name:', intel.organization_name);
        console.log('Created:', intel.created_at);
        console.log('Has Synthesis:', !!intel.synthesis);
        console.log('Has Opportunities:', !!intel.opportunities);
        
        if (intel.synthesis) {
          const synthesis = typeof intel.synthesis === 'string' ? JSON.parse(intel.synthesis) : intel.synthesis;
          console.log('Synthesis Keys:', Object.keys(synthesis));
          
          if (synthesis.executive_synthesis) {
            console.log('Executive Summary (first 200 chars):', synthesis.executive_synthesis.substring(0, 200));
          }
        }
      });
      
      if (result.length === 0) {
        console.log('NO INTELLIGENCE RECORDS FOUND IN DATABASE!');
        console.log('\nThis means the orchestrator is NOT saving results to the database.');
      }
    } catch (e) {
      console.error('Error:', e.message);
      console.log('Response:', data);
    }
  });
});

req.on('error', console.error);
req.end();
