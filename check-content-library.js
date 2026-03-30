const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkContentLibrary() {
  console.log('Checking content_library table...\n');

  // Check if table exists
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .limit(1);

  if (error) {
    if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
      console.log('❌ Table does not exist. Creating it now...\n');

      // Create the table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS content_library (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id VARCHAR(255),
          content_type VARCHAR(100),
          title VARCHAR(500),
          content TEXT,
          metadata JSONB,
          tags TEXT[],
          status VARCHAR(50) DEFAULT 'draft',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by VARCHAR(100) DEFAULT 'niv'
        );

        ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Enable all operations" ON content_library
          FOR ALL USING (true);

        GRANT ALL ON content_library TO anon, authenticated, service_role;
      `;

      console.log('Creating table with SQL:\n', createTableSQL);

      // Note: You need to run this SQL in Supabase SQL editor
      console.log('\n⚠️ Please run the above SQL in your Supabase SQL editor');
      console.log('Go to: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/editor');

    } else {
      console.log('❌ Error:', error.message);
    }
  } else {
    console.log('✅ Table exists!');
    console.log('Current items:', data?.length || 0);

    if (data && data.length > 0) {
      console.log('\nSample content types:');
      const types = [...new Set(data.map(item => item.content_type))];
      types.forEach(type => console.log(`  - ${type}`));
    }
  }
}

checkContentLibrary();