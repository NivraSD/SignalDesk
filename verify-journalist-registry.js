const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  // Get all journalists
  const { data: all, error } = await supabase.from('journalist_registry').select('industry, email, tier, name, outlet');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (all) {
    // Group by industry
    const byIndustry = all.reduce((acc, j) => {
      if (!acc[j.industry]) {
        acc[j.industry] = { total: 0, withEmail: 0, tier1: 0, tier2: 0 };
      }
      acc[j.industry].total++;
      if (j.email) acc[j.industry].withEmail++;
      if (j.tier === 'tier1') acc[j.industry].tier1++;
      if (j.tier === 'tier2') acc[j.industry].tier2++;
      return acc;
    }, {});

    console.log('📊 Journalists by Industry:\n');
    Object.entries(byIndustry)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([industry, stats]) => {
        const ind = industry.padEnd(25);
        const tot = String(stats.total).padStart(3);
        const em = String(stats.withEmail).padStart(3);
        const t1 = String(stats.tier1).padStart(2);
        const t2 = String(stats.tier2).padStart(2);
        console.log(`  ${ind} | Total: ${tot} | Emails: ${em} | T1: ${t1} | T2: ${t2}`);
      });

    // Show overall stats
    const totalWithEmails = all.filter(j => j.email).length;
    const tier1Count = all.filter(j => j.tier === 'tier1').length;
    const tier2Count = all.filter(j => j.tier === 'tier2').length;

    console.log('\n📈 Overall Statistics:');
    console.log(`  Total journalists: ${all.length}`);
    console.log(`  With email addresses: ${totalWithEmails} (${Math.round(totalWithEmails/all.length*100)}%)`);
    console.log(`  Tier 1: ${tier1Count} (${Math.round(tier1Count/all.length*100)}%)`);
    console.log(`  Tier 2: ${tier2Count} (${Math.round(tier2Count/all.length*100)}%)`);

    // Show sample journalists with emails
    console.log('\n📋 Sample Journalists with Emails:\n');
    const withEmails = all.filter(j => j.email).slice(0, 5);
    withEmails.forEach(j => {
      const name = j.name.padEnd(25);
      const outlet = j.outlet.padEnd(20);
      const industry = j.industry.padEnd(15);
      console.log(`  ${name} | ${outlet} | ${industry} | ${j.email}`);
    });
  }
}

verify().catch(console.error);
