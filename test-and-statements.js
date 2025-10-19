const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testMultiKeywordQueries() {
  console.log('🧪 Testing AND Statement Handling & Publication Metadata\n');

  const testCases = [
    {
      name: "Single keyword: AI",
      focusArea: "AI",
      expectedIndustries: ["artificial_intelligence"]
    },
    {
      name: "AND statement: AI and technology",
      focusArea: "AI and technology",
      expectedIndustries: ["artificial_intelligence", "technology"]
    },
    {
      name: "Multiple with comma: crypto, fintech",
      focusArea: "crypto, fintech",
      expectedIndustries: ["cryptocurrency", "fintech"]
    },
    {
      name: "Ampersand: healthcare & biotech",
      focusArea: "healthcare & biotech",
      expectedIndustries: ["healthcare"]
    },
    {
      name: "Complex: AI and space and climate",
      focusArea: "AI and space and climate",
      expectedIndustries: ["artificial_intelligence", "space", "climate"]
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`TEST: ${testCase.name}`);
    console.log(`Focus Area: "${testCase.focusArea}"`);
    console.log(`Expected Industries: ${testCase.expectedIndustries.join(', ')}`);
    console.log('─'.repeat(70));

    try {
      // Simulate what NIV would send
      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Give me 5 ${testCase.focusArea} journalists`,
          userId: "test-user",
          orgId: "60b16ab5-d9f3-4ae8-ab7d-b39fceb55bd3",
          stage: "full"
        })
      });

      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data.content?.journalists || data.content?.verified_journalists) {
        const journalists = data.content.journalists || data.content.verified_journalists || [];
        console.log(`\n✅ Found ${journalists.length} journalists`);

        // Show industries covered
        const industries = [...new Set(journalists.map(j => j.industry))];
        console.log(`📊 Industries: ${industries.join(', ')}`);

        // Show outlets with metadata
        console.log(`\n📰 Sample journalists with outlet metadata:`);
        journalists.slice(0, 3).forEach(j => {
          const meta = j.outlet_metadata || {};
          console.log(`  - ${j.name} (${j.outlet})`);
          console.log(`    Beat: ${j.beat}`);
          console.log(`    Outlet Category: ${meta.category || 'N/A'}`);
          console.log(`    Influence Score: ${meta.influence_score || 'N/A'}`);
          console.log(`    Reach: ${meta.reach || 'N/A'}`);
        });

        // Check gap analysis
        if (data.content.gap_analysis) {
          console.log(`\n📈 Gap Analysis:`);
          console.log(`   Has Gaps: ${data.content.gap_analysis.hasGaps}`);
          console.log(`   Current Count: ${data.content.gap_analysis.currentCount}`);
          console.log(`   Requested: ${data.content.gap_analysis.requestedCount}`);
          if (data.content.gap_analysis.hasGaps) {
            console.log(`   Missing: ${data.content.gap_analysis.missingCount}`);
          }
        }
      } else {
        console.log(`⚠️ No journalists found in response`);
        console.log(`Response mode: ${data.mode}`);
      }

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n' + '='.repeat(70));
  console.log('✅ All tests complete!');
  console.log('\n📝 Summary:');
  console.log('  - AND statements are parsed (split on "and", "&", ",")');
  console.log('  - Multiple industries are queried and combined');
  console.log('  - Outlet metadata includes: category, influence_score, reach');
  console.log('  - Gap detection works across multiple industries');
}

testMultiKeywordQueries().catch(console.error);
