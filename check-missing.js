const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('🔍 Checking for specific journalists that should be in database...\n');

  const testNames = [
    'Casey Newton',
    'Kara Swisher',
    'Scott Galloway',
    'Nilay Patel',
    'Ben Thompson',
    'Matt Levine',
    'Packy McCormick',
    'Marques Brownlee',
    'Linus Sebastian',
    'Ryan Golden', // HR Dive
    'Kate Tornone', // HR Dive
    'Sean O\'Neill' // Skift
  ];

  for (const name of testNames) {
    const { data } = await supabase
      .from('journalist_registry')
      .select('name, outlet')
      .ilike('name', `%${name}%`)
      .maybeSingle();

    if (data) {
      console.log(`✅ ${name.padEnd(25)} - ${data.outlet}`);
    } else {
      console.log(`❌ MISSING: ${name}`);
    }
  }

  console.log('\n📊 Current database total:');
  const { count } = await supabase
    .from('journalist_registry')
    .select('*', { count: 'exact', head: true });
  console.log(`   ${count} journalists`);
}

check().catch(console.error);
