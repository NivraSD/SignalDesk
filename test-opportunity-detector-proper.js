// Test opportunity detector with proper enriched_data structure
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testOpportunityDetector() {
  console.log('🧪 Testing opportunity detector with proper enriched_data structure...\n');

  // First clear old opportunities
  console.log('🗑️ Clearing old opportunities...');
  const { error: deleteError } = await supabase
    .from('opportunities')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.error('Error clearing:', deleteError);
  } else {
    console.log('✅ Cleared old opportunities');
  }

  // Create proper enriched_data structure matching monitoring-stage-2-enrichment output
  const testData = {
    organization_name: 'Tesla',
    organization_id: 'tesla-test',
    enriched_data: {
      organized_intelligence: {
        events: [
          {
            type: 'product_launch',
            entity: 'Apple',
            description: 'Apple announces Vision Pro 2 with breakthrough AI features, threatening Tesla\'s AR initiatives',
            timestamp: new Date().toISOString(),
            significance: 'high'
          },
          {
            type: 'crisis',
            entity: 'Ford',
            description: 'Ford recalls 500,000 electric vehicles due to battery fire risk, opening market opportunity',
            timestamp: new Date().toISOString(),
            significance: 'critical'
          },
          {
            type: 'regulatory',
            entity: 'EU',
            description: 'EU proposes new autonomous vehicle regulations requiring open-source safety algorithms',
            timestamp: new Date().toISOString(),
            significance: 'high'
          },
          {
            type: 'market_move',
            entity: 'Rivian',
            description: 'Rivian stock drops 30% after missing delivery targets, investors looking for alternatives',
            timestamp: new Date().toISOString(),
            significance: 'medium'
          },
          {
            type: 'executive_change',
            entity: 'GM',
            description: 'GM\'s Chief Autonomous Driving Officer resigns, citing strategic disagreements',
            timestamp: new Date().toISOString(),
            significance: 'high'
          }
        ],
        entities: [
          { name: 'Apple', type: 'competitor', total_mentions: 15, sentiment: 'negative' },
          { name: 'Ford', type: 'competitor', total_mentions: 12, sentiment: 'negative' },
          { name: 'Tesla', type: 'organization', total_mentions: 8, sentiment: 'neutral' },
          { name: 'EU', type: 'regulator', total_mentions: 10, sentiment: 'neutral' },
          { name: 'Rivian', type: 'competitor', total_mentions: 7, sentiment: 'negative' },
          { name: 'GM', type: 'competitor', total_mentions: 5, sentiment: 'negative' }
        ],
        topic_clusters: [
          { theme: 'EV battery safety', article_count: 25, trending: true },
          { theme: 'Autonomous driving regulations', article_count: 18, trending: true },
          { theme: 'AR/VR in vehicles', article_count: 12, trending: false },
          { theme: 'Electric vehicle deliveries', article_count: 20, trending: true }
        ],
        quotes: [
          { text: "The EV market is experiencing its first major safety crisis", source: "Reuters" },
          { text: "Tesla's competitors are struggling with production", source: "Bloomberg" },
          { text: "Regulatory changes could reshape the autonomous vehicle landscape", source: "TechCrunch" }
        ],
        metrics: [
          { name: 'EV Market Share', value: '18%', change: '+2%', entity: 'Tesla' },
          { name: 'Stock Price', value: '$45', change: '-30%', entity: 'Rivian' }
        ]
      },
      extracted_data: {
        // Fallback data if organized_intelligence is empty
        events: [],
        entities: [],
        quotes: [],
        metrics: []
      },
      enriched_articles: [
        {
          title: "Ford's massive EV recall shakes industry confidence",
          source: "Wall Street Journal",
          relevance_score: 95
        }
      ],
      executive_summary: {
        immediate_actions: ["Address battery safety concerns", "Capitalize on Ford recall"],
        strategic_opportunities: ["Gain market share from struggling competitors"],
        competitive_threats: ["Apple entering AR vehicle space"],
        market_trends: ["Increased regulatory scrutiny on autonomous vehicles"]
      },
      knowledge_graph: {
        entities: ['Tesla', 'Apple', 'Ford', 'EU', 'Rivian', 'GM'],
        relationships: [
          { from: 'Ford', to: 'Tesla', type: 'competes_with' },
          { from: 'Apple', to: 'Tesla', type: 'threatens' }
        ]
      }
    },
    profile: {
      industry: 'Electric Vehicles',
      strengths: ['Battery technology', 'Autonomous driving', 'Brand recognition'],
      weaknesses: ['Quality control', 'Customer service'],
      competition: {
        direct_competitors: ['Ford', 'GM', 'Rivian'],
        indirect_competitors: ['Apple', 'Google'],
        emerging_threats: ['Chinese EV makers'],
        gaps: ['Struggling with production', 'Safety concerns']
      }
    },
    executive_synthesis: {
      competitive_dynamics: {
        key_moves: [
          "Ford's recall creates immediate market opportunity",
          "Apple's AR entry threatens future roadmap"
        ]
      },
      immediate_opportunities: [
        "Launch safety-focused marketing campaign",
        "Poach talent from GM's autonomous division"
      ]
    },
    detection_config: {
      min_score: 60,
      max_opportunities: 20,
      focus_areas: ['competitive', 'regulatory', 'crisis']
    }
  };

  console.log('\n📡 Calling opportunity detector with realistic data...');
  console.log('Events included:', testData.enriched_data.organized_intelligence.events.length);
  console.log('Entities included:', testData.enriched_data.organized_intelligence.entities.length);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
  });

  const result = await response.json();
  console.log('\n📊 Detector Response:');
  console.log('Status:', response.status);
  console.log('Opportunities returned:', result.opportunities?.length || 0);

  if (result.error) {
    console.error('❌ Error:', result.error);
  }

  if (result.opportunities?.length > 0) {
    console.log('\n🎯 Opportunities detected:');
    result.opportunities.forEach((opp, i) => {
      console.log(`\n${i+1}. ${opp.title}`);
      console.log(`   Score: ${opp.score} | Urgency: ${opp.urgency} | Window: ${opp.time_window}`);
      console.log(`   Category: ${opp.category}`);
      console.log(`   Description: ${opp.description?.substring(0, 150)}...`);
      console.log(`   Trigger: ${opp.trigger_event?.substring(0, 100)}...`);
    });
  }

  // Wait for database write
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Check database
  console.log('\n💾 Checking database for saved opportunities...');
  const { data: savedOpps, error: fetchError } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (fetchError) {
    console.error('Error fetching:', fetchError);
  } else {
    console.log('Found in database:', savedOpps?.length || 0, 'opportunities');

    if (savedOpps?.length > 0) {
      console.log('\n✅ Opportunities successfully saved to database!');
      console.log('First saved opportunity:');
      const saved = savedOpps[0];
      console.log('- ID:', saved.id);
      console.log('- Title:', saved.title);
      console.log('- Score:', saved.score);
      console.log('- Category:', saved.category);
      console.log('- Organization:', saved.organization_id);
    }
  }
}

testOpportunityDetector().catch(console.error);