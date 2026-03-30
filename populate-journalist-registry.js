const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read the journalist files
const journalistsBasePath = path.join(__dirname, 'Journalists.md');
const journalistsExpandedPath = path.join(__dirname, 'JournalistsExpanded.md');

const journalistsBaseContent = fs.readFileSync(journalistsBasePath, 'utf-8');
const journalistsExpandedContent = fs.readFileSync(journalistsExpandedPath, 'utf-8');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse Journalists.md - extract the JOURNALIST_REGISTRY object
function parseJournalistsBase(content) {
  const journalists = [];

  // Extract the export const JOURNALIST_REGISTRY = { ... } object
  const registryMatch = content.match(/export const JOURNALIST_REGISTRY = \{([\s\S]*?)\n\};/);
  if (!registryMatch) {
    console.error('❌ Could not parse JOURNALIST_REGISTRY from Journalists.md');
    return journalists;
  }

  const registryContent = registryMatch[1];

  // Match each industry section
  const industryRegex = /(\w+):\s*\[([\s\S]*?)\]/g;
  let industryMatch;

  while ((industryMatch = industryRegex.exec(registryContent)) !== null) {
    const industry = industryMatch[1];
    const journalistsArray = industryMatch[2];

    // Parse individual journalist objects
    const journalistRegex = /\{\s*name:\s*['"]([^'"]+)['"],\s*outlet:\s*['"]([^'"]+)['"],\s*beat:\s*['"]([^'"]+)['"](?:,\s*twitter:\s*['"]([^'"]+)['"])?\s*\}/g;
    let journalistMatch;

    while ((journalistMatch = journalistRegex.exec(journalistsArray)) !== null) {
      journalists.push({
        name: journalistMatch[1],
        outlet: journalistMatch[2],
        beat: journalistMatch[3],
        twitter: journalistMatch[4] || null,
        industry: industry
      });
    }
  }

  return journalists;
}

// Parse JournalistsExpanded.md - extract email addresses and tier info
function parseJournalistsExpanded(content) {
  const journalistEmails = new Map(); // Key: "name|outlet", Value: { email, tier }

  // Extract TIER1_OUTLETS
  const tier1Match = content.match(/export const TIER1_OUTLETS = \{([\s\S]*?)\n\};/);
  if (tier1Match) {
    parseOutletSection(tier1Match[1], 'tier1', journalistEmails);
  }

  // Extract TIER2_OUTLETS if exists
  const tier2Match = content.match(/export const TIER2_OUTLETS = \{([\s\S]*?)\n\};/);
  if (tier2Match) {
    parseOutletSection(tier2Match[1], 'tier2', journalistEmails);
  }

  return journalistEmails;
}

function parseOutletSection(content, tier, journalistEmails) {
  // Match outlet sections: 'Outlet Name': { ... journalists: { industry: [...] } }
  const outletRegex = /'([^']+)':\s*\{[\s\S]*?journalists:\s*\{([\s\S]*?)\n\s*\}/g;
  let outletMatch;

  while ((outletMatch = outletRegex.exec(content)) !== null) {
    const outlet = outletMatch[1];
    const journalistsSection = outletMatch[2];

    // Match industry arrays within journalists
    const industryRegex = /(\w+):\s*\[([\s\S]*?)\]/g;
    let industryMatch;

    while ((industryMatch = industryRegex.exec(journalistsSection)) !== null) {
      const journalistsArray = industryMatch[2];

      // Parse individual journalist objects with emails
      const journalistRegex = /\{\s*name:\s*['"]([^'"]+)['"],\s*beat:\s*['"]([^'"]+)['"](?:,\s*twitter:\s*['"]([^'"]+)['"])?(?:,\s*email:\s*['"]([^'"]+)['"])?\s*\}/g;
      let journalistMatch;

      while ((journalistMatch = journalistRegex.exec(journalistsArray)) !== null) {
        const name = journalistMatch[1];
        const email = journalistMatch[4];

        if (email) {
          const key = `${name}|${outlet}`;
          journalistEmails.set(key, { email, tier });
        }
      }
    }
  }
}

// Merge the data
function mergeJournalistData(baseJournalists, expandedEmails) {
  const merged = [];

  for (const journalist of baseJournalists) {
    const key = `${journalist.name}|${journalist.outlet}`;
    const expandedData = expandedEmails.get(key);

    merged.push({
      name: journalist.name,
      outlet: journalist.outlet,
      beat: journalist.beat,
      industry: journalist.industry,
      tier: expandedData?.tier || 'tier2', // Default to tier2 if not in expanded list
      twitter_handle: journalist.twitter,
      email: expandedData?.email || null,
      topics: [journalist.beat], // Initialize topics with beat
      enrichment_status: expandedData?.email ? 'complete' : 'pending'
    });
  }

  return merged;
}

async function populateDatabase(journalists) {
  console.log(`📊 Preparing to insert ${journalists.length} journalists...`);

  // Clear existing data (optional - comment out if you want to keep existing data)
  const { error: deleteError } = await supabase
    .from('journalist_registry')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.error('⚠️ Error clearing table:', deleteError);
  } else {
    console.log('🗑️ Cleared existing data');
  }

  // Insert in batches of 100 (Supabase limit)
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < journalists.length; i += batchSize) {
    const batch = journalists.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('journalist_registry')
      .insert(batch);

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} journalists)`);
    }
  }

  console.log(`\n📊 Final Results:`);
  console.log(`✅ Successfully inserted: ${inserted}`);
  console.log(`❌ Failed: ${errors}`);

  // Verify the data
  const { count } = await supabase
    .from('journalist_registry')
    .select('*', { count: 'exact', head: true });

  console.log(`📈 Total journalists in database: ${count}`);

  // Show sample by industry
  const { data: sample } = await supabase
    .from('journalist_registry')
    .select('industry, count')
    .limit(20);

  if (sample) {
    console.log(`\n📋 Sample by industry:`);
    const industryGroups = await supabase
      .from('journalist_registry')
      .select('industry');

    if (industryGroups.data) {
      const counts = industryGroups.data.reduce((acc, j) => {
        acc[j.industry] = (acc[j.industry] || 0) + 1;
        return acc;
      }, {});

      Object.entries(counts).forEach(([industry, count]) => {
        console.log(`  ${industry}: ${count}`);
      });
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting journalist registry population...\n');

  console.log('📖 Parsing Journalists.md...');
  const baseJournalists = parseJournalistsBase(journalistsBaseContent);
  console.log(`✅ Found ${baseJournalists.length} journalists from base file\n`);

  console.log('📖 Parsing JournalistsExpanded.md...');
  const expandedEmails = parseJournalistsExpanded(journalistsExpandedContent);
  console.log(`✅ Found ${expandedEmails.size} journalists with emails\n`);

  console.log('🔄 Merging data...');
  const mergedJournalists = mergeJournalistData(baseJournalists, expandedEmails);

  const withEmails = mergedJournalists.filter(j => j.email).length;
  console.log(`✅ Merged ${mergedJournalists.length} total journalists`);
  console.log(`   📧 ${withEmails} with email addresses`);
  console.log(`   ⏳ ${mergedJournalists.length - withEmails} pending enrichment\n`);

  console.log('💾 Populating database...');
  await populateDatabase(mergedJournalists);

  console.log('\n✅ Done!');
}

main().catch(console.error);
