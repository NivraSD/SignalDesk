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

// Read JournalistsExpanded.md
const journalistsExpandedPath = path.join(__dirname, 'JournalistsExpanded.md');
const content = fs.readFileSync(journalistsExpandedPath, 'utf-8');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse JournalistsExpanded.md to extract ALL journalists
 * Structure:
 *   1. TIER1_OUTLETS/TIER2_OUTLETS → Outlet → beat → array of journalists
 *   2. Root-level expanded arrays (e.g., healthcare_biotech_expanded: [...])
 */
function parseJournalistsExpanded(content) {
  const journalists = [];

  // Extract TIER1_OUTLETS
  const tier1Match = content.match(/export const TIER1_OUTLETS = \{([\s\S]*?)\n\};/);
  if (tier1Match) {
    parseOutletSection(tier1Match[1], 'tier1', journalists);
  }

  // Extract TIER2_OUTLETS
  const tier2Match = content.match(/export const TIER2_OUTLETS = \{([\s\S]*?)\n\};/);
  if (tier2Match) {
    parseOutletSection(tier2Match[1], 'tier2', journalists);
  }

  // Extract root-level expanded arrays (fintech_expanded, healthcare_biotech_expanded, etc.)
  // These are AFTER the TIER2_OUTLETS closing }; and contain flat journalist arrays
  const afterTier2 = content.split('export const TIER2_OUTLETS')[1];
  if (afterTier2) {
    parseRootLevelExpandedArrays(afterTier2, journalists);
  }

  return journalists;
}

/**
 * Parse an outlet section (TIER1_OUTLETS or TIER2_OUTLETS)
 */
function parseOutletSection(content, tier, journalists) {
  // Match each outlet: 'Outlet Name': { ... journalists: { beat: [...] } }
  const outletRegex = /'([^']+)':\s*\{[\s\S]*?journalists:\s*\{([\s\S]*?)\n\s*\}/g;
  let outletMatch;

  while ((outletMatch = outletRegex.exec(content)) !== null) {
    const outlet = outletMatch[1];
    const journalistsSection = outletMatch[2];

    console.log(`  📰 Parsing ${outlet}...`);

    // Match each beat/industry within the outlet
    const industryRegex = /(\w+):\s*\[([\s\S]*?)\]/g;
    let industryMatch;

    while ((industryMatch = industryRegex.exec(journalistsSection)) !== null) {
      const industry = industryMatch[1];
      const journalistsArray = industryMatch[2];

      // Parse individual journalist objects
      // Format: { name: 'Name', beat: 'Beat', twitter: '@handle', email: 'email@domain.com' }
      const journalistRegex = /\{\s*name:\s*'([^']+)',\s*beat:\s*'([^']+)'(?:,\s*twitter:\s*'(@[^']+)')?(?:,\s*email:\s*'([^']+)')?\s*\}/g;
      let journalistMatch;

      while ((journalistMatch = journalistRegex.exec(journalistsArray)) !== null) {
        const name = journalistMatch[1];
        const beat = journalistMatch[2];
        const twitter = journalistMatch[3] || null;
        const email = journalistMatch[4] || null;

        // Normalize industry name (remove _expanded suffix, etc.)
        const normalizedIndustry = normalizeIndustry(industry);

        journalists.push({
          name,
          outlet,
          beat,
          industry: normalizedIndustry,
          tier,
          twitter_handle: twitter,
          email,
          topics: [beat, normalizedIndustry],
          enrichment_status: email ? 'complete' : 'pending'
        });
      }
    }
  }
}

/**
 * Parse root-level expanded arrays (not in TIER1/TIER2 structure)
 * Format: industry_name_expanded: [ { name, outlet, beat, twitter, email }, ... ]
 */
function parseRootLevelExpandedArrays(content, journalists) {
  // Match patterns like: fintech_expanded: [ ... ]
  // or healthcare_biotech_expanded: [ ... ]
  const expandedArrayRegex = /\/\/\s*([A-Z &]+)\s*\([^)]*\)\s*\n\s*(\w+_?\w*_?expanded):\s*\[([\s\S]*?)\n\s*\]/g;
  let match;

  while ((match = expandedArrayRegex.exec(content)) !== null) {
    const sectionName = match[1]; // e.g., "HEALTHCARE & BIOTECH"
    const categoryName = match[2]; // e.g., "healthcare_biotech_expanded"
    const journalistsArray = match[3];

    console.log(`  📰 Parsing root-level category: ${categoryName}...`);

    // Parse journalists in format: { name: 'Name', outlet: 'Outlet', beat: 'Beat', twitter: '@handle', email: 'email@domain.com' }
    const journalistRegex = /\{\s*name:\s*'([^']+)',\s*outlet:\s*'([^']+)',\s*beat:\s*'([^']+)'(?:,\s*twitter:\s*'(@[^']+)')?(?:,\s*email:\s*'([^']+)')?\s*\}/g;
    let journalistMatch;

    while ((journalistMatch = journalistRegex.exec(journalistsArray)) !== null) {
      const name = journalistMatch[1];
      const outlet = journalistMatch[2];
      const beat = journalistMatch[3];
      const twitter = journalistMatch[4] || null;
      const email = journalistMatch[5] || null;

      // Determine tier based on outlet (simplified - assume tier2 for trade publications)
      const tier = determineTierFromOutlet(outlet);

      // Normalize the category name to industry
      const industry = normalizeIndustry(categoryName.replace(/_expanded$/, ''));

      journalists.push({
        name,
        outlet,
        beat,
        industry,
        tier,
        twitter_handle: twitter,
        email,
        topics: [beat, industry],
        enrichment_status: email ? 'complete' : 'pending'
      });
    }
  }
}

