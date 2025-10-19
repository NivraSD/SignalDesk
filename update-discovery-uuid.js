const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

const openaiOrgId = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff';

async function updateOrgId() {
  console.log('Updating mcp_discovery organization_id from string to UUID...\n');

  // First get the existing record
  const { data: existing, error: fetchError } = await supabase
    .from('mcp_discovery')
    .select('*')
    .eq('organization_name', 'OpenAI')
    .single();

  if (fetchError || !existing) {
    console.log('❌ Error fetching record:', fetchError?.message);
    return;
  }

  console.log('Current organization_id:', existing.organization_id);

  // Delete the old record with string ID
  const { error: deleteError } = await supabase
    .from('mcp_discovery')
    .delete()
    .eq('organization_name', 'OpenAI');

  if (deleteError) {
    console.log('❌ Error deleting old record:', deleteError.message);
    return;
  }

  console.log('✅ Deleted old record');

  // Insert new record with UUID
  const newRecord = {
    ...existing,
    organization_id: openaiOrgId,
    updated_at: new Date().toISOString()
  };

  delete newRecord.created_at; // Let database set this

  const { data: inserted, error: insertError } = await supabase
    .from('mcp_discovery')
    .insert(newRecord)
    .select();

  if (insertError) {
    console.log('❌ Error inserting new record:', insertError.message);
    console.log('   Details:', insertError.details);
  } else {
    console.log('✅ Inserted new record with UUID');
    console.log('   Organization ID:', inserted[0].organization_id);
    console.log('   Stakeholders:');
    console.log('     - Regulators:', inserted[0].stakeholders?.regulators?.length);
    console.log('     - Investors:', inserted[0].stakeholders?.major_investors?.length);
  }
}

updateOrgId();
