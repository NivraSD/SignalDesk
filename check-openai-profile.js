// Check OpenAI organization profile
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOpenAIProfile() {
  console.log('🔍 Checking OpenAI organization profile...\n')

  const { data, error } = await supabase
    .from('organization_profiles')
    .select('*')
    .eq('organization_name', 'OpenAI')
    .single()

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  if (data) {
    console.log('Profile found. Checking stakeholders...\n')

    const profile = data.profile_data || {}

    console.log('📋 Stakeholders:')
    if (profile.stakeholders) {
      console.log('\nRegulators:')
      console.log(JSON.stringify(profile.stakeholders.regulators, null, 2))

      console.log('\nMajor Investors:')
      console.log(JSON.stringify(profile.stakeholders.major_investors, null, 2))

      console.log('\nKey Executives:')
      console.log(JSON.stringify(profile.stakeholders.key_executives, null, 2))
    } else {
      console.log('No stakeholders found in profile')
    }

    console.log('\n📅 Profile created:', data.created_at)
    console.log('📅 Profile updated:', data.updated_at)
  } else {
    console.log('❌ No profile found for OpenAI')
  }
}

checkOpenAIProfile()
