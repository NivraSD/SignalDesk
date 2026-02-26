const https = require('https');

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM";

// Get all tables
const options = {
  hostname: 'zskaxjtyuaqazydouifp.supabase.co',
  path: '/rest/v1/',
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
      console.log('\n=== AVAILABLE TABLES/ENDPOINTS ===');
      
      // Parse the OpenAPI response to get table names
      if (result.paths) {
        const tables = Object.keys(result.paths)
          .filter(path => path.startsWith('/'))
          .map(path => path.split('/')[1])
          .filter(name => name && !name.includes('{'))
          .filter((v, i, a) => a.indexOf(v) === i); // unique
        
        console.log('\nFound tables:');
        tables.forEach(table => console.log(`  - ${table}`));
        
        // Check for intelligence-related tables
        const intelligenceTables = tables.filter(t => 
          t.includes('intelligence') || 
          t.includes('synthesis') || 
          t.includes('opportunities') ||
          t.includes('pipeline')
        );
        
        if (intelligenceTables.length > 0) {
          console.log('\n=== INTELLIGENCE-RELATED TABLES ===');
          intelligenceTables.forEach(table => console.log(`  - ${table}`));
        }
      } else {
        console.log('Response:', JSON.stringify(result).substring(0, 500));
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
});

req.on('error', console.error);
req.end();