/**
 * Determine tier from outlet name
 * Tier 1: NYT, WSJ, Bloomberg, Reuters, WaPo, FT, etc.
 * Tier 2/Trade: Industry-specific publications
 */
function determineTierFromOutlet(outlet) {
  const tier1Outlets = [
    'New York Times', 'Wall Street Journal', 'Bloomberg', 'Washington Post',
    'Reuters', 'Financial Times', 'TechCrunch', 'CNBC', 'Axios', 'The Verge',
    'The Information', 'Wired', 'Forbes', 'Fortune', 'STAT News', 'CoinDesk',
    'Ars Technica', 'MIT Tech Review', 'The Atlantic', 'Semafor', 'Puck', 'Vox',
    'Platformer', 'Big Technology', 'The Block', 'NPR', 'AP News', 'CNN'
  ];

  return tier1Outlets.includes(outlet) ? 'tier1' : 'tier2';
}

/**
 * Normalize industry names
 * Maps things like "fintech_expanded" → "fintech", "ai" → "artificial_intelligence"
 */
function normalizeIndustry(industry) {
  // Remove _expanded suffix
  industry = industry.replace(/_expanded$/, '');

  // Map common variations
  const mapping = {
    'ai': 'artificial_intelligence',
    'crypto': 'cryptocurrency',
    'vc_startups': 'venture_capital',
    'climate_energy': 'energy',  // NEW: map climate_energy to energy
    'energy': 'energy',  // Keep energy as-is
    'oil_gas': 'energy',  // Map oil & gas to energy
    'healthcare_biotech': 'healthcare',
    'automotive_mobility': 'automotive',
    'retail_ecommerce': 'retail',
    'media_entertainment': 'media',
    'food_agtech': 'food',
    'enterprise_cloud': 'technology',
    'consumer_tech': 'technology',
    'defense_tech': 'technology',
    'devtools': 'technology',
    'edtech': 'technology',
    'gaming': 'technology',
    'insurtech': 'fintech',
    'legaltech': 'technology',
    'proptech': 'real_estate',
    'quantum': 'technology',
    'robotics': 'technology',
    'saas': 'technology',
    'semiconductors': 'technology',
    'streaming': 'media',
    'supply_chain': 'business',
    'telecom': 'technology',
    'web3': 'cryptocurrency',
    'creator_economy': 'media',
    'immigration_tech': 'policy',
    'privacy': 'policy'
  };

  return mapping[industry] || industry;
}

/**
 * Populate database with journalists
 */
async function populateDatabase(journalists) {
  console.log(`\n📊 Preparing to ADD ${journalists.length} journalists...`);

  // Check current count
  const { count: beforeCount } = await supabase
    .from('journalist_registry')
    .select('*', { count: 'exact', head: true });

  console.log(`📈 Current database count: ${beforeCount || 0}`);
  console.log(`➕ Adding ${journalists.length} to existing ${beforeCount || 0}...`);

  // Insert in batches
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < journalists.length; i += batchSize) {
    const batch = journalists.slice(i, i + batchSize);

    const { error } = await supabase
      .from('journalist_registry')
      .insert(batch);

    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} journalists)`);
    }
  }

  console.log(`\n📊 Final Results:`);
  console.log(`✅ Successfully inserted: ${inserted}`);
  console.log(`❌ Failed: ${errors}`);

  // Verify and show stats
  const { count } = await supabase
    .from('journalist_registry')
    .select('*', { count: 'exact', head: true });

  console.log(`📈 Total journalists in database: ${count}`);

  // Show breakdown by industry
  const { data: allJournalists } = await supabase
    .from('journalist_registry')
    .select('industry, tier, email');

  if (allJournalists) {
    const industryGroups = allJournalists.reduce((acc, j) => {
      if (!acc[j.industry]) {
        acc[j.industry] = { total: 0, tier1: 0, tier2: 0, withEmail: 0 };
      }
      acc[j.industry].total++;
      if (j.tier === 'tier1') acc[j.industry].tier1++;
      if (j.tier === 'tier2') acc[j.industry].tier2++;
      if (j.email) acc[j.industry].withEmail++;
      return acc;
    }, {});

    console.log(`\n📋 Breakdown by industry:`);
    Object.entries(industryGroups)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([industry, stats]) => {
        console.log(`  ${industry.padEnd(25)} ${stats.total} total (T1: ${stats.tier1}, T2: ${stats.tier2}, emails: ${stats.withEmail})`);
      });
  }

  // Show total with emails
  const withEmails = journalists.filter(j => j.email).length;
  console.log(`\n📧 ${withEmails} journalists have email addresses (${Math.round(withEmails/journalists.length*100)}%)`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Populating journalist registry from JournalistsExpanded.md\n');

  console.log('📖 Parsing JournalistsExpanded.md...');
  const journalists = parseJournalistsExpanded(content);

  console.log(`\n✅ Extracted ${journalists.length} journalists`);
  console.log(`   ${journalists.filter(j => j.tier === 'tier1').length} Tier 1`);
  console.log(`   ${journalists.filter(j => j.tier === 'tier2').length} Tier 2`);
  console.log(`   ${journalists.filter(j => j.email).length} with emails`);

  // Get unique industries
  const industries = [...new Set(journalists.map(j => j.industry))].sort();
  console.log(`\n📊 ${industries.length} industries covered:`);
  console.log(`   ${industries.join(', ')}`);

  console.log('\n💾 Populating database...');
  await populateDatabase(journalists);

  console.log('\n✅ Done!');
}

main().catch(console.error);
