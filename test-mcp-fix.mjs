// Test MCP Discovery fix - regenerate profile for Mitsui & Co.
import { config } from 'dotenv';
config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const ORG_ID = '4f9504ea-9ba3-4696-9e75-8f226f23f4ad';
const ORG_NAME = 'Mitsui & Co.';

console.log('🔧 Testing MCP Discovery fix...\n');

// Trigger MCP Discovery
console.log('📡 Triggering MCP Discovery for Mitsui & Co...');
const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-discovery`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
  },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'create_organization_profile',
      arguments: {
        organization_id: ORG_ID,
        organization_name: ORG_NAME,
        industry_hint: 'Trading',
        product_lines: [
          'Commodity Trading and Marketing',
          'Resource Development and Investment',
          'Supply Chain Management',
          'Infrastructure Investment and Development',
          'Trade Finance and Risk Management'
        ],
        key_markets: [
          'Asia Pacific',
          'North America',
          'South America',
          'Europe',
          'Africa',
          'Middle East',
          'Japan'
        ],
        business_model: 'General Trading Company (Sogo Shosha)'
      }
    }
  })
});

if (!response.ok) {
  console.error('❌ MCP Discovery failed:', response.status, await response.text());
  process.exit(1);
}

const result = await response.json();
console.log('✅ MCP Discovery completed\n');

// Verify profile structure
console.log('🔍 Verifying profile structure...');
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const { data, error } = await supabase
  .from('organizations')
  .select('company_profile')
  .eq('id', ORG_ID)
  .single();

if (error) {
  console.error('❌ Failed to fetch profile:', error);
  process.exit(1);
}

const profile = data.company_profile;

console.log('\n📊 Profile structure:');
console.log(`   Has top-level sources: ${!!profile.sources}`);
if (profile.sources) {
  console.log(`   Source categories: ${Object.keys(profile.sources).join(', ')}`);
  Object.entries(profile.sources).forEach(([category, sources]) => {
    if (Array.isArray(sources)) {
      console.log(`     - ${category}: ${sources.length} sources`);
    }
  });
}

console.log(`   Has monitoring_config.sources_by_category: ${!!profile.monitoring_config?.sources_by_category}`);
if (profile.monitoring_config?.sources_by_category) {
  console.log(`   Monitoring config categories: ${Object.keys(profile.monitoring_config.sources_by_category).join(', ')}`);
}

// Count total sources
let totalSources = 0;
if (profile.sources) {
  Object.values(profile.sources).forEach(sources => {
    if (Array.isArray(sources)) {
      totalSources += sources.length;
    }
  });
}

console.log(`\n📈 Total sources: ${totalSources}`);

if (totalSources > 0) {
  console.log('\n✅ SUCCESS: Profile has sources!');
} else {
  console.log('\n❌ FAILURE: Profile still has 0 sources');
  process.exit(1);
}
