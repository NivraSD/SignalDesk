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

// Read JournalistUpdate.md
const updateFilePath = path.join(__dirname, 'JournalistUpdate.md');
const content = fs.readFileSync(updateFilePath, 'utf-8');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse journalistupdate.md - handles multiple structures
 */
function parseJournalistUpdate(content) {
  const journalists = [];

  // 1. Parse TIER1_OUTLETS_EXPANDED
  console.log('📰 Parsing TIER1_OUTLETS_EXPANDED...');
  const tier1Match = content.match(/export const TIER1_OUTLETS_EXPANDED = \{([\s\S]*?)\n\};/);
  if (tier1Match) {
    parseOutletSection(tier1Match[1], 'tier1', journalists);
  }

  // 2. Parse TIER2_OUTLETS_EXPANDED
  console.log('📰 Parsing TIER2_OUTLETS_EXPANDED...');
  const tier2Match = content.match(/export const TIER2_OUTLETS_EXPANDED = \{([\s\S]*?)\n\};/);
  if (tier2Match) {
    parseOutletSection(tier2Match[1], 'tier2', journalists);
  }

  // 3. Parse VERTICAL_PUBLICATIONS
  console.log('📰 Parsing VERTICAL_PUBLICATIONS...');
  const verticalMatch = content.match(/export const VERTICAL_PUBLICATIONS = \{([\s\S]*?)\n\};/);
  if (verticalMatch) {
    parseVerticalPublications(verticalMatch[1], journalists);
  }

  // 4. Parse PODCAST_JOURNALISTS
  console.log('📰 Parsing PODCAST_JOURNALISTS...');
  const podcastMatch = content.match(/export const PODCAST_JOURNALISTS = \{([\s\S]*?)\n\};/);
  if (podcastMatch) {
    parseFlatJournalistArrays(podcastMatch[1], 'tier1', journalists);
  }

  // 5. Parse NEWSLETTER_JOURNALISTS
  console.log('📰 Parsing NEWSLETTER_JOURNALISTS...');
  const newsletterMatch = content.match(/export const NEWSLETTER_JOURNALISTS = \{([\s\S]*?)\n\};/);
  if (newsletterMatch) {
    parseFlatJournalistArrays(newsletterMatch[1], 'tier1', journalists);
  }

  // 6. Parse REGIONAL_TECH_PRESS
  console.log('📰 Parsing REGIONAL_TECH_PRESS...');
  const regionalMatch = content.match(/export const REGIONAL_TECH_PRESS = \{([\s\S]*?)\n\};/);
  if (regionalMatch) {
    parseRegionalPress(regionalMatch[1], journalists);
  }

  // 7. Parse EUROPEAN_TECH_PRESS
  console.log('📰 Parsing EUROPEAN_TECH_PRESS...');
  const europeanMatch = content.match(/export const EUROPEAN_TECH_PRESS = \{([\s\S]*?)\n\};/);
  if (europeanMatch) {
    parseSimpleOutletFormat(europeanMatch[1], 'tier2', journalists);
  }

  // 8. Parse ASIA_TECH_PRESS
  console.log('📰 Parsing ASIA_TECH_PRESS...');
  const asiaMatch = content.match(/export const ASIA_TECH_PRESS = \{([\s\S]*?)\n\};/);
  if (asiaMatch) {
    parseSimpleOutletFormat(asiaMatch[1], 'tier2', journalists);
  }

  // 9. Parse ADDITIONAL_INDUSTRY_JOURNALISTS
  console.log('📰 Parsing ADDITIONAL_INDUSTRY_JOURNALISTS...');
  const additionalMatch = content.match(/export const ADDITIONAL_INDUSTRY_JOURNALISTS = \{([\s\S]*?)\n\};/);
  if (additionalMatch) {
    parseFlatJournalistArrays(additionalMatch[1], 'tier2', journalists);
  }

  // 10. Parse YOUTUBE_TECH_JOURNALISTS
  console.log('📰 Parsing YOUTUBE_TECH_JOURNALISTS...');
  const youtubeMatch = content.match(/export const YOUTUBE_TECH_JOURNALISTS = \[([\s\S]*?)\n\];/);
  if (youtubeMatch) {
    parseYouTubeJournalists(youtubeMatch[1], journalists);
  }

  return journalists;
}

/**
 * Parse outlet sections (TIER1/TIER2 format with nested beat arrays)
 */
