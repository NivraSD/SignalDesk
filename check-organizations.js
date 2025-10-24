// Check organizations table
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrganizations() {
  console.log('📋 Checking organizations table...\n')

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .limit(10)

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  console.log(`Found ${data.length} organizations:`)
  data.forEach(org => {
    console.log(`  - ${org.name} (${org.id})`)
  })

  // Check specifically for OpenAI
  console.log('\n🔍 Looking for OpenAI...')
  const { data: openai } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'OpenAI')
    .single()

  if (openai) {
    console.log('✅ Found OpenAI:', JSON.stringify(openai, null, 2))
  } else {
    console.log('❌ OpenAI not found in organizations table!')
  }
}

checkOrganizations()
