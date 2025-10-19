// Test if patterns are publicly readable
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPatterns() {
  console.log('Testing pattern library access...\n')

  const { data, error } = await supabase
    .from('stakeholder_patterns')
    .select('pattern_name, stakeholder_type, reliability_score')
    .order('stakeholder_type')

  if (error) {
    console.log('❌ Error:', error.message)
    console.log('Error details:', error)
  } else {
    console.log(`✅ Successfully accessed ${data.length} patterns:`)
    data.forEach(p => {
      console.log(`   • ${p.pattern_name} (${p.stakeholder_type}) - ${(p.reliability_score * 100).toFixed(0)}% reliability`)
    })
  }
}

testPatterns().catch(console.error)
