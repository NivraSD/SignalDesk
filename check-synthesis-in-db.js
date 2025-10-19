const https = require('https');

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('Using key:', SUPABASE_KEY ? 'Key found' : 'NO KEY FOUND');

// Get latest intelligence for OpenAI (org_id = 1)
const options = {
  hostname: 'zskaxjtyuaqazydouifp.supabase.co',
  path: '/rest/v1/intelligence?organization_id=eq.1&order=created_at.desc&limit=1',
  method: 'GET',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  }
};

if (!SUPABASE_KEY) {
  console.error('No Supabase key found! Check .env.local');
  process.exit(1);
}

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result && result[0]) {
        const intel = result[0];
        console.log('\n=== LATEST INTELLIGENCE IN DATABASE ===');
        console.log('ID:', intel.id);
        console.log('Created:', intel.created_at);
        console.log('Organization:', intel.organization_name);
        
        // Check synthesis
        if (intel.synthesis) {
          const synthesis = typeof intel.synthesis === 'string' ? JSON.parse(intel.synthesis) : intel.synthesis;
          console.log('\n=== SYNTHESIS CONTENT ===');
          console.log('Has Executive Summary:', !!synthesis.executive_synthesis);
          console.log('Executive Summary Length:', synthesis.executive_synthesis?.length || 0);
          
          // Show first 500 chars of executive summary
          if (synthesis.executive_synthesis) {
            console.log('\nFirst 500 chars of Executive Summary:');
            console.log(synthesis.executive_synthesis.substring(0, 500) + '...');
          }
          
          // Check each persona
          console.log('\n=== PERSONA ANALYSIS ===');
          console.log('Competitive Dynamics:', {
            hasData: !!synthesis.competitive_dynamics,
            keyMoves: synthesis.competitive_dynamics?.key_competitor_moves?.length || 0,
            urgentActions: synthesis.competitive_dynamics?.urgent_pr_actions?.length || 0
          });
          
          console.log('Narrative Intelligence:', {
            hasData: !!synthesis.narrative_intelligence,
            narratives: synthesis.narrative_intelligence?.evolving_narratives?.length || 0,
            opportunities: synthesis.narrative_intelligence?.immediate_pr_opportunities?.length || 0
          });
          
          // Show some actual content
          if (synthesis.competitive_dynamics?.key_competitor_moves?.length > 0) {
            console.log('\n=== SAMPLE COMPETITOR MOVES ===');
            synthesis.competitive_dynamics.key_competitor_moves.slice(0, 2).forEach((move, i) => {
              console.log(`${i+1}. ${JSON.stringify(move).substring(0, 200)}...`);
            });
          }
        } else {
          console.log('\n❌ NO SYNTHESIS DATA IN DATABASE');
        }
        
      } else {
        console.log('No intelligence found in database');
      }
    } catch (e) {
      console.error('Error:', e.message);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', console.error);
req.end();
