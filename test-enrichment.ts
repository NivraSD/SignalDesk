// Test enrichment directly
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const testProfile = {
  organization_name: "Mitsui & Co.",
  company_profile: {
    business_model: "Commodity trading company",
    product_lines: ["Metals", "Energy", "Food"],
    key_markets: ["Asia", "Europe"],
    strategic_goals: []
  },
  competition: {
    direct_competitors: ["Glencore", "Trafigura", "Vitol", "Cargill"],
    indirect_competitors: ["Sumitomo Corporation", "Mitsubishi Corporation"],
    emerging_threats: []
  },
  stakeholders: {
    regulators: ["CFTC", "DOE", "EPA"],
    major_investors: [],
    major_customers: []
  }
};

const testArticles = [
  {
    title: "Glencore announces major copper mining expansion in Chile",
    description: "Global commodity trader Glencore plans to invest $2B in Chilean copper operations",
    source: "Reuters",
    url: "https://reuters.com/glencore-chile",
    date: "2025-11-17",
    has_full_content: false
  },
  {
    title: "Trafigura wins LNG supply contract with major Asian buyer",
    description: "Commodity trading house Trafigura secures 10-year LNG supply deal worth $5B",
    source: "Bloomberg",
    url: "https://bloomberg.com/trafigura-lng",
    date: "2025-11-17",
    has_full_content: false
  },
  {
    title: "CFTC proposes new commodity trading position limits",
    description: "US regulator CFTC announces stricter oversight of commodity derivatives",
    source: "Financial Times",
    url: "https://ft.com/cftc-limits",
    date: "2025-11-17",
    has_full_content: false
  }
];

async function testEnrichment() {
  console.log('🧪 Testing enrichment with sample data...\n');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/monitoring-stage-2-enrichment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({
      articles: testArticles,
      profile: testProfile,
      organization_name: "Mitsui & Co."
    })
  });

  if (!response.ok) {
    console.error('❌ Enrichment failed:', response.status, response.statusText);
    const text = await response.text();
    console.error(text);
    return;
  }

  const data = await response.json();

  console.log('\n✅ ENRICHMENT RESPONSE:');
  console.log('Events extracted:', data.extracted_data?.events?.length || 0);
  console.log('Entities extracted:', data.extracted_data?.entities?.length || 0);
  console.log('Profile returned:', !!data.profile);
  console.log('Company profile returned:', !!data.profile?.company_profile);

  console.log('\n📊 SAMPLE EVENTS:');
  (data.extracted_data?.events || []).slice(0, 5).forEach((event, i) => {
    console.log(`\n${i+1}. [${event.type}] ${event.entity}`);
    console.log(`   ${event.description}`);
    console.log(`   Category: ${event.category}`);
  });

  console.log('\n📋 ENTITIES:', (data.extracted_data?.entities || []).slice(0, 10));

  // Check if events actually match our test articles
  const glencoreEvent = (data.extracted_data?.events || []).find(e =>
    e.entity?.toLowerCase().includes('glencore') || e.description?.toLowerCase().includes('glencore')
  );
  const trafiguraEvent = (data.extracted_data?.events || []).find(e =>
    e.entity?.toLowerCase().includes('trafigura') || e.description?.toLowerCase().includes('trafigura')
  );

  console.log('\n🎯 COMPETITOR EVENT CHECK:');
  console.log('Glencore event found:', !!glencoreEvent);
  if (glencoreEvent) console.log('  ', glencoreEvent);
  console.log('Trafigura event found:', !!trafiguraEvent);
  if (trafiguraEvent) console.log('  ', trafiguraEvent);
}

testEnrichment().catch(console.error);