function parseOutletSection(content, tier, journalists) {
  const outletRegex = /'([^']+)':\s*\{[\s\S]*?journalists:\s*\{([\s\S]*?)\n\s*\}/g;
  let outletMatch;

  while ((outletMatch = outletRegex.exec(content)) !== null) {
    const outlet = outletMatch[1];
    const journalistsSection = outletMatch[2];

    console.log(`  📄 ${outlet}`);

    // Match each industry/beat within outlet
    const industryRegex = /(\w+):\s*\[([\s\S]*?)\]/g;
    let industryMatch;

    while ((industryMatch = industryRegex.exec(journalistsSection)) !== null) {
      const industry = industryMatch[1];
      const journalistsArray = industryMatch[2];

      // Parse journalist objects
      const journalistRegex = /\{\s*name:\s*'([^']+)',\s*beat:\s*'([^']+)'(?:,\s*twitter:\s*'(@[^']+)')?(?:,\s*email:\s*'([^']+)')?(?:,\s*notes:\s*'([^']+)')?\s*\}/g;
      let journalistMatch;

      while ((journalistMatch = journalistRegex.exec(journalistsArray)) !== null) {
        journalists.push({
          name: journalistMatch[1],
          outlet,
          beat: journalistMatch[2],
          industry: normalizeIndustry(industry),
          tier,
          twitter_handle: journalistMatch[3] || null,
          email: journalistMatch[4] || null,
          topics: [journalistMatch[2], normalizeIndustry(industry)],
          enrichment_status: journalistMatch[4] ? 'complete' : 'pending'
        });
      }
    }
  }
}

/**
 * Parse vertical publications (flat arrays of journalists per outlet)
 */
function parseVerticalPublications(content, journalists) {
  // Match: 'Outlet Name': { journalists: [...] }
  const outletRegex = /'([^']+)':\s*\{[\s\S]*?journalists:\s*\[([\s\S]*?)\]\s*\}/g;
  let outletMatch;

  while ((outletMatch = outletRegex.exec(content)) !== null) {
    const outlet = outletMatch[1];
    const journalistsArray = outletMatch[2];

    console.log(`  📄 ${outlet}`);

    // Match both single-line AND multi-line formats
    const journalistRegex = /\{\s*name:\s*'([^']+)'[\s\S]*?beat:\s*'([^']+)'[\s\S]*?(?:twitter:\s*'(@[^']+)')?[\s\S]*?(?:email:\s*'([^']+)')?\s*\}/g;
    let journalistMatch;

    while ((journalistMatch = journalistRegex.exec(journalistsArray)) !== null) {
      const industry = inferIndustryFromBeat(journalistMatch[2]);

      journalists.push({
        name: journalistMatch[1],
        outlet,
        beat: journalistMatch[2],
        industry,
        tier: 'tier2',
        twitter_handle: journalistMatch[3] || null,
        email: journalistMatch[4] || null,
        topics: [journalistMatch[2], industry],
        enrichment_status: journalistMatch[4] ? 'complete' : 'pending'
      });
    }
  }
}

/**
 * Parse flat journalist arrays (podcasts, newsletters, additional)
 */
function parseFlatJournalistArrays(content, tier, journalists) {
  // Match: industry: [ { name, outlet, beat, ... }, ... ]
  const industryRegex = /(\w+):\s*\[([\s\S]*?)\n\]/g;
  let industryMatch;
  let totalFound = 0;

  while ((industryMatch = industryRegex.exec(content)) !== null) {
    const industry = industryMatch[1];
    const journalistsArray = industryMatch[2];
    let count = 0;

    // Match both single-line AND multi-line formats
    const journalistRegex = /\{\s*name:\s*'([^']+)'[\s\S]*?outlet:\s*'([^']+)'[\s\S]*?beat:\s*'([^']+)'[\s\S]*?(?:twitter:\s*'(@[^']+)')?[\s\S]*?(?:email:\s*'([^']+)')?\s*\}/g;
    let journalistMatch;

    while ((journalistMatch = journalistRegex.exec(journalistsArray)) !== null) {
      journalists.push({
        name: journalistMatch[1],
        outlet: journalistMatch[2],
        beat: journalistMatch[3],
        industry: normalizeIndustry(industry),
        tier,
        twitter_handle: journalistMatch[4] || null,
        email: journalistMatch[5] || null,
        topics: [journalistMatch[3], normalizeIndustry(industry)],
        enrichment_status: journalistMatch[5] ? 'complete' : 'pending'
      });
      count++;
    }

    if (count > 0) {
      console.log(`  ✓ ${industry}: ${count} journalists`);
      totalFound += count;
    }
  }

  return totalFound;
}

/**
 * Parse regional press (city → outlet → journalists)
 */
