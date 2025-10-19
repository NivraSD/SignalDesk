// Test creative opportunity detection with save verification
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testCreativeOpportunities() {
  console.log('🧪 Testing creative opportunity detection with save...\n');
  
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
  
  // Call mcp-opportunity-detector
  const testData = {
    organization_name: 'Apple',
    organization_id: 'apple-test',
    enriched_intel: [{
      title: "Apple unveils new AI features",
      description: "Apple announced groundbreaking AI capabilities for iPhone",
      source: "TechCrunch",
      relevance_score: 95,
      url: "https://example.com",
      published_date: new Date().toISOString(),
      entities: ["Apple", "iPhone", "AI"],
      topics: ["artificial intelligence", "mobile technology"],
      sentiment: "positive",
      key_points: ["AI integration", "Privacy focus", "Consumer features"]
    }],
    competitive_intel: [{
      company: "Samsung",
      strengths: ["Market share", "Android ecosystem"],
      weaknesses: ["Privacy concerns", "Fragmentation"]
    }]
  };

  console.log('\n📡 Calling opportunity detector...');
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
  console.log('Full response:', JSON.stringify(result, null, 2));
  console.log('Opportunities returned:', result.opportunities?.length || 0);
  
  if (result.opportunities?.length > 0) {
    console.log('\n🎯 First opportunity:');
    const opp = result.opportunities[0];
    console.log('- Title:', opp.title);
    console.log('- Score:', opp.score);
    console.log('- PR Angle:', opp.pr_angle);
    console.log('- Creative approach:', opp.creative_approach);
    console.log('- Campaign name:', opp.campaign_name);
    console.log('- Key messages:', opp.key_messages);
    console.log('- Formats:', opp.formats);
  }

  // Wait a moment for database write
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Check database
  console.log('\n💾 Checking database for saved opportunities...');
  const { data: savedOpps, error: fetchError } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (fetchError) {
    console.error('Error fetching:', fetchError);
  } else {
    console.log('Found in database:', savedOpps?.length || 0, 'opportunities');
    
    if (savedOpps?.length > 0) {
      console.log('\n✅ Successfully saved! First saved opportunity:');
      const saved = savedOpps[0];
      console.log('- ID:', saved.id);
      console.log('- Title:', saved.title);
      console.log('- Score:', saved.score);
      console.log('- Organization:', saved.organization_id);
      console.log('- Created:', new Date(saved.created_at).toLocaleString());
      
      // Check for creative fields in data
      if (saved.data) {
        console.log('\n🎨 Creative enhancements in database:');
        console.log('- Creative approach:', saved.data.creative_approach || 'N/A');
        console.log('- Campaign name:', saved.data.campaign_name || 'N/A');
        console.log('- Key messages:', saved.data.key_messages || 'N/A');
        console.log('- Formats:', saved.data.formats || 'N/A');
      }
    } else {
      console.log('\n❌ No opportunities saved to database');
    }
  }
}

testCreativeOpportunities().catch(console.error);
