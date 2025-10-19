const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function testCreativeEnhancement() {
  console.log('\n🎯 Testing Creative Enhancement with Executable Campaigns\n');
  console.log('=' .repeat(60));

  // Get the most recent opportunities
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching opportunities:', error);
    return;
  }

  if (!opportunities || opportunities.length === 0) {
    console.log('No opportunities found in database');
    return;
  }

  console.log(`\nFound ${opportunities.length} recent opportunities\n`);

  // Check each opportunity for creative fields
  let hasCreative = 0;
  let hasExecutableContent = 0;
  let hasResourceIntensive = 0;

  opportunities.forEach((opp, index) => {
    console.log(`\n${index + 1}. ${opp.title}`);
    console.log('   Organization:', opp.organization_id);
    console.log('   Created:', new Date(opp.created_at).toLocaleString());

    const campaignName = opp.data?.campaign_name || opp.data?.playbook?.campaign_name;
    const creativeApproach = opp.data?.creative_approach || opp.data?.playbook?.creative_approach;

    if (campaignName || creativeApproach) {
      hasCreative++;
      console.log('\n   ✅ HAS CREATIVE FIELDS:');

      if (campaignName) {
        console.log(`   📌 Campaign: "${campaignName}"`);
      }

      if (creativeApproach) {
        console.log(`   🎨 Approach: "${creativeApproach.substring(0, 200)}..."`);

        // Check for executable content keywords
        const executableKeywords = [
          'social media', 'twitter', 'linkedin', 'instagram', 'tiktok',
          'short-form', 'video', 'content', 'narrative', 'story',
          'pitch', 'media angle', 'thread', 'post', 'reel', 'shorts',
          'campaign', 'series', 'engagement', 'influencer'
        ];

        const resourceIntensiveKeywords = [
          'documentary', 'vr', 'ar', 'virtual reality', 'augmented reality',
          'film', 'event', 'installation', 'exhibition', 'conference'
        ];

        const approach = creativeApproach.toLowerCase();

        const hasExecutable = executableKeywords.some(keyword =>
          approach.includes(keyword)
        );

        const hasIntensive = resourceIntensiveKeywords.some(keyword =>
          approach.includes(keyword)
        );

        if (hasExecutable) {
          hasExecutableContent++;
          console.log('   ✅ Contains executable tactics');
        }

        if (hasIntensive) {
          hasResourceIntensive++;
          console.log('   ⚠️  Contains resource-intensive ideas');
        }
      }
    } else {
      console.log('   ❌ No creative fields found');
    }
  });

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 SUMMARY:');
  console.log(`   Total opportunities checked: ${opportunities.length}`);
  console.log(`   Has creative fields: ${hasCreative} (${Math.round(hasCreative/opportunities.length*100)}%)`);

  if (hasCreative > 0) {
    console.log(`   Contains executable tactics: ${hasExecutableContent} (${Math.round(hasExecutableContent/hasCreative*100)}% of creative)`);
    console.log(`   Contains resource-intensive: ${hasResourceIntensive} (${Math.round(hasResourceIntensive/hasCreative*100)}% of creative)`);
  }

  if (hasCreative === 0) {
    console.log('\n⚠️  No creative fields found. You may need to:');
    console.log('   1. Run the full pipeline to generate new opportunities');
    console.log('   2. Check that opportunity-orchestrator-v2 is deployed');
    console.log('   3. Verify Claude API is working properly');
  } else if (hasResourceIntensive > hasExecutableContent) {
    console.log('\n⚠️  More resource-intensive than executable content detected.');
    console.log('   The updated prompts should reduce this in new opportunities.');
  } else {
    console.log('\n✅ Creative enhancement is working with focus on executable campaigns!');
  }
}

testCreativeEnhancement();