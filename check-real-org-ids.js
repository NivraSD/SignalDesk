// Check actual organization IDs in your database
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrgs() {
  console.log('Checking organizations in database...\n')

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  if (!orgs || orgs.length === 0) {
    console.log('❌ No organizations found in database')
    return
  }

  console.log(`✅ Found ${orgs.length} organizations:\n`)
  orgs.forEach((org, index) => {
    console.log(`${index + 1}. ${org.name}`)
    console.log(`   ID: ${org.id}`)
    console.log(`   Type: ${typeof org.id}`)
    console.log('')
  })

  console.log('\n📝 To test predictions, use one of these organization IDs above')
  console.log('The ID must be a UUID format, not a number like "2"')
}

checkOrgs().catch(console.error)
