const https = require('https');

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM";

// Check intelligence_findings structure
const options = {
  hostname: 'zskaxjtyuaqazydouifp.supabase.co',
  path: '/rest/v1/intelligence_findings?limit=5&order=created_at.desc',
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
      const findings = JSON.parse(data);
      console.log(`\n=== INTELLIGENCE_FINDINGS TABLE ===`);
      console.log(`Found ${findings.length} records\n`);
      
      if (findings.length > 0) {
        // Show structure of first record
        const first = findings[0];
        console.log('Table columns:');
        Object.keys(first).forEach(key => {
          const value = first[key];
          const type = value === null ? 'null' : typeof value === 'object' ? 'object/json' : typeof value;
          console.log(`  - ${key}: ${type}`);
        });
        
        // Check for synthesis data
        if (first.synthesis || first.executive_synthesis) {
          console.log('\n✅ HAS SYNTHESIS DATA');
        }
        
        // Show recent records
        console.log('\nRecent records:');
        findings.forEach(f => {
          console.log(`  - ID: ${f.id}`);
          console.log(`    Org: ${f.organization_name || f.organization_id || 'Unknown'}`);
          console.log(`    Created: ${f.created_at}`);
          console.log(`    Has synthesis: ${!!(f.synthesis || f.executive_synthesis)}`);
        });
      } else {
        console.log('Table is empty - no intelligence findings stored');
      }
    } catch (e) {
      console.error('Error:', e.message);
      console.log('Response:', data.substring(0, 500));
    }
  });
});

req.on('error', console.error);
req.end();