function parseRegionalPress(content, journalists) {
  // Match: 'City': { 'Outlet': { journalists: [...] } }
  const cityRegex = /'([^']+)':\s*\{([\s\S]*?)\n\s*\}/g;
  let cityMatch;

  while ((cityMatch = cityRegex.exec(content)) !== null) {
    const city = cityMatch[1];
    const outletsSection = cityMatch[2];

    console.log(`  📍 ${city}`);

    const outletRegex = /'([^']+)':\s*\{\s*domain:\s*'[^']*',\s*(?:format:\s*'[^']*',\s*)?journalists:\s*\[([\s\S]*?)\]\s*\}/g;
    let outletMatch;

    while ((outletMatch = outletRegex.exec(outletsSection)) !== null) {
      const outlet = outletMatch[1];
      const journalistsArray = outletMatch[2];

      const journalistRegex = /\{\s*name:\s*'([^']+)',\s*beat:\s*'([^']+)'(?:,\s*twitter:\s*'(@[^']+)')?(?:,\s*email:\s*'([^']+)')?\s*\}/g;
      let journalistMatch;

      while ((journalistMatch = journalistRegex.exec(journalistsArray)) !== null) {
        journalists.push({
          name: journalistMatch[1],
          outlet,
          beat: journalistMatch[2],
          industry: inferIndustryFromBeat(journalistMatch[2]),
          tier: 'tier2',
          twitter_handle: journalistMatch[3] || null,
          email: journalistMatch[4] || null,
          topics: [journalistMatch[2], city],
          enrichment_status: journalistMatch[4] ? 'complete' : 'pending'
        });
      }
    }
  }
}

/**
 * Parse simple outlet format (European/Asia press)
 */
function parseSimpleOutletFormat(content, tier, journalists) {
  const outletRegex = /'([^']+)':\s*\{[\s\S]*?journalists:\s*\[([\s\S]*?)\]\s*\}/g;
  let outletMatch;

  while ((outletMatch = outletRegex.exec(content)) !== null) {
    const outlet = outletMatch[1];
    const journalistsArray = outletMatch[2];

    console.log(`  📄 ${outlet}`);

    // Match both single-line AND multi-line formats
    const journalistRegex = /\{\s*name:\s*'([^']+)'[\s\S]*?beat:\s*'([^']+)'[\s\S]*?(?:twitter:\s*'(@[^']+)')?[\s\S]*?(?:email:\s*'([^']+)')?\s*\}/g;
    let journalistMatch;

    while ((journalistMatch = journalistRegex.exec(journalistsArray)) !== null) {
      journalists.push({
        name: journalistMatch[1],
        outlet,
        beat: journalistMatch[2],
        industry: inferIndustryFromBeat(journalistMatch[2]),
        tier,
        twitter_handle: journalistMatch[3] || null,
        email: journalistMatch[4] || null,
        topics: [journalistMatch[2]],
        enrichment_status: journalistMatch[4] ? 'complete' : 'pending'
      });
    }
  }
}

/**
 * Parse YouTube journalists
 */
function parseYouTubeJournalists(content, journalists) {
  // Match both single-line AND multi-line formats
  const journalistRegex = /\{\s*name:\s*'([^']+)'[\s\S]*?outlet:\s*'([^']+)'[\s\S]*?beat:\s*'([^']+)'[\s\S]*?(?:twitter:\s*'(@[^']+)')?[\s\S]*?(?:email:\s*'([^']+)')?\s*\}/g;
  let journalistMatch;

  while ((journalistMatch = journalistRegex.exec(content)) !== null) {
    journalists.push({
      name: journalistMatch[1],
      outlet: journalistMatch[2],
      beat: journalistMatch[3],
      industry: 'technology',
      tier: 'tier1', // YouTube creators are influential
      twitter_handle: journalistMatch[4] || null,
      email: journalistMatch[5] || null,
      topics: [journalistMatch[3], 'youtube', 'video'],
      enrichment_status: journalistMatch[5] ? 'complete' : 'pending'
    });
  }
}

/**
 * Normalize industry names
 */
function normalizeIndustry(industry) {
  industry = industry.replace(/_expanded$/, '').replace(/_additional$/, '');

  const mapping = {
    'ai': 'artificial_intelligence',
    'crypto': 'cryptocurrency',
    'cryptocurrency': 'cryptocurrency',
    'blockchain_web3': 'cryptocurrency',
    'vc_startups': 'venture_capital',
    'climate_energy': 'energy',
    'energy': 'energy',
    'healthcare_biotech': 'healthcare',
    'automotive_mobility': 'automotive',
    'retail_ecommerce': 'retail',
    'ecommerce': 'retail',
    'media_entertainment': 'media',
    'food_agtech': 'food',
    'technology': 'technology',
    'finance': 'fintech',
    'logistics': 'business',
    'luxury': 'retail',
    'legal': 'policy',
    'national_security': 'policy',
    'climate': 'energy',
    'housing': 'real_estate',
    'transportation': 'automotive',
    'fashion': 'retail',
    'education': 'technology',
    'wealth': 'fintech',
    'commodities': 'business',
    'economics': 'business',
    'customer_service': 'technology',
    'supply_chain': 'business',
    'sales_tech': 'technology',
    'cybersecurity': 'cybersecurity',
    'telecommunications': 'technology',
    'data_analytics': 'technology',
    'devtools': 'technology',
    'marketing': 'advertising',
    'business': 'business'
  };

  return mapping[industry] || 'technology';
}

