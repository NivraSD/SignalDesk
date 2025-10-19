const fetch = require('node-fetch');

async function testPhaseCampaignExecution() {
  console.log('🧪 Testing phase campaign execution...\n');

  const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
  const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

  // Test payload simulating executor -> content-intelligent-v2 call
  const testPayload = {
    message: 'Generate coordinated awareness phase campaign',
    organizationContext: {
      organizationId: 'OpenAI',
      organizationName: 'OpenAI',
      industry: 'Technology'
    },
    stage: 'campaign_generation',
    campaignContext: {
      blueprintId: 'test-blueprint-123',
      campaignType: 'VECTOR_CAMPAIGN',
      campaignFolder: 'campaigns/test-campaign',
      phase: 'awareness',
      phaseNumber: 1,
      objective: 'Build initial awareness of Sora 2',
      narrative: 'Sora 2 represents breakthrough in AI video generation',
      targetStakeholders: ['Tech Media', 'Early Adopters'],
      positioning: 'Technical Pioneer',
      keyMessages: ['Revolutionary video quality', 'Unprecedented control'],
      researchInsights: ['Growing demand for AI video tools'],
      timeline: 'Week 1-3',
      currentDate: '2025-10-16',
      contentRequirements: {
        owned: [
          {
            type: 'blog-post',
            stakeholder: 'Tech Media',
            purpose: 'Introduce Sora 2 capabilities to technical audience',
            keyPoints: ['Technical specifications', 'Use cases']
          }
        ],
        media: [
          {
            type: 'media-pitch',
            journalists: ['John Doe', 'Jane Smith'],
            story: 'OpenAI announces Sora 2',
            positioning: 'Industry-leading video AI'
          }
        ]
      }
    }
  };

  console.log('📤 Calling niv-content-intelligent-v2...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📥 Response status:', response.status);

    const responseText = await response.text();
    console.log('\n📄 Raw response:');
    console.log(responseText.substring(0, 1000));

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ SUCCESS!');
        console.log('Generated content pieces:', data.generatedContent?.length || 0);
        console.log('Phase:', data.phase);
        console.log('Folder:', data.folder);

        if (data.generatedContent) {
          data.generatedContent.forEach((piece, idx) => {
            console.log(`\n  ${idx + 1}. ${piece.type} (${piece.stakeholder || 'general'})`);
            console.log(`     Content: ${piece.content ? 'Generated (' + piece.content.length + ' chars)' : 'FAILED - ' + piece.error}`);
          });
        }
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError.message);
      }
    } else {
      console.error('\n❌ Request failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPhaseCampaignExecution();
