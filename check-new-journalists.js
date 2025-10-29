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

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNewJournalists() {
  console.log('🔍 Checking for new journalists from journalistupdate.md...\n');

  // Check for specific outlets/people that should be there
  const testCases = [
    // Vertical Publications
    { name: 'Ryan Golden', outlet: 'Construction Dive', category: 'Vertical Publications' },
    { name: 'Kate Tornone', outlet: 'HR Dive', category: 'Vertical Publications' },
    { name: 'Kim Davis', outlet: 'MarTech', category: 'Vertical Publications' },
    { name: 'Sean O\'Neill', outlet: 'Skift', category: 'Vertical Publications - Travel' },

    // Podcasters
    { name: 'Casey Newton', outlet: 'Platformer', category: 'Podcast Journalists' },
    { name: 'Kara Swisher', outlet: 'Pivot', category: 'Podcast Journalists' },

    // Newsletter Writers
    { name: 'Ben Thompson', outlet: 'Stratechery', category: 'Newsletter Journalists' },
    { name: 'Matt Levine', outlet: 'Money Stuff', category: 'Newsletter Journalists' },

    // Regional Tech Press
    { name: 'Mark Hurst', outlet: 'Austin Business Journal', category: 'Regional Tech Press' },

    // YouTube
    { name: 'Marques Brownlee', outlet: 'MKBHD', category: 'YouTube Tech' },
    { name: 'Linus Sebastian', outlet: 'Linus Tech Tips', category: 'YouTube Tech' }
  ];

  console.log('📋 Testing for specific journalists that should exist:\n');

  for (const test of testCases) {
    const { data, error } = await supabase
      .from('journalist_registry')
      .select('name, outlet, industry')
      .ilike('name', `%${test.name}%`)
      .single();

    if (data) {
      console.log(`✅ FOUND: ${test.name} (${test.outlet}) - ${test.category}`);
    } else {
      console.log(`❌ MISSING: ${test.name} (${test.outlet}) - ${test.category}`);
    }
  }

  // Check total counts by outlet type
  console.log('\n📊 Checking outlet distribution:\n');

  const { data: outlets, error: outletError } = await supabase
    .from('journalist_registry')
    .select('outlet');

  if (outlets) {
    const outletCounts = outlets.reduce((acc, j) => {
      acc[j.outlet] = (acc[j.outlet] || 0) + 1;
      return acc;
    }, {});

    // Show some key outlets
    const keyOutlets = [
      'Construction Dive', 'HR Dive', 'MarTech', 'Skift', 'SportTechie',
      'Platformer', 'Stratechery', 'Money Stuff',
      'Austin Business Journal', 'Miami Herald',
      'MKBHD', 'Linus Tech Tips'
    ];

    keyOutlets.forEach(outlet => {
      const count = outletCounts[outlet] || 0;
      if (count > 0) {
        console.log(`  ✅ ${outlet}: ${count} journalists`);
      } else {
        console.log(`  ❌ ${outlet}: 0 journalists (MISSING!)`);
      }
    });
  }

  console.log('\n🔢 Total count in database:', outlets?.length || 0);
}

checkNewJournalists().catch(console.error);