/**
 * Infer industry from beat description
 */
function inferIndustryFromBeat(beat) {
  const beatLower = beat.toLowerCase();

  if (beatLower.includes('hr') || beatLower.includes('recruiting') || beatLower.includes('workplace')) return 'labor';
  if (beatLower.includes('marketing') || beatLower.includes('martech')) return 'advertising';
  if (beatLower.includes('construction') || beatLower.includes('manufacturing')) return 'business';
  if (beatLower.includes('hospitality') || beatLower.includes('travel') || beatLower.includes('hotel')) return 'business';
  if (beatLower.includes('sports')) return 'media';
  if (beatLower.includes('music') || beatLower.includes('entertainment')) return 'media';
  if (beatLower.includes('agriculture') || beatLower.includes('agtech') || beatLower.includes('food')) return 'food';
  if (beatLower.includes('beauty')) return 'retail';
  if (beatLower.includes('pet')) return 'retail';
  if (beatLower.includes('aging') || beatLower.includes('elder') || beatLower.includes('senior')) return 'healthcare';
  if (beatLower.includes('government') || beatLower.includes('civic')) return 'policy';
  if (beatLower.includes('supply chain') || beatLower.includes('logistics')) return 'business';
  if (beatLower.includes('cybersecurity') || beatLower.includes('security')) return 'cybersecurity';
  if (beatLower.includes('telecom') || beatLower.includes('wireless') || beatLower.includes('5g')) return 'technology';
  if (beatLower.includes('data') || beatLower.includes('analytics')) return 'technology';
  if (beatLower.includes('developer') || beatLower.includes('devops') || beatLower.includes('cloud native')) return 'technology';
  if (beatLower.includes('crypto') || beatLower.includes('blockchain') || beatLower.includes('web3') || beatLower.includes('nft')) return 'cryptocurrency';
  if (beatLower.includes('gaming') || beatLower.includes('esports')) return 'technology';

  return 'technology'; // default
}

/**
 * Populate database
 */
async function populateDatabase(journalists) {
  console.log(`\n📊 Preparing to insert ${journalists.length} journalists...`);

  // Get current count before clearing
  const { count: beforeCount } = await supabase
    .from('journalist_registry')
    .select('*', { count: 'exact', head: true });

  console.log(`📈 Current database count: ${beforeCount || 0}`);

  // CLEAR existing data for fresh import with fixed parsing
  console.log(`🗑️ Clearing existing journalists...`);
  const { error: deleteError } = await supabase
    .from('journalist_registry')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.error('⚠️ Error clearing table:', deleteError);
  } else {
    console.log('✅ Table cleared');
  }

  console.log(`➕ Inserting ${journalists.length} journalists...`);

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
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} (${batch.length} journalists)`);
    }
  }

  console.log(`\n📊 Final Results:`);
  console.log(`✅ Successfully inserted: ${inserted}`);
  console.log(`❌ Failed: ${errors}`);

  // Verify
  const { count } = await supabase
    .from('journalist_registry')
    .select('*', { count: 'exact', head: true });

  console.log(`📈 Total journalists in database: ${count}`);

  // Show breakdown
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

  const withEmails = journalists.filter(j => j.email).length;
  console.log(`\n📧 ${withEmails} journalists have email addresses (${Math.round(withEmails/journalists.length*100)}%)`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Importing MASSIVE journalist update (1,000+ journalists)\n');

  const journalists = parseJournalistUpdate(content);

  console.log(`\n✅ Extracted ${journalists.length} journalists`);
  console.log(`   ${journalists.filter(j => j.tier === 'tier1').length} Tier 1`);
  console.log(`   ${journalists.filter(j => j.tier === 'tier2').length} Tier 2`);
  console.log(`   ${journalists.filter(j => j.email).length} with emails`);

  const industries = [...new Set(journalists.map(j => j.industry))].sort();
  console.log(`\n📊 ${industries.length} industries covered:`);
  console.log(`   ${industries.join(', ')}`);

  console.log('\n💾 Populating database...');
  await populateDatabase(journalists);

  console.log('\n✅ Done! Journalist registry massively expanded!');
}

main().catch(console.error);
