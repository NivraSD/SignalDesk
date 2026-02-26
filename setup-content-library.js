const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupContentLibrary() {
  console.log('Setting up content_library table...');

  try {
    // Try to create the table via RPC or direct SQL
    const { data: existing, error: checkError } = await supabase
      .from('content_library')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('Table does not exist. Creating...');

      // Table doesn't exist, create it using SQL through Supabase management
      console.log('Please create the table using Supabase Dashboard with this structure:');
      console.log(`
CREATE TABLE content_library (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  priority TEXT DEFAULT 'medium',
  framework_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
      `);
      console.log('\nThen run this script again.');
      return;
    }

    // Table exists, test insert
    console.log('Testing content_library table...');

    const testContent = {
      id: `test-${Date.now()}`,
      title: 'Test Content',
      type: 'press-release',
      content: 'This is a test content item',
      status: 'draft',
      priority: 'medium',
      metadata: { test: true }
    };

    const { data: inserted, error: insertError } = await supabase
      .from('content_library')
      .insert(testContent)
      .select();

    if (insertError) {
      console.error('Insert test failed:', insertError);

      // Try simpler insert without select
      const { error: simpleInsertError } = await supabase
        .from('content_library')
        .insert({
          id: testContent.id,
          title: testContent.title,
          type: testContent.type,
          content: testContent.content
        });

      if (simpleInsertError) {
        console.error('Simple insert also failed:', simpleInsertError);
        console.log('\nPlease check RLS policies in Supabase Dashboard.');
      } else {
        console.log('Simple insert successful! Table is working.');
      }
    } else {
      console.log('Insert successful!', inserted);

      // Clean up test data
      const { error: deleteError } = await supabase
        .from('content_library')
        .delete()
        .eq('id', testContent.id);

      if (deleteError) {
        console.log('Could not delete test data:', deleteError);
      } else {
        console.log('Test data cleaned up.');
      }
    }

    // Check current content
    const { data: contents, error: fetchError } = await supabase
      .from('content_library')
      .select('id, title, type, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!fetchError) {
      console.log(`\nCurrent content library (${contents.length} items):`, contents);
    }

    console.log('\n✅ Content library is ready!');

  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupContentLibrary();