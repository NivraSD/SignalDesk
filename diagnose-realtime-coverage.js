// Diagnostic script to check what the real-time monitor is seeing
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  console.log('🔍 DIAGNOSING REAL-TIME MONITOR COVERAGE\n');

  const orgName = 'OpenAI';

  // STEP 1: Check Discovery Profile
  console.log('📍 STEP 1: Checking Discovery Profile');
  const discoveryResponse = await supabase.functions.invoke('mcp-discovery', {
    body: {
      tool: 'create_organization_profile',
      arguments: {
        organization_name: orgName,
        save_to_persistence: false
      }
    }
  });

  const profile = discoveryResponse.data?.profile;
  console.log('Profile competitors:', {
    direct: profile?.competition?.direct_competitors?.length || 0,
    indirect: profile?.competition?.indirect_competitors?.length || 0,
    emerging: profile?.competition?.emerging_threats?.length || 0,
    sample: profile?.competition?.direct_competitors?.slice(0, 10) || []
  });

  // STEP 2: Check Monitor-Stage-1 Articles
  console.log('\n📍 STEP 2: Checking Monitor-Stage-1 Articles');
  const monitorResponse = await supabase.functions.invoke('monitor-stage-1', {
    body: {
      organization_name: orgName,
      profile: profile
    }
  });

  const articles = monitorResponse.data?.articles || [];
  console.log(`Total articles: ${articles.length}`);

  // Analyze article entity coverage
  const entityMentions = {};
  const competitors = [
    ...(profile?.competition?.direct_competitors || []),
    ...(profile?.competition?.indirect_competitors || [])
  ];

  articles.forEach(article => {
    const text = `${article.title} ${article.description}`.toLowerCase();

    // Check org
    if (text.includes(orgName.toLowerCase())) {
      entityMentions[orgName] = (entityMentions[orgName] || 0) + 1;
    }

    // Check competitors
    competitors.forEach(comp => {
      if (comp && text.includes(comp.toLowerCase())) {
        entityMentions[comp] = (entityMentions[comp] || 0) + 1;
      }
    });
  });

  console.log('\n📊 Entity Coverage in Articles:');
  const sorted = Object.entries(entityMentions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  sorted.forEach(([entity, count]) => {
    const pct = ((count / articles.length) * 100).toFixed(1);
    console.log(`  ${entity}: ${count} articles (${pct}%)`);
  });

  // Check for missing competitors
  const mentionedCompetitors = sorted.map(([entity]) => entity);
  const missingCompetitors = competitors.filter(c => !mentionedCompetitors.includes(c)).slice(0, 10);

  console.log('\n⚠️ Missing Competitors (no articles):');
  missingCompetitors.forEach(comp => {
    console.log(`  - ${comp}`);
  });

  console.log('\n💡 RECOMMENDATION:');
  if (entityMentions[orgName] > articles.length * 0.7) {
    console.log('  ❌ Too org-focused! 70%+ articles are about the organization itself.');
    console.log('  ✅ FIX: Adjust monitor-stage-1 to prioritize competitor coverage.');
  } else {
    console.log('  ✅ Coverage looks balanced.');
  }
}

diagnose().catch(console.error);
