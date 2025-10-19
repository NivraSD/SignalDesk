const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

async function testInfluenceMapper() {
  console.log('🧪 Testing Influence Mapper with Tool Calling...\n');

  // Create mock enriched data with influence lever templates
  const enrichedData = {
    campaignGoal: 'Launch new AI-powered DevOps platform to enterprise market',
    positioning: {
      name: 'The Intelligent DevOps Platform',
      description: 'Enterprise-grade reliability meets AI-powered velocity',
      keyMessages: [
        'Reduce deployment time by 70% with AI-powered automation',
        'Enterprise security and compliance built-in',
        'Seamless integration with existing tools'
      ],
      differentiators: [
        'Only platform with built-in AI code review',
        'SOC2 Type II certified from day one',
        '99.99% uptime SLA'
      ],
      opportunities: [
        'First-mover advantage in AI DevOps space',
        'Growing demand for AI automation in enterprise'
      ]
    },
    influenceLeverTemplates: [
      {
        stakeholder: 'CTO',
        psychologicalProfile: {
          fears: ['System downtime', 'Security breaches', 'Vendor lock-in'],
          aspirations: ['Innovation leadership', 'Team productivity', 'Cost optimization']
        },
        primaryFear: 'System downtime and reliability issues',
        primaryAspiration: 'Drive innovation while maintaining stability',
        decisionTriggers: ['ROI proof', 'Security audit results', 'Peer references'],
        channels: ['TechCrunch', 'Gartner reports', 'LinkedIn', 'Industry conferences']
      },
      {
        stakeholder: 'VP Engineering',
        psychologicalProfile: {
          fears: ['Team burnout', 'Technical debt', 'Missed deadlines'],
          aspirations: ['Developer happiness', 'Faster delivery', 'Quality code']
        },
        primaryFear: 'Team burnout from manual deployments',
        primaryAspiration: 'Increase team velocity and satisfaction',
        decisionTriggers: ['Developer testimonials', 'Proof of concept', 'Time savings data'],
        channels: ['Hacker News', 'Dev.to', 'GitHub', 'Stack Overflow']
      }
    ],
    knowledgeLibrary: {
      foundational: [
        {
          title: 'Psychological Influence Patterns in B2B Sales',
          insights: ['Fear-based messaging drives urgency', 'Aspiration messaging drives long-term commitment']
        }
      ],
      pattern_specific: [
        {
          pattern: 'CHORUS',
          tactics: ['Coordinated multi-channel approach', 'Unified messaging across voices']
        }
      ],
      methodologies: []
    },
    researchData: {
      stakeholders: [
        {
          name: 'CTO',
          role: 'Chief Technology Officer',
          psychology: {
            fears: ['System downtime', 'Security breaches'],
            aspirations: ['Innovation leadership', 'Team productivity']
          },
          decisionTriggers: ['ROI proof', 'Security audit results']
        }
      ]
    }
  };

  const patternSelection = {
    selectedPattern: {
      pattern: 'CHORUS',
      rationale: 'Enterprise B2B requires coordinated multi-voice advocacy across owned, earned, and influencer channels',
      confidence: 0.85,
      pillarEmphasis: {
        pillar1_owned: 'medium',
        pillar2_relationships: 'high',
        pillar3_events: 'high',
        pillar4_media: 'high'
      },
      timeline: 'Weeks 1-12',
      keyMechanics: [
        'Owned content establishes positioning',
        'Influencer voices amplify credibility',
        'Media coverage provides third-party validation',
        'Events create community momentum'
      ]
    },
    alternativePattern: {
      pattern: 'NETWORK',
      rationale: 'For slower, deeper relationship building with key enterprise accounts',
      confidence: 0.65
    },
    riskFactors: [
      'Requires significant coordination across teams',
      'Message consistency difficult to maintain'
    ]
  };

  const campaignGoal = 'Launch new AI-powered DevOps platform to enterprise market';

  console.log('📊 Test data:', {
    stakeholderCount: enrichedData.influenceLeverTemplates.length,
    pattern: patternSelection.selectedPattern.pattern,
    positioningMessages: enrichedData.positioning.keyMessages.length
  });

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-influence-mapper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({
        enrichedData,
        patternSelection,
        campaignGoal
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const result = await response.json();

    console.log('\n✅ Influence Mapper Response:');
    console.log(`   - Strategies Generated: ${result.influenceStrategies?.length || 0}`);

    if (result.influenceStrategies && result.influenceStrategies.length > 0) {
      console.log('\n📋 First Strategy Sample:');
      const first = result.influenceStrategies[0];
      console.log(`   - Stakeholder: ${first.stakeholder}`);
      console.log(`   - Primary Fear: ${first.psychologicalProfile?.primaryFear}`);
      console.log(`   - Primary Aspiration: ${first.psychologicalProfile?.primaryAspiration}`);
      console.log(`   - Influence Levers: ${first.influenceLevers?.length || 0}`);
      console.log(`   - Has 4-phase strategy: ${!!first.touchpointStrategy}`);

      console.log('\n🎯 Full Response:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n⚠️ No strategies generated!');
      console.log('Full response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testInfluenceMapper();
