// Quick Twitter test

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testTwitter() {
  console.log('🐦 Testing Twitter monitoring...\n')

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/mcp-social-intelligence`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        tool: 'monitor_twitter',
        arguments: {
          query: 'Tesla OR Elon Musk',
          time_range: '24h',
          max_results: 5
        }
      })
    }
  )

  const data = await response.json()
  console.log('Status:', response.status)
  console.log('Response:', JSON.stringify(data, null, 2))

  if (data.success && data.results.length > 0) {
    console.log(`\n✅ Found ${data.results.length} tweets!`)
    console.log('\n📝 Sample tweet:')
    console.log(data.results[0])
  }
}

testTwitter().catch(console.error)