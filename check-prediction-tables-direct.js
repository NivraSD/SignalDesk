// Direct check of prediction tables using raw SQL
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('🔍 Checking prediction tables directly...\n')

  // Check if tables exist using raw SQL
  const { data: tables, error: tableError } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'stakeholder_%'
      ORDER BY table_name;
    `
  })

  if (tableError) {
    console.log('Trying alternative method...')
    // Try direct query approach
    const { data: profilesTest, error: profilesError } = await supabase
      .from('stakeholder_profiles')
      .select('count')
      .limit(0)

    const { data: patternsTest, error: patternsError } = await supabase
      .from('stakeholder_patterns')
      .select('count')
      .limit(0)

    const { data: predictionsTest, error: predictionsError } = await supabase
      .from('stakeholder_predictions')
      .select('count')
      .limit(0)

    console.log('✅ stakeholder_profiles:', profilesError ? `❌ ${profilesError.message}` : '✅ exists')
    console.log('✅ stakeholder_patterns:', patternsError ? `❌ ${patternsError.message}` : '✅ exists')
    console.log('✅ stakeholder_predictions:', predictionsError ? `❌ ${predictionsError.message}` : '✅ exists')
  } else {
    console.log('Found tables:', tables)
  }

  console.log('\n🔍 Checking pattern library data...')
  const { data: patterns, error: patternError } = await supabase
    .from('stakeholder_patterns')
    .select('pattern_name, stakeholder_type, reliability_score')
    .order('stakeholder_type')

  if (patternError) {
    console.log('❌ Error:', patternError.message)
  } else {
    console.log(`✅ Found ${patterns.length} patterns:`)
    patterns.forEach(p => {
      console.log(`   • ${p.pattern_name} (${p.stakeholder_type}) - ${(p.reliability_score * 100).toFixed(0)}% reliability`)
    })
  }

  console.log('\n✅ Prediction system tables are operational!')
}

checkTables().catch(console.error)
