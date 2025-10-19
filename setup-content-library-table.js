#!/usr/bin/env node

// Create content_library table in Supabase
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjgwMDI3MywiZXhwIjoyMDQ4Mzc2MjczfQ.J0LGXQkZIyBm4IaQgKSe3NG9pJOuJ1a7H7p6qjDbdRg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function setupContentLibraryTable() {
  console.log('Setting up content_library table...\n')

  // Create the table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS content_library (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id TEXT,
        type TEXT NOT NULL,
        content JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by TEXT
    );
  `

  const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })

  if (createError) {
    console.error('Error creating table:', createError)
  } else {
    console.log('✅ Table created successfully')
  }

  // Enable RLS
  const { error: rlsError } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;'
  })

  if (rlsError && !rlsError.message.includes('already enabled')) {
    console.error('Error enabling RLS:', rlsError)
  } else {
    console.log('✅ RLS enabled')
  }

  // Drop existing policies
  await supabase.rpc('exec_sql', {
    sql: 'DROP POLICY IF EXISTS "Allow all operations for now" ON content_library;'
  })

  // Create permissive policy
  const policySQL = `
    CREATE POLICY "Allow all operations for now" ON content_library
        FOR ALL USING (true) WITH CHECK (true);
  `

  const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySQL })

  if (policyError) {
    console.error('Error creating policy:', policyError)
  } else {
    console.log('✅ Policy created')
  }

  // Test insert
  const testData = {
    organization_id: 'test',
    type: 'test',
    content: { message: 'test' },
    metadata: { test: true },
    status: 'completed',
    created_by: 'setup'
  }

  const { data, error } = await supabase
    .from('content_library')
    .insert(testData)
    .select()

  if (error) {
    console.error('❌ Test insert failed:', error)
  } else {
    console.log('✅ Test insert successful:', data)

    // Clean up test data
    await supabase
      .from('content_library')
      .delete()
      .eq('created_by', 'setup')
  }

  console.log('\n✅ Content library table setup complete!')
}

// Alternative: Direct SQL execution if RPC doesn't work
async function setupWithDirectSQL() {
  console.log('Trying direct SQL execution...\n')

  try {
    // This uses the SQL editor approach
    const sqlCommands = [
      `CREATE TABLE IF NOT EXISTS content_library (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id TEXT,
        type TEXT NOT NULL,
        content JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by TEXT
      );`,

      `ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;`,

      `DROP POLICY IF EXISTS "Allow all operations for now" ON content_library;`,

      `CREATE POLICY "Allow all operations for now" ON content_library
        FOR ALL USING (true) WITH CHECK (true);`
    ]

    console.log('Run these SQL commands in Supabase SQL Editor:')
    console.log('=' .repeat(50))
    sqlCommands.forEach((sql, i) => {
      console.log(`-- Command ${i + 1}`)
      console.log(sql)
      console.log('')
    })
    console.log('=' .repeat(50))

  } catch (error) {
    console.error('Error:', error)
  }
}

// Try setup, fallback to SQL output
setupContentLibraryTable().catch(() => {
  console.log('\nFallback: Manual SQL commands needed')
  setupWithDirectSQL()
})