const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMediaListGeneration() {
  console.log('🧪 Testing Media List Generation with Real Data\n');

  // First, verify journalist-registry function works
  console.log('1️⃣ Testing journalist-registry function...');

  try {
    const registryResponse = await fetch(
      `${supabaseUrl}/functions/v1/journalist-registry`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          industry: 'technology',
          tier: 'tier1',
          count: 5,
          mode: 'query'
        })
      }
    );

    if (registryResponse.ok) {
      const registryData = await registryResponse.json();
      console.log(`✅ journalist-registry returned ${registryData.journalists?.length || 0} journalists`);

      if (registryData.journalists && registryData.journalists.length > 0) {
        console.log('\n📋 Sample journalists from registry:\n');
        registryData.journalists.slice(0, 3).forEach(j => {
          console.log(`  ${j.name}`);
          console.log(`    Outlet: ${j.outlet}`);
          console.log(`    Email: ${j.email || 'Not available'}`);
          console.log(`    Beat: ${j.beat}`);
          console.log('');
        });
      }
    } else {
      console.error('❌ journalist-registry request failed:', registryResponse.status);
      const errorText = await registryResponse.text();
      console.error('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Error calling journalist-registry:', error.message);
  }

  // Now test media list generation through mcp-content
  console.log('\n2️⃣ Testing media list generation through mcp-content...');

  try {
    const mcpResponse = await fetch(
      `${supabaseUrl}/functions/v1/mcp-content`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          tool: 'generate_media_list',
          args: {
            industry: 'technology',
            narrative: 'OpenAI is revolutionizing AI development with its latest Codex release',
            proofPoints: ['300% growth in developer adoption', 'Fortune 500 integrations'],
            count: 5
          }
        })
      }
    );

    if (mcpResponse.ok) {
      const mcpData = await mcpResponse.json();
      console.log('✅ Media list generated successfully');
      console.log('\n📝 Generated Media List:\n');
      console.log(mcpData.content || mcpData.result || mcpData);

      // Check if it contains "SAMPLE" (which means it's using fallback)
      const resultText = JSON.stringify(mcpData);
      if (resultText.includes('SAMPLE')) {
        console.log('\n⚠️  WARNING: Media list contains "SAMPLE" - may not be using real data');
      } else {
        console.log('\n✅ Media list appears to use real journalist data (no "SAMPLE" markers)');
      }
    } else {
      console.error('❌ mcp-content request failed:', mcpResponse.status);
      const errorText = await mcpResponse.text();
      console.error('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Error calling mcp-content:', error.message);
  }
}

testMediaListGeneration().catch(console.error);
