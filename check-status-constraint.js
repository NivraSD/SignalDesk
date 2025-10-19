const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkConstraint() {
  // Get all distinct status values currently in the table
  const { data: existing } = await supabase
    .from('campaign_blueprints')
    .select('status');

  console.log('Existing status values:', [...new Set(existing?.map(r => r.status))]);

  // Try to insert with different status values to see which ones work
  const testStatuses = ['draft', 'active', 'executing', 'completed', 'archived'];

  for (const status of testStatuses) {
    const { error } = await supabase
      .from('campaign_blueprints')
      .insert({
        session_id: 'test-session-' + Date.now(),
        org_id: 1,
        campaign_type: 'TEST',
        positioning: 'Test',
        research_data: {},
        blueprint_data: {},
        status: status
      });

    if (error) {
      console.log(`❌ Status '${status}' NOT allowed:`, error.message);
    } else {
      console.log(`✅ Status '${status}' IS allowed`);
      // Clean up test record
      await supabase
        .from('campaign_blueprints')
        .delete()
        .eq('session_id', 'test-session-' + (Date.now() - 100));
    }
  }
}

checkConstraint();
