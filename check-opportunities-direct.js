const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOpportunities() {
  console.log('🔍 Checking opportunities directly from database...\n');
  
  // Get count
  const { count, error: countError } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true });
    
  console.log(`Total opportunities in database: ${count || 0}`);
  
  // Get all opportunities
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('✅ No opportunities found - database is empty!');
    return;
  }
  
  console.log(`\n⚠️ Found ${data.length} opportunities:\n`);
  
  data.forEach((opp, i) => {
    console.log(`${i + 1}. ${opp.title}`);
    console.log(`   ID: ${opp.id}`);
    console.log(`   Org: ${opp.organization_id}`);
    console.log(`   Created: ${opp.created_at}`);
    console.log(`   Score: ${opp.score}`);
    console.log('');
  });
  
  // Check for specific "phantom" opportunities
  const phantomTitles = [
    'India Market Counter-Narrative',
    'Counter-BYD Premium Positioning'
  ];
  
  const phantoms = data.filter(opp => 
    phantomTitles.some(title => opp.title.includes(title))
  );
  
  if (phantoms.length > 0) {
    console.log('🚨 FOUND PHANTOM OPPORTUNITIES:');
    phantoms.forEach(p => {
      console.log(`   - ${p.title} (created: ${p.created_at})`);
    });
  }
}

checkOpportunities().catch(console.error);